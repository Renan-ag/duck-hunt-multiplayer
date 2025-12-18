import { gameManager } from "../gameManager";
import { k } from "../lib/kaplayCtx";

export function gameOver() {
  k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0)]);
  k.add([
    k.text("GAME OVER!", { font: "nes", size: 8 }),
    k.anchor("center"),
    k.pos(k.center()),
  ]);

  const maxIndex = gameManager.currentScore.reduce(
    (maxIdx, current, idx, arr) => (current > arr[maxIdx] ? idx : maxIdx),
    0,
  );

  k.add([
    k.text(`WINNER PLAYER ${maxIndex + 1}!`, { font: "nes", size: 8 }),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y + 40),
  ]);

  k.wait(6, () => {
    k.go("main-menu");
  });
}
