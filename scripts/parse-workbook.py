#!/usr/bin/env python3
import json
import posixpath
import sys
import uuid
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

SPREADSHEET_NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RELATIONSHIP_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def load_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    shared_strings = []

    for shared_string_item in root.findall("a:si", SPREADSHEET_NS):
        shared_strings.append(
            "".join(
                text_node.text or ""
                for text_node in shared_string_item.iter(
                    "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"
                )
            )
        )

    return shared_strings


def get_sheet_paths(archive):
    workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relationship_targets = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships_root
    }
    sheet_paths = {}

    for sheet in workbook_root.find("a:sheets", SPREADSHEET_NS):
        relationship_id = sheet.attrib[RELATIONSHIP_ID]
        target = relationship_targets[relationship_id].lstrip("/")
        sheet_path = (
            target
            if target.startswith("xl/")
            else posixpath.normpath(posixpath.join("xl", target))
        )
        sheet_paths[sheet.attrib["name"]] = sheet_path

    return sheet_paths


def get_column_index(cell_reference):
    letters = "".join(character for character in cell_reference if character.isalpha())
    column_index = 0

    for letter in letters:
        column_index = column_index * 26 + ord(letter.upper()) - 64

    return column_index - 1


def get_cell_value(cell, shared_strings):
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        return "".join(
            text_node.text or ""
            for text_node in cell.iter(
                "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"
            )
        )

    value_node = cell.find("a:v", SPREADSHEET_NS)

    if value_node is None:
        return ""

    raw_value = value_node.text or ""

    if cell_type == "s":
        return shared_strings[int(raw_value)]

    if cell_type == "b":
        return raw_value == "1"

    return raw_value


def get_rows(archive, sheet_path, shared_strings):
    sheet_root = ET.fromstring(archive.read(sheet_path))
    rows = []

    for row in sheet_root.findall(".//a:sheetData/a:row", SPREADSHEET_NS):
        values = []

        for cell in row.findall("a:c", SPREADSHEET_NS):
            column_index = get_column_index(cell.attrib["r"])

            while len(values) < column_index:
                values.append("")

            values.append(get_cell_value(cell, shared_strings))

        rows.append(values)

    return rows


def get_value(row, index):
    return row[index] if index < len(row) else ""


def clean_text(value):
    return str(value or "").strip()


def excel_serial_to_date(value):
    serial_number = int(float(value))
    excel_epoch = datetime(1899, 12, 30)
    return (excel_epoch + timedelta(days=serial_number)).date().isoformat()


def parse_hours(value):
    return f"{float(value):.2f}"


def parse_week_number(value):
    return int(float(value))


def parse_workbook(path):
    with zipfile.ZipFile(path) as archive:
        shared_strings = load_shared_strings(archive)
        sheet_paths = get_sheet_paths(archive)

        time_rows = get_rows(archive, sheet_paths["MayaCarroll_Time"], shared_strings)
        key_rows = get_rows(archive, sheet_paths["Key"], shared_strings)

    budget_mappings = []
    seen_budget_mapping_keys = set()

    for row_index, row in enumerate(key_rows[1:], start=2):
        product_name = clean_text(get_value(row, 0))
        budget_name = clean_text(get_value(row, 1))
        budget_number = clean_text(get_value(row, 2)) or "-"
        notes = clean_text(get_value(row, 3))

        if not product_name or not budget_name:
            continue

        budget_mapping_key = (product_name, budget_name, budget_number)

        if budget_mapping_key in seen_budget_mapping_keys:
            continue

        seen_budget_mapping_keys.add(budget_mapping_key)
        budget_mappings.append(
            {
                "id": str(
                    uuid.uuid5(
                        uuid.NAMESPACE_URL,
                        f"deepstation-budget-mapping:{product_name}:{budget_name}:{budget_number}",
                    )
                ),
                "productName": product_name,
                "budgetName": budget_name,
                "budgetNumber": budget_number,
                "notes": notes or None,
            }
        )

    budget_mapping_lookup = {
        (
            budget_mapping["productName"].lower(),
            budget_mapping["budgetName"].lower(),
            budget_mapping["budgetNumber"].lower(),
        ): budget_mapping
        for budget_mapping in budget_mappings
    }

    time_entries = []

    for row_index, row in enumerate(time_rows[1:], start=2):
        date_value = get_value(row, 0)
        product_name = clean_text(get_value(row, 1))
        budget_name = clean_text(get_value(row, 2))
        budget_number = clean_text(get_value(row, 3))
        task_description = clean_text(get_value(row, 4))
        hours_worked = get_value(row, 5)
        week_number = get_value(row, 6)
        notes = clean_text(get_value(row, 7))

        if (
            not date_value
            or not product_name
            or not budget_name
            or not budget_number
            or not task_description
            or not hours_worked
            or not week_number
        ):
            continue

        budget_mapping_key = (
            product_name.lower(),
            budget_name.lower(),
            budget_number.lower(),
        )
        matching_budget_mapping = budget_mapping_lookup.get(budget_mapping_key)

        time_entries.append(
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"deepstation-time-entry:{row_index}")),
                "entryDate": excel_serial_to_date(date_value),
                "productName": product_name,
                "budgetName": budget_name,
                "budgetNumber": budget_number,
                "taskDescription": task_description,
                "hoursWorked": parse_hours(hours_worked),
                "weekNumber": parse_week_number(week_number),
                "notes": notes or None,
                "budgetMappingKey": budget_mapping_key if matching_budget_mapping else None,
            }
        )

    return {
        "sourceWorkbook": path,
        "importedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "budgetMappings": budget_mappings,
        "timeEntries": time_entries,
    }


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: parse-workbook.py <workbook.xlsx>")

    print(json.dumps(parse_workbook(sys.argv[1]), indent=2))


if __name__ == "__main__":
    main()
