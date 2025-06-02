// frocar/src/utils/filterStrategies.ts

import { CarListing } from '../pages/Profile'; // Pamiętaj o zaimportowaniu interfejsu CarListing

// Typ dla funkcji strategii filtrowania
export type CarFilterStrategy = (listings: CarListing[], value: any) => CarListing[];

/**
 * Strategia filtrowania po marce samochodu.
 * @param listings Aktualna lista ogłoszeń do filtrowania.
 * @param brand Filtr marki (string).
 * @returns Przefiltrowana lista ogłoszeń.
 */
export const filterByBrand: CarFilterStrategy = (listings: CarListing[], brand: string): CarListing[] => {
  if (!brand) {
    return listings; // Jeśli brak filtra, zwracamy niezmienioną listę
  }
  return listings.filter((car) => car.brand.toLowerCase().includes(brand.toLowerCase()));
};

/**
 * Strategia filtrowania po dostępności samochodu.
 * @param listings Aktualna lista ogłoszeń do filtrowania.
 * @param availability Filtr dostępności ('all', 'available', 'unavailable').
 * @returns Przefiltrowana lista ogłoszeń.
 */
export const filterByAvailability: CarFilterStrategy = (listings: CarListing[], availability: 'all' | 'available' | 'unavailable'): CarListing[] => {
  if (availability === 'all') {
    return listings;
  }
  return listings.filter((car) =>
    availability === 'available' ? car.isAvailable : !car.isAvailable
  );
};

/**
 * Strategia filtrowania po typie paliwa.
 * @param listings Aktualna lista ogłoszeń do filtrowania.
 * @param fuelType Filtr typu paliwa (string).
 * @returns Przefiltrowana lista ogłoszeń.
 */
export const filterByFuelType: CarFilterStrategy = (listings: CarListing[], fuelType: string): CarListing[] => {
  if (!fuelType) {
    return listings;
  }
  return listings.filter((car) => car.fuelType.toLowerCase() === fuelType.toLowerCase());
};

/**
 * Strategia filtrowania po minimalnej liczbie miejsc.
 * @param listings Aktualna lista ogłoszeń do filtrowania.
 * @param minSeats Minimalna liczba miejsc (number).
 * @returns Przefiltrowana lista ogłoszeń.
 */
export const filterByMinSeats: CarFilterStrategy = (listings: CarListing[], minSeats: number): CarListing[] => {
  if (isNaN(minSeats) || minSeats <= 0) { // Sprawdzamy też, czy nie jest to NaN lub zero/ujemna wartość
    return listings;
  }
  return listings.filter((car) => car.seats >= minSeats);
};

/**
 * Strategia filtrowania po maksymalnej cenie wynajmu.
 * @param listings Aktualna lista ogłoszeń do filtrowania.
 * @param maxPrice Maksymalna cena wynajmu (number).
 * @returns Przefiltrowana lista ogłoszeń.
 */
export const filterByMaxPrice: CarFilterStrategy = (listings: CarListing[], maxPrice: number): CarListing[] => {
  if (isNaN(maxPrice) || maxPrice <= 0) { // Sprawdzamy też, czy nie jest to NaN lub zero/ujemna wartość
    return listings;
  }
  return listings.filter((car) => car.rentalPricePerDay <= maxPrice);
};