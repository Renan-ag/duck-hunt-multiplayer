import { DEAD_ZONE } from "../constants";

export function getRoomId() {
  return new URLSearchParams(location.search).get("room");
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function applyDeadZone(v: number) {
  return Math.abs(v) < DEAD_ZONE ? 0 : v;
}

export function vibrate(pattern: number[] | number) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
