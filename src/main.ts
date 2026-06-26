import "./styles.css";
import * as THREE from "three";

const STORAGE_KEY = "freedom-engine.save.v1";
const GAME_TITLE = "Red, White & Boomtown";
const GAME_SUBTITLE = "Build the Fourth. Feed the crowd. Keep the sky from suing you.";
const TILE_SIZE = 1;
const MAP_W = 24;
const MAP_H = 18;

type Category = "paths" | "vendors" | "civic" | "services" | "parade" | "rides" | "fireworks" | "tools";
type PhaseId = "setup" | "afternoon" | "parade" | "evening" | "finale" | "recap";
type WeatherId = "clear" | "hot" | "windy" | "dry" | "rain";
type ToolId = BuildingId | "bulldoze";

type BuildingId =
  | "path"
  | "serviceLane"
  | "gate"
  | "parking"
  | "shuttle"
  | "generator"
  | "lightTower"
  | "water"
  | "tables"
  | "viewing"
  | "shade"
  | "info"
  | "hotdog"
  | "funnelCake"
  | "lemonade"
  | "iceCream"
  | "bbq"
  | "flagStand"
  | "souvenir"
  | "raffle"
  | "historyBooth"
  | "dunkTank"
  | "ringToss"
  | "bounceHouse"
  | "carousel"
  | "ferrisWheel"
  | "spinRide"
  | "musicStage"
  | "paradeStaging"
  | "paradeRoute"
  | "veteransFloat"
  | "fireTruckFloat"
  | "classicCars"
  | "trashCan"
  | "dumpster"
  | "bathroom"
  | "handwash"
  | "firstAid"
  | "fireMarshal"
  | "fireCrew"
  | "security"
  | "lostChild"
  | "maintenance"
  | "supplyDepot"
  | "volunteer"
  | "fireworksVendor"
  | "sparklerStand"
  | "launchZone"
  | "safetyBarrier"
  | "finaleControl"
  | "grandFinaleRack";

type Stats = {
  money: number;
  crowd: number;
  joy: number;
  pride: number;
  spectacle: number;
  safety: number;
  fireRisk: number;
  flow: number;
  traffic: number;
  supply: number;
  trash: number;
  bathrooms: number;
  heat: number;
  noise: number;
  permit: number;
  marshal: number;
  chaos: number;
  finale: number;
};

type Effects = Partial<Record<Exclude<keyof Stats, "money" | "crowd">, number>> & {
  revenue?: number;
  draw?: number;
  cost?: number;
  capacity?: number;
  food?: number;
  bathroomCapacity?: number;
  trashCapacity?: number;
  fireCoverage?: number;
  viewing?: number;
  parade?: number;
  supplyBoost?: number;
  power?: number;
  service?: number;
};

type BuildingDef = {
  id: BuildingId;
  name: string;
  category: Category;
  cost: number;
  upkeep: number;
  color: number;
  accent: number;
  height: number;
  capacity?: number;
  effects: Effects;
  pros: string[];
  cons: string[];
  requiresPath?: boolean;
  unique?: boolean;
  radius?: number;
  shape?: "box" | "tent" | "tower" | "ride" | "zone" | "route";
};

type PlacedBuilding = {
  uid: number;
  defId: BuildingId;
  x: number;
  y: number;
};

type Bulletin = {
  headline: string;
  body: string;
  phase: string;
};

type Policies = {
  budget: "balanced" | "spectacle" | "safety" | "revenue" | "comfort";
  fireworks: "strict" | "normal" | "loose";
  vendors: "local" | "commercial" | "charity";
  parade: "short" | "balanced" | "grand";
  security: "light" | "balanced" | "heavy";
  services: "minimum" | "adequate" | "overprepared";
};

type GameState = {
  started: boolean;
  ended: boolean;
  phaseIndex: number;
  weather: WeatherId;
  stats: Stats;
  spent: number;
  revenue: number;
  buildings: PlacedBuilding[];
  selectedTool: ToolId;
  selectedCategory: Category;
  selectedTile?: { x: number; y: number };
  policies: Policies;
  bulletins: Bulletin[];
  placementNotice: string;
  phaseBanner?: PhaseBanner;
  awards: string[];
  finaleOutcome?: FinaleOutcome;
  tick: number;
  nextUid: number;
};

type PhaseBanner = {
  title: string;
  line: string;
  warnings: string[];
};

type FinaleOutcome = {
  score: number;
  title: string;
  archetype: string;
  article: string;
  quote: string;
  best: string;
  worst: string;
  awards: string[];
};

type CrowdDot = {
  mesh: THREE.Mesh;
  target: THREE.Vector3;
  speed: number;
  mood: "happy" | "tired" | "chaos";
};

const phases: { id: PhaseId; title: string; body: string }[] = [
  { id: "setup", title: "Morning Setup", body: "Cheap prep time. Build the boring stuff before the county arrives." },
  { id: "afternoon", title: "Afternoon Crowd Surge", body: "Families arrive hungry, thirsty, warm, and optimistic." },
  { id: "parade", title: "Parade Hour", body: "Civic pride rolls through town and blocks whatever you put in its way." },
  { id: "evening", title: "Evening Rush", body: "Peak crowds, vendor stress, bathroom math, and finale pressure." },
  { id: "finale", title: "Fireworks Finale", body: "The build phase is over. The sky accountant has arrived." },
  { id: "recap", title: "Endgame Recap", body: "The newspaper has thoughts. Several of them are fair." },
];

const weatherDefs: Record<WeatherId, { name: string; body: string; effects: Partial<Stats> }> = {
  clear: { name: "Clear", body: "Blue sky, clean schedule, suspiciously calm committee members.", effects: { joy: 3, spectacle: 3 } },
  hot: { name: "Hot", body: "Lemonade matters. Shade is now strategy.", effects: { heat: 12, crowd: 30 } },
  windy: { name: "Windy", body: "Flags look heroic. Fireworks paperwork looks nervous.", effects: { fireRisk: 10, spectacle: -2 } },
  dry: { name: "Dry", body: "Every patch of grass has become a small policy question.", effects: { fireRisk: 13, permit: 5 } },
  rain: { name: "Rain Threat", body: "Crowd arrives cautiously and checks the sky between bites.", effects: { crowd: -80, joy: -5, fireRisk: -5 } },
};

const baseStats: Stats = {
  money: 18500,
  crowd: 0,
  joy: 55,
  pride: 45,
  spectacle: 25,
  safety: 65,
  fireRisk: 12,
  flow: 58,
  traffic: 20,
  supply: 55,
  trash: 5,
  bathrooms: 15,
  heat: 18,
  noise: 12,
  permit: 10,
  marshal: 45,
  chaos: 12,
  finale: 20,
};

const defaultPolicies: Policies = {
  budget: "balanced",
  fireworks: "normal",
  vendors: "local",
  parade: "balanced",
  security: "balanced",
  services: "adequate",
};

const defs: BuildingDef[] = [
  {
    id: "path",
    name: "Walking Path",
    category: "paths",
    cost: 40,
    upkeep: 0,
    color: 0xc8a66b,
    accent: 0xead7a6,
    height: 0.05,
    shape: "route",
    effects: { flow: 2, service: 0.4 },
    pros: ["Improves crowd movement", "Connects vendors and services"],
    cons: ["Takes precious lawn"],
  },
  {
    id: "serviceLane",
    name: "Service Lane",
    category: "paths",
    cost: 120,
    upkeep: 6,
    color: 0x8f826e,
    accent: 0xd7c3a1,
    height: 0.06,
    shape: "route",
    effects: { flow: 1, service: 3, traffic: -1, permit: -1 },
    pros: ["Supports vendors and emergency access", "Reduces permit pressure"],
    cons: ["Not charming"],
  },
  {
    id: "gate",
    name: "Entrance Gate",
    category: "paths",
    cost: 450,
    upkeep: 12,
    color: 0x2f5f9e,
    accent: 0xf4c35a,
    height: 0.45,
    shape: "tower",
    effects: { draw: 85, flow: 2, capacity: 120 },
    pros: ["Brings visitors into the park", "Improves flow"],
    cons: ["More people means more everything"],
  },
  {
    id: "parking",
    name: "Parking Lot",
    category: "paths",
    cost: 700,
    upkeep: 18,
    color: 0x4d5661,
    accent: 0xd7dee8,
    height: 0.05,
    effects: { draw: 140, traffic: 8, capacity: 170 },
    pros: ["Increases attendance capacity"],
    cons: ["Adds traffic pressure"],
  },
  {
    id: "shuttle",
    name: "Shuttle Stop",
    category: "paths",
    cost: 620,
    upkeep: 30,
    color: 0x315a82,
    accent: 0xf2d27b,
    height: 0.35,
    effects: { draw: 70, traffic: -8, flow: 3, capacity: 90 },
    pros: ["Reduces traffic", "Adds arrivals"],
    cons: ["Costs money each phase"],
  },
  {
    id: "generator",
    name: "Power Generator",
    category: "paths",
    cost: 520,
    upkeep: 22,
    color: 0x535b64,
    accent: 0xf0c545,
    height: 0.35,
    effects: { power: 9, spectacle: 1, noise: 4, fireRisk: 2 },
    pros: ["Powers rides, lights, and stage"],
    cons: ["Adds noise and fire risk"],
  },
  {
    id: "lightTower",
    name: "Light Tower",
    category: "paths",
    cost: 360,
    upkeep: 14,
    color: 0xf2d68a,
    accent: 0xffffff,
    height: 1.4,
    shape: "tower",
    effects: { safety: 2, finale: 2, power: -1 },
    pros: ["Improves safety at evening rush"],
    cons: ["Needs power"],
  },
  {
    id: "water",
    name: "Water Station",
    category: "paths",
    cost: 220,
    upkeep: 10,
    color: 0x51a7d9,
    accent: 0xcaf1ff,
    height: 0.32,
    effects: { heat: -5, safety: 2, joy: 1 },
    pros: ["Reduces heat fatigue", "Helps safety"],
    cons: ["No revenue"],
  },
  {
    id: "tables",
    name: "Picnic Tables",
    category: "paths",
    cost: 180,
    upkeep: 5,
    color: 0x9a6b38,
    accent: 0xf7dfb2,
    height: 0.18,
    effects: { joy: 2, heat: -1, flow: 1, capacity: 20 },
    pros: ["Gives families a landing zone"],
    cons: ["Mild trash clustering"],
  },
  {
    id: "viewing",
    name: "Viewing Lawn",
    category: "paths",
    cost: 260,
    upkeep: 6,
    color: 0x4d8a54,
    accent: 0xe8e6c8,
    height: 0.04,
    shape: "zone",
    effects: { viewing: 80, finale: 4, joy: 1 },
    pros: ["Improves parade/fireworks viewing"],
    cons: ["Does not solve lines"],
  },
  {
    id: "shade",
    name: "Shade Tent",
    category: "paths",
    cost: 380,
    upkeep: 14,
    color: 0x2e74b5,
    accent: 0xfff2c5,
    height: 0.48,
    shape: "tent",
    effects: { heat: -7, safety: 2, joy: 2, capacity: 35 },
    pros: ["Reduces fatigue", "Comfort boost"],
    cons: ["Costs more than people think"],
  },
  {
    id: "info",
    name: "Information Booth",
    category: "paths",
    cost: 320,
    upkeep: 12,
    color: 0xf4c35a,
    accent: 0x2e4f86,
    height: 0.38,
    effects: { flow: 3, chaos: -2, safety: 1 },
    pros: ["Reduces confusion", "Helps lost visitors"],
    cons: ["No direct revenue"],
  },
  {
    id: "hotdog",
    name: "Hot Dog Stand",
    category: "vendors",
    cost: 500,
    upkeep: 18,
    color: 0xd74a3f,
    accent: 0xffd36d,
    height: 0.42,
    effects: { revenue: 48, food: 65, joy: 3, trash: 5, supply: -4, capacity: 75 },
    pros: ["Reliable food revenue", "Crowd-pleaser"],
    cons: ["Creates trash and lines"],
    requiresPath: true,
  },
  {
    id: "funnelCake",
    name: "Funnel Cake Stand",
    category: "vendors",
    cost: 720,
    upkeep: 24,
    color: 0xe5b85f,
    accent: 0xffffff,
    height: 0.45,
    effects: { revenue: 82, food: 45, joy: 7, trash: 9, supply: -6, flow: -1, capacity: 55 },
    pros: ["High joy and money", "Funnel cake economy"],
    cons: ["Trash, lines, grease cloud jokes"],
    requiresPath: true,
  },
  {
    id: "lemonade",
    name: "Lemonade Stand",
    category: "vendors",
    cost: 420,
    upkeep: 16,
    color: 0xffd84f,
    accent: 0x88d4ff,
    height: 0.38,
    effects: { revenue: 38, food: 25, joy: 2, trash: 2, heat: -4, supply: -3, capacity: 65 },
    pros: ["Reduces heat", "Low trash"],
    cons: ["Moderate money"],
    requiresPath: true,
  },
  {
    id: "iceCream",
    name: "Ice Cream Stand",
    category: "vendors",
    cost: 580,
    upkeep: 22,
    color: 0xf7a6c8,
    accent: 0xffffff,
    height: 0.42,
    effects: { revenue: 55, food: 38, joy: 5, trash: 4, heat: -2, supply: -5, capacity: 55 },
    pros: ["Joy boost", "Good in heat"],
    cons: ["Supply sensitive"],
    requiresPath: true,
  },
  {
    id: "bbq",
    name: "BBQ Stand",
    category: "vendors",
    cost: 760,
    upkeep: 32,
    color: 0x7a332a,
    accent: 0xf0b15a,
    height: 0.45,
    effects: { revenue: 88, food: 78, joy: 5, trash: 7, supply: -8, fireRisk: 2, capacity: 90 },
    pros: ["Strong food capacity", "Big revenue"],
    cons: ["Supply and smoke pressure"],
    requiresPath: true,
  },
  {
    id: "flagStand",
    name: "Flag Stand",
    category: "civic",
    cost: 300,
    upkeep: 8,
    color: 0xe44646,
    accent: 0x3f79c9,
    height: 0.35,
    effects: { revenue: 20, pride: 4, spectacle: 2, trash: 1, supply: -2 },
    pros: ["Civic pride", "Simple merch"],
    cons: ["Small lines"],
    requiresPath: true,
  },
  {
    id: "souvenir",
    name: "Souvenir Stand",
    category: "civic",
    cost: 470,
    upkeep: 14,
    color: 0x385e9d,
    accent: 0xf0cf6c,
    height: 0.38,
    effects: { revenue: 46, pride: 2, joy: 2, trash: 3, supply: -4, capacity: 52 },
    pros: ["Revenue and keepsakes"],
    cons: ["Stockout risk"],
    requiresPath: true,
  },
  {
    id: "raffle",
    name: "Charity Raffle",
    category: "civic",
    cost: 340,
    upkeep: 8,
    color: 0xe0d6b3,
    accent: 0xc73c3c,
    height: 0.35,
    effects: { revenue: 20, pride: 5, joy: 2, permit: -1 },
    pros: ["Civic pride", "Softens permit mood"],
    cons: ["Not a revenue machine"],
    requiresPath: true,
  },
  {
    id: "historyBooth",
    name: "Local History Booth",
    category: "civic",
    cost: 380,
    upkeep: 10,
    color: 0x9e8b65,
    accent: 0xf1e6c8,
    height: 0.38,
    effects: { pride: 7, joy: 1, spectacle: 1, heat: -1 },
    pros: ["Pride and wholesome texture"],
    cons: ["Low revenue"],
    requiresPath: true,
  },
  {
    id: "dunkTank",
    name: "Dunk Tank",
    category: "rides",
    cost: 680,
    upkeep: 22,
    color: 0x3aa0d8,
    accent: 0xf8dd73,
    height: 0.5,
    effects: { revenue: 52, joy: 6, spectacle: 2, heat: -1, flow: -1, capacity: 60 },
    pros: ["Joy and small spectacle"],
    cons: ["Lines near targets"],
    requiresPath: true,
  },
  {
    id: "ringToss",
    name: "Ring Toss",
    category: "rides",
    cost: 430,
    upkeep: 14,
    color: 0x4f965d,
    accent: 0xf1dc7f,
    height: 0.32,
    effects: { revenue: 36, joy: 4, capacity: 55, flow: -1 },
    pros: ["Cheap carnival fun"],
    cons: ["Small crowd knot"],
    requiresPath: true,
  },
  {
    id: "bounceHouse",
    name: "Bounce House",
    category: "rides",
    cost: 950,
    upkeep: 38,
    color: 0xd84d73,
    accent: 0x5ba4e6,
    height: 0.65,
    shape: "tent",
    effects: { revenue: 45, joy: 9, safety: -1, capacity: 70, power: -1 },
    pros: ["Major family joy"],
    cons: ["Needs attention and power"],
    requiresPath: true,
  },
  {
    id: "carousel",
    name: "Star-Spangled Carousel",
    category: "rides",
    cost: 1450,
    upkeep: 54,
    color: 0xdfc07a,
    accent: 0xd44b48,
    height: 0.75,
    shape: "ride",
    effects: { revenue: 76, joy: 10, spectacle: 5, safety: -1, power: -2, capacity: 110 },
    pros: ["High joy and charm"],
    cons: ["Power and maintenance pressure"],
    requiresPath: true,
  },
  {
    id: "ferrisWheel",
    name: "Liberty Wheel",
    category: "rides",
    cost: 2200,
    upkeep: 80,
    color: 0x325f9d,
    accent: 0xf4c35a,
    height: 1.6,
    shape: "ride",
    effects: { revenue: 110, joy: 11, spectacle: 10, safety: -2, power: -3, capacity: 130, noise: 2 },
    pros: ["Skyline spectacle", "Strong revenue"],
    cons: ["Power and safety pressure"],
    requiresPath: true,
  },
  {
    id: "spinRide",
    name: "Freedom Spinner",
    category: "rides",
    cost: 1500,
    upkeep: 58,
    color: 0xb23c4f,
    accent: 0xffffff,
    height: 0.8,
    shape: "ride",
    effects: { revenue: 90, joy: 8, spectacle: 6, safety: -2, chaos: 2, power: -2, capacity: 95 },
    pros: ["Fast carnival energy"],
    cons: ["Chaos and maintenance risk"],
    requiresPath: true,
  },
  {
    id: "musicStage",
    name: "Music Stage",
    category: "civic",
    cost: 1300,
    upkeep: 55,
    color: 0x2e335c,
    accent: 0xf5cb64,
    height: 0.6,
    effects: { joy: 8, spectacle: 5, draw: 80, noise: 8, flow: -2, power: -3, capacity: 160 },
    pros: ["Draws crowds", "Joy and spectacle"],
    cons: ["Noise and crowd clustering"],
    requiresPath: true,
  },
  {
    id: "paradeStaging",
    name: "Parade Staging",
    category: "parade",
    cost: 750,
    upkeep: 24,
    color: 0x7b4a2b,
    accent: 0xf4c35a,
    height: 0.35,
    effects: { parade: 6, pride: 4, spectacle: 2, permit: -1 },
    pros: ["Required for a strong parade"],
    cons: ["Uses space"],
    unique: true,
  },
  {
    id: "paradeRoute",
    name: "Parade Route",
    category: "parade",
    cost: 80,
    upkeep: 0,
    color: 0xb4383f,
    accent: 0xf8f1dc,
    height: 0.07,
    shape: "route",
    effects: { parade: 2, pride: 1, flow: -0.4 },
    pros: ["Defines viewing and civic energy"],
    cons: ["Blocks flow during parade hour"],
  },
  {
    id: "veteransFloat",
    name: "Veterans Float",
    category: "parade",
    cost: 620,
    upkeep: 18,
    color: 0x2f5f9e,
    accent: 0xf4c35a,
    height: 0.42,
    effects: { parade: 5, pride: 8, spectacle: 2, capacity: 20 },
    pros: ["High civic pride"],
    cons: ["Parade logistics"],
  },
  {
    id: "fireTruckFloat",
    name: "Fire Truck Float",
    category: "parade",
    cost: 720,
    upkeep: 22,
    color: 0xc53932,
    accent: 0xffffff,
    height: 0.45,
    effects: { parade: 4, pride: 5, spectacle: 3, fireCoverage: 2, flow: -1 },
    pros: ["Pride and safety flavor"],
    cons: ["Large route footprint"],
  },
  {
    id: "classicCars",
    name: "Classic Car Line",
    category: "parade",
    cost: 660,
    upkeep: 20,
    color: 0x6c82b5,
    accent: 0xffefb1,
    height: 0.38,
    effects: { parade: 4, pride: 4, spectacle: 5, traffic: 2 },
    pros: ["Spectacle and nostalgia"],
    cons: ["Can overheat without service"],
  },
  {
    id: "trashCan",
    name: "Trash Can",
    category: "services",
    cost: 90,
    upkeep: 4,
    color: 0x2f6d48,
    accent: 0xd9f0c9,
    height: 0.22,
    effects: { trashCapacity: 24, trash: -3, safety: 1 },
    pros: ["Cheap cleanliness"],
    cons: ["Needs enough of them"],
  },
  {
    id: "dumpster",
    name: "Dumpster Pickup",
    category: "services",
    cost: 360,
    upkeep: 20,
    color: 0x56685b,
    accent: 0xe3e9d4,
    height: 0.35,
    effects: { trashCapacity: 75, trash: -8, service: 2, flow: -0.5 },
    pros: ["Heavy trash control"],
    cons: ["Not pretty"],
  },
  {
    id: "bathroom",
    name: "Bathroom Row",
    category: "services",
    cost: 420,
    upkeep: 22,
    color: 0xe7e1cc,
    accent: 0x416db0,
    height: 0.45,
    effects: { bathroomCapacity: 80, bathrooms: -8, joy: 2, safety: 2 },
    pros: ["Prevents bathroom pressure collapse"],
    cons: ["Maintenance need"],
  },
  {
    id: "handwash",
    name: "Handwashing Station",
    category: "services",
    cost: 220,
    upkeep: 12,
    color: 0xbfdde8,
    accent: 0x2f6f99,
    height: 0.28,
    effects: { safety: 3, bathrooms: -2, joy: 1 },
    pros: ["Safety and comfort"],
    cons: ["No revenue"],
  },
  {
    id: "firstAid",
    name: "First Aid Tent",
    category: "services",
    cost: 650,
    upkeep: 36,
    color: 0xffffff,
    accent: 0xd94141,
    height: 0.45,
    shape: "tent",
    effects: { safety: 8, heat: -3, chaos: -2, permit: -2 },
    pros: ["Safety anchor", "Heat recovery"],
    cons: ["Costs money"],
  },
  {
    id: "fireMarshal",
    name: "Fire Marshal Booth",
    category: "services",
    cost: 820,
    upkeep: 38,
    color: 0xc94b42,
    accent: 0xffffff,
    height: 0.4,
    effects: { marshal: 12, fireRisk: -8, permit: -7, safety: 4 },
    pros: ["Lowers risk and permit pressure"],
    cons: ["May judge your funnel cake geometry"],
  },
  {
    id: "fireCrew",
    name: "Fire Crew Staging",
    category: "services",
    cost: 980,
    upkeep: 48,
    color: 0xb8362f,
    accent: 0xf5d16d,
    height: 0.45,
    effects: { fireCoverage: 18, fireRisk: -10, safety: 7, finale: 6, marshal: 4 },
    pros: ["Central fireworks safety"],
    cons: ["Expensive but not optional at scale"],
  },
  {
    id: "security",
    name: "Security Post",
    category: "services",
    cost: 520,
    upkeep: 30,
    color: 0x283f6f,
    accent: 0xd8e8ff,
    height: 0.42,
    effects: { chaos: -7, safety: 3, joy: -1, permit: -2 },
    pros: ["Controls incidents"],
    cons: ["Too much presence can dent joy"],
  },
  {
    id: "lostChild",
    name: "Lost Child Tent",
    category: "services",
    cost: 410,
    upkeep: 18,
    color: 0xffe2a0,
    accent: 0x3f79c9,
    height: 0.42,
    shape: "tent",
    effects: { safety: 5, chaos: -3, flow: 1 },
    pros: ["Mitigates crowd anxiety"],
    cons: ["Quietly important"],
  },
  {
    id: "maintenance",
    name: "Maintenance Shed",
    category: "services",
    cost: 640,
    upkeep: 28,
    color: 0x7b725f,
    accent: 0xf2d187,
    height: 0.42,
    effects: { safety: 3, supplyBoost: 4, service: 3, chaos: -2 },
    pros: ["Keeps machines and bins alive"],
    cons: ["Not glamorous"],
  },
  {
    id: "supplyDepot",
    name: "Vendor Supply Depot",
    category: "services",
    cost: 850,
    upkeep: 34,
    color: 0x846146,
    accent: 0xe6c489,
    height: 0.48,
    effects: { supplyBoost: 18, supply: 16, traffic: 3, service: 3 },
    pros: ["Prevents vendor stockouts"],
    cons: ["Adds service traffic"],
  },
  {
    id: "volunteer",
    name: "Volunteer HQ",
    category: "services",
    cost: 540,
    upkeep: 20,
    color: 0x3d7b68,
    accent: 0xf2e3b2,
    height: 0.42,
    effects: { pride: 4, safety: 2, chaos: -3, flow: 1 },
    pros: ["Softens chaos", "Boosts civic pride"],
    cons: ["Needs a coherent festival to help"],
  },
  {
    id: "fireworksVendor",
    name: "Fireworks Vendor",
    category: "fireworks",
    cost: 900,
    upkeep: 28,
    color: 0x253f75,
    accent: 0xf6cf65,
    height: 0.45,
    effects: { revenue: 95, spectacle: 8, fireRisk: 8, permit: 5, supply: -4, capacity: 80 },
    pros: ["Money and spectacle"],
    cons: ["Risk and permits"],
    requiresPath: true,
  },
  {
    id: "sparklerStand",
    name: "Glow Spark Stand",
    category: "fireworks",
    cost: 520,
    upkeep: 18,
    color: 0xff8f3d,
    accent: 0xffffb6,
    height: 0.4,
    effects: { revenue: 50, joy: 3, spectacle: 4, fireRisk: 4, permit: 2, chaos: 1 },
    pros: ["Abstract glow-stick spark energy"],
    cons: ["Small risk bump"],
    requiresPath: true,
  },
  {
    id: "launchZone",
    name: "Launch Zone",
    category: "fireworks",
    cost: 1400,
    upkeep: 24,
    color: 0x2b2f36,
    accent: 0xffd66b,
    height: 0.08,
    shape: "zone",
    effects: { finale: 18, spectacle: 10, fireRisk: 12, permit: 8 },
    pros: ["Required for a real finale"],
    cons: ["Needs space, barriers, fire coverage"],
    unique: true,
  },
  {
    id: "safetyBarrier",
    name: "Safety Barrier",
    category: "fireworks",
    cost: 180,
    upkeep: 4,
    color: 0xf2d363,
    accent: 0x2b2b2b,
    height: 0.18,
    effects: { fireRisk: -2, safety: 2, permit: -1, finale: 1, flow: -0.2 },
    pros: ["Defines safe distances"],
    cons: ["Can constrain flow"],
  },
  {
    id: "finaleControl",
    name: "Finale Control Booth",
    category: "fireworks",
    cost: 980,
    upkeep: 38,
    color: 0x273c68,
    accent: 0xf0c55f,
    height: 0.5,
    effects: { finale: 12, safety: 4, marshal: 3, permit: -3, power: -2 },
    pros: ["Improves finale readiness"],
    cons: ["Needs power and planning"],
    unique: true,
  },
  {
    id: "grandFinaleRack",
    name: "Grand Finale Rack",
    category: "fireworks",
    cost: 1300,
    upkeep: 18,
    color: 0x5c2734,
    accent: 0xffd55d,
    height: 0.25,
    effects: { finale: 14, spectacle: 15, fireRisk: 10, permit: 5, chaos: 2 },
    pros: ["Huge abstract spectacle"],
    cons: ["Risky without coverage"],
  },
];

const defById = new Map(defs.map((def) => [def.id, def]));

const categoryLabels: Record<Category, string> = {
  paths: "Paths",
  vendors: "Food & Vendors",
  civic: "Civic Pride",
  services: "Services",
  parade: "Parade",
  rides: "Carnival",
  fireworks: "Fireworks",
  tools: "Tools",
};

const policyOptions: { key: keyof Policies; label: string; values: Record<string, string> }[] = [
  {
    key: "budget",
    label: "Budget Priority",
    values: { balanced: "Balanced", spectacle: "Spectacle-first", safety: "Safety-first", revenue: "Vendor revenue", comfort: "Family comfort" },
  },
  {
    key: "fireworks",
    label: "Fireworks Policy",
    values: { strict: "Strictly permitted", normal: "Normal permitted", loose: "Loose enforcement" },
  },
  {
    key: "vendors",
    label: "Vendor Policy",
    values: { local: "Local vendors", commercial: "High-bid commercial", charity: "Charity/community" },
  },
  {
    key: "parade",
    label: "Parade Priority",
    values: { short: "Short and efficient", balanced: "Balanced route", grand: "Grand parade" },
  },
  {
    key: "security",
    label: "Security Style",
    values: { light: "Light touch", balanced: "Balanced", heavy: "Heavy presence" },
  },
  {
    key: "services",
    label: "Trash/Bathrooms",
    values: { minimum: "Bare minimum", adequate: "Adequate", overprepared: "Overprepared" },
  },
];

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Missing #app");
const app = appRoot;

let state = createNewGame();
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let raycaster: THREE.Raycaster;
let pointer: THREE.Vector2;
let groundPlane: THREE.Mesh;
let buildingGroup: THREE.Group;
let crowdGroup: THREE.Group;
let overlayGroup: THREE.Group;
let fireworksGroup: THREE.Group;
let tileMeshes: THREE.Mesh[] = [];
let crowdDots: CrowdDot[] = [];
let selectedTileMesh: THREE.Mesh;
let hoveredTile: { x: number; y: number } | undefined;
let hoverScreen: { x: number; y: number } | undefined;
let mapReady = false;
let lastTime = performance.now();
let finaleStart = 0;

function createNewGame(): GameState {
  const weatherCycle: WeatherId[] = ["clear", "hot", "windy", "dry", "rain"];
  const weather = weatherCycle[Math.floor(Math.random() * weatherCycle.length)];
  const firstBulletin = {
    headline: "Festival Committee Finds Empty Field, Calls It Opportunity",
    body: `Liberty Park opens under ${weatherDefs[weather].name.toLowerCase()} skies. The town asks only that joy exceed paperwork.`,
    phase: "Morning Setup",
  };
  return {
    started: false,
    ended: false,
    phaseIndex: 0,
    weather,
    stats: makeInitialStats(weather),
    spent: 0,
    revenue: 0,
    buildings: starterLayout(),
    selectedTool: "path",
    selectedCategory: "paths",
    policies: { ...defaultPolicies },
    bulletins: [firstBulletin],
    placementNotice: "Mayor's Clipboard: start with paths, then food, bathrooms, trash, parade pieces, and fireworks support.",
    awards: [],
    tick: 0,
    nextUid: 100,
  };
}

function makeInitialStats(weather: WeatherId): Stats {
  const stats = { ...baseStats };
  for (const [key, value] of Object.entries(weatherDefs[weather].effects) as [keyof Stats, number][]) {
    stats[key] =
      key === "money"
        ? stats[key] + value
        : key === "crowd"
          ? Math.max(0, stats[key] + value)
          : clamp(stats[key] + value, 0, 100);
  }
  return stats;
}

function starterLayout(): PlacedBuilding[] {
  const placed: PlacedBuilding[] = [];
  let uid = 1;
  for (let y = 7; y <= 10; y += 1) {
    placed.push({ uid: uid++, defId: "path", x: 1, y });
  }
  for (let x = 1; x <= 6; x += 1) {
    placed.push({ uid: uid++, defId: "path", x, y: 9 });
  }
  placed.push({ uid: uid++, defId: "gate", x: 0, y: 9 });
  placed.push({ uid: uid++, defId: "parking", x: 0, y: 7 });
  placed.push({ uid: uid++, defId: "parking", x: 0, y: 11 });
  return placed;
}

function bootstrap(): void {
  app.innerHTML = `
    <div id="game-shell" class="game-shell">
      <div id="scene-root"><span id="map-ready-marker" class="sr-only">Liberty Park terrain loading</span></div>
      <div id="loading-card" class="loading-card">Setting up Liberty Park... checking fireworks permit...</div>
      <div class="hud">
        <section id="phase-panel" class="panel phase-panel"></section>
        <section id="stats-panel" class="stats-grid"></section>
        <div class="right-stack">
          <section id="advisor-panel" class="panel advisor-panel"></section>
          <section id="policy-panel" class="panel policy-panel"></section>
          <section id="feed-panel" class="panel feed-panel"></section>
          <section id="finale-panel" class="panel finale-panel"></section>
        </div>
      </div>
      <section id="build-panel" class="panel build-panel"></section>
      <section id="selection-panel" class="panel selection-panel"></section>
      <div id="phase-banner" class="phase-banner hidden"></div>
      <div id="hover-tooltip" class="hover-tooltip hidden"></div>
      <div id="title-screen" class="title-screen"></div>
      <div id="end-screen" class="end-screen hidden"></div>
      <div id="toast" class="toast hidden"></div>
    </div>
  `;
  setupScene();
  bindUi();
  renderAll();
  animate(performance.now());
}

function setupScene(): void {
  const root = document.querySelector<HTMLDivElement>("#scene-root");
  if (!root) throw new Error("Missing scene root");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1a2b);
  camera = new THREE.OrthographicCamera(-13, 13, 8, -8, 0.1, 100);
  camera.position.set(11, 13, 12);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  root.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  const ambient = new THREE.HemisphereLight(0xcfe8ff, 0x273014, 2.1);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff1c9, 2.6);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  scene.add(sun);

  buildingGroup = new THREE.Group();
  crowdGroup = new THREE.Group();
  overlayGroup = new THREE.Group();
  fireworksGroup = new THREE.Group();
  scene.add(buildingGroup, crowdGroup, overlayGroup, fireworksGroup);

  createTerrain();
  selectedTileMesh = makeTileHighlight(0xfee07b, 0.45);
  selectedTileMesh.visible = false;
  overlayGroup.add(selectedTileMesh);

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("click", onCanvasClick);
  window.addEventListener("resize", onResize);
  rebuildScene();
  renderer.render(scene, camera);
  mapReady = true;
  root.dataset.mapReady = "true";
  const marker = document.querySelector<HTMLSpanElement>("#map-ready-marker");
  if (marker) marker.textContent = "Liberty Park terrain ready";
  root.classList.add("map-ready");
}

function createTerrain(): void {
  const terrain = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f7848, roughness: 0.9 });
  const tileMatA = new THREE.MeshStandardMaterial({ color: 0x467f4e, roughness: 0.95 });
  const tileMatB = new THREE.MeshStandardMaterial({ color: 0x3b7044, roughness: 0.95 });
  tileMeshes = [];
  for (let x = 0; x < MAP_W; x += 1) {
    for (let y = 0; y < MAP_H; y += 1) {
      const mat = (x + y) % 2 ? tileMatA : tileMatB;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.035, 0.98), mat);
      mesh.position.set(tileToWorldX(x), -0.03, tileToWorldZ(y));
      mesh.userData = { x, y };
      mesh.receiveShadow = true;
      terrain.add(mesh);
      tileMeshes.push(mesh);
    }
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(MAP_W + 2, 0.16, MAP_H + 2), grassMat);
  base.position.set(-0.5, -0.14, -0.5);
  base.receiveShadow = true;
  groundPlane = base;
  scene.add(base, terrain);

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x605948, roughness: 0.88 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, MAP_H + 3), roadMat);
  road.position.set(tileToWorldX(-1), 0.0, -0.5);
  road.receiveShadow = true;
  scene.add(road);

  const lakeMat = new THREE.MeshStandardMaterial({ color: 0x274e70, roughness: 0.5, metalness: 0.05 });
  const lake = new THREE.Mesh(new THREE.BoxGeometry(MAP_W + 2, 0.03, 2.2), lakeMat);
  lake.position.set(-0.5, 0.0, tileToWorldZ(MAP_H + 0.65));
  scene.add(lake);
}

function bindUi(): void {
  app.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) return;
    const action = target.dataset.action ?? "";
    if (action === "start") startGame();
    if (action === "new") restartGame();
    if (action === "advance") advancePhase();
    if (action === "save") saveGame();
    if (action === "load") loadGame();
    if (action === "howto") document.querySelector("#title-screen")?.classList.toggle("show-howto");
    if (action === "dismissPhase") {
      state.phaseBanner = undefined;
      renderPhaseBanner();
    }
    if (action === "copyRecap") copyRecap();
    if (action === "category") {
      state.selectedCategory = target.dataset.category as Category;
      renderBuildPanel();
    }
    if (action === "tool") {
      state.selectedTool = target.dataset.tool as ToolId;
      renderBuildPanel();
      renderSelectionPanel();
    }
    if (action === "policy") {
      const key = target.dataset.key as keyof Policies | undefined;
      const select = target as HTMLSelectElement;
      if (key) {
        state.policies[key] = select.value as never;
        addBulletin("Town Committee Revises Operating Philosophy", policySummary(), "Policy Desk");
        renderAll();
      }
    }
  });
}

function onResize(): void {
  const aspect = window.innerWidth / window.innerHeight;
  const height = 16;
  camera.left = (-height * aspect) / 2;
  camera.right = (height * aspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event: PointerEvent): void {
  hoverScreen = { x: event.clientX, y: event.clientY };
  updatePointer(event);
  const tile = pickTile();
  hoveredTile = tile;
  if (tile) {
    selectedTileMesh.visible = true;
    selectedTileMesh.position.set(tileToWorldX(tile.x), 0.04, tileToWorldZ(tile.y));
  } else {
    selectedTileMesh.visible = false;
  }
  state.selectedTile = tile;
  renderSelectionPanel();
  renderHoverTooltip();
}

function onCanvasClick(event: MouseEvent): void {
  if (!state.started || state.ended) return;
  if (currentPhase().id === "finale" || currentPhase().id === "recap") {
    showToast("The finale is underway. The committee has put down the hammer.");
    return;
  }
  updatePointer(event);
  const tile = pickTile();
  if (!tile) return;
  if (state.selectedTool === "bulldoze") {
    bulldoze(tile.x, tile.y);
  } else {
    placeBuilding(state.selectedTool as BuildingId, tile.x, tile.y);
  }
}

function updatePointer(event: PointerEvent | MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickTile(): { x: number; y: number } | undefined {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(tileMeshes, false);
  if (!hits.length) return undefined;
  const data = hits[0].object.userData as { x: number; y: number };
  return { x: data.x, y: data.y };
}

function startGame(): void {
  if (!mapReady) {
    showToast("Setting up Liberty Park...");
    return;
  }
  state.started = true;
  document.querySelector("#title-screen")?.classList.add("hidden");
  addBulletin("Radio WFEG Begins Blanket Coverage", "Build paths, feed people, respect bathroom math, and keep the finale out of the incident file.", "Morning Setup");
  rebuildScene();
  renderAll();
  renderer.render(scene, camera);
}

function restartGame(): void {
  state = createNewGame();
  clearFinale();
  rebuildScene();
  document.querySelector("#end-screen")?.classList.add("hidden");
  document.querySelector("#title-screen")?.classList.remove("hidden");
  state.phaseBanner = undefined;
  renderAll();
}

function saveGame(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  showToast("Festival plan saved locally.");
}

function loadGame(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    showToast("No saved festival found.");
    return;
  }
  try {
    state = JSON.parse(raw) as GameState;
    state.placementNotice ??= "Loaded festival plan. The clipboard is judging quietly.";
    rebuildScene();
    document.querySelector("#title-screen")?.classList.toggle("hidden", state.started);
    document.querySelector("#end-screen")?.classList.toggle("hidden", !state.ended);
    renderAll();
    showToast("Local festival save loaded.");
  } catch {
    showToast("Save file could not be read.");
  }
}

function placeBuilding(defId: BuildingId, x: number, y: number): void {
  const def = defById.get(defId);
  if (!def) return;
  if (!inBounds(x, y)) {
    failPlacement("Cannot place on water.");
    return;
  }
  if (occupied(x, y)) {
    failPlacement("Too close to another object. That tile is already spoken for.");
    return;
  }
  if (def.unique && state.buildings.some((building) => building.defId === def.id)) {
    failPlacement(`${def.name} is unique for this scenario.`);
    return;
  }
  if (def.requiresPath && !nearbyPath(x, y)) {
    failPlacement("Needs nearby path.");
    return;
  }
  const setupDiscount = currentPhase().id === "setup" ? 0.86 : 1;
  const cost = Math.round(def.cost * setupDiscount);
  if (state.stats.money < cost) {
    failPlacement("Not enough money.");
    return;
  }
  state.stats.money -= cost;
  state.spent += cost;
  state.buildings.push({ uid: state.nextUid++, defId, x, y });
  addBuildingMesh(state.buildings[state.buildings.length - 1]);
  if (def.category === "fireworks") renderRiskRadius();
  state.placementNotice = `${def.name} placed. The committee can point at a thing.`;
  showToast(`${def.name} placed.`);
  renderAll();
}

function bulldoze(x: number, y: number): void {
  const index = state.buildings.findIndex((building) => building.x === x && building.y === y);
  if (index < 0) {
    failPlacement("Nothing to bulldoze there.");
    return;
  }
  const [removed] = state.buildings.splice(index, 1);
  const def = defById.get(removed.defId);
  const refund = Math.round((def?.cost ?? 0) * 0.35);
  state.stats.money += refund;
  addBulletin("Grounds Crew Reverses A Decision", `${def?.name ?? "Something"} removed. Refund: $${refund}.`, currentPhase().title);
  rebuildScene();
  renderAll();
}

function failPlacement(message: string): void {
  state.placementNotice = message;
  showToast(message);
  renderBuildPanel();
  renderSelectionPanel();
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < MAP_W && y >= 0 && y < MAP_H;
}

function occupied(x: number, y: number): boolean {
  return state.buildings.some((building) => building.x === x && building.y === y);
}

function nearbyPath(x: number, y: number): boolean {
  return state.buildings.some((building) => {
    const def = defById.get(building.defId);
    if (!def || (def.id !== "path" && def.id !== "serviceLane" && def.id !== "paradeRoute" && def.id !== "gate")) return false;
    return Math.abs(building.x - x) + Math.abs(building.y - y) <= 2;
  });
}

function advancePhase(): void {
  if (!state.started) return;
  const phase = currentPhase();
  if (phase.id === "recap") {
    showEndScreen();
    return;
  }
  if (phase.id === "finale") {
    resolveFinale();
    state.phaseIndex = phases.findIndex((item) => item.id === "recap");
    showEndScreen();
    renderAll();
    return;
  }
  const before = { ...state.stats };
  runPhaseSimulation(phase.id);
  state.phaseIndex += 1;
  state.phaseBanner = makePhaseBanner(currentPhase(), before);
  if (currentPhase().id === "finale") {
    startFinaleShow();
  }
  renderAll();
}

function runPhaseSimulation(phaseId: PhaseId): void {
  state.tick += 1;
  const counts = countBuildings();
  const effects = collectEffects();
  const policy = policyModifiers();
  const weather = weatherDefs[state.weather].effects;
  const crowdPotential =
    180 +
    (effects.draw ?? 0) +
    (effects.capacity ?? 0) * 0.35 +
    (state.stats.spectacle + state.stats.pride + state.stats.joy) * 1.8 +
    (weather.crowd ?? 0);
  const phaseCrowdFactor = phaseId === "setup" ? 0.26 : phaseId === "afternoon" ? 0.62 : phaseId === "parade" ? 0.75 : 1.0;
  const arrivalCapacity = 220 + (effects.capacity ?? 0) + counts.parking * 120 + counts.shuttle * 90 + counts.gate * 110;
  const crowd = clamp(Math.round(Math.min(arrivalCapacity, crowdPotential) * phaseCrowdFactor), 20, 2400);
  const foodDemand = crowd * (phaseId === "evening" ? 0.36 : phaseId === "afternoon" ? 0.28 : 0.18);
  const bathroomDemand = crowd * (phaseId === "evening" ? 0.27 : 0.18);
  const trashDemand = crowd * 0.05 + Math.max(0, effects.trash ?? 0) * 5.2;
  const foodCapacity = Math.max(0, effects.food ?? 0);
  const bathroomCapacity = Math.max(20, effects.bathroomCapacity ?? 0);
  const trashCapacity = Math.max(10, effects.trashCapacity ?? 0);
  const service = effects.service ?? 0;
  const power = effects.power ?? 0;
  const paradeQuality = paradeScore(effects, counts);
  const viewing = effects.viewing ?? 0;
  const foodShortage = clamp((foodDemand - foodCapacity) / Math.max(80, foodDemand), 0, 1);
  const bathroomPressure = clamp((bathroomDemand - bathroomCapacity) / Math.max(40, bathroomDemand), 0, 1);
  const trashPressure = clamp((trashDemand - trashCapacity - service * 5) / Math.max(30, trashDemand), 0, 1);
  const pathTiles = counts.path + counts.serviceLane + counts.paradeRoute * 0.5;
  const flowBase = 42 + pathTiles * 1.7 + (effects.flow ?? 0) + service * 1.5 - crowd / 85;
  const paradeBlock = phaseId === "parade" ? Math.max(0, counts.paradeRoute * 1.4 + policy.paradeFlowPenalty) : 0;
  const flow = clamp(flowBase - paradeBlock - foodShortage * 10 - bathroomPressure * 8, 0, 100);
  const traffic = clamp(20 + counts.parking * 8 - counts.shuttle * 7 + crowd / 95 + policy.traffic, 0, 100);
  const supply = clamp(54 + (effects.supplyBoost ?? 0) + (effects.supply ?? 0) + service * 2 + policy.supply - foodCapacity * 0.035, 0, 100);
  const heat = clamp(18 + (weather.heat ?? 0) + crowd / 130 + (effects.heat ?? 0) + policy.heat, 0, 100);
  const fireRisk = clamp(
    8 +
      (weather.fireRisk ?? 0) +
      (effects.fireRisk ?? 0) +
      counts.fireworksVendor * 4 +
      counts.launchZone * 10 +
      counts.grandFinaleRack * 8 -
      (effects.fireCoverage ?? 0) -
      counts.safetyBarrier * 1.5 +
      policy.fireRisk,
    0,
    100,
  );
  const permit = clamp(8 + (effects.permit ?? 0) + fireRisk * 0.32 + traffic * 0.18 + policy.permit - (effects.marshal ?? 0) * 0.45, 0, 100);
  const safety = clamp(62 + (effects.safety ?? 0) - fireRisk * 0.18 - bathroomPressure * 10 - trashPressure * 8 - heat * 0.09 + policy.safety, 0, 100);
  const joy = clamp(48 + (effects.joy ?? 0) + foodCapacity / 30 + viewing / 42 - foodShortage * 18 - bathroomPressure * 22 - trashPressure * 15 - heat * 0.08 + policy.joy, 0, 100);
  const pride = clamp(42 + (effects.pride ?? 0) + paradeQuality * (phaseId === "parade" ? 1.25 : 0.35) + policy.pride - trashPressure * 9, 0, 100);
  const spectacle = clamp(24 + (effects.spectacle ?? 0) + paradeQuality * 0.35 + (phaseId === "evening" ? 7 : 0) + policy.spectacle, 0, 100);
  const marshal = clamp(36 + (effects.marshal ?? 0) - permit * 0.12 + policy.marshal, 0, 100);
  const chaos = clamp(
    8 +
      (effects.chaos ?? 0) +
      foodShortage * 15 +
      bathroomPressure * 18 +
      trashPressure * 15 +
      Math.max(0, 55 - flow) * 0.42 +
      fireRisk * 0.18 +
      heat * 0.12 +
      traffic * 0.1 +
      policy.chaos,
    0,
    100,
  );
  const finale = clamp(
    16 +
      (effects.finale ?? 0) +
      viewing / 20 +
      (effects.fireCoverage ?? 0) * 0.5 +
      Math.max(0, 100 - fireRisk) * 0.08 +
      Math.max(0, 100 - permit) * 0.05 +
      policy.finale,
    0,
    100,
  );
  const revenue = Math.round(
    ((effects.revenue ?? 0) * Math.min(1.25, crowd / 520) * (1 - foodShortage * 0.35) + crowd * 0.8) * policy.revenue,
  );
  const upkeep = Math.round(state.buildings.reduce((sum, building) => sum + (defById.get(building.defId)?.upkeep ?? 0), 0) * policy.cost);
  state.revenue += revenue;
  state.stats.money += revenue - upkeep;
  state.stats.crowd = crowd;
  state.stats.joy = joy;
  state.stats.pride = pride;
  state.stats.spectacle = spectacle;
  state.stats.safety = safety;
  state.stats.fireRisk = fireRisk;
  state.stats.flow = flow;
  state.stats.traffic = traffic;
  state.stats.supply = supply;
  state.stats.trash = clamp(Math.round(trashPressure * 100), 0, 100);
  state.stats.bathrooms = clamp(Math.round(bathroomPressure * 100), 0, 100);
  state.stats.heat = heat;
  state.stats.noise = clamp(10 + (effects.noise ?? 0) + crowd / 160 + policy.noise, 0, 100);
  state.stats.permit = permit;
  state.stats.marshal = marshal;
  state.stats.chaos = chaos;
  state.stats.finale = finale;
  makePhaseBulletins(phaseId, { revenue, upkeep, foodShortage, bathroomPressure, trashPressure, paradeQuality, power });
  adjustCrowdDots();
  rebuildScene();
}

function collectEffects(): Effects {
  const result: Effects = {};
  for (const building of state.buildings) {
    const def = defById.get(building.defId);
    if (!def) continue;
    for (const [key, value] of Object.entries(def.effects) as [keyof Effects, number][]) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

function countBuildings(): Record<BuildingId, number> {
  const counts = Object.fromEntries(defs.map((def) => [def.id, 0])) as Record<BuildingId, number>;
  for (const building of state.buildings) counts[building.defId] += 1;
  return counts;
}

function policyModifiers(): {
  revenue: number;
  cost: number;
  fireRisk: number;
  permit: number;
  safety: number;
  spectacle: number;
  joy: number;
  pride: number;
  chaos: number;
  marshal: number;
  finale: number;
  supply: number;
  traffic: number;
  heat: number;
  noise: number;
  paradeFlowPenalty: number;
} {
  const m = {
    revenue: 1,
    cost: 1,
    fireRisk: 0,
    permit: 0,
    safety: 0,
    spectacle: 0,
    joy: 0,
    pride: 0,
    chaos: 0,
    marshal: 0,
    finale: 0,
    supply: 0,
    traffic: 0,
    heat: 0,
    noise: 0,
    paradeFlowPenalty: 0,
  };
  if (state.policies.budget === "spectacle") Object.assign(m, { spectacle: 8, finale: 5, safety: -3, cost: 1.05 });
  if (state.policies.budget === "safety") Object.assign(m, { safety: 7, fireRisk: -4, spectacle: -2, cost: 1.08 });
  if (state.policies.budget === "revenue") Object.assign(m, { revenue: 1.18, joy: -1, permit: 2 });
  if (state.policies.budget === "comfort") Object.assign(m, { joy: 6, heat: -4, revenue: 0.94 });
  if (state.policies.fireworks === "strict") Object.assign(m, { fireRisk: -8, permit: -6, spectacle: -3, finale: -1, marshal: 5 });
  if (state.policies.fireworks === "loose") Object.assign(m, { fireRisk: 13, permit: 9, spectacle: 8, revenue: m.revenue * 1.06, chaos: 6 });
  if (state.policies.vendors === "commercial") Object.assign(m, { revenue: m.revenue * 1.14, pride: -3, supply: 3 });
  if (state.policies.vendors === "charity") Object.assign(m, { revenue: m.revenue * 0.88, pride: 7, joy: 3, permit: -2 });
  if (state.policies.parade === "short") Object.assign(m, { paradeFlowPenalty: -4, pride: -2, spectacle: -2 });
  if (state.policies.parade === "grand") Object.assign(m, { paradeFlowPenalty: 10, pride: 9, spectacle: 6, cost: m.cost * 1.03 });
  if (state.policies.security === "light") Object.assign(m, { joy: 3, chaos: 5, safety: -3 });
  if (state.policies.security === "heavy") Object.assign(m, { joy: -4, chaos: -8, safety: 6, permit: -3, cost: m.cost * 1.04 });
  if (state.policies.services === "minimum") Object.assign(m, { cost: m.cost * 0.9, trash: 0, safety: -4, chaos: 4 });
  if (state.policies.services === "overprepared") Object.assign(m, { cost: m.cost * 1.1, safety: 5, joy: 4, chaos: -4, heat: -2 });
  return m;
}

function paradeScore(effects: Effects, counts: Record<BuildingId, number>): number {
  const route = counts.paradeRoute * 2.5;
  const units = counts.veteransFloat * 7 + counts.fireTruckFloat * 6 + counts.classicCars * 5;
  const staging = counts.paradeStaging ? 12 : -8;
  const viewing = (effects.viewing ?? 0) / 18;
  return clamp(route + units + staging + viewing, 0, 60);
}

function makePhaseBulletins(
  phaseId: PhaseId,
  context: {
    revenue: number;
    upkeep: number;
    foodShortage: number;
    bathroomPressure: number;
    trashPressure: number;
    paradeQuality: number;
    power: number;
  },
): void {
  const title = currentPhase().title;
  addBulletin("Town Ledger Updates Without Blinking", `Revenue $${context.revenue.toLocaleString()} minus upkeep $${context.upkeep.toLocaleString()}.`, title);
  if (phaseId === "afternoon" && state.stats.heat > 55) addEvent("Heat Wave", "Lemonade is now infrastructure. Shade tents gain moral authority.", { heat: 4, joy: -4, safety: -2 });
  if (phaseId === "afternoon" && context.foodShortage > 0.25) addEvent("Funnel Cake Line Revolt", "A queue forms a government and demands powdered sugar representation.", { joy: -6, chaos: 4 });
  if (context.bathroomPressure > 0.3) addEvent("Porta-Potty Math Defeats Town Council", "Bathroom pressure becomes the only issue anyone can discuss calmly.", { joy: -8, safety: -4, chaos: 6 });
  if (context.trashPressure > 0.35) addEvent("Trash Cans Beg For Reinforcements", "Several bins appear to be negotiating surrender terms.", { pride: -7, joy: -4, chaos: 5 });
  if (state.stats.fireRisk > 62) addEvent("Fire Marshal Warning", "The marshal praises the bunting and then points very seriously at the launch map.", { permit: 8, marshal: -4 });
  if (phaseId === "parade" && context.paradeQuality < 16) addEvent("Marching Band Detour", "The band completes a bold new route through regional confusion.", { pride: -5, flow: -8, chaos: 7 });
  if (phaseId === "parade" && context.paradeQuality > 34) addEvent("Veterans Float Applause", "The route works, the crowd can see, and civic pride gets a standing ovation.", { pride: 8, spectacle: 4, joy: 3 });
  if (phaseId === "evening" && state.stats.supply < 35) addEvent("Vendor Stockout", "A souvenir stand learns that hope is not inventory.", { joy: -6, chaos: 3 });
  if (phaseId === "evening" && state.policies.fireworks === "loose" && state.stats.fireRisk > 45) {
    addEvent("Unauthorized Sparkler Swarm", "A glow-happy side crowd appears. It is abstract, legal-safe, and extremely stressful.", { fireRisk: 7, chaos: 6, spectacle: 3 });
  }
  if (phaseId === "evening" && context.power < -5) addEvent("Generator Failure", "The stage lights blink like they have read the budget.", { joy: -5, spectacle: -5, chaos: 4 });
  if (phaseId === "evening" && state.stats.traffic > 62) addEvent("Parking Gridlock", "The parking lot achieves consciousness and immediately complains.", { flow: -5, joy: -4, chaos: 5 });
}

function addEvent(headline: string, body: string, effects: Partial<Stats>): void {
  for (const [key, value] of Object.entries(effects) as [keyof Stats, number][]) {
    if (key === "money" || key === "crowd") continue;
    state.stats[key] = clamp(state.stats[key] + value, 0, 100);
  }
  addBulletin(headline, body, currentPhase().title);
}

function addBulletin(headline: string, body: string, phase: string): void {
  state.bulletins = [{ headline, body, phase }, ...state.bulletins].slice(0, 10);
}

function resolveFinale(): void {
  const counts = countBuildings();
  const effects = collectEffects();
  const viewingScore = clamp((effects.viewing ?? 0) / Math.max(1, state.stats.crowd) * 90 + counts.viewing * 8, 0, 100);
  const launchReady = counts.launchZone ? 18 : -22;
  const safetyReady = state.stats.safety * 0.25 + state.stats.marshal * 0.2 + (effects.fireCoverage ?? 0) * 0.7 + counts.safetyBarrier * 2.2;
  const riskPenalty = state.stats.fireRisk * 0.5 + state.stats.permit * 0.24 + state.stats.chaos * 0.25;
  const weatherPenalty = state.weather === "windy" ? 11 : state.weather === "dry" ? 8 : state.weather === "rain" ? 7 : 0;
  const score = clamp(
    Math.round(state.stats.spectacle * 0.55 + state.stats.finale * 0.85 + viewingScore * 0.35 + launchReady + safetyReady - riskPenalty - weatherPenalty),
    0,
    100,
  );
  const title =
    score >= 88
      ? "Huge Crowd-Pleaser"
      : score >= 74
        ? "Beautiful and Safe"
        : score >= 58
          ? "Safe but Modest"
          : score >= 38
            ? "Too Smoky, Still Applauded"
            : state.stats.fireRisk > 78 || state.stats.chaos > 80
              ? "Sparkpocalypse"
              : "Delayed by Permit Issue";
  const archetype = endingArchetype(score);
  const awards = makeAwards(score);
  const bestWorst = bestAndWorst();
  state.finaleOutcome = {
    score,
    title,
    archetype,
    best: bestWorst.best,
    worst: bestWorst.worst,
    awards,
    quote: makeQuote(archetype),
    article: makeArticle(score, title, archetype, awards, bestWorst),
  };
  state.awards = awards;
  state.ended = true;
  addBulletin("Grand Finale Lights Up Sky, Insurance Agent Watches Silently", `${title}. Finale score: ${score}.`, "Fireworks Finale");
}

function endingArchetype(score: number): string {
  const s = state.stats;
  if (s.fireRisk > 82 || s.chaos > 86) return "Sparkpocalypse";
  if (s.permit > 78) return "Permit Office Nightmare";
  if (s.pride > 78 && s.flow < 38) return "Parade Gridlock Incident";
  if (s.spectacle > 82 && s.fireRisk > 55) return "Pyro Capital of the County";
  if (state.revenue > 9000 && s.trash > 58) return "Funnel Cake Republic";
  if (s.joy > 78 && s.safety > 78 && s.pride > 70 && score > 72) return "Perfect Small-Town Fourth";
  if (s.flow > 76 && s.supply > 68 && s.trash < 36) return "Logistics Masterpiece";
  if (s.chaos < 25 && s.safety > 78) return "Quiet Civic Picnic";
  if (score > 76) return "Local Legend";
  return "Carnival Boomtown";
}

function makeAwards(score: number): string[] {
  const awards: string[] = [];
  const s = state.stats;
  if (s.joy > 75 && s.safety > 70 && score > 70) awards.push("Best Use of Questionable Budget");
  if (state.revenue > 8500) awards.push("Most Patriotic Vendor Density");
  if (s.bathrooms < 20) awards.push("Bathroom Infrastructure Hero");
  if (s.marshal > 78 && s.fireRisk < 34) awards.push("Fire Marshal Whisperer");
  if (s.trash < 28) awards.push("Trash Containment Medal");
  if (s.pride > 76 && s.flow > 55) awards.push("Parade Logistics Goblin");
  if (s.fireRisk < 42 && score > 60) awards.push("Sky Accountant Survivor");
  if (s.spectacle > 78) awards.push("Finale Showboat Ribbon");
  if (s.chaos > 80 || s.fireRisk > 80) awards.push("Insurance Adjuster Summoning Circle");
  return awards.length ? awards.slice(0, 6) : ["Civically Acceptable Clipboard"];
}

function bestAndWorst(): { best: string; worst: string } {
  const candidates: [string, number, boolean][] = [
    ["Joy", state.stats.joy, true],
    ["Civic Pride", state.stats.pride, true],
    ["Spectacle", state.stats.spectacle, true],
    ["Safety", state.stats.safety, true],
    ["Flow", state.stats.flow, true],
    ["Fire Risk", state.stats.fireRisk, false],
    ["Trash", state.stats.trash, false],
    ["Bathroom Pressure", state.stats.bathrooms, false],
    ["Chaos", state.stats.chaos, false],
  ];
  const scored = candidates.map(([name, value, highGood]) => ({ name, value, score: highGood ? value : 100 - value }));
  scored.sort((a, b) => b.score - a.score);
  return { best: scored[0].name, worst: scored[scored.length - 1].name };
}

function makeQuote(archetype: string): string {
  const quotes: Record<string, string> = {
    "Perfect Small-Town Fourth": '"I cried during the finale and only partly from smoke," said a relieved volunteer.',
    "Pyro Capital of the County": '"The sky did the budget speech for us," said the committee chair.',
    "Funnel Cake Republic": '"I saw three families form a powdered sugar caucus," said a vendor.',
    "Parade Gridlock Incident": '"The parade was visible from everywhere because it stopped everywhere," said Local Radio.',
    "Permit Office Nightmare": '"The paperwork had a paperwork problem," said a clerk.',
    "Carnival Boomtown": '"The rides carried the day and several committee meetings," said a parent.',
    "Quiet Civic Picnic": '"Honestly? It was nice," said someone who got a shady seat.',
    Sparkpocalypse: '"The newspaper has chosen the word incident with care," said the editor.',
    "Logistics Masterpiece": '"No one praised the trash plan, which is how we know it worked," said Public Works.',
    "Local Legend": '"People will exaggerate this by Labor Day," said the mayor.',
  };
  return quotes[archetype] ?? '"The town will be discussing the layout for a while," said a witness.';
}

function makeArticle(score: number, finaleTitle: string, archetype: string, awards: string[], bestWorst: { best: string; worst: string }): string {
  return `Liberty Park welcomed ${state.stats.crowd.toLocaleString()} visitors and finished with $${Math.max(0, Math.round(state.stats.money)).toLocaleString()} in the town account after a ${finaleTitle.toLowerCase()} finale. The festival's strongest category was ${bestWorst.best}, while ${bestWorst.worst} supplied the committee's next meeting agenda. Analysts classified the day as "${archetype}." Awards: ${awards.join(", ")}.`;
}

function currentPhase(): { id: PhaseId; title: string; body: string } {
  return phases[state.phaseIndex] ?? phases[phases.length - 1];
}

function makePhaseBanner(phase: { id: PhaseId; title: string; body: string }, before: Stats): PhaseBanner {
  const lines: Record<PhaseId, string> = {
    setup: "The committee has found a clipboard and therefore believes it is ready.",
    afternoon: "The first wave of citizens has entered Liberty Park with sunscreen, opinions, and suspicious cooler confidence.",
    parade: "The parade has begun, which means civic pride is up and traffic cones are making enemies.",
    evening: "Dinner rush arrives with sticky hands, big expectations, and bold bathroom assumptions.",
    finale: "The build phase is over. The sky accountant has arrived with a clipboard.",
    recap: "The Gazette has opinions, and several of them are unfortunately fair.",
  };
  const deltas = [
    deltaLine("Crowd", state.stats.crowd - before.crowd, "visitors"),
    deltaLine("Money", state.stats.money - before.money, "budget"),
    deltaLine("Trash", state.stats.trash - before.trash, "pressure"),
    deltaLine("Bathrooms", state.stats.bathrooms - before.bathrooms, "pressure"),
    deltaLine("Fire Risk", state.stats.fireRisk - before.fireRisk, "risk"),
    deltaLine("Flow", state.stats.flow - before.flow, "flow"),
  ].filter(Boolean) as string[];
  const warnings = deltas.length ? deltas.slice(0, 3) : advisorNudges().slice(0, 2);
  return { title: phase.title, line: lines[phase.id], warnings };
}

function deltaLine(label: string, delta: number, noun: string): string | undefined {
  if (Math.abs(delta) < 4) return undefined;
  const direction = delta > 0 ? "up" : "down";
  return `${label} ${direction} ${Math.abs(Math.round(delta)).toLocaleString()} ${noun}`;
}

function rebuildScene(): void {
  buildingGroup.clear();
  overlayGroup.clear();
  overlayGroup.add(selectedTileMesh);
  for (const building of state.buildings) addBuildingMesh(building);
  renderRiskRadius();
  adjustCrowdDots();
}

function addBuildingMesh(building: PlacedBuilding): void {
  const def = defById.get(building.defId);
  if (!def) return;
  const group = new THREE.Group();
  group.position.set(tileToWorldX(building.x), 0, tileToWorldZ(building.y));
  const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.72 });
  const accent = new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.58 });
  const baseHeight = def.height;
  const halo = makeCategoryHalo(def.category);
  group.add(halo);
  if (def.shape === "route" || def.shape === "zone") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, baseHeight, 0.92), mat);
    mesh.position.y = baseHeight / 2 + 0.02;
    group.add(mesh);
    if (def.shape === "route") {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, baseHeight + 0.012, 0.8), accent);
      stripe.position.y = baseHeight + 0.035;
      group.add(stripe);
    }
  } else if (def.shape === "tent") {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.78, baseHeight, 0.78), mat);
    box.position.y = baseHeight / 2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.35, 4), accent);
    roof.position.y = baseHeight + 0.16;
    roof.rotation.y = Math.PI / 4;
    group.add(box, roof);
    if (def.category === "vendors") {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.72), mat);
      stripe.position.set(-0.16, baseHeight + 0.28, 0);
      const stripe2 = stripe.clone();
      stripe2.position.x = 0.16;
      group.add(stripe, stripe2);
    }
  } else if (def.shape === "tower") {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, baseHeight, 8), mat);
    post.position.y = baseHeight / 2;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.48), accent);
    cap.position.y = baseHeight + 0.05;
    group.add(post, cap);
  } else if (def.shape === "ride") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 18), mat);
    base.position.y = 0.08;
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.035, 8, 24), accent);
    arm.position.y = baseHeight;
    arm.rotation.x = Math.PI / 2;
    group.add(base, arm);
    group.userData.spin = true;
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.72, baseHeight, 0.72), mat);
    box.position.y = baseHeight / 2;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.12), accent);
    sign.position.set(0, baseHeight + 0.08, -0.36);
    group.add(box, sign);
    if (def.category === "services") {
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.08), accent);
      badge.position.set(0.24, baseHeight + 0.2, -0.36);
      group.add(badge);
    }
    if (def.category === "fireworks") {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.18), accent);
      rack.position.set(0, baseHeight + 0.22, 0.22);
      group.add(rack);
    }
  }
  const label = makeLabel(`${categoryIcon(def.category)} ${shortName(def.name)}`, def.accent);
  label.position.set(0, Math.max(0.38, baseHeight + 0.28), 0);
  group.add(label);
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  buildingGroup.add(group);
}

function makeCategoryHalo(category: Category): THREE.Mesh {
  const geometry = new THREE.RingGeometry(0.48, 0.56, 28);
  const material = new THREE.MeshBasicMaterial({
    color: categoryColor(category),
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.035;
  return mesh;
}

function renderRiskRadius(): void {
  const launch = state.buildings.find((building) => building.defId === "launchZone");
  if (!launch) return;
  const geometry = new THREE.RingGeometry(1.4, 3.2, 48);
  const material = new THREE.MeshBasicMaterial({ color: 0xff784d, transparent: true, opacity: 0.16, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(tileToWorldX(launch.x), 0.08, tileToWorldZ(launch.y));
  overlayGroup.add(ring);
}

function makeTileHighlight(color: number, opacity: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.035, 0.96),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
  );
  return mesh;
}

function makeLabel(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.fillStyle = "rgba(17, 24, 39, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  ctx.fillStyle = "#fff4cb";
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.95, 0.24, 1);
  return sprite;
}

function shortName(name: string): string {
  return name
    .replace("Star-Spangled ", "")
    .replace("Freedom ", "")
    .replace("Stand", "")
    .replace("Station", "Sta.")
    .replace("Fireworks", "FW")
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}

function adjustCrowdDots(): void {
  const targetCount = state.started ? clamp(Math.round(state.stats.crowd / 32), 8, 90) : 0;
  while (crowdDots.length < targetCount) {
    const dot = makeCrowdDot();
    crowdDots.push(dot);
    crowdGroup.add(dot.mesh);
  }
  while (crowdDots.length > targetCount) {
    const dot = crowdDots.pop();
    if (dot) crowdGroup.remove(dot.mesh);
  }
  for (const dot of crowdDots) {
    dot.mood = state.stats.chaos > 68 ? "chaos" : state.stats.joy < 42 ? "tired" : "happy";
    (dot.mesh.material as THREE.MeshStandardMaterial).color.set(dot.mood === "happy" ? 0xffe1a3 : dot.mood === "tired" ? 0x9ab0c4 : 0xff785f);
  }
}

function makeCrowdDot(): CrowdDot {
  const material = new THREE.MeshStandardMaterial({ color: 0xffe1a3, roughness: 0.4 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), material);
  mesh.position.copy(randomWalkablePoint());
  mesh.position.y = 0.12;
  return { mesh, target: randomWalkablePoint(), speed: 0.45 + Math.random() * 0.55, mood: "happy" };
}

function randomWalkablePoint(): THREE.Vector3 {
  const walkables = state.buildings.filter((building) => {
    const def = defById.get(building.defId);
    return def?.id === "path" || def?.id === "serviceLane" || def?.id === "paradeRoute" || def?.id === "viewing" || def?.id === "gate";
  });
  const pick = walkables[Math.floor(Math.random() * Math.max(1, walkables.length))];
  const x = pick ? pick.x : Math.floor(Math.random() * MAP_W);
  const y = pick ? pick.y : Math.floor(Math.random() * MAP_H);
  return new THREE.Vector3(tileToWorldX(x) + (Math.random() - 0.5) * 0.7, 0.12, tileToWorldZ(y) + (Math.random() - 0.5) * 0.7);
}

function startFinaleShow(): void {
  finaleStart = performance.now();
  clearFinale();
  addBulletin("Finale Control Booth Counts Down", "The committee stops placing objects and starts negotiating with the sky.", "Fireworks Finale");
}

function clearFinale(): void {
  fireworksGroup.clear();
}

function animate(time: number): void {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  updateCrowd(dt);
  updateRides(time);
  updateFinale(time);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateCrowd(dt: number): void {
  for (const dot of crowdDots) {
    const direction = dot.target.clone().sub(dot.mesh.position);
    if (direction.length() < 0.12) {
      dot.target = randomWalkablePoint();
    } else {
      direction.normalize();
      dot.mesh.position.add(direction.multiplyScalar(dot.speed * dt * (state.stats.flow / 55)));
    }
  }
}

function updateRides(time: number): void {
  buildingGroup.children.forEach((group) => {
    if (!group.userData.spin) return;
    group.rotation.y += 0.01 + Math.sin(time * 0.001) * 0.002;
  });
}

function updateFinale(time: number): void {
  if (currentPhase().id !== "finale") return;
  const elapsed = (time - finaleStart) / 1000;
  if (elapsed < 0) return;
  if (Math.random() < 0.16) spawnFirework();
  const faded: THREE.Object3D[] = [];
  fireworksGroup.children.forEach((object: THREE.Object3D) => {
    object.position.y += 0.022;
    const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
    material.opacity = Math.max(0, material.opacity - 0.008);
    if (material.opacity <= 0) faded.push(object);
  });
  faded.forEach((object) => fireworksGroup.remove(object));
}

function spawnFirework(): void {
  const colors = [0xffd35f, 0xff6b5e, 0x88c7ff, 0xffffff, 0x83e6a1];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const launch = state.buildings.find((building) => building.defId === "launchZone");
  const center = launch ? new THREE.Vector3(tileToWorldX(launch.x), 1.4, tileToWorldZ(launch.y)) : new THREE.Vector3(2, 1.4, 2);
  for (let i = 0; i < 16; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 }),
    );
    const angle = (Math.PI * 2 * i) / 16;
    const radius = 0.25 + Math.random() * 0.6;
    mesh.position.set(center.x + Math.cos(angle) * radius, center.y + Math.random() * 1.2, center.z + Math.sin(angle) * radius);
    fireworksGroup.add(mesh);
  }
}

function renderAll(): void {
  updateShellState();
  renderTitle();
  renderPhasePanel();
  renderStats();
  renderAdvisorPanel();
  renderPolicyPanel();
  renderFeed();
  renderBuildPanel();
  renderSelectionPanel();
  renderFinalePanel();
  renderPhaseBanner();
}

function updateShellState(): void {
  const shell = document.querySelector<HTMLDivElement>("#game-shell");
  if (!shell) return;
  shell.classList.toggle("is-started", state.started);
  shell.classList.toggle("is-ended", state.ended);
  shell.classList.toggle("is-map-ready", mapReady);
}

function renderPhaseBanner(): void {
  const el = document.querySelector<HTMLDivElement>("#phase-banner");
  if (!el) return;
  const banner = state.phaseBanner;
  if (!banner || !state.started || state.ended) {
    el.classList.add("hidden");
    return;
  }
  el.innerHTML = `
    <article>
      <button aria-label="Dismiss phase banner" data-action="dismissPhase">X</button>
      <strong>${banner.title}</strong>
      <p>${banner.line}</p>
      <ul>${banner.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>
    </article>
  `;
  el.classList.remove("hidden");
}

function renderTitle(): void {
  const el = document.querySelector<HTMLDivElement>("#title-screen");
  if (!el || state.started) return;
  const hasSave = Boolean(localStorage.getItem(STORAGE_KEY));
  el.innerHTML = `
    <article class="title-card">
      <p class="eyebrow">Liberty Park Committee Simulator</p>
      <h1>${GAME_TITLE}</h1>
      <h2>${GAME_SUBTITLE}</h2>
      <p>Design a one-day Fourth of July festival in Liberty Park. Place vendors, paths, parade pieces, bathrooms, trash service, safety, parking, and fireworks infrastructure. Keep the crowd happy, the fire marshal calm, and the finale loud enough to be remembered for mostly legal reasons.</p>
      <div class="title-grid">
        <article><h3>Build</h3><p>Paths, stands, rides, parade pieces, civic services, and abstract fireworks infrastructure.</p></article>
        <article><h3>Balance</h3><p>Money, trash, bathrooms, safety, fire risk, flow, traffic, spectacle, and chaos.</p></article>
        <article><h3>Finish</h3><p>Reach the finale, survive the Gazette, and earn a scorecard worth bragging about.</p></article>
      </div>
      <div class="title-actions">
        <button class="primary" data-action="start">START THE FOURTH</button>
        ${hasSave ? `<button data-action="load">LOAD SAVED FESTIVAL</button>` : ""}
        <button data-action="howto">HOW THIS NONSENSE WORKS</button>
      </div>
      <div class="title-howto">
        <h3>Mayor's Clipboard</h3>
        <ol>
          <li>Place paths so people can move.</li>
          <li>Add food and drink so the crowd spends money instead of rioting politely.</li>
          <li>Add bathrooms and trash before the park becomes a documentary.</li>
          <li>Add parade and fireworks pieces before the finale.</li>
          <li>Watch safety, fire risk, flow, trash, bathrooms, and money.</li>
        </ol>
      </div>
    </article>
  `;
}

function renderPhasePanel(): void {
  const phase = currentPhase();
  const el = document.querySelector<HTMLDivElement>("#phase-panel");
  if (!el) return;
  el.innerHTML = `
    <h1>${GAME_TITLE}</h1>
    <h2>${phase.title} - Weather: ${weatherDefs[state.weather].name}</h2>
    <p>${phase.body} ${weatherDefs[state.weather].body}</p>
    <div class="phase-actions">
      <button class="primary" data-action="advance">${phase.id === "finale" ? "Resolve Finale" : phase.id === "recap" ? "Show Recap" : "Advance Phase"}</button>
      <button data-action="save">Save</button>
      <button data-action="load">Load</button>
      <button class="danger" data-action="new">Restart</button>
    </div>
  `;
}

function renderStats(): void {
  const el = document.querySelector<HTMLDivElement>("#stats-panel");
  if (!el) return;
  const s = state.stats;
  const stats: [string, string | number, boolean, string][] = [
    ["Money", `$${Math.round(s.money).toLocaleString()}`, s.money < 0, "Budget remaining before the committee starts selling commemorative spoons."],
    ["Crowd", s.crowd.toLocaleString(), false, "Citizens currently converting oxygen into opinions."],
    ["Joy", Math.round(s.joy), s.joy < 40, "How close the park is to wholesome chaos."],
    ["Safety", Math.round(s.safety), s.safety < 45, "How little the fire marshal is twitching."],
    ["Fire Risk", Math.round(s.fireRisk), s.fireRisk > 60, "How spicy the sky plan has become."],
    ["Flow", Math.round(s.flow), s.flow < 42, "Whether the crowd moves like people or a clogged parade kazoo."],
    ["Trash", Math.round(s.trash), s.trash > 55, "How close Liberty Park is to raccoon governance."],
    ["Bathrooms", Math.round(s.bathrooms), s.bathrooms > 55, "The thin porcelain line between civilization and revolt."],
    ["Spectacle", Math.round(s.spectacle), false, "How much the day looks like the poster promised."],
    ["Chaos", Math.round(s.chaos), s.chaos > 65, "Unscheduled freedom."],
  ];
  el.innerHTML = stats
    .map(([label, value, danger, help]) => `<article class="stat ${danger ? "danger" : ""}" title="${escapeAttr(help)}"><span>${label}</span><b>${value}</b></article>`)
    .join("");
}

function renderAdvisorPanel(): void {
  const el = document.querySelector<HTMLDivElement>("#advisor-panel");
  if (!el) return;
  const nudges = advisorNudges();
  const tutorial =
    currentPhase().id === "setup"
      ? `
        <div class="clipboard">
          <b>Mayor's Clipboard</b>
          <ol>
            <li>Place paths so people can move.</li>
            <li>Add vendors, bathrooms, trash, parade pieces, and fireworks support.</li>
            <li>Watch safety, fire risk, flow, trash, bathrooms, and money.</li>
          </ol>
        </div>`
      : "";
  el.innerHTML = `
    <h2>Civic Panic Meter</h2>
    ${tutorial}
    <ul class="nudge-list">
      ${nudges.map((nudge) => `<li>${nudge}</li>`).join("")}
    </ul>
  `;
}

function advisorNudges(): string[] {
  const s = state.stats;
  const nudges: string[] = [];
  if (s.bathrooms > 48) nudges.push("Bathroom pressure is rising. Add restrooms before the crowd starts writing reviews in all caps.");
  if (s.trash > 46) nudges.push("Trash is climbing. Deploy trash service or prepare for raccoon democracy.");
  if (s.fireRisk > 52) nudges.push("Fire risk is high. Add fire safety before the sky accountant gets involved.");
  if (s.flow < 46) nudges.push("Flow is low. Add paths or open space so the crowd stops moving like a clogged parade kazoo.");
  if (s.money < 3500) nudges.push("Money is low. Vendors generate revenue, assuming people can reach them.");
  if (s.pride < 42 && currentPhase().id !== "setup") nudges.push("Parade pride is low. Add staging, route support, or floats before the parade becomes people walking with paperwork.");
  if (s.finale < 44) nudges.push("Finale readiness is low. Fireworks need support, safety, and spectacle.");
  if (!nudges.length) nudges.push("No active panic. This is either good planning or the calm before a municipal spreadsheet.");
  return nudges.slice(0, 3);
}

function renderPolicyPanel(): void {
  const el = document.querySelector<HTMLDivElement>("#policy-panel");
  if (!el) return;
  el.innerHTML = `
    <h2>Management</h2>
    ${policyOptions
      .map(
        (option) => `
      <label class="policy-row">
        <span>${option.label}</span>
        <select data-action="policy" data-key="${option.key}">
          ${Object.entries(option.values)
            .map(([value, label]) => `<option value="${value}" ${state.policies[option.key] === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </label>
    `,
      )
      .join("")}
  `;
}

function renderFeed(): void {
  const el = document.querySelector<HTMLDivElement>("#feed-panel");
  if (!el) return;
  el.innerHTML = `
    <h2>Local Radio / Gazette</h2>
    <div class="feed-list">
      ${state.bulletins
        .map((item) => `<article class="bulletin"><strong>${item.headline}</strong><span>${item.phase}: ${item.body}</span></article>`)
        .join("")}
    </div>
  `;
}

function renderBuildPanel(): void {
  const el = document.querySelector<HTMLDivElement>("#build-panel");
  if (!el) return;
  const categoryDefs = state.selectedCategory === "tools" ? [] : defs.filter((def) => def.category === state.selectedCategory);
  el.innerHTML = `
    <h2>Build Menu</h2>
    <p class="placement-notice">${state.placementNotice}</p>
    <div class="category-tabs">
      ${(["paths", "vendors", "civic", "services", "parade", "rides", "fireworks", "tools"] as Category[])
        .map((category) => `<button class="${state.selectedCategory === category ? "active" : ""}" data-action="category" data-category="${category}">${categoryLabels[category]}</button>`)
        .join("")}
    </div>
    <div class="tool-grid">
      ${
        state.selectedCategory === "tools"
          ? `<button class="${state.selectedTool === "bulldoze" ? "active" : ""}" data-action="tool" data-tool="bulldoze"><b>TL Bulldoze</b><span>Remove object, partial refund</span><small>Use when the committee regrets geometry.</small></button>`
          : categoryDefs
              .map(
                (def) => `<button class="${state.selectedTool === def.id ? "active" : ""}" data-action="tool" data-tool="${def.id}" title="${escapeAttr(describeDef(def))}">
                  <b>${categoryIcon(def.category)} ${def.name}</b>
                  <span>$${def.cost.toLocaleString()} - ${describeDef(def)}</span>
                  <small>${placementRule(def)}</small>
                </button>`,
              )
              .join("")
      }
    </div>
  `;
}

function renderSelectionPanel(): void {
  const el = document.querySelector<HTMLDivElement>("#selection-panel");
  if (!el) return;
  const tile = state.selectedTile ?? hoveredTile;
  const existing = tile ? state.buildings.find((building) => building.x === tile.x && building.y === tile.y) : undefined;
  const selected = state.selectedTool === "bulldoze" ? undefined : defById.get(state.selectedTool as BuildingId);
  const current = existing ? defById.get(existing.defId) : undefined;
  const def = current ?? selected;
  if (!def) {
    el.innerHTML = `<h2>Selection</h2><p>Choose a build item or hover a tile.</p>`;
    return;
  }
  el.innerHTML = `
    <h2>${current ? "Tile" : "Selected Tool"}</h2>
    <p><b>${def.name}</b>${current ? " already operates here." : ` costs $${def.cost.toLocaleString()}.`}</p>
    <dl>
      <dt>Pros</dt><dd>${def.pros.slice(0, 2).join("; ")}</dd>
      <dt>Cons</dt><dd>${def.cons.slice(0, 2).join("; ")}</dd>
      <dt>Upkeep</dt><dd>$${def.upkeep}/phase</dd>
      <dt>Needs Path</dt><dd>${def.requiresPath ? "Yes" : "No"}</dd>
    </dl>
  `;
}

function renderHoverTooltip(): void {
  const el = document.querySelector<HTMLDivElement>("#hover-tooltip");
  if (!el) return;
  const tile = hoveredTile;
  const screen = hoverScreen;
  const placed = tile ? state.buildings.find((building) => building.x === tile.x && building.y === tile.y) : undefined;
  const def = placed ? defById.get(placed.defId) : undefined;
  if (!def || !screen || !state.started) {
    el.classList.add("hidden");
    return;
  }
  const refund = Math.round(def.cost * 0.35);
  el.style.left = `${Math.min(window.innerWidth - 260, screen.x + 16)}px`;
  el.style.top = `${Math.max(12, screen.y - 12)}px`;
  el.innerHTML = `
    <b>${categoryIcon(def.category)} ${def.name}</b>
    <span>${categoryLabels[def.category]}</span>
    <p>${describeDef(def)}</p>
    <small>Upkeep $${def.upkeep}/phase - Bulldoze refund $${refund}</small>
  `;
  el.classList.remove("hidden");
}

function renderFinalePanel(): void {
  const el = document.querySelector<HTMLDivElement>("#finale-panel");
  if (!el) return;
  const readiness = Math.round(state.stats.finale);
  el.innerHTML = `
    <h2>Finale Readiness</h2>
    <div class="meter"><i style="width:${readiness}%"></i></div>
    <p>${readiness < 35 ? "The sky plan is mostly hope." : readiness < 65 ? "A plausible finale is forming." : "The finale crew is starting to smile."}</p>
    <dl>
      <dt>Fire Marshal</dt><dd>${Math.round(state.stats.marshal)}</dd>
      <dt>Permit Pressure</dt><dd>${Math.round(state.stats.permit)}</dd>
      <dt>Supply</dt><dd>${Math.round(state.stats.supply)}</dd>
      <dt>Traffic</dt><dd>${Math.round(state.stats.traffic)}</dd>
    </dl>
  `;
}

function showEndScreen(): void {
  if (!state.finaleOutcome) resolveFinale();
  const outcome = state.finaleOutcome;
  if (!outcome) return;
  const el = document.querySelector<HTMLDivElement>("#end-screen");
  if (!el) return;
  const shareTitle = shareableOutcomeTitle(outcome);
  const breakdown = scoreBreakdownRows(outcome.score);
  el.classList.remove("hidden");
  el.innerHTML = `
    <article class="end-card">
      <p class="eyebrow">Gazette Final Edition</p>
      <h1>${shareTitle}</h1>
      <h2>${outcome.title} - Finale Score ${outcome.score}</h2>
      <div class="score-grid">
        <article><h3>Attendance</h3><p>${state.stats.crowd.toLocaleString()} visitors</p></article>
        <article><h3>Revenue</h3><p>$${state.revenue.toLocaleString()} gross / $${Math.round(state.stats.money).toLocaleString()} ending cash</p></article>
        <article><h3>Best / Worst</h3><p>${outcome.best} / ${outcome.worst}</p></article>
      </div>
      <div class="breakdown-grid">
        ${breakdown.map(([label, value]) => `<article><span>${label}</span><b>${value}</b></article>`).join("")}
      </div>
      <article class="newspaper">
        <h3>Liberty Park Gazette Final Edition</h3>
        <p>${outcome.article}</p>
        <p>${outcome.quote}</p>
      </article>
      <div class="award-list">${outcome.awards.map((award) => `<span>${award}</span>`).join("")}</div>
      <p class="copy-status" id="copy-status"></p>
      <button data-action="copyRecap">Copy Recap</button>
      <button class="primary" data-action="new">New Festival</button>
    </article>
  `;
}

function shareableOutcomeTitle(outcome: FinaleOutcome): string {
  const s = state.stats;
  if (outcome.score >= 88) return "BOOMTOWN LEGEND";
  if (s.bathrooms > 72) return "BATHROOM MATH INCIDENT";
  if (s.fireRisk > 78 || s.chaos > 82) return "THE SKY SUED BACK";
  if (s.marshal < 34 || s.permit > 72) return "FIRE MARSHAL SIDE-EYE";
  if (s.pride > 68 && s.flow > 45) return "PARADE OF MOSTLY SUCCESS";
  return outcome.score >= 58 ? "CIVICALLY ACCEPTABLE" : "FIRE MARSHAL SIDE-EYE";
}

function scoreBreakdownRows(finaleScore: number): [string, number | string][] {
  const s = state.stats;
  return [
    ["Joy", Math.round(s.joy)],
    ["Civic Pride", Math.round(s.pride)],
    ["Spectacle", Math.round(s.spectacle)],
    ["Safety", Math.round(s.safety)],
    ["Flow", Math.round(s.flow)],
    ["Cleanliness", Math.round(100 - s.trash)],
    ["Finale Readiness", Math.round(s.finale)],
    ["Money Remaining", `$${Math.max(0, Math.round(s.money)).toLocaleString()}`],
    ["Chaos Penalty", `-${Math.round(s.chaos)}`],
    ["Finale Score", finaleScore],
  ];
}

function recapText(): string {
  const outcome = state.finaleOutcome;
  if (!outcome) return "";
  const awards = outcome.awards.slice(0, 2).join(", ");
  return `I scored ${outcome.score} in ${GAME_TITLE} with ${shareableOutcomeTitle(outcome)}, ${awards}. Crowd: ${state.stats.crowd.toLocaleString()}, Joy: ${Math.round(state.stats.joy)}, Safety: ${Math.round(state.stats.safety)}, Fire Risk: ${Math.round(state.stats.fireRisk)}.`;
}

async function copyRecap(): Promise<void> {
  const text = recapText();
  if (!text) return;
  document.body.dataset.lastRecap = text;
  try {
    await navigator.clipboard?.writeText(text);
    showToast("Recap copied.");
  } catch {
    showToast("Recap ready to copy.");
  }
  const status = document.querySelector<HTMLParagraphElement>("#copy-status");
  if (status) status.textContent = text;
}

function showToast(message: string): void {
  const el = document.querySelector<HTMLDivElement>("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  window.setTimeout(() => el.classList.add("hidden"), 1500);
}

function policySummary(): string {
  return `Budget ${state.policies.budget}, fireworks ${state.policies.fireworks}, vendors ${state.policies.vendors}, parade ${state.policies.parade}.`;
}

function describeDef(def: BuildingDef): string {
  const custom: Partial<Record<BuildingId, string>> = {
    hotdog: "Cheap vendor. Adds revenue and joy, but increases trash and lines.",
    bathroom: "Reduces bathroom pressure. Boring until missing, then civilization collapses.",
    trashCan: "Keeps Liberty Park from becoming a raccoon shareholder meeting.",
    dumpster: "Heavy trash control for when bins start negotiating surrender.",
    fireMarshal: "Reduces fire risk and permit pressure. Does not enjoy your trust-me-bro fireworks plan.",
    fireCrew: "Emergency coverage for the spicy sky plan.",
    paradeStaging: "Makes the parade feel intentional instead of people walking with paperwork.",
    paradeRoute: "Guides civic pride through town and briefly annoys crowd flow.",
    launchZone: "Abstract finale zone. Builds spectacle while asking safety to do math.",
    finaleControl: "Improves finale readiness and makes the ending look planned.",
  };
  return custom[def.id] ?? `${def.pros[0]}. Tradeoff: ${def.cons[0].toLowerCase()}.`;
}

function placementRule(def: BuildingDef): string {
  if (def.requiresPath) return "Rule: needs nearby path.";
  if (def.category === "fireworks") return "Rule: keep the sky plan supported.";
  if (def.category === "parade") return "Tip: parade pieces work best near route/path tiles.";
  return "Rule: open grass tile.";
}

function categoryIcon(category: Category): string {
  const icons: Record<Category, string> = {
    paths: "PT",
    vendors: "FD",
    civic: "CV",
    services: "SV",
    parade: "PR",
    rides: "RD",
    fireworks: "FW",
    tools: "TL",
  };
  return icons[category];
}

function categoryColor(category: Category): number {
  const colors: Record<Category, number> = {
    paths: 0xf1ce8a,
    vendors: 0xffc857,
    civic: 0x8db8ff,
    services: 0x76d99a,
    parade: 0xff6b65,
    rides: 0xd88cff,
    fireworks: 0xff9b4a,
    tools: 0xb8c7d8,
  };
  return colors[category];
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tileToWorldX(x: number): number {
  return x - MAP_W / 2 + 0.5;
}

function tileToWorldZ(y: number): number {
  return y - MAP_H / 2 + 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

bootstrap();
