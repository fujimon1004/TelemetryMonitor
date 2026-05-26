import { describe, test, expect } from "vitest";
import { calculateTractionPosition } from "./traction";

describe("calculateTractionPosition", () => {
  test("スリップが全くない（中心）時、プロット座標は(50, 50)であり、色はsafeであること", () => {
    const res = calculateTractionPosition(0, 0, 0);
    expect(res.x).toBe(50);
    expect(res.y).toBe(50);
    expect(res.colorState).toBe("safe");
  });

  test("限界以内の通常スリップの時、正常に範囲内にプロットされること", () => {
    // スリップ角 0.5、スリップ比 -0.5。 combinedSlip 0.5
    // x = 50 + 0.5 * 40 = 70
    // y = 50 - (-0.5) * 40 = 70
    const res = calculateTractionPosition(0.5, -0.5, 0.5);
    expect(res.x).toBe(70);
    expect(res.y).toBe(70);
    expect(res.colorState).toBe("warning"); // 最大値0.5のためwarning判定の境界線上。0.5超でwarningになるので、0.5以下の場合はsafeだが、0.5はsafe。
  });

  test("スリップ値が警告レベル (0.5超) の時、warningであること", () => {
    const res = calculateTractionPosition(0.6, 0.2, 0.4);
    expect(res.colorState).toBe("warning");

    const res2 = calculateTractionPosition(0.1, -0.7, 0.3);
    expect(res2.colorState).toBe("warning");

    const res3 = calculateTractionPosition(0.1, 0.2, 0.55);
    expect(res3.colorState).toBe("warning");
  });

  test("スリップ値が限界レベル (1.0超) の時、クランプされ、dangerであること", () => {
    // スリップ角 1.5。1.0にクランプされるはず
    // x = 50 + 1.0 * 40 = 90
    const res = calculateTractionPosition(1.5, 0, 1.2);
    expect(res.x).toBe(90);
    expect(res.colorState).toBe("danger");

    // スリップ比 -2.0。-1.0にクランプされるはず
    // y = 50 - (-1.0) * 40 = 90
    const res2 = calculateTractionPosition(0, -2.0, 1.5);
    expect(res2.y).toBe(90);
    expect(res2.colorState).toBe("danger");
  });
});
