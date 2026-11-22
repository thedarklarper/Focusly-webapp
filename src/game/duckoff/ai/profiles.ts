import { Difficulty } from "../types";

/**
 * Difficulty is a data table, not three separate AIs. Every profile drives the
 * same utility brain through a virtual controller, so the opponent physically
 * cannot cheat — it only reacts faster, spaces better and errs less.
 */
export type AIProfile = {
  /** Frames between decisions. Higher = slower to react. */
  reactFrames: number;
  /** Chance to hold guard when the player's swing is coming. */
  blockChance: number;
  /** Chance to punish a whiffed / recovering move with a counter-swing. */
  whiffPunish: number;
  /** Distance the AI tries to hold when neutral. */
  preferRange: number;
  /** How often it walks in versus waits. */
  aggression: number;
  /** Whether it will spend meter on the special. */
  meterUse: boolean;
  /** Chance per decision of a deliberately suboptimal action. */
  inputNoise: number;
  /** Whether it backs off after a successful guard. */
  retreatAfterBlock: boolean;
};

export const AI_PROFILES: Record<Difficulty, AIProfile> = {
  easy: {
    reactFrames: 26,
    blockChance: 0.15,
    whiffPunish: 0.1,
    preferRange: 150,
    aggression: 0.35,
    meterUse: false,
    inputNoise: 0.35,
    retreatAfterBlock: false,
  },
  medium: {
    reactFrames: 14,
    blockChance: 0.45,
    whiffPunish: 0.35,
    preferRange: 130,
    aggression: 0.55,
    meterUse: true,
    inputNoise: 0.12,
    retreatAfterBlock: true,
  },
  hard: {
    reactFrames: 6,
    blockChance: 0.8,
    whiffPunish: 0.75,
    preferRange: 118,
    aggression: 0.75,
    meterUse: true,
    inputNoise: 0,
    retreatAfterBlock: true,
  },
};
