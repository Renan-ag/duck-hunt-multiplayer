import { generateQRCodeCanvas } from "./lib/qrcode";
import type { ServerMessage } from "./types/ws";
import { k } from "./lib/kaplayCtx";
import { preloadAssets } from "./preload-assets";
import { gameScene } from "./scenes/game";
import { gameOver } from "./scenes/game-over";
import { mainMenu } from "./scenes/main-menu";
import { NetworkManager } from "./socket/network-manager";
import { PLAYER_COLORS, WS_URL } from "./constants";
import type { GameObj } from "kaplay";
import { handlePlayerInput } from "./helpers/utils";
import { gameManager } from "./gameManager";

export const network = new NetworkManager<ServerMessage>(WS_URL);

type Player = {
  cursor: GameObj;
  targetX: number;
  targetY: number;
  score: number;
};

export const players = new Map<number, Player>();

network.onMessage(async (msg) => {
  if (msg.type === "room-created") {
    console.log("Room created");
    const url = `${location.origin}/controller.html?room=${msg.sessionId}`;
    console.log(url);
    const canvas = await generateQRCodeCanvas(url);

    k.loadSprite("qr", canvas);
    k.add([k.sprite("qr"), k.scale(0.1), k.pos(220, 40), k.anchor("center")]);
  }

  if (msg.type === "player-joined") {
    console.log(`Player ${msg.playerId} joined`);
    const color = PLAYER_COLORS[msg.playerId];

    const cursor = k.add([
      k.sprite("cursor"),
      k.anchor("center"),
      k.pos(65 + 13 * msg.playerId - 1, k.center().y + 12),
      k.color(color),
    ]);

    players.set(msg.playerId, {
      cursor,
      targetX: k.center().x,
      targetY: k.center().y,
      score: 0,
    });
  }

  if (msg.type === "input") {
    if (gameManager.state !== "menu")
      handlePlayerInput(msg.playerId, msg.payload);

    if (gameManager.state === "menu") {
      if (msg.payload.shoot) k.go("game");
    }
  }
});

network.send({ type: "create-room" });
preloadAssets();

k.scene("main-menu", mainMenu);
k.scene("game", gameScene);
k.scene("game-over", gameOver);

k.go("main-menu");
