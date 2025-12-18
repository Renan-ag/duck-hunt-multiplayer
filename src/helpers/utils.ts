import { k } from "../lib/kaplayCtx";
import { players } from "../main";

export function formatScore(score: number, nbDigits: number) {
  return score.toString().padStart(nbDigits, "0");
}

export function handlePlayerInput(
  playerId: number,
  payload: {
    gamma?: number;
    beta?: number;
    shoot?: boolean;
    recalibrate?: boolean;
  },
  shoot?: (playerId: number) => void,
) {
  const player = players.get(playerId);
  if (!player) return;

  // 🎯 RECALIBRAR
  if (payload.recalibrate) {
    player.targetX = k.center().x;
    player.targetY = k.center().y;
    return;
  }

  // 🎮 PONTEIRO ABSOLUTO
  if (payload.gamma !== undefined && payload.beta !== undefined) {
    player.targetX = k.map(payload.gamma, -30, 30, 0, k.width());
    player.targetY = k.map(payload.beta, -30, 30, 0, k.height());
  }

  // 🔫 TIRO
  if (payload.shoot) {
    shoot?.(playerId);
  }
}
