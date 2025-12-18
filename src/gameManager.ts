import type { GameObj } from "kaplay";
import { k } from "./lib/kaplayCtx";

function makeGameManager() {
  return k.add([
    k.state("menu", [
      "menu",
      "cutscene",
      "round-start",
      "round-end",
      "hunt-start",
      "hunt-end",
      "duck-hunted",
      "duck-escaped",
    ]),
    {
      isGamePaused: false,
      currentScore: [0, 0, 0, 0],
      currentRoundNumber: 0,
      currentHuntNumber: 0,
      numberBulletsLeft: [3, 3, 3, 3],
      numberDucksShotInRound: 0,
      finalRound: 3,
      preySpeed: 70,
      resetGameState(this: GameObj) {
        this.isGamePaused = false;
        this.currentScore = [0, 0, 0, 0];
        this.currentRoundNumber = 0;
        this.currentHuntNumber = 0;
        this.numberBulletsLeft = [3, 3, 3, 3];
        this.numberDucksShotInRound = 0;
        this.preySpeed = 100;
      },
    },
  ]);
}

export const gameManager = makeGameManager();
