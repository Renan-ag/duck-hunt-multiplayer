import QRCode from "qrcode";

export async function generateQRCodeCanvas(
  url: string,
  size = 256,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");

  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 1,
  });

  return canvas;
}
