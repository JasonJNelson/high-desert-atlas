import { arizonaPlaces } from "./arizona";
import { coloradoPlaces } from "./colorado";
import { newMexicoPlaces } from "./newmexico";
import type { CategoryId, Place, RegionId, RegionMeta } from "./types";
import { utahPlaces } from "./utah";
import { vegasPlaces } from "./vegas";

export type { BasemapId, CategoryId, Place, RegionId, RegionMeta } from "./types";

export const REGIONS: RegionMeta[] = [
  {
    id: "vegas",
    label: "Las Vegas",
    blurb: "Neon, red rock, and the dam.",
    color: "#b85c38",
  },
  {
    id: "utah",
    label: "Utah",
    blurb: "Canyons, arches, and salt.",
    color: "#2f6a66",
  },
  {
    id: "arizona",
    label: "Arizona",
    blurb: "The big canyon and the Sonoran Desert.",
    color: "#8d4b3c",
  },
  {
    id: "colorado",
    label: "Colorado",
    blurb: "High country, dunes, and cliff dwellings.",
    color: "#3d6a48",
  },
  {
    id: "newmexico",
    label: "New Mexico",
    blurb: "White dunes, pueblos, and badlands.",
    color: "#8a6239",
  },
];

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "park", label: "Parks" },
  { id: "hike", label: "Hikes" },
  { id: "view", label: "Views" },
  { id: "rock", label: "Geology" },
  { id: "water", label: "Water" },
  { id: "town", label: "Towns" },
  { id: "culture", label: "Culture" },
  { id: "landmark", label: "Landmarks" },
  { id: "night", label: "Night" },
  { id: "trail", label: "Off-road" },
];

export const PLACES: Place[] = [
  ...vegasPlaces,
  ...utahPlaces,
  ...arizonaPlaces,
  ...coloradoPlaces,
  ...newMexicoPlaces,
];

export function catalogWith(offroad: Place[]): Place[] {
  const pick = (region: RegionId) => offroad.filter((place) => place.region === region);
  return [
    ...vegasPlaces,
    ...pick("vegas"),
    ...utahPlaces,
    ...pick("utah"),
    ...arizonaPlaces,
    ...pick("arizona"),
    ...coloradoPlaces,
    ...pick("colorado"),
    ...newMexicoPlaces,
    ...pick("newmexico"),
  ];
}

const byId = new Map(PLACES.map((place) => [place.id, place]));

export function rememberPlaces(places: Place[]) {
  for (const place of places) byId.set(place.id, place);
}

export function getPlace(id: string): Place | undefined {
  return byId.get(id);
}

export function regionMeta(id: RegionId): RegionMeta {
  const found = REGIONS.find((region) => region.id === id);
  if (!found) throw new Error(`Unknown region ${id}`);
  return found;
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
