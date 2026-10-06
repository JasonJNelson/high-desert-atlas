/**
 * Pull named off-road routes from OpenStreetMap and write src/data/offroad.ts.
 * Run: node scripts/build-offroad.mjs
 * Geometry is © OpenStreetMap contributors, ODbL.
 */
import { writeFileSync } from "node:fs";
import { moreTrails } from "./offroad-rest.mjs";
import { rest2 } from "./offroad-rest2.mjs";

const OVERPASS = "https://overpass.openstreetmap.fr/api/interpreter";

const trails = [
  // Las Vegas
  t("wheeler-pass", "Wheeler Pass", "vegas", "Spring Mountains, between Cold Creek and Pahrump", [36.15, -115.85, 36.45, -115.45], ["Wheeler Pass Road", "Wheeler Pass Road North", "Wheeler Pass Road South"], "A mountain crossing the Strip never sees.", "Wheeler Pass Road climbs the Spring Mountains from the Pahrump side and drops toward Cold Creek, through pinyon and then cliff. It is the classic high route out of the Las Vegas valley that is not the paved Lee Canyon road.", "You trade the basin for a 7,000-foot ridge in an hour, with bristlecone country above the desert.", ["The pass itself, when it is dry and open", "Side roads to Carpenter and Trout canyons", "Snow that closes the top long after the valley is hot"], "May–June and September–October. Snow and mud shut the summit.", "Half a day", "High clearance. Stock SUVs make it when graded and dry. Not a rock trail.", "Pass near 7,500 ft", "None for the road. Spring Mountains passes can close without a ceremony.", "", "From Cold Creek Road northwest of Las Vegas, or from the Pahrump side. Do not start up with a storm on the mountain.", ["Check the county and forest road report. A dry afternoon in town means nothing at the summit.", "The cutoff spurs are rougher than the main grade."], "Snow, ice in the shade, and afternoon thunderstorms. No services on the pass.", "", ["charleston", "red-rock"], ""),
  t("cottonwood-valley", "Cottonwood Valley", "vegas", "Red Rock Canyon backcountry, west of Blue Diamond", [35.95, -115.55, 36.2, -115.25], ["Cottonwood Pass Road", "Cottonwood Pass West Road"], "The dirt half of Red Rock, past the scenic loop.", "Cottonwood Pass Road is the OHV backbone south of the paved Red Rock scenic drive: a valley of sandstone and Joshua trees between Blue Diamond and the Spring Mountain crest.", "The scenic loop is a windshield tour. This is where you are allowed to wander, on designated roads.", ["Cottonwood Pass", "The valley roads under the escarpment", "Connections toward Potosi"], "October–April. Summer is a furnace and the ground holds heat.", "2–4 hours", "High clearance. Sandy and rocky in stretches. Stock cars get stuck.", "About 3,500–5,000 ft", "Red Rock Canyon is a fee area. OHV rules are BLM and the conservation area, not 'anywhere'.", "Stay on designated routes. Red Rock has wilderness next door. Driving off the road is how the area gets closed.", "South of the Red Rock scenic loop, via Cottonwood Valley from SR-159 / Blue Diamond.", ["Download the BLM route map before you lose signal.", "Weekends are busy with side-by-sides. Weekday mornings are quieter."], "Soft sand, desert tortoises, and flash floods in the washes. Wilderness boundaries are not suggestions.", "", ["red-rock", "charleston"], ""),
  t("lovell-wash", "Lovell Wash", "vegas", "West of the Las Vegas valley, toward Red Rock", [36.05, -115.55, 36.25, -115.3], ["Lovell Wash Road"], "A wash road under the Red Rock rampart.", "Lovell Wash Road follows the drainage on the back side of the Red Rock escarpment, a sandy and rocky track used as a link in the Cottonwood and Spring Mountain dirt network.", "It is the unglamorous connector that actually gets you into the country the scenic loop only looks at.", ["The wash bottom", "Links toward Cottonwood and the old mine roads"], "October–April", "2–3 hours", "High clearance. Sand and rock. Not for a low sedan.", "About 3,500 ft", "Public land rules. Designated routes only near Red Rock.", "", "West of Las Vegas via the Red Rock / Blue Diamond side.", ["Air down a little if you have the compressor to air back up.", "If the wash is running, it is not a road that day."], "Flash floods. Do not drive a wash with a storm upstream.", "", ["red-rock", "cottonwood-valley"], ""),
  t("potosi-pass", "Potosi Pass", "vegas", "South Spring Mountains, above Goodsprings", [35.9, -115.6, 36.1, -115.35], ["Potosi Pass Road"], "An old mining pass under Mount Potosi.", "Potosi Pass Road crosses a shoulder of Mount Potosi, the peak with the antennas southwest of Las Vegas. The country is mined-out, steep, and close to town.", "A short, serious grade with a view back to the valley, not a Sunday scenic drive.", ["The pass", "Mine remnants — look, do not enter", "The drop toward Goodsprings"], "October–May. Snow at the top in winter.", "2–3 hours", "High clearance 4x4. Narrow and rocky toward the top.", "Pass near 6,000 ft", "None. Abandoned mines are unstable.", "", "From the Goodsprings side or the Mountain Springs side. Ask locally which side is less chewed up.", ["Do not enter mine openings.", "The antennas on the peak are not a viewpoint you drive to."], "Loose rock, exposure, and unmarked mine shafts.", "", ["red-rock", "charleston"], ""),
  t("trout-canyon", "Trout Canyon", "vegas", "Spring Mountains, northwest of Mountain Springs", [36.05, -115.7, 36.25, -115.4], ["Trout Canyon Road"], "A canyon road into the west side of the Springs.", "Trout Canyon Road leaves the Pahrump highway and climbs a canyon into the Spring Mountains, with the Wheeler Pass network above it.", "It is the quiet way into the range, used by people who already know the mountain.", ["The canyon grade", "Connections toward Wheeler Pass"], "May–October, if the upper roads are dry", "Half a day if you link to the pass", "High clearance. The upper end gets rough and can hold snow.", "Canyon to about 6,500 ft", "None.", "", "From SR-160 between Mountain Springs and Pahrump.", ["Pair it with Wheeler only if both are open.", "Cell service dies in the canyon."], "Rockfall and washouts after storms.", "", ["wheeler-pass", "charleston"], ""),
  t("carpenter-canyon", "Carpenter Canyon", "vegas", "Spring Mountains, near Wheeler Pass", [36.15, -115.75, 36.35, -115.45], ["Carpenter Canyon Road"], "A forest canyon tied to the Wheeler grade.", "Carpenter Canyon Road is a Spring Mountains dirt road in the same knot as Wheeler Pass: shade, rock, and a real climb out of the desert.", "One of the few places near Las Vegas where the air actually cools.", ["The canyon", "The link toward Wheeler Pass"], "Late spring through fall, snow-dependent", "Half a day", "High clearance.", "About 6,000–7,500 ft", "None.", "", "From the Wheeler Pass road network, or the west side of the Spring Mountains.", ["Treat it as part of the Wheeler system, not a separate paved outing."], "Snow and deadfall. The road is narrow.", "", ["wheeler-pass", "trout-canyon"], ""),
  t("mormon-well", "Mormon Well Road", "vegas", "Desert National Wildlife Refuge, Sheep Range", [36.25, -115.45, 36.75, -114.95], ["Mormon Well Road"], "The long dirt road into the refuge.", "Mormon Well Road runs north from the edge of the Las Vegas valley into the Desert National Wildlife Refuge and the Sheep Range. It is a long, remote desert drive to a spring, not a rock trail.", "This is the empty Nevada that starts twenty minutes from the last subdivision.", ["Mormon Well", "The Sheep Range front", "The Alamo Road junction, if you continue"], "October–April. Summer heat is dangerous and water is not reliable.", "A full day", "High clearance. Usually not technical, often washboard and rocky. A low car will suffer.", "About 3,000–5,500 ft", "Desert National Wildlife Refuge. Stay on designated roads. The refuge is not an open OHV area.", "", "North of Las Vegas via the Corn Creek / Mormon Well side. Carry all your water.", ["Tell someone the plan. This is a long way from a tow truck.", "The refuge closes roads. A line on this map is not a promise the gate is open."], "No water, no shade, soft shoulders, and military airspace nearby. Do not chase wildlife off the road.", "Stay on the designated road. The refuge can close routes.", ["valley-of-fire", "red-rock"], "https://www.fws.gov/refuge/desert"),
  t("alamo-road", "Alamo Road", "vegas", "Desert National Wildlife Refuge, toward Alamo", [36.3, -115.5, 36.9, -114.9], ["Alamo Road"], "The north continuation through the refuge.", "Alamo Road keeps going where Mormon Well leaves you, a long desert grade toward the Pahranagat and Alamo side of the refuge.", "It is a crossing, not a loop you finish before lunch.", ["The high desert between the Sheep Range and the Pahranagat", "Junctions with Mormon Well"], "October–April", "Most of a day", "High clearance. Remote. Not a rock crawler trail.", "About 4,000–6,000 ft", "Refuge rules. Designated roads only.", "", "Connects the Mormon Well side to the north. Do not start late.", ["Fuel in town. There is no gas on the road.", "A full-size spare is not optional."], "Isolation. A breakdown here is a night out.", "", ["mormon-well", "valley-of-fire"], ""),
  t("gold-butte-road", "Gold Butte Road", "vegas", "Gold Butte National Monument, south of Mesquite", [36.25, -114.35, 36.7, -114.0], ["Gold Butte Road", "Gold Butte Wash Road", "New Gold Butte Road"], "The monument's main dirt artery.", "Gold Butte Road and the wash road beside it are the way into Gold Butte National Monument: sandstone, Joshua trees, and the Little Finland country south of Mesquite.", "This is the Nevada monument most people miss on the way to Zion.", ["Whitney Pockets area, if you detour on a designated road", "The road toward Little Finland", "Falling Man and the other rock art, from the road and marked trails only"], "October–April. Summer is brutal and the roads rut after rain.", "A full day from Las Vegas", "High clearance. Sandy washes. Not technical until you leave the main road, which you should not.", "About 2,000–4,000 ft", "Gold Butte National Monument. Designated roads only. No dispersed camping in some zones. Pack out everything.", "A national monument, not an open riding area. Off-route driving is the fastest way to get the roads closed.", "South from Riverside / Mesquite, or the scenic back way from the Lake Mead side. The last pavement ends and the monument begins.", ["Little Finland is fragile. Walk the last bit on the signed path.", "Carry water for a day even if you plan a shorter one."], "Deep sand after wind, and flash floods in Gold Butte Wash. Cell service is a rumor.", "Designated routes only.", ["valley-of-fire", "mud-wash"], "https://www.blm.gov/visit/gold-butte-national-monument"),
  t("mud-wash", "Mud Wash", "vegas", "Gold Butte National Monument", [36.3, -114.35, 36.65, -114.05], ["Mud Wash Road", "Mud Wash North Road", "Lower Mud Wash Road"], "The sand road through the middle of the monument.", "Mud Wash is the soft center of Gold Butte, a sandy corridor between the Gold Butte Road and the scramble of sandstone to the east.", "It is the drive that feels like the monument instead of the road to the monument.", ["The wash", "Links to Little Finland and the Black Butte side"], "October–April, and not right after rain. The name is not poetic.", "Half a day once you are in the monument", "High clearance. Sand. 4x4 when it is dry and loose, worse when it is wet.", "About 2,500 ft", "Monument rules. Designated road.", "", "From Gold Butte Road.", ["Air down for the sand if you know how to air up.", "If you are leaving ruts off the existing track, turn around."], "The wash flash-floods. Wet mud here has ended trips.", "", ["gold-butte-road", "little-finland"], ""),
  t("little-finland", "Little Finland", "vegas", "Gold Butte National Monument", [36.4, -114.3, 36.6, -114.05], ["Little Finland Road"], "A short road to a grove of stone fins.", "Little Finland Road ends at one of the strangest rock gardens in the monument, orange fins the size of rooms. The walk from the parking area is the point. The fins are not a playground.", "It is a small place that photographs like a fantasy and breaks if you climb it.", ["The fins, from the ground", "The approach through the monument"], "October–April. Go early. The rock faces east and the crowds, such as they are, come late.", "2 hours at the rocks, plus the drive in", "High clearance to get here. The last walk is on foot.", "About 2,700 ft", "Monument. No climbing on the fins. No drones in many posted areas. Pack out trash.", "", "Via Gold Butte Road and Mud Wash. Do not invent a shortcut across the desert.", ["Stay on the existing path. Cryptobiotic soil and the fins both scar.", "There is no water and little shade."], "Fragile rock. A snapped fin does not grow back.", "Walk the fins. Do not climb them.", ["gold-butte-road", "mud-wash"], ""),
  t("devils-throat", "Devil's Throat", "vegas", "Gold Butte National Monument", [36.35, -114.25, 36.55, -114.05], ["Devils Throat Road"], "A sinkhole you drive to and do not enter.", "Devil's Throat is a collapse in the desert floor, sudden and deep. The road gets you to the rim. The hole is not a trail.", "A geologic surprise in a monument most maps still treat as empty.", ["The rim of the throat", "The approach across the mesa"], "October–April", "An hour at the site, plus the drive", "High clearance. The road is sandy and marked 4x4 in places.", "About 2,500 ft", "Monument. Stay behind the rim.", "", "From the Gold Butte road network.", ["The edge is rotten. Do not walk out for a better photo."], "Unstable rim. A fall here is not survivable.", "", ["gold-butte-road", "black-butte"], ""),
  t("black-butte", "Black Butte Road", "vegas", "Gold Butte National Monument", [36.4, -114.3, 36.65, -114.05], ["Black Butte Road"], "The road under the dark volcanic butte.", "Black Butte Road runs beneath the black hill that breaks the sandstone of Gold Butte, a designated route through the north end of the monument.", "It is the contrast: basalt on top of the same red rock as Valley of Fire.", ["Black Butte", "Links toward the Lime Canyon and Mud Wash roads"], "October–April", "Half a day inside the monument", "High clearance.", "About 2,500 ft", "Monument. Designated road.", "", "From the Gold Butte entrance roads south of Mesquite.", ["Combine it with Devil's Throat rather than a separate day."], "Soft shoulders and no services.", "", ["devils-throat", "gold-butte-road"], ""),
  t("scanlon-ferry", "Scanlon Ferry Road", "vegas", "Gold Butte, toward the Colorado River", [36.25, -114.4, 36.5, -114.1], ["Scanlon Ferry Road"], "A descent toward the river and a ferry that is long gone.", "Scanlon Ferry Road drops from the Gold Butte bench toward the Colorado, to the site of a ferry that served the country before the dams. The river is still there. The ferry is not.", "History at the bottom of a rough road, which is the only kind of history this desert keeps.", ["The grade down", "The river end of the road"], "October–April", "Half a day", "High clearance 4x4. The descent is the point, and so is the climb out.", "From the bench down toward the river", "Monument. The road ends. It does not become a river crossing.", "", "From Gold Butte Road.", ["Turn around where the road ends. The river is not a continuation."], "Exposure on the grade. Heat at the bottom.", "", ["gold-butte-road", "valley-of-fire"], ""),
  t("christmas-tree", "Christmas Tree Pass", "vegas", "Newberry Mountains, between Searchlight and Laughlin", [35.15, -114.95, 35.45, -114.55], ["Christmas Tree Pass Road"], "A desert pass hung with tinsel, seriously.", "Christmas Tree Pass Road crosses the Newberry Mountains between Searchlight and the Colorado River near Laughlin. People have been hanging ornaments in the junipers for decades. Spirit Mountain, to the south, is sacred ground.", "A strange, specific American place: a graded desert road, a folk tradition, and a mountain you leave alone.", ["The pass and the decorated trees", "Grapevine Canyon petroglyphs, from the signed area", "The view toward the river"], "October–April. The decorations are unofficial and the mountain is not.", "2–3 hours plus the drive from Las Vegas", "Usually a careful passenger car or stock SUV when graded. Storms change that. It is dirt.", "Pass near 4,000 ft", "Public road. Spirit Mountain and the surrounding country are culturally important to the Mojave. Stay on the road and in signed visiting areas.", "", "From US-95 at Searchlight, or from the Laughlin / NV-163 side.", ["Do not add your own ornament if you would not want the tree wearing it in July.", "Grapevine Canyon art is not a climbing wall."], "Loose gravel, cattle, and side roads that are not public. Off-road travel around Spirit Mountain is restricted.", "Stay on the pass road. The mountain is not an OHV area.", ["hoover-dam", "seven-magic"], ""),
  t("nelson-hills", "Nelson Hills", "vegas", "Eldorado Canyon, south of Lake Mead", [35.55, -115.05, 35.9, -114.55], null, "A web of mine roads above the Colorado.", "The hills behind Nelson and Eldorado Canyon are an old mining district of named routes, tailings, and short 4x4 roads above the river. The mapped lines are the lettered routes and Eagle Wash, not an invitation to cross the claims.", "It is the closest real off-road network to the south end of the Las Vegas valley.", ["Eagle Wash", "The lettered mine routes", "The view down Eldorado Canyon toward the river"], "October–April", "Half a day", "Mixed. Some routes are high clearance, some are rock crawler. Read the line you are on.", "About 2,000–3,500 ft", "A mix of public land and mining claims. Abandoned mines are not attractions you enter.", "", "From US-95 south to Nelson, then the canyon and the hills above it.", ["Stay out of adits and shafts. They collapse and they are not ventilated.", "The landing at the river is a dead end with people in it. Drive like it."], "Mine shafts, loose rock, and weekend traffic.", "", ["hoover-dam", "az-hot-springs"], ""),
  t("anniversary-mine", "Anniversary Mine", "vegas", "Lake Mead, north of the Bowl of Fire", [36.15, -114.85, 36.4, -114.6], ["Anniversary Mine Road"], "A mine road on the way to the hot springs.", "Anniversary Mine Road is a Lake Mead backcountry track in the same country as the Arizona Hot Springs hike: old workings, wash bottoms, and the river not far below.", "It is the drive version of the country you otherwise reach by walking the wash.", ["The mine road", "Washes toward the river hills"], "October–April. The lake country is dangerously hot in summer.", "Half a day", "High clearance.", "About 1,500–2,500 ft", "Lake Mead National Recreation Area. Park fee. Designated roads. Mines are closed.", "", "From the Northshore Road side of Lake Mead.", ["Do not combine this with the hot-springs ladder hike unless you have the daylight.", "The mine is not a tour."], "Unstable mine works and summer heat that kills.", "", ["az-hot-springs", "valley-of-fire"], ""),
  t("boxcar-cove", "Boxcar Cove", "vegas", "Lake Mead shoreline", [36.05, -114.9, 36.3, -114.65], ["Boxcar Cove Road"], "A cove road down to the high-water stain.", "Boxcar Cove Road drops off the Northshore bench to a cove on Lake Mead, named for the railcars dumped here when the railroad was being erased by the rising water.", "A short, strange piece of Hoover Dam history you can still drive to when the road is open.", ["The cove", "The abandoned equipment, which is debris, not a jungle gym"], "Fall through spring. The road closes or washes out. The lake level changes what 'the shore' means.", "2–3 hours", "High clearance. Rough and sometimes gated.", "Down to the lake", "Lake Mead NRA fee. The road is not always open.", "", "From Northshore Road.", ["If the gate is closed, it is closed. Do not drive around it."], "Steep grade and a shoreline that is not a beach.", "", ["hoover-dam", "anniversary-mine"], ""),
  t("bitter-springs", "Bitter Springs", "vegas", "Northshore, Lake Mead", [36.25, -114.7, 36.5, -114.4], ["Bitter Springs Trail", "Bitter Springs Road (4WD)"], "A 4x4 trail down a desert wash to a spring that is not sweet.", "Bitter Springs is a marked 4x4 trail off the Northshore Road, a rocky wash with a name that tells you not to drink. It is one of the few Lake Mead routes that is an actual trail rather than a cove road.", "Short, close to the valley, and rougher than it looks from the pavement.", ["The trail in the wash", "The spring, which is not drinking water"], "October–April", "2–3 hours", "High clearance 4x4. Rock in the wash.", "About 1,500–2,500 ft", "Lake Mead NRA. Stay on the trail.", "", "Signed off Northshore Road, east of the valley.", ["This is not the Arizona Hot Springs hike. Different canyon, different commitment."], "Rock, and the usual Lake Mead heat.", "", ["valley-of-fire", "az-hot-springs"], ""),
  t("government-wash", "Government Wash", "vegas", "Lake Mead, near the Las Vegas Bay", [36.05, -114.9, 36.25, -114.7], ["Government Wash Road"], "The closest dirt wash to the city, and it shows.", "Government Wash Road drops to a popular shoreline cove just east of the Las Vegas Bay. It is sandy, heavily used, and the opposite of remote.", "Use it as a shake-down, not as the trip.", ["The wash", "The cove when the lake is up"], "Fall through spring", "1–2 hours", "High clearance. Sand. Often passable, often crowded.", "Down to the lake", "Lake Mead NRA fee.", "", "Just inside the park, close to Lake Mead Boulevard.", ["Go early or accept the crowd.", "Soft sand at the bottom catches street tires."], "Weekend traffic and people backing trailers badly.", "", ["hoover-dam", "boxcar-cove"], ""),
  t("toquop-wash", "Toquop Wash", "vegas", "Between Mesquite and the Virgin Mountains", [36.6, -114.25, 36.9, -113.9], ["Toquop Wash Road"], "A wash on the Arizona-bound side of Mesquite.", "Toquop Wash Road runs the drainage south of the Virgin Mountains, desert country between Mesquite and the Gold Butte highlands.", "A useful and empty road if you are already in Mesquite and not ready for the freeway.", ["The wash", "The mountain front"], "October–April", "2–3 hours", "High clearance. Sandy wash.", "About 2,000 ft", "Public land. Stay in the wash road.", "", "South of Mesquite.", ["Do not drive it in a storm. It is a wash."], "Flash floods.", "", ["gold-butte-road", "valley-of-fire"], ""),
  t("gass-peak", "Gass Peak Road", "vegas", "North of the Las Vegas valley", [36.3, -115.25, 36.5, -115.05], ["Gass Peak Road"], "The road to the peak that watches the north valley.", "Gass Peak Road climbs out of the north edge of Las Vegas toward the summit that anchors that end of the valley. It is a ridge road, exposed and popular with people who want a view without a trailhead.", "The overview of the city from the side the tourists do not photograph.", ["The ridge", "The view back across the valley"], "October–May. Wind is the constant.", "2–3 hours", "High clearance. Rocky.", "Peak near 6,900 ft. The road does not owe you the summit.", "Public land. The top is not a campground.", "", "From the north valley, off the roads toward Corn Creek.", ["The last stretch is rougher than the beginning. Turning around is a skill."], "Exposure and wind. No guardrails, because there is no road in the suburban sense.", "", ["mormon-well", "red-rock"], ""),
  t("logandale", "Logandale Trails", "vegas", "Moapa Valley, north of Lake Mead", [36.52, -114.62, 36.72, -114.35], null, "The valley's main OHV network, named like a playlist.", "Logandale Trails is the BLM open area above the Moapa Valley: a mapped stack of loops, from the main loop to rock-crawler lines with names like Jack's Reward and Sidewinder. The lines on this map are the named trails, not the whole desert.", "If you want a system, with trail names and a way back to the trailer, this is the one near Las Vegas.", ["Trail 1, the main loop", "Jackrabbit and Lookout", "The harder named lines, if the machine matches the trail"], "October–April. Midsummer is for people who misread the forecast.", "Half a day to a full day", "Mixed. The main loop is high clearance and side-by-sides. Named rock trails are modified.", "About 1,500–2,500 ft", "BLM Logandale Trails. Free to ride the designated trails. Stay in the system. The Muddy River valley below is not part of the playground.", "", "I-15 to the Moapa Valley, then the signed Logandale trailhead west of Logandale.", ["The main loop is the orientation. Do not start on a rock trail because the name sounded fun.", "The town of Logandale is not the trailhead. Follow the signs up the bench."], "Weekend crowds, rock, and people riding above their ability. Dust.", "Open OHV area on designated trails. The surrounding desert is not open.", ["valley-of-fire", "bitter-springs"], "https://www.blm.gov/visit/logandale-trails"),
];

function t(id, name, region, area, bbox, osm, signature, summary, why, highlights, best, time, difficulty, elevation, fee, permit, access, tips, watch, status, pairWith, website) {
  return { id, name, region, area, bbox, osm, signature, summary, why, highlights, best, time, difficulty, elevation, fee, permit, access, tips, watch, status, pairWith, website };
}

const systems = {
  "nelson-hills": {
    bbox: [35.55, -115.05, 35.9, -114.55],
    test: (name, tags) => /^Route [A-Z]$/.test(name) || /^Eagle Wash/.test(name),
  },
  logandale: {
    bbox: [36.52, -114.62, 36.72, -114.35],
    test: (name, tags) => {
      const allow = new Set([
        "Trail 1 (Main Loop)",
        "Jackrabbit Loop Trail",
        "Jackrabbit Trail",
        "Lookout Trail",
        "Lookout Lollipop",
        "Mitch's Trail",
        "Black Lunge",
        "Conquer",
        "Divide",
        "Grindstone - Swamp Jump Bypass",
        "Swamp Jumps",
        "Sidewinder",
        "Sidewinder Connector",
        "Jack's Reward",
        "Jack's Reward Alt",
        "California Ridge",
        "Jornada del Muerto",
        "Pearl Jam",
        "Derek Trucks",
        "Warren Haynes",
        "Steely Dan",
        "Elizabeth Reed",
        "Graphx",
        "Easy Street",
        "Warm Up Loop",
      ]);
      return allow.has(name) && (tags.highway === "track" || tags.highway === "path" || tags.highway === "unclassified");
    },
  },
};

const extras = [
  t("burr-trail", "Burr Trail", "utah", "From Boulder to the Waterpocket Fold", [37.7, -111.55, 38.15, -110.85], ["Burr Trail Road"], "A switchback road down the Waterpocket Fold.", "The Burr Trail Road runs from Boulder, Utah, across the Circle Cliffs and down the famous switchbacks of the Waterpocket Fold into Capitol Reef. Much of it is graded and even paved on the Boulder end. The switchbacks are the moment. It is a backcountry road, not a Moab trail, and it still deserves a high-clearance plan when it has not been graded.", "The fold, from a road that uses it.", ["The switchbacks", "The Circle Cliffs", "The junction with the Notom road"], "March–November. Wet clay on the east side. Snow on the Boulder Mountain side.", "Half a day", "Often a careful SUV when dry and graded. The switchbacks are steep and exposed. Not a rock crawler trail. RVs should not.", "From about 6,700 ft at Boulder down the fold", "Grand Staircase-Escalante and Capitol Reef. The park end has its own rules. No extra permit for the through road.", "", "From UT-12 in Boulder, or from the Notom-Bullfrog road on the east.", ["The pavement ends. The switchbacks do not have guardrails.", "Check the east side after rain."], "Exposure on the switchbacks and clay when wet.", "Do not drive the dirt east of the fold when it is wet.", ["capitol-reef", "bryce"], ""),
  t("smoky-mountain", "Smoky Mountain Road", "utah", "Grand Staircase-Escalante, south of Escalante", [37.0, -111.85, 37.7, -111.15], ["Smoky Mountain Road", "Smoky Mountain/Alvey Wash Trail"], "The other long road south of Escalante.", "Smoky Mountain Road leaves the Hole-in-the-Rock country and crosses the Kaiparowits toward Big Water, a remote high-clearance traverse of Grand Staircase-Escalante. It is longer and lonelier than it looks on a map.", "A full crossing of the monument's empty middle.", ["The Kaiparowits", "Alvey Wash", "The distance, which is the feature"], "April–October. Mud closes it. Summer is hot and waterless.", "A full day", "High clearance. Remote. 4x4 when rough or wet.", "High desert, often 5,000–7,000 ft", "Grand Staircase-Escalante. No services. Carry water and a spare.", "", "From the Hole-in-the-Rock Road side or from Big Water. Tell someone which way.", ["This is not a spur you add to a Hole-in-the-Rock day.", "Fuel at both ends, because you will wish you had it in the middle."], "Isolation and clay.", "Remote. Do not start late.", ["hole-in-the-rock", "cottonwood-canyon"], ""),
  t("house-rock", "House Rock Valley Road", "utah", "Between US-89 and the Vermilion Cliffs", [36.95, -112.15, 37.25, -111.85], ["House Rock Valley Road"], "The dirt road under the Vermilion Cliffs.", "House Rock Valley Road runs the base of the Vermilion Cliffs between US-89 and the country south of the Grand Staircase. It is a washboard desert road used to reach the cliffs, the condor country, and the Wire Pass side of the Paria.", "The approach to a landscape that looks like a wall.", ["The cliffs", "The valley road", "The connection toward the Paria trailheads"], "March–November. Mud after storms. Summer heat.", "2–4 hours", "Usually a careful car or SUV when dry. Washboard. Not a rock trail.", "About 5,000 ft", "Grand Staircase-Escalante and BLM. The Wave and Wire Pass have their own permit. This road does not get you past that.", "", "From US-89 west of Page, or from the Cottonwood Canyon side.", ["A permit for the Wave is not waiting at the end of this road.", "Washboard will find every loose bolt."], "Soft shoulders and no services.", "", ["the-wave", "cottonwood-canyon"], ""),
  t("owl-creek", "Owl Creek Pass", "colorado", "Between Ridgway and the Cimarron", [38.05, -107.8, 38.25, -107.55], ["Owl Creek-Cimarron Road"], "A high dirt pass above Ridgway.", "Owl Creek Pass is the dirt crossing from Ridgway over to the Cimarron, under Courthouse Mountain and Chimney Rock. It is a scenic high-clearance road, famous from films and still a forest road that snows shut.", "The San Juans without the shelf-road commitment of the passes to the south.", ["The pass", "Chimney Rock and Courthouse Mountain", "The aspen, in season"], "June–October. Snow lingers. Mud in the shoulder season.", "Half a day", "High clearance recommended. Usually not a rock crawler trail. Rough when it has not been graded.", "About 10,100 ft", "Forest road. No fee.", "", "From Ridgway, or from the Cimarron side near Silver Jack.", ["The weather changes fast above the aspens.", "A good add-on to Ouray, not a replacement for Imogene."], "Snow early, mud late, and a narrow grade.", "Seasonal.", ["ouray", "telluride"], ""),
  t("dunton", "Dunton Road", "colorado", "Between Dolores and the San Juans", [37.55, -108.45, 38.0, -107.9], ["Dunton Road"], "A long forest road to a hot-spring ghost town.", "Dunton Road runs from the Dolores side into the West Dolores River country and the old town of Dunton. It is a remote forest drive, high clearance in stretches, used to reach the Lizard Head wilderness edge rather than a rock trail.", "The quiet San Juan approach, from the west.", ["The forest road", "Dunton", "The West Dolores"], "June–October", "Most of a day", "High clearance. Remote dirt. Not technical rock when dry.", "High forest, over 8,000 ft", "Forest road. The hot springs at Dunton are private. The road is public.", "", "From Dolores, north into the forest.", ["The resort is not a public soak.", "Fuel in Dolores."], "Isolation and mud.", "", ["telluride", "mesa-verde"], ""),
];

const all = [...trails, ...moreTrails, ...rest2, ...extras];

const KNOWN = new Set([
  "strip", "fremont", "neon-museum", "mob-museum", "red-rock", "valley-of-fire", "hoover-dam", "az-hot-springs", "seven-magic", "charleston", "springs-preserve",
  "zion-canyon", "the-narrows", "bryce", "delicate-arch", "canyonlands", "dead-horse", "capitol-reef", "monument-valley", "goblin-valley", "bonneville", "antelope-island",
  "gc-south", "gc-north", "horseshoe", "antelope-canyon", "the-wave", "sedona", "havasu", "saguaro", "petrified", "flagstaff", "kartchner", "chiricahua", "dbg",
  "rmnp", "maroon-bells", "garden-gods", "mesa-verde", "sand-dunes", "black-canyon", "red-rocks-amp", "telluride", "ouray", "hanging-lake", "pikes-peak", "colo-monument",
  "white-sands", "carlsbad", "santa-fe", "taos-pueblo", "bandelier", "chaco", "tent-rocks", "bisti", "meow-wolf", "vla", "sandia", "ghost-ranch", "el-morro", "shiprock",
  ...all.map((trail) => trail.id),
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function overpass(query) {
  let last = "unknown";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(OVERPASS, {
        method: "POST",
        body: query,
        headers: { "User-Agent": "HighDesertAtlas/1.0 (off-road map build)" },
      });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
      console.log("retry", last);
      await sleep(1500 * (attempt + 1));
    }
  }
  throw new Error(last);
}

function wayLine(way) {
  const geom = way.geometry;
  if (!geom || geom.length < 2) return null;
  return geom.map((point) => [point.lon, point.lat]);
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function stitch(lines) {
  const unused = lines.filter((line) => line.length >= 2).map((line) => line.slice());
  const out = [];
  const tol = 0.0009;
  while (unused.length) {
    let chain = unused.pop();
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < unused.length; i++) {
        const seg = unused[i];
        const a = chain[0];
        const b = chain[chain.length - 1];
        const s = seg[0];
        const e = seg[seg.length - 1];
        if (dist(b, s) < tol) {
          chain = chain.concat(seg.slice(1));
          unused.splice(i, 1);
          grew = true;
          break;
        }
        if (dist(b, e) < tol) {
          chain = chain.concat(seg.slice(0, -1).reverse());
          unused.splice(i, 1);
          grew = true;
          break;
        }
        if (dist(a, e) < tol) {
          chain = seg.concat(chain.slice(1));
          unused.splice(i, 1);
          grew = true;
          break;
        }
        if (dist(a, s) < tol) {
          chain = seg.slice().reverse().concat(chain.slice(1));
          unused.splice(i, 1);
          grew = true;
          break;
        }
      }
    }
    out.push(chain);
  }
  return out.sort((a, b) => b.length - a.length);
}

function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let max = 0;
    let index = -1;
    const [x1, y1] = points[start];
    const [x2, y2] = points[end];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = start + 1; i < end; i++) {
      const [x, y] = points[i];
      const d = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / len;
      if (d > max) {
        max = d;
        index = i;
      }
    }
    if (max > epsilon && index !== -1) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function simplifyLines(lines) {
  return lines
    .map((line) => {
      let epsilon = 0.00018;
      let next = simplify(line, epsilon);
      if (next.length > 280) next = simplify(line, 0.00045);
      if (next.length > 360) next = simplify(line, 0.0009);
      return next.map(([lng, lat]) => [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5]);
    })
    .filter((line) => line.length >= 2);
}

function haversine(a, b) {
  const R = 3958.8;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function milesOf(lines) {
  let miles = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) miles += haversine(line[i - 1], line[i]);
  }
  return miles;
}

function anchor(lines) {
  let best = lines[0];
  let bestLen = -1;
  for (const line of lines) {
    const len = milesOf([line]);
    if (len > bestLen) {
      best = line;
      bestLen = len;
    }
  }
  return best[Math.floor(best.length / 2)];
}

function usable(way) {
  const tags = way.tags || {};
  if (!tags.highway) return false;
  if (["footway", "cycleway", "steps", "corridor", "platform"].includes(tags.highway)) return false;
  return true;
}

function inBbox(line, bbox) {
  const [s, w, n, e] = bbox;
  return line.some(([lng, lat]) => lat >= s && lat <= n && lng >= w && lng <= e);
}

async function fetchBatch(batch) {
  const parts = [];
  for (const trail of batch) {
    if (!trail.osm) continue;
    const [s, w, n, e] = trail.bbox;
    for (const name of trail.osm) parts.push(`way["name"=${JSON.stringify(name)}](${s},${w},${n},${e});`);
  }
  if (!parts.length) return new Map();
  const query = `[out:json][timeout:90];(\n${parts.join("\n")}\n);out geom;`;
  const data = await overpass(query);
  const byTrail = new Map(batch.map((trail) => [trail.id, []]));
  for (const way of data.elements || []) {
    if (!usable(way)) continue;
    const line = wayLine(way);
    if (!line) continue;
    const name = way.tags?.name;
    for (const trail of batch) {
      if (!trail.osm?.includes(name)) continue;
      if (!inBbox(line, trail.bbox)) continue;
      byTrail.get(trail.id).push(line);
    }
  }
  return byTrail;
}

async function fetchSystem(trail) {
  const spec = systems[trail.id];
  if (!spec) return [];
  const [s, w, n, e] = spec.bbox;
  const query = `[out:json][timeout:80];way["name"](${s},${w},${n},${e});out geom;`;
  const data = await overpass(query);
  return (data.elements || []).filter((way) => usable(way) && spec.test(way.tags?.name || "", way.tags || {}));
}

const places = [];
const missed = [];
const named = all.filter((trail) => trail.osm);
const systemsOnly = all.filter((trail) => !trail.osm);

for (let i = 0; i < named.length; i += 8) {
  const batch = named.slice(i, i + 8);
  process.stdout.write(`batch ${batch.map((trail) => trail.id).join(", ")}... `);
  let byTrail;
  try {
    byTrail = await fetchBatch(batch);
  } catch (error) {
    console.log("FAIL", error instanceof Error ? error.message : error);
    missed.push(...batch.map((trail) => trail.id));
    continue;
  }
  console.log("ok");
  for (const trail of batch) accept(trail, byTrail.get(trail.id) || []);
  await sleep(800);
}

for (const trail of systemsOnly) {
  process.stdout.write(`${trail.id}... `);
  try {
    const ways = await fetchSystem(trail);
    console.log(`${ways.length} ways`);
    accept(trail, ways.map(wayLine).filter(Boolean));
  } catch (error) {
    console.log("FAIL", error instanceof Error ? error.message : error);
    missed.push(trail.id);
  }
  await sleep(800);
}

function accept(trail, rawLines) {
  const line = simplifyLines(stitch(rawLines));
  const miles = milesOf(line);
  console.log(`  ${trail.id}: ${line.length} lines, ${miles.toFixed(1)} mi`);
  if (!line.length || miles < 0.25) {
    missed.push(trail.id);
    return;
  }
  const [lng, lat] = anchor(line);
  const pretty = miles < 10 ? miles.toFixed(1) : String(Math.round(miles));
  const pairWith = trail.pairWith.filter((id) => KNOWN.has(id) && id !== trail.id);
  places.push({
    id: trail.id,
    name: trail.name,
    region: trail.region,
    categories: ["trail"],
    lat,
    lng,
    area: trail.area,
    signature: trail.signature,
    summary: trail.summary,
    why: trail.why,
    highlights: trail.highlights,
    best: trail.best,
    time: `${pretty} miles · ${trail.time}`,
    difficulty: trail.difficulty,
    elevation: trail.elevation,
    fee: trail.fee,
    permit: trail.permit || undefined,
    access: trail.access,
    tips: trail.tips,
    watch: trail.watch,
    status: trail.status || undefined,
    pairWith,
    established: "Route line © OpenStreetMap contributors, simplified",
    website: trail.website || undefined,
    line,
  });
}

const fallback = {
  "lovell-wash": '[out:json][timeout:40];way["name"~"Lovell Wash",i](36.0,-115.75,36.35,-115.15);out geom;',
  "bitter-springs": '[out:json][timeout:40];way["name"~"Bitter Springs",i](36.2,-114.85,36.6,-114.3);out geom;',
  "metal-masher": '[out:json][timeout:40];way["name"~"Metal Masher",i](38.4,-109.8,38.65,-109.45);out geom;',
  "hell-roaring": '[out:json][timeout:40];way["name"~"Hell Roaring",i](38.55,-109.85,38.85,-109.4);out geom;',
  "eagles-dare": '[out:json][timeout:40];way["name"~"Eagles Dare|Where Eagles",i](38.45,-109.7,38.75,-109.25);out geom;',
  "strike-ravine": '[out:json][timeout:40];way["name"~"Strike Ravine",i](38.45,-109.8,38.7,-109.4);out geom;',
  "behind-the-reef": '[out:json][timeout:40];way["name"~"Behind The Reef|Behind the Reef",i](38.6,-111.25,39.2,-110.35);out geom;',
  "crack-canyon": '[out:json][timeout:40];way["name"~"Crack Canyon",i](38.55,-111.0,39.05,-110.4);out geom;',
  schnebly: '[out:json][timeout:40];way["name"~"Schnebly",i](34.75,-111.8,35.05,-111.45);out geom;',
  "diamond-creek": '[out:json][timeout:40];way["name"~"Diamond Creek",i]["highway"](35.45,-113.8,36.05,-112.9);out geom;',
  "clear-lake": '[out:json][timeout:40];way["name"~"Clear Lake",i](37.78,-107.9,38.02,-107.55);out geom;',
  tomboy: '[out:json][timeout:40];way["name"~"Tomboy",i](37.88,-107.88,38.02,-107.65);out geom;',
  "taylor-pass": '[out:json][timeout:40];way["name"~"Taylor Pass",i](38.95,-106.85,39.22,-106.4);out geom;',
  gilman: '[out:json][timeout:40];way["name"~"Guadalupe Canyon|Gilman",i]["highway"](35.65,-106.95,35.95,-106.5);out geom;',
  kelly: '[out:json][timeout:40];way["name"~"Kelly",i]["highway"~"track|unclassified|tertiary"](33.9,-107.35,34.25,-106.85);out geom;',
  "devils-throat": '[out:json][timeout:40];way["name"~"Devils Throat|Devil.s Throat",i](36.25,-114.4,36.65,-113.95);out geom;',
};

const byId = new Map(all.map((trail) => [trail.id, trail]));
for (const id of [...new Set(missed)]) {
  if (places.some((place) => place.id === id)) continue;
  const query = fallback[id];
  const trail = byId.get(id);
  if (!query || !trail) continue;
  process.stdout.write(`fallback ${id}... `);
  try {
    const data = await overpass(query);
    const lines = (data.elements || []).filter(usable).map(wayLine).filter(Boolean);
    console.log(`${lines.length} raw`);
    accept(trail, lines);
  } catch (error) {
    console.log("FAIL", error instanceof Error ? error.message : error);
  }
  await sleep(600);
}

const file = `// Generated by scripts/build-offroad.mjs. Route lines are © OpenStreetMap contributors, ODbL.
import type { Place } from "./types";

export const offroadPlaces: Place[] = ${JSON.stringify(places, null, 2)};
`;
writeFileSync("/workspace/src/data/offroad.ts", file);
console.log(`wrote ${places.length} trails`);
if (missed.length) console.log("missed", missed.join(", "));

