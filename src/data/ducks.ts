import { Duck } from "@/game/types";

export const DUCKS: Duck[] = [
  { id: "prototype", name: "Prototype", element: "Normal", rarity: "Common", base_hp: 120, base_attack: 32, base_defense: 28, base_speed: 30, base_energy: 100, ability: "Steady Quack — balanced strike", personality: "A loyal first mate who never quits.", art: "🐤", sprite: "/ducks/normal.png" },
  { id: "pirate", name: "Pirate Duck", element: "Storm", rarity: "Rare", base_hp: 105, base_attack: 45, base_defense: 20, base_speed: 36, base_energy: 100, ability: "Cannon Quack — huge hit, risky recoil", personality: "Brave, loud, and always after the next treasure.", art: "🏴‍☠️", sprite: "/ducks/pirate_duck.png" },
  { id: "queen", name: "Queen", element: "Light", rarity: "Epic", base_hp: 115, base_attack: 28, base_defense: 34, base_speed: 31, base_energy: 100, ability: "Royal Rally — buffs the flock", personality: "Graceful, generous, and absolutely in charge.", art: "👑", sprite: "/ducks/queen_duck.png" },
  { id: "elder", name: "Elder Cthulhu", element: "Shadow", rarity: "Legendary", base_hp: 160, base_attack: 30, base_defense: 45, base_speed: 18, base_energy: 100, ability: "Deep Gaze — slows the opponent", personality: "Ancient wisdom with surprisingly soft feathers.", art: "🐙", sprite: "/ducks/elder.png" },
  { id: "zorp", name: "Zorp the Alien", element: "Cosmic", rarity: "Epic", base_hp: 100, base_attack: 36, base_defense: 25, base_speed: 48, base_energy: 100, ability: "Glitch Beam — unpredictable damage", personality: "Doesn’t understand Earth rules. Wins anyway.", art: "👽", sprite: "/ducks/zorp-alien.png" },
  { id: "stone", name: "Stone Mage", element: "Earth", rarity: "Rare", base_hp: 145, base_attack: 26, base_defense: 42, base_speed: 20, base_energy: 100, ability: "Pebble Shield — blocks the next hit", personality: "Quiet, sturdy, and excellent at listening.", art: "🪨", sprite: "/ducks/stone_mage.png" },
  { id: "octoduck", name: "Octoduck", element: "Tide", rarity: "Epic", base_hp: 110, base_attack: 39, base_defense: 24, base_speed: 40, base_energy: 100, ability: "Eightfold Flap — multi-hit combo", personality: "Eight wings. Eight plans. Zero chill.", art: "🐙", sprite: "/ducks/octoduck.png" },
  { id: "war", name: "War Duck", element: "Steel", rarity: "Legendary", base_hp: 175, base_attack: 44, base_defense: 38, base_speed: 22, base_energy: 100, ability: "March On — heavy bruiser blow", personality: "Tough shell, tender heart, excellent posture.", art: "🪖", sprite: "/ducks/warluck.png" },
];

export const getDuck = (id: string) => DUCKS.find((d) => d.id === id) || DUCKS[0];
