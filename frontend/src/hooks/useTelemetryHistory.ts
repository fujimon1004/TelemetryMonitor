import { useState, useEffect, useRef } from "react";
import type { TelemetryData } from "../App"; // Assuming we will export TelemetryData from App.tsx

export interface TracePoint {
  timeMs: number;
  accel: number;
  brake: number;
  steer: number;
}

export interface MapPoint {
  x: number;
  z: number;
  slip: number;
  brake: number;
  lap: number;
}

export function useTelemetryHistory(telemetry: TelemetryData) {
  // Trace Graph History
  const [traceHistory, setTraceHistory] = useState<TracePoint[]>([]);
  const MAX_TRACE_POINTS = 300; // Approx 5 seconds at 60fps

  // Track Map History
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const prevRaceOn = useRef<number>(0);

  useEffect(() => {
    // 1. Update Trace History
    const newPoint: TracePoint = {
      timeMs: Date.now(),
      accel: telemetry.accel,
      brake: telemetry.brake,
      steer: telemetry.steer,
    };
    
    setTraceHistory((prev) => {
      const next = [...prev, newPoint];
      if (next.length > MAX_TRACE_POINTS) {
        return next.slice(next.length - MAX_TRACE_POINTS);
      }
      return next;
    });

    // 2. Update Map Points
    const currentRaceOn = telemetry.isRaceOn;
    
    if (currentRaceOn === 1 && prevRaceOn.current === 0) {
      // Race just started, clear map
      setMapPoints([]);
    }

    if (currentRaceOn === 1) {
      // Calculate heat value based on slip and braking
      const maxSlip = Math.max(
        Math.abs(telemetry.tireCombinedSlip.frontLeft),
        Math.abs(telemetry.tireCombinedSlip.frontRight),
        Math.abs(telemetry.tireCombinedSlip.rearLeft),
        Math.abs(telemetry.tireCombinedSlip.rearRight)
      );

      const mapPoint: MapPoint = {
        x: telemetry.position.x,
        z: telemetry.position.z, // Z is forward/backward
        slip: maxSlip,
        brake: telemetry.brake,
        lap: telemetry.lapNumber,
      };

      setMapPoints((prev) => {
        // Record point every few meters or frames to prevent massive arrays
        if (prev.length === 0) return [mapPoint];
        const last = prev[prev.length - 1];
        const distSq = Math.pow(last.x - mapPoint.x, 2) + Math.pow(last.z - mapPoint.z, 2);
        // Only add point if moved more than 2 meters (distSq > 4)
        if (distSq > 4) {
          return [...prev, mapPoint];
        }
        return prev;
      });
    }

    prevRaceOn.current = currentRaceOn;

  }, [telemetry]);

  return { traceHistory, mapPoints };
}
