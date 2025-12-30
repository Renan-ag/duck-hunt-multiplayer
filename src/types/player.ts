import type { GameObj } from "kaplay";

export type Player = {
  cursor: GameObj;
  targetX: number;
  targetY: number;
  score: number;
};
