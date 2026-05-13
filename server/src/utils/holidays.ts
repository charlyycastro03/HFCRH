export function isMexicanHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();

  if (month === 1 && day === 1) return true;
  if (month === 5 && day === 1) return true;
  if (month === 9 && day === 16) return true;
  if (month === 12 && day === 25) return true;
  if (month === 10 && day === 1 && (year - 2024) % 6 === 0) return true;

  if (month === 2 && dayOfWeek === 1 && day <= 7) return true;
  if (month === 3 && dayOfWeek === 1 && day >= 15 && day <= 21) return true;
  if (month === 11 && dayOfWeek === 1 && day >= 15 && day <= 21) return true;

  return false;
}

export function calculateBusinessDays(
  startDate: string,
  endDate: string,
  workDaysPerWeek: number
): number {
  let count = 0;
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    const dayOfWeek = current.getDay();
    let isWorkDay = true;

    if (workDaysPerWeek <= 6 && dayOfWeek === 0) isWorkDay = false;
    else if (workDaysPerWeek <= 5 && dayOfWeek === 6) isWorkDay = false;

    if (isWorkDay && !isMexicanHoliday(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function calculateReturnDate(endDate: string, workDaysPerWeek: number): Date {
  const returnDate = new Date(endDate + 'T12:00:00');
  returnDate.setDate(returnDate.getDate() + 1);

  while (true) {
    const dayOfWeek = returnDate.getDay();
    let isWorkDay = true;
    if (workDaysPerWeek <= 6 && dayOfWeek === 0) isWorkDay = false;
    if (workDaysPerWeek <= 5 && dayOfWeek === 6) isWorkDay = false;
    if (isWorkDay && !isMexicanHoliday(returnDate)) break;
    returnDate.setDate(returnDate.getDate() + 1);
  }
  return returnDate;
}
