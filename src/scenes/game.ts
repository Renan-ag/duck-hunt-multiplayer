import type { GameObj } from "kaplay";
import { COLORS, fontConfig, PLAYER_COLORS } from "../constants";
import { makeDog } from "../entities/dog";
import { makeDuck } from "../entities/duck";
import { gameManager } from "../gameManager";
import { k } from "../lib/kaplayCtx";
import { network, players } from "../main";
import { formatScore, handlePlayerInput } from "../helpers/utils";

export function gameScene() {
  k.add([k.rect(k.width(), k.height()), k.color(COLORS.blue), "sky"]);
  k.add([k.sprite("background"), k.pos(0, -10), k.z(1)]);

  const scores: Array<GameObj> = [
    k.add([
      k.text(formatScore(0, 3), { font: "nes", size: 6 }),
      k.pos(218, 180),
      k.color(PLAYER_COLORS[1]),
      k.z(2),
    ]),
    k.add([
      k.text(formatScore(0, 3), { font: "nes", size: 6 }),
      k.pos(218, 189),
      k.color(PLAYER_COLORS[2]),
      k.z(2),
    ]),
    k.add([
      k.text(formatScore(0, 3), { font: "nes", size: 6 }),
      k.pos(218, 198),
      k.color(PLAYER_COLORS[3]),
      k.z(2),
    ]),
    k.add([
      k.text(formatScore(0, 3), { font: "nes", size: 6 }),
      k.pos(218, 207),
      k.color(PLAYER_COLORS[4]),
      k.z(2),
    ]),
  ];

  const roundCount = k.add([
    k.text("1", fontConfig),
    k.pos(k.center().x + 11, 183.5),
    k.z(2),
    k.color(COLORS.red),
  ]);

  const duckIcons = k.add([k.pos(112, 200)]);
  let duckIconPosX = 1;

  for (let i = 0; i < 10; i++) {
    duckIcons.add([
      k.rect(7, 9),
      k.pos(duckIconPosX, 0),
      k.color(255, 255, 255),
      `duckIcon-${i}`,
    ]);
    duckIconPosX += 8;
  }

  const BULLET_UI_MASK_WIDTH = [22, 15, 8, 0];
  const BULLET_UI_MASK_POS = [
    k.vec2(9, 181), // Player 4
    k.vec2(41, 181), // Player 2
    k.vec2(9, 203), // Player 1
    k.vec2(41, 203), // Player 3
  ];
  const BULLET_UI_MASK_PLAYERS = [3, 1, 0, 2]; // Player index order to manipulate bullet ui mask width

  const bulletUIMasks: Array<GameObj> = [];

  for (let i = 0; i < 4; i++) {
    bulletUIMasks.push(
      k.add([
        k.rect(0, 8),
        k.pos(BULLET_UI_MASK_POS[i]),
        k.z(2),
        k.color(COLORS.black),
      ]),
    );
  }

  const dog = makeDog(k.vec2(0, k.center().y));
  dog.searchForDucks();

  const roundStartController = gameManager.onStateEnter(
    "round-start",
    async (isFirstRound: boolean) => {
      if (!isFirstRound) gameManager.preySpeed += 50;
      k.play("ui", { volume: 0.8 });
      gameManager.currentRoundNumber++;
      roundCount.text = String(gameManager.currentRoundNumber);

      const textBox = k.add([
        k.sprite("textbox"),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - 50),
        k.z(2),
      ]);

      textBox.add([
        k.text("ROUND", fontConfig),
        k.anchor("center"),
        k.pos(0, -10),
      ]);

      textBox.add([
        k.text(String(gameManager.currentRoundNumber), fontConfig),
        k.anchor("center"),
        k.pos(0, 4),
      ]);

      await k.wait(1);
      k.destroy(textBox);
      gameManager.enterState("hunt-start");
    },
  );

  const huntStartController = gameManager.onStateEnter("hunt-start", () => {
    gameManager.currentHuntNumber++;
    const duck = makeDuck(
      String(gameManager.currentHuntNumber - 1),
      gameManager.preySpeed,
    );
    duck.setBehavior();
  });

  const huntEndController = gameManager.onStateEnter("hunt-end", () => {
    k.setData("best-score", gameManager.currentScore);

    if (gameManager.currentHuntNumber < 10) {
      gameManager.enterState("hunt-start");
      return;
    }

    gameManager.currentHuntNumber = 0;
    gameManager.enterState("round-end");
  });

  const duckHuntedController = gameManager.onStateEnter("duck-hunted", () => {
    for (let i = 0; i < gameManager.numberBulletsLeft.length; i++) {
      gameManager.numberBulletsLeft[i] = 3;
    }

    dog.catchFallenDuck();
  });

  const duckEscapedController = gameManager.onStateEnter("duck-escaped", () => {
    console.log(gameManager.numberBulletsLeft);
    for (let i = 0; i < gameManager.numberBulletsLeft.length; i++) {
      gameManager.numberBulletsLeft[i] = 3;
    }
    dog.mockPlayer();
  });

  const roundEndController = gameManager.onStateEnter("round-end", () => {
    if (gameManager.currentRoundNumber === gameManager.finalRound) {
      k.go("game-over");
      return;
    }

    gameManager.numberDucksShotInRound = 0;
    for (const duckIcon of duckIcons.children) {
      duckIcon.color = k.color(255, 255, 255);
    }

    gameManager.enterState("round-start");
  });

  players.forEach((player, index) => {
    player.cursor = k.add([
      k.sprite("cursor"),
      k.anchor("center"),
      k.pos(),
      k.area({ collisionIgnore: ["duck"] }),
      k.color(PLAYER_COLORS[index]),
      k.z(3),
      `cursor-${index}`,
    ]);
  });

  const shotAction = (playerId: number) => {
    if (
      gameManager.state !== "hunt-start" ||
      gameManager.numberBulletsLeft[playerId - 1] <= 0
    )
      return;

    k.play("gun-shot", { volume: 0.5 });
    gameManager.numberBulletsLeft[playerId - 1]--;

    const player = players.get(playerId);
    if (!player) return;

    const cursorPos = player.cursor.pos;

    const duck = k.get("duck")[0];
    if (!duck || !duck.area || duck.hasBeenShot) return;

    if (duck.hasPoint(cursorPos)) {
      duck.huntedBy = playerId;
      duck.isAlive = false;
    }
  };

  network.onMessage(async (msg) => {
    if (msg.type === "input") {
      handlePlayerInput(msg.playerId, msg.payload, shotAction);
    }
  });

  k.onUpdate(() => {
    scores.forEach((score, index) => {
      score.text = formatScore(gameManager.currentScore[index], 3);
    });
    bulletUIMasks.forEach((mask, index) => {
      mask.width =
        BULLET_UI_MASK_WIDTH[
          gameManager.numberBulletsLeft[BULLET_UI_MASK_PLAYERS[index]]
        ] ?? 22;
    });

    players.forEach((p) => {
      p.cursor.pos.x = k.lerp(p.cursor.pos.x, p.targetX, 0.15);
      p.cursor.pos.y = k.lerp(p.cursor.pos.y, p.targetY, 0.15);
    });
  });

  const forestAmbianceSound = k.play("forest-ambiance", {
    volume: 0.1,
    loop: true,
  });

  k.onSceneLeave(() => {
    forestAmbianceSound.stop();
    roundStartController.cancel();
    huntStartController.cancel();
    huntEndController.cancel();
    roundEndController.cancel();
    duckHuntedController.cancel();
    duckEscapedController.cancel();
    gameManager.resetGameState();
  });

  k.onKeyPress((key) => {
    if (key === "p") {
      k.getTreeRoot().paused = !k.getTreeRoot().paused;
      if (k.getTreeRoot().paused) {
        gameManager.isGamePaused = true;

        k.add([
          k.text("PAUSED", { font: "nes", size: 8 }),
          k.pos(5, 5),
          k.z(3),
          "paused-text",
        ]);
      } else {
        gameManager.isGamePaused = false;

        const pausedText = k.get("paused-text")[0];
        if (pausedText) k.destroy(pausedText);
      }
    }
  });
}
