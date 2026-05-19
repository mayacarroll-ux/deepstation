import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { Client } from "pg";

const workbookPath = process.argv[2];
const projectRoot = process.cwd();
const parserPath = path.join(projectRoot, "scripts", "parse-workbook.py");
const outputPath = path.join(projectRoot, "data", "imported-workbook.json");
const singleUserId = "single-user";

if (!workbookPath) {
  console.error("Usage: npm run import:workbook -- /absolute/path/to/workbook.xlsx");
  process.exit(1);
}

function parseWorkbook() {
  const parseResult = spawnSync("python3", [parserPath, workbookPath], {
    encoding: "utf8"
  });

  if (parseResult.status !== 0) {
    throw new Error(parseResult.stderr || "Workbook parser failed.");
  }

  return JSON.parse(parseResult.stdout);
}

async function writeFallbackData(importPayload) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(`${outputPath}.tmp`, `${JSON.stringify(importPayload, null, 2)}\n`);
  await fs.rename(`${outputPath}.tmp`, outputPath);
}

async function importToPostgres(importPayload) {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  try {
    await client.query("begin");
    await client.query(
      `
        insert into users (id, name, email)
        values ($1, $2, $3)
        on conflict (id) do update
        set name = excluded.name,
            email = excluded.email
      `,
      [singleUserId, "Maya Carroll", "single-user@deepstation.local"]
    );
    await client.query("delete from time_entries where owner_id = $1", [singleUserId]);
    await client.query("delete from budget_mappings where owner_id = $1", [singleUserId]);

    const budgetMappingIdsByKey = new Map();

    for (const budgetMapping of importPayload.budgetMappings) {
      const budgetMappingResult = await client.query(
        `
          insert into budget_mappings (
            owner_id,
            product_name,
            budget_name,
            budget_number,
            notes
          )
          values ($1, $2, $3, $4, $5)
          returning id
        `,
        [
          singleUserId,
          budgetMapping.productName,
          budgetMapping.budgetName,
          budgetMapping.budgetNumber,
          budgetMapping.notes
        ]
      );
      const budgetMappingKey = [
        budgetMapping.productName.toLowerCase(),
        budgetMapping.budgetName.toLowerCase(),
        budgetMapping.budgetNumber.toLowerCase()
      ].join("\u0000");

      budgetMappingIdsByKey.set(budgetMappingKey, budgetMappingResult.rows[0].id);
    }

    for (const timeEntry of importPayload.timeEntries) {
      const budgetMappingId = timeEntry.budgetMappingKey
        ? budgetMappingIdsByKey.get(timeEntry.budgetMappingKey.join("\u0000")) ?? null
        : null;

      await client.query(
        `
          insert into time_entries (
            owner_id,
            budget_mapping_id,
            entry_date,
            product_name,
            budget_name,
            budget_number,
            task_description,
            hours_worked,
            week_number,
            notes
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          singleUserId,
          budgetMappingId,
          timeEntry.entryDate,
          timeEntry.productName,
          timeEntry.budgetName,
          timeEntry.budgetNumber,
          timeEntry.taskDescription,
          timeEntry.hoursWorked,
          timeEntry.weekNumber,
          timeEntry.notes
        ]
      );
    }

    await client.query("commit");
    return true;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

const importPayload = parseWorkbook();

await writeFallbackData(importPayload);
const didImportToPostgres = await importToPostgres(importPayload);

console.log(
  JSON.stringify(
    {
      workbookPath,
      fallbackDataPath: outputPath,
      didImportToPostgres,
      budgetMappings: importPayload.budgetMappings.length,
      timeEntries: importPayload.timeEntries.length
    },
    null,
    2
  )
);
