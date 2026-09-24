export type RegionId = "vegas" | "utah" | "arizona" | "colorado" | "newmexico";

export type CategoryId =
  | "park"
  | "hike"
  | "view"
  | "rock"
  | "water"
  | "town"
  | "culture"
  | "landmark"
  | "night";

export type BasemapId = "liberty" | "dark" | "satellite";

export type Place = {
  id: string;
  name: string;
  region: RegionId;
  categories: CategoryId[];
  lat: number;
  lng: number;
  area: string;
  signature: string;
  summary: string;
  why: string;
  highlights: string[];
  best: string;
  time: string;
  difficulty: string;
  elevation: string;
  fee: string;
  permit?: string;
  access: string;
  tips: string[];
  watch: string;
  status?: string;
  pairWith: string[];
  established?: string;
  website?: string;
};

export type RegionMeta = {
  id: RegionId;
  label: string;
  blurb: string;
  color: string;
};
