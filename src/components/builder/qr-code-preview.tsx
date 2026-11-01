import QRCode from "qrcode";
import type { PixelRect } from "@/lib/builder/layout-geometry";

interface QrCodePreviewProps {
  text: string;
  rect: PixelRect;
}

function buildModulesPath(text: string): { path: string; moduleCount: number } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const commands: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        commands.push(`M${col} ${row}h1v1h-1z`);
      }
    }
  }
  return { path: commands.join(""), moduleCount: modules.size };
}

export function QrCodePreview({ text, rect }: QrCodePreviewProps) {
  const { path, moduleCount } = buildModulesPath(text);
  const side = Math.min(rect.width, rect.height);
  const left = rect.left + (rect.width - side) / 2;
  const top = rect.top + (rect.height - side) / 2;
  const scale = side / moduleCount;
  return (
    <g pointerEvents="none">
      <rect x={left} y={top} width={side} height={side} fill="#ffffff" />
      <path
        d={path}
        fill="#000000"
        transform={`translate(${left} ${top}) scale(${scale})`}
        shapeRendering="crispEdges"
      />
    </g>
  );
}
