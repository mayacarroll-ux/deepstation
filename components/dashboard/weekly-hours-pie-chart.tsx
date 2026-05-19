import { formatHours } from "@/lib/utils/format";

type WeeklyHoursBreakdown = {
  budgetName: string;
  totalHours: number;
};

type WeeklyHoursPieChartProps = {
  groupedHours: WeeklyHoursBreakdown[];
  totalHours: number;
  weekNumber: number;
  weekYear: number;
};

const chartColors = [
  "#2dd4bf",
  "#60a5fa",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#c084fc"
];

function getPieSlicePath(startAngle: number, endAngle: number) {
  const radius = 42;
  const center = 50;
  const startRadians = (startAngle - 90) * (Math.PI / 180);
  const endRadians = (endAngle - 90) * (Math.PI / 180);
  const startX = center + radius * Math.cos(startRadians);
  const startY = center + radius * Math.sin(startRadians);
  const endX = center + radius * Math.cos(endRadians);
  const endY = center + radius * Math.sin(endRadians);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${center} ${center}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    "Z"
  ].join(" ");
}

export function WeeklyHoursPieChart({
  groupedHours,
  totalHours,
  weekNumber,
  weekYear
}: WeeklyHoursPieChartProps) {
  const chartSegments = groupedHours.map((groupedHour, index) => ({
    ...groupedHour,
    color: chartColors[index % chartColors.length],
    percentage: totalHours > 0 ? (groupedHour.totalHours / totalHours) * 100 : 0
  }));
  let accumulatedAngle = 0;

  return (
    <section className="mt-8 border border-[var(--border)] bg-[var(--panel-elevated)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Weekly project mix</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Week {weekNumber}, {weekYear}, grouped by Budget Name / project.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-[var(--muted)]">Total weekly hours</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--accent)]">
            {formatHours(totalHours)} hrs
          </p>
        </div>
      </div>

      {totalHours <= 0 || chartSegments.length === 0 ? (
        <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
          No time entries for this week yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(220px,0.6fr)_1fr] lg:items-center">
          <div className="mx-auto w-full max-w-xs">
            <svg
              aria-label={`Project hours pie chart for week ${weekNumber}, ${weekYear}`}
              className="h-auto w-full"
              role="img"
              viewBox="0 0 100 100"
            >
              {chartSegments.length === 1 ? (
                <circle cx="50" cy="50" fill={chartSegments[0].color} r="42" />
              ) : (
                chartSegments.map((chartSegment) => {
                  const startAngle = accumulatedAngle;
                  const endAngle = accumulatedAngle + chartSegment.percentage * 3.6;

                  accumulatedAngle = endAngle;

                  return (
                    <path
                      d={getPieSlicePath(startAngle, endAngle)}
                      fill={chartSegment.color}
                      key={chartSegment.budgetName}
                      stroke="var(--panel-elevated)"
                      strokeWidth="1"
                    />
                  );
                })
              )}
              <circle cx="50" cy="50" fill="var(--panel-elevated)" r="24" />
              <text
                fill="var(--foreground)"
                fontSize="8"
                fontWeight="700"
                textAnchor="middle"
                x="50"
                y="49"
              >
                {formatHours(totalHours)}
              </text>
              <text fill="var(--muted)" fontSize="5" textAnchor="middle" x="50" y="57">
                hours
              </text>
            </svg>
          </div>

          <div className="grid gap-3">
            {chartSegments.map((chartSegment) => (
              <div
                className="grid gap-3 border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={chartSegment.budgetName}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0"
                    style={{ backgroundColor: chartSegment.color }}
                  />
                  <p className="truncate font-semibold">{chartSegment.budgetName}</p>
                </div>
                <p className="font-semibold tabular-nums">
                  {formatHours(chartSegment.totalHours)} hrs
                </p>
                <p className="text-sm text-[var(--muted)] tabular-nums">
                  {chartSegment.percentage.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
