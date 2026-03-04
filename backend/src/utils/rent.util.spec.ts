import { calculateRentDays, calculateProRatedRent } from './rent.util';

describe('Rent Utility Functions', () => {
  describe('calculateRentDays', () => {
    it('should calculate the correct number of rent days including start and end date', () => {
      // Arrange
      const startDate = new Date('2023-10-01');
      const endDate = new Date('2023-10-15');

      // Act
      const rentDays = calculateRentDays(startDate, endDate);

      // Assert
      // Từ ngày 1 đến ngày 15 là 15 ngày
      expect(rentDays).toBe(15);
    });

    it('should return 1 day when start and end date are the same', () => {
      const startDate = new Date('2023-10-01');
      const endDate = new Date('2023-10-01');
      
      const rentDays = calculateRentDays(startDate, endDate);
      
      expect(rentDays).toBe(1);
    });

    it('should return 0 when end date is before start date', () => {
      const startDate = new Date('2023-10-15');
      const endDate = new Date('2023-10-01');
      
      const rentDays = calculateRentDays(startDate, endDate);
      
      expect(rentDays).toBe(0);
    });
  });

  describe('calculateProRatedRent', () => {
    it('should correctly calculate pro-rated rent based on a 30-day month', () => {
      // Arrange
      const monthlyRent = 3000000; // 3 triệu
      const days = 15; // Nửa tháng

      // Act
      const proRatedRent = calculateProRatedRent(monthlyRent, days);

      // Assert
      expect(proRatedRent).toBe(1500000); // 1.5 triệu
    });

    it('should correctly round the pro-rated rent to nearest integer', () => {
      const monthlyRent = 3000000; 
      const days = 1; 

      const proRatedRent = calculateProRatedRent(monthlyRent, days);

      // 3,000,000 / 30 = 100,000 per day
      expect(proRatedRent).toBe(100000);
    });

    it('should allow custom days in month (e.g. 31 days)', () => {
      const monthlyRent = 3100000; 
      const days = 10; 

      const proRatedRent = calculateProRatedRent(monthlyRent, days, 31);

      // 3,100,000 / 31 = 100,000 per day * 10 = 1,000,000
      expect(proRatedRent).toBe(1000000);
    });

    it('should return 0 if days or monthly rent is 0', () => {
      expect(calculateProRatedRent(3000000, 0)).toBe(0);
      expect(calculateProRatedRent(0, 15)).toBe(0);
    });
  });
});
