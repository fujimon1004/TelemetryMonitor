import { describe, it, expect } from "vitest";
import { parseTelemetry } from "./parser.js";

describe("TelemetryParser", () => {
  it("should throw an error if the buffer is not 324 bytes", () => {
    const invalidBuffer = Buffer.alloc(323);
    expect(() => parseTelemetry(invalidBuffer)).toThrow("Invalid packet size: expected 324 bytes, got 323");
  });

  it("should parse valid telemetry data correctly", () => {
    const buffer = Buffer.alloc(324);

    // 0: isRaceOn (S32)
    buffer.writeInt32LE(1, 0);

    // 4: timestampMs (U32)
    buffer.writeUInt32LE(123456, 4);

    // 8, 12, 16: engineMaxRpm, engineIdleRpm, currentEngineRpm (F32)
    buffer.writeFloatLE(8000.0, 8);
    buffer.writeFloatLE(1000.0, 12);
    buffer.writeFloatLE(3500.0, 16);

    // 20: acceleration X, Y, Z (F32[3])
    buffer.writeFloatLE(1.1, 20);
    buffer.writeFloatLE(9.8, 24);
    buffer.writeFloatLE(-0.5, 28);

    // 212: carOrdinal (S32)
    buffer.writeInt32LE(999, 212);

    // 216: carClass (S32)
    buffer.writeInt32LE(4, 216); // A Class

    // 220: carPerformanceIndex (S32)
    buffer.writeInt32LE(800, 220);

    // 224: drivetrainType (S32)
    buffer.writeInt32LE(2, 224); // AWD

    // 228: numCylinders (S32)
    buffer.writeInt32LE(6, 228);

    // 232: carGroup (U32, FH6)
    buffer.writeUInt32LE(12, 232);

    // 236: smashableVelDiff (F32, FH6)
    buffer.writeFloatLE(0.12, 236);

    // 240: smashableMass (F32, FH6)
    buffer.writeFloatLE(150.0, 240);

    // 256: speed (F32 - m/s)
    buffer.writeFloatLE(27.7778, 256); // ~ 100 km/h

    // 260: power (F32 - Watts)
    buffer.writeFloatLE(250000.0, 260); // ~ 335 HP

    // 264: torque (F32 - Nm)
    buffer.writeFloatLE(350.0, 264);

    // 268: tireTemp FL, FR, RL, RR (F32[4])
    buffer.writeFloatLE(85.5, 268);
    buffer.writeFloatLE(86.0, 272);
    buffer.writeFloatLE(80.2, 276);
    buffer.writeFloatLE(81.1, 280);

    // 288: fuel (F32)
    buffer.writeFloatLE(0.85, 288);

    // 312: lapNumber (U16)
    buffer.writeUInt16LE(3, 312);

    // 314: racePosition (U8)
    buffer.writeUInt8(2, 314);

    // 315: accel (U8)
    buffer.writeUInt8(255, 315);

    // 316: brake (U8)
    buffer.writeUInt8(0, 316);

    // 317: clutch (U8)
    buffer.writeUInt8(0, 317);

    // 318: handBrake (U8)
    buffer.writeUInt8(0, 318);

    // 319: gear (U8)
    buffer.writeUInt8(4, 319);

    // 320: steer (S8)
    buffer.writeInt8(-50, 320);

    // 321: normalizedDrivingLine (S8)
    buffer.writeInt8(10, 321);

    // 322: normalizedAIBrakeDiff (S8)
    buffer.writeInt8(0, 322);

    const parsed = parseTelemetry(buffer);

    // Assertions
    expect(parsed.isRaceOn).toBe(1);
    expect(parsed.timestampMs).toBe(123456);
    expect(parsed.engineMaxRpm).toBeCloseTo(8000.0);
    expect(parsed.engineIdleRpm).toBeCloseTo(1000.0);
    expect(parsed.currentEngineRpm).toBeCloseTo(3500.0);
    
    expect(parsed.acceleration.x).toBeCloseTo(1.1);
    expect(parsed.acceleration.y).toBeCloseTo(9.8);
    expect(parsed.acceleration.z).toBeCloseTo(-0.5);

    expect(parsed.carOrdinal).toBe(999);
    expect(parsed.carClass).toBe(4);
    expect(parsed.carPerformanceIndex).toBe(800);
    expect(parsed.drivetrainType).toBe(2);
    expect(parsed.numCylinders).toBe(6);

    // FH6 specific fields
    expect(parsed.carGroup).toBe(12);
    expect(parsed.smashableVelDiff).toBeCloseTo(0.12);
    expect(parsed.smashableMass).toBeCloseTo(150.0);

    expect(parsed.speed).toBeCloseTo(27.7778);
    expect(parsed.speedKmh).toBeCloseTo(100.0); // 27.7778 * 3.6 = 100.00008

    expect(parsed.power).toBeCloseTo(250000.0);
    expect(parsed.torque).toBeCloseTo(350.0);

    expect(parsed.tireTemp.frontLeft).toBeCloseTo(85.5);
    expect(parsed.tireTemp.frontRight).toBeCloseTo(86.0);
    expect(parsed.tireTemp.rearLeft).toBeCloseTo(80.2);
    expect(parsed.tireTemp.rearRight).toBeCloseTo(81.1);

    expect(parsed.fuel).toBeCloseTo(0.85);
    expect(parsed.lapNumber).toBe(3);
    expect(parsed.racePosition).toBe(2);

    expect(parsed.accel).toBe(255);
    expect(parsed.brake).toBe(0);
    expect(parsed.clutch).toBe(0);
    expect(parsed.handBrake).toBe(0);
    expect(parsed.gear).toBe(4);
    expect(parsed.steer).toBe(-50);
  });
});
