import {
  faCalendarWeek,
  faClockRotateLeft,
  faEye,
  faEyeSlash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type TimeEntryWeekOption = {
  value: string;
  label: string;
};

type TimeEntryWeekSelectorProps = {
  hiddenFields?: Record<string, string>;
  historyHref: string;
  isHistoryMode: boolean;
  selectedWeekValue: string;
  weekOptions: TimeEntryWeekOption[];
};

export function TimeEntryWeekSelector({
  hiddenFields,
  historyHref,
  isHistoryMode,
  selectedWeekValue,
  weekOptions
}: TimeEntryWeekSelectorProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-end">
        <form action="/time-entries" className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_auto] sm:items-end">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
                <input key={fieldName} name={fieldName} type="hidden" value={fieldValue} />
              ))
            : null}
          <label className="grid gap-2 text-sm font-semibold">
            Week
            <Select defaultValue={selectedWeekValue} name="weekSelection">
              {weekOptions.map((weekOption) => (
                <option key={weekOption.value} value={weekOption.value}>
                  {weekOption.label}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button className="h-11 px-5 !text-neutral-950" type="submit">
              <span className="mr-2 inline-flex items-center">
                <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCalendarWeek} />
              </span>
              View week
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
          <ButtonLink href={historyHref} variant="secondary">
            <span className="mr-2 inline-flex items-center">
              <FontAwesomeIcon
                className="h-3.5 w-3.5"
                icon={isHistoryMode ? faEyeSlash : faClockRotateLeft}
              />
            </span>
            {isHistoryMode ? "Show selected week" : "Show history"}
          </ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}
