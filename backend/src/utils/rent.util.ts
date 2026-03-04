export function calculateRentDays(startDate: Date, endDate: Date): number {
  if (endDate < startDate) return 0;
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  return diffDays + 1; // Bao gồm cả ngày bắt đầu và ngày kết thúc
}

export function calculateProRatedRent(monthlyRent: number, days: number, daysInMonth: number = 30): number {
  if (days <= 0 || monthlyRent <= 0) return 0;
  
  const dailyRent = monthlyRent / daysInMonth;
  return Math.round(dailyRent * days);
}
