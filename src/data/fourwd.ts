import type { Place, RegionId } from "./types";
import data from "./fourwd.json";

type Row = [string, string, RegionId, number, number, number, [number, number][][]];

const AREA: Record<RegionId, string> = {
  vegas: "Nevada, around Las Vegas",
  utah: "Utah",
  arizona: "Arizona",
  colorado: "Colorado",
  newmexico: "New Mexico",
};

const WHY =
  "This one is in the atlas because the road is tagged as requiring four-wheel drive, not because it is a scenic graded road a car can creep along.";
const BEST = "When the surface is dry. Snow, mud, and runoff close these before they close the highway.";
const DIFFICULTY =
  "4WD required. High clearance. How hard it is changes along the line and with the weather.";
const ELEVATION = "Not surveyed here. The map shows the path, not the altitude.";
const FEE =
  "Depends who manages the ground. Many BLM and forest roads are free. Parks, monuments, and some recreation sites are not.";
const ACCESS =
  "Use the mapped line as the named route only. A drawn road is not permission to cross a closure, a wilderness boundary, or private land.";
const TIPS = [
  "Low range, a full-size spare, and someone who knows when you should be back.",
  "If the tires leave the existing track, you are no longer on this route.",
];
const WATCH =
  "Rocks, shelves, water, and a road that may be closed even though the line is still here. Do not drive it wet to see what happens.";
const STATUS =
  "OpenStreetMap tags this route 4WD-only. Check the county, forest, BLM, or park before you go.";
const ESTABLISHED = "Route line © OpenStreetMap contributors, simplified";
const REST = ["Stay on the existing track", "Confirm it is open with the land manager"];

function pretty(miles: number): string {
  return miles < 10 ? miles.toFixed(1) : String(Math.round(miles));
}

function toPlace(row: Row): Place {
  const [id, name, region, lat, lng, miles, line] = row;
  const length = pretty(miles);
  const area = AREA[region];
  return {
    id,
    name,
    region,
    categories: ["trail"],
    lat,
    lng,
    area,
    signature: `${length} miles. Tagged 4WD-only.`,
    summary: `${name} is a named route OpenStreetMap marks as 4WD-only, about ${length} miles in ${area}. The line on the map is that named track, simplified. It does not show gates, private property, or a closure that happened after the map was drawn.`,
    why: WHY,
    highlights: [`About ${length} miles of named 4WD route`, REST[0], REST[1]],
    best: BEST,
    time: `${length} miles · allow extra time`,
    difficulty: DIFFICULTY,
    elevation: ELEVATION,
    fee: FEE,
    access: ACCESS,
    tips: TIPS,
    watch: WATCH,
    status: STATUS,
    pairWith: [],
    established: ESTABLISHED,
    line,
  };
}

export const fourwdPlaces: Place[] = (data.rows as Row[]).map(toPlace);
