// frocar/src/utils/carFilterContext.ts

import { CarListing } from '../pages/ProfilePage'; // Zaimportuj CarListing
import { CarFilterStrategy } from './filterStrategies'; // Zaimportuj typ strategii

// Typ dla reguły filtrowania, łączącej strategię z jej wartością filtra.
export type FilterRule = {
  strategy: CarFilterStrategy;
  value: any;
};

/**
 * Funkcja kontekstu, która aplikuje zbiór strategii filtrowania do listy samochodów.
 * @param initialListings Początkowa lista ogłoszeń do filtrowania.
 * @param filterRules Tablica obiektów, gdzie każdy obiekt zawiera strategię filtrowania i wartość dla tej strategii.
 * @returns Finalna, przefiltrowana lista ogłoszeń.
 */
export const applyFilters = (initialListings: CarListing[], filterRules: FilterRule[]): CarListing[] => {
  let filteredListings = [...initialListings]; // Tworzymy kopię, aby nie modyfikować oryginalnej listy

  for (const rule of filterRules) {
    // Aplikujemy każdą strategię po kolei do aktualnie przefiltrowanej listy
    filteredListings = rule.strategy(filteredListings, rule.value);
  }

  return filteredListings;
};