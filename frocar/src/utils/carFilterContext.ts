import { CarListing } from '../pages/Profile'; 
import { CarFilterStrategy } from './filterStrategies'; 

export type FilterRule = {
  strategy: CarFilterStrategy;
  value: any;
};

export const applyFilters = (initialListings: CarListing[], filterRules: FilterRule[]): CarListing[] => {
  let filteredListings = [...initialListings]; 

  for (const rule of filterRules) {
    filteredListings = rule.strategy(filteredListings, rule.value);
  }

  return filteredListings;
};