import { MAX_TILT, SENSITIVITY, WS_URL } from "./constants";
import { SocketClient } from "./socket/client";
import type { ServerMessage } from "./types/ws";
import {
  getRoomId,
  vibrate,
  applyDeadZone,
  clamp,
} from "./helpers/utils-controller";

window.onload = () => {
  const PLAYER_THEMES: Record<
    number,
    { bg: string; primary: string; text: string }
  > = {
    1: { bg: "#064e3b", primary: "#22c55e", text: "#022c22" },
    2: { bg: "#0c4a6e", primary: "#38bdf8", text: "#082f49" },
    3: { bg: "#713f12", primary: "#facc15", text: "#422006" },
    4: { bg: "#4c1d95", primary: "#a78bfa", text: "#2e1065" },
  };

  const statusElement = document.getElementById("status");
  const titleEl = document.getElementById("title");
  const startBtn = document.getElementById("start");
  const shootBtn = document.getElementById("shoot");
  const recalibrateBtn = document.getElementById("recalibrate");

  const network = new SocketClient<ServerMessage>(WS_URL);

  let playerId: number | null = null;

  let calibrated = false;
  let baseGamma = 0;
  let baseBeta = 0;

  let lastGamma = 0;
  let lastBeta = 0;

  function updateStatus(text: string) {
    if (!statusElement) return;
    statusElement.textContent = text;
  }

  function applyTheme(playerId: number) {
    const t = PLAYER_THEMES[playerId];
    if (!t) return;

    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--primary", t.primary);
    document.documentElement.style.setProperty("--primary-text", t.text);
  }

  /* NETWORK */

  const roomId = getRoomId();

  if (!roomId) {
    document.body.innerHTML = "<h1>Sala inválida</h1>";
    throw new Error("Room ID ausente");
  }

  network.onMessage(async (msg) => {
    if (msg.type === "joined-room") {
      playerId = msg.playerId;

      if (titleEl) titleEl.textContent = `Player ${playerId}`;
      updateStatus("Controle pronto");

      if (shootBtn) shootBtn.style.display = "block";
      if (recalibrateBtn) recalibrateBtn.style.display = "block";

      applyTheme(playerId);
      vibrate(100);
    }

    if (msg.type === "error") {
      updateStatus(msg.message);
      vibrate([100, 50, 100]);
    }
  });

  network.send({
    type: "join-room",
    sessionId: roomId,
  });

  /* ===============================
   PERMISSÃO + GIROSCÓPIO (iOS SAFE)
=============================== */
  function hasOrientationPermissionAPI(
    e: typeof DeviceOrientationEvent,
  ): e is typeof DeviceOrientationEvent & {
    requestPermission: () => Promise<PermissionState>;
  } {
    return typeof (e as any).requestPermission === "function";
  }

  async function requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      hasOrientationPermissionAPI(DeviceOrientationEvent)
    ) {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === "granted";
    }

    return true;
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    if (!playerId || !calibrated) return;

    lastGamma = e.gamma ?? 0;
    lastBeta = e.beta ?? 0;

    // offset absoluto em relação ao centro calibrado
    let gamma = (lastGamma - baseGamma) * SENSITIVITY;
    let beta = (lastBeta - baseBeta) * SENSITIVITY;

    gamma = applyDeadZone(gamma);
    beta = applyDeadZone(beta);

    // limites físicos confortáveis
    gamma = clamp(gamma, -MAX_TILT, MAX_TILT);
    beta = clamp(beta, -MAX_TILT, MAX_TILT);

    network.send({
      type: "input",
      payload: { gamma, beta },
    });
  }

  if (recalibrateBtn) {
    recalibrateBtn.onclick = () => {
      if (!playerId) return;

      baseGamma = lastGamma;
      baseBeta = lastBeta;
      calibrated = true;

      vibrate([50, 30, 50]);
      updateStatus("Centro calibrado");

      network.send({
        type: "input",
        payload: { recalibrate: true },
      });
    };
  }

  if (startBtn) {
    startBtn.onclick = async () => {
      const allowed = await requestPermission();
      if (!allowed) {
        updateStatus("Permissão negada");
        return;
      }

      startBtn.remove();
      updateStatus("Segure o celular reto e toque em RECALIBRAR");
      vibrate(80);

      window.addEventListener("deviceorientation", handleOrientation);
    };
  }

  if (shootBtn) {
    shootBtn.onclick = () => {
      vibrate(50);

      network.send({
        type: "input",
        payload: { shoot: true },
      });
    };
  }
};
