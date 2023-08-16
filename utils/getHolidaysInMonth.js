function getHolidaysInMonth(year, month, startDay, endDay) {
  const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // Get the day of the week of the first day of the month -1 cause month start with 0

  const dayNameToIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const startDayIndex = dayNameToIndex[startDay];
  const endDayIndex = dayNameToIndex[endDay];

  let holidays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
    if (startDayIndex === 0) {
      if (dayOfWeek < startDayIndex || dayOfWeek > endDayIndex) {
        holidays++;
      }
    } else {
      if (dayOfWeek < startDayIndex && dayOfWeek > endDayIndex) {
        holidays++;
      }
    }
  }
  return holidays;
}

module.exports = getHolidaysInMonth;
