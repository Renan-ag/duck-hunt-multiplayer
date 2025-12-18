import kaplay from "kaplay";

export const k = kaplay({
  width: 256,
  height: 224,
  background: [24, 24, 24],
  letterbox: true,
  touchToMouse: true,
  scale: 4,
  pixelDensity: devicePixelRatio,
  debug: true,
  global: false,
});
