import { CarListing } from '../pages/Profile';

export type CarFilterStrategy = (listings: CarListing[], value: any) => CarListing[];

export const filterByBrand: CarFilterStrategy = (listings: CarListing[], brand: string): CarListing[] => {
  if (!brand) {
    return listings;
  }
  return listings.filter((car) => car.brand.toLowerCase().includes(brand.toLowerCase()));
};

export const filterByAvailability: CarFilterStrategy = (
  listings: CarListing[],
  availability: 'all' | 'available' | 'unavailable'
): CarListing[] => {
  if (availability === 'all') {
    return listings;
  }
  return listings.filter((car) =>
    availability === 'available' ? car.isAvailable : !car.isAvailable
  );
};

export const filterByFuelType: CarFilterStrategy = (listings: CarListing[], fuelType: string): CarListing[] => {
  if (!fuelType || fuelType === 'all') {
    return listings;
  }
  return listings.filter((car) => car.fuelType.toLowerCase() === fuelType.toLowerCase());
};


export const filterByMinSeats: CarFilterStrategy = (listings: CarListing[], minSeats: number): CarListing[] => {
  if (isNaN(minSeats) || minSeats <= 0) {
    return listings;
  }
  return listings.filter((car) => car.seats >= minSeats);
};

export const filterByMaxPrice: CarFilterStrategy = (listings: CarListing[], maxPrice: number): CarListing[] => {
  if (isNaN(maxPrice) || maxPrice <= 0) {
    return listings;
  }
  return listings.filter((car) => car.rentalPricePerDay <= maxPrice);
};

export const filterByPriceRange: CarFilterStrategy = (
  listings: CarListing[],
  { min, max }: { min: number; max: number }
): CarListing[] => {
  if (isNaN(min) && isNaN(max)) {
    return listings;
  }
  return listings.filter((car) => {
    const price = car.rentalPricePerDay;
    const minValid = !isNaN(min) && min > 0 ? price >= min : true;
    const maxValid = !isNaN(max) && max > 0 ? price <= max : true;
    return minValid && maxValid;
  });
};