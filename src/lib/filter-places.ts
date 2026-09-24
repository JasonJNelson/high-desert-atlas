import type { Place } from "@/data/places";
import type { CategoryId, RegionId } from "@/data/types";

export function filterPlaces(
  places: Place[],
  opts: {
    query: string;
    regions: RegionId[];
    categories: CategoryId[];
    savedOnly: boolean;
    favorites: string[];
  },
): Place[] {
  const query = opts.query.trim().toLowerCase();
  return places.filter((place) => {
    if (opts.regions.length > 0 && !opts.regions.includes(place.region)) return false;
    if (
      opts.categories.length > 0 &&
      !place.categories.some((category) => opts.categories.includes(category))
    ) {
      return false;
    }
    if (opts.savedOnly && !opts.favorites.includes(place.id)) return false;
    if (!query) return true;
    const haystack = [
      place.name,
      place.area,
      place.signature,
      place.summary,
      place.why,
      place.access,
      ...place.highlights,
      ...place.tips,
    ]
      .join("\n")
      .toLowerCase();
    return haystack.includes(query);
  });
}
