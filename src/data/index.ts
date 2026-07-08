import tripJson from "./trip.json";
import itineraryJson from "./itinerary.json";
import attractionsJson from "./attractions.json";
import restaurantsJson from "./restaurants.json";
import toursJson from "./tours.json";
import shoppingJson from "./shopping.json";
import packingJson from "./packing.json";
import budgetJson from "./budget.json";
import insuranceJson from "./insurance.json";
import videosJson from "./videos.json";
import type { Trip, Day, Place, Video } from "../types";

export const trip = tripJson as Trip;
export const itinerary = itineraryJson as Day[];
export const attractions = attractionsJson as Place[];
export const restaurants = restaurantsJson as Place[];
export const tours = toursJson as any;
export const shopping = shoppingJson as any;
export const packing = packingJson as Record<string, string[]>;
export const budget = budgetJson as any;
export const insurance = insuranceJson as any;
export const videos = videosJson as Video[];

export const allPlaces: Place[] = [...attractions, ...restaurants];
