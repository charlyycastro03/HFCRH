export function getDaysGrantedByYear(anniversaryYear: number): number {
  if (anniversaryYear === 1) return 12;
  if (anniversaryYear === 2) return 14;
  if (anniversaryYear === 3) return 16;
  if (anniversaryYear === 4) return 18;
  if (anniversaryYear === 5) return 20;
  if (anniversaryYear <= 10) return 22;
  if (anniversaryYear <= 15) return 24;
  if (anniversaryYear <= 20) return 26;
  if (anniversaryYear <= 25) return 28;
  if (anniversaryYear <= 30) return 30;
  if (anniversaryYear <= 35) return 32;
  return 32 + Math.floor((anniversaryYear - 31) / 5) * 2;
}

export function calculateYearsOfService(hireDate: Date): number {
  const today = new Date();
  let years = today.getFullYear() - hireDate.getFullYear();
  const m = today.getMonth() - hireDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < hireDate.getDate())) years--;
  return Math.max(0, years);
}

export function calculateEntitlement(hireDate: Date | null): number {
  if (!hireDate) return 0;

  const today = new Date();
  const start = new Date(hireDate);

  let years = today.getFullYear() - start.getFullYear();
  let m = today.getMonth() - start.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < start.getDate())) {
    years--;
    m += 12;
  }

  if (today.getDate() < start.getDate()) m--;

  if (m < 0) m += 12;

  if (years <= 0) {
    if (today < start) return 0;
    return Math.floor(m * (12 / 12));
  }

  return getDaysGrantedByYear(years);
}
