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
  /* ===============================
     THEME
  =============================== */

  const PLAYER_THEMES: Record<
    number,
    { bg: string; primary: string; text: string }
  > = {
    1: { bg: "#064e3b", primary: "#22c55e", text: "#022c22" },
    2: { bg: "#0c4a6e", primary: "#38bdf8", text: "#082f49" },
    3: { bg: "#713f12", primary: "#facc15", text: "#422006" },
    4: { bg: "#4c1d95", primary: "#a78bfa", text: "#2e1065" },
    5: { bg: "#7c2d12", primary: "#fb923c", text: "#431407" },
  };

  const statusElement = document.getElementById("status");
  const titleEl = document.getElementById("title");
  const startBtn = document.getElementById("start");
  const shootBtn = document.getElementById("shoot");
  const recalibrateBtn = document.getElementById("recalibrate");

  const SHOOT_COOLDOWN = 500;

  let playerId: number | null = null;
  let rejoinToken: string | null = null;
  let handshakeDone = false;

  let calibrated = false;
  let canShoot = true;

  let baseGamma = 0;
  let baseBeta = 0;
  let lastGamma = 0;
  let lastBeta = 0;

  function updateStatus(text: string) {
    if (statusElement) statusElement.textContent = text;
  }

  function applyTheme(playerId: number) {
    const t = PLAYER_THEMES[playerId];
    if (!t) return;

    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--primary", t.primary);
    document.documentElement.style.setProperty("--primary-text", t.text);
  }

  /* ===============================
     iOS ORIENTATION PERMISSION
  =============================== */

  function hasOrientationPermissionAPI(
    e: typeof DeviceOrientationEvent,
  ): e is typeof DeviceOrientationEvent & {
    requestPermission: () => Promise<PermissionState>;
  } {
    return typeof (e as any).requestPermission === "function";
  }

  async function requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      hasOrientationPermissionAPI(DeviceOrientationEvent)
    ) {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === "granted";
    }
    return true; // Android / Desktop
  }

  /* ===============================
     NETWORK
  =============================== */

  const roomId = getRoomId();
  if (!roomId) {
    document.body.innerHTML = "<h1>Sala inválida</h1>";
    return;
  }

  const network = new SocketClient<ServerMessage>(WS_URL);

  /**
   * Handshake único:
   * - tenta rejoin se existir token
   * - senão faz join normal
   */
  function handshake() {
    if (handshakeDone) return;
    handshakeDone = true;

    const savedToken = localStorage.getItem("rejoinToken");

    if (savedToken) {
      updateStatus("Reconectando...");
      network.send({
        type: "rejoin-room",
        roomId,
        rejoinToken: savedToken,
      });
      return;
    }

    updateStatus("Conectando...");
    network.send({
      type: "join-room",
      roomId,
    });
  }

  // Como o SocketClient não expõe onOpen
  setTimeout(handshake, 300);

  network.onMessage((msg) => {
    if (msg.type === "joined-room") {
      playerId = msg.playerId;
      rejoinToken = msg.rejoinToken;

      localStorage.setItem("rejoinToken", rejoinToken);
      localStorage.setItem("roomId", roomId);

      if (titleEl) titleEl.textContent = `Player ${playerId}`;
      updateStatus("Controle pronto");

      shootBtn && (shootBtn.style.display = "block");
      recalibrateBtn && (recalibrateBtn.style.display = "block");

      applyTheme(playerId);
      vibrate(50);
      return;
    }

    if (msg.type === "rejoined-room") {
      playerId = msg.playerId;

      if (titleEl) titleEl.textContent = `Player ${playerId}`;
      updateStatus("Reconectado");

      shootBtn && (shootBtn.style.display = "block");
      recalibrateBtn && (recalibrateBtn.style.display = "block");

      applyTheme(playerId);
      vibrate(30);
      return;
    }

    if (msg.type === "error") {
      updateStatus(msg.message);

      // Rejoin expirou → entra novamente
      if (msg.message.toLowerCase().includes("rejoin")) {
        setTimeout(() => {
          localStorage.removeItem("rejoinToken");
          handshakeDone = false;
          handshake();
        }, 1000);
      }
    }
  });

  /* ===============================
     GYROSCOPE
  =============================== */

  function handleOrientation(e: DeviceOrientationEvent) {
    if (!playerId || !calibrated) return;

    lastGamma = e.gamma ?? 0;
    lastBeta = e.beta ?? 0;

    let gamma = (lastGamma - baseGamma) * SENSITIVITY;
    let beta = (lastBeta - baseBeta) * SENSITIVITY;

    gamma = applyDeadZone(gamma);
    beta = applyDeadZone(beta);

    gamma = clamp(gamma, -MAX_TILT, MAX_TILT);
    beta = clamp(beta, -MAX_TILT, MAX_TILT);

    network.send({
      type: "input",
      payload: { gamma, beta },
    });
  }

  /* ===============================
     UI EVENTS
  =============================== */

  startBtn?.addEventListener("click", async () => {
    const allowed = await requestOrientationPermission();

    if (!allowed) {
      updateStatus("Permissão de movimento negada");
      return;
    }

    startBtn.remove();
    updateStatus("Segure reto e toque em RE-CALIBRAR");
    vibrate(40);

    window.addEventListener("deviceorientation", handleOrientation);
  });

  recalibrateBtn?.addEventListener("click", () => {
    if (!playerId) return;

    baseGamma = lastGamma;
    baseBeta = lastBeta;
    calibrated = true;

    updateStatus("Centro calibrado");
    vibrate(30);

    network.send({
      type: "input",
      payload: { recalibrate: true },
    });
  });

  shootBtn?.addEventListener("click", () => {
    if (!playerId || !canShoot) return;

    canShoot = false;
    vibrate(30);

    network.send({
      type: "input",
      payload: { shoot: true },
    });

    setTimeout(() => {
      canShoot = true;
    }, SHOOT_COOLDOWN);
  });
};

/**
 * Limpa token se o usuário sair de vez
 */
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("rejoinToken");
});
