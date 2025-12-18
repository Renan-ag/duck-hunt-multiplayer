import { COLORS, fontConfig, PLAYER_COLORS } from "../constants";
import { k } from "../lib/kaplayCtx";
import { formatScore } from "../helpers/utils";
import { players } from "../main";
import { gameManager } from "../gameManager";

export function mainMenu() {
  gameManager.state = "menu";
  k.add([k.sprite("menu")]);

  k.add([
    k.text("PLAYERS:", { font: "nes", size: 6 }),
    k.z(2),
    k.anchor("center"),
    k.pos(43, k.center().y + 12),
  ]);

  k.add([
    k.text("SHOOT TO START!", fontConfig),
    k.z(2),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y + 50),
  ]);

  k.add([
    k.text("MADE BY RENAN A. GOUVEIA", { font: "nes", size: 4.5 }),
    k.z(2),
    k.anchor("center"),
    k.pos(60, 219),
    k.color(COLORS.blue),
    k.opacity(0.8),
  ]);

  let bestScore: number[] | null = k.getData("best-score");

  if (players) {
    players.forEach((_, index) => {
      k.add([
        k.sprite("cursor"),
        k.anchor("center"),
        k.pos(65 + 13 * index, k.center().y + 12),
        k.color(k.Color.fromHex(PLAYER_COLORS[index])),
      ]);
    });
  }

  if (!bestScore) {
    bestScore = [0, 0, 0, 0];
    k.setData("best-score", bestScore);
  }
  const highScore = bestScore ? Math.max(...bestScore) : 0;

  k.add([
    k.text(`BEST SCORE:${formatScore(highScore, 3)}`, fontConfig),
    k.z(2),
    k.anchor("center"),
    k.pos(k.center().x, 184),
    k.color(COLORS.red),
  ]);
}
