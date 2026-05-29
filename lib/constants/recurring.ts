const recurringDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

export const recurringDayOptions = recurringDayNames.map((dayName, index) => ({
  label: dayName,
  value: index + 1
}));
