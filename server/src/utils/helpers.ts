export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getLocalDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
