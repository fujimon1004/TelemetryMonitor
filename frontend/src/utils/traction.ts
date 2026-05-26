export interface TractionPosition {
  x: number;
  y: number;
  colorState: "safe" | "warning" | "danger";
}

/**
 * タイヤのスリップ比（縦）とスリップ角（横）から、摩擦円上の2D表示座標と警告状態を計算する。
 * 表示領域は 100x100 の仮想座標とし、中心は (50, 50)、摩擦限界円の半径は 40 とする。
 * SVGの座標系に合わせて、Y軸は加速（プラス）で上方向（数値減少）、制動（マイナス）で下方向（数値増加）とする。
 */
export function calculateTractionPosition(
  slipAngle: number,
  slipRatio: number,
  combinedSlip: number
): TractionPosition {
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // Forzaの標準スリップ値は 1.0 付近がグリップの限界。最大±1.0の範囲でクランプ。
  // スリップアングル（横スリップ）をX軸、スリップ比（縦スリップ）をY軸に割り当て。
  const clampedX = clamp(slipAngle, -1.0, 1.0);
  const clampedY = clamp(slipRatio, -1.0, 1.0);

  const x = 50 + clampedX * 40;
  const y = 50 - clampedY * 40; // SVGのY軸反転を考慮 (プラス値は上方向へ)

  // 警告ステータスの判定
  // スリップ角、スリップ比、または複合スリップのいずれかが限界値を超えたらdangerとする
  const maxSlipVal = Math.max(Math.abs(slipAngle), Math.abs(slipRatio), combinedSlip);

  let colorState: "safe" | "warning" | "danger" = "safe";
  if (maxSlipVal >= 1.0) {
    colorState = "danger";
  } else if (maxSlipVal >= 0.5) {
    colorState = "warning";
  }

  return { x, y, colorState };
}
