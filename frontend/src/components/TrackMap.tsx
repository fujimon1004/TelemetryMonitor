import React, { useMemo } from "react";
import type { MapPoint } from "../hooks/useTelemetryHistory";
import "./TrackMap.css";

interface TrackMapProps {
  points: MapPoint[];
}

export const TrackMap: React.FC<TrackMapProps> = ({ points }) => {
  const { minX, minZ, rangeX, rangeZ } = useMemo(() => {
    if (points.length === 0) {
      return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, rangeX: 1, rangeZ: 1 };
    }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });
    
    // Add 5% padding
    const rX = Math.max(maxX - minX, 10);
    const rZ = Math.max(maxZ - minZ, 10);
    minX -= rX * 0.05;
    maxX += rX * 0.05;
    minZ -= rZ * 0.05;
    maxZ += rZ * 0.05;

    return { 
      minX, maxX, minZ, maxZ, 
      rangeX: maxX - minX, 
      rangeZ: maxZ - minZ 
    };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="trackMapContainer empty">
        <div className="trackMapMessage">
          WAITING FOR RACE TO START...
        </div>
      </div>
    );
  }

  const svgSize = 400;
  const scale = Math.min(svgSize / rangeX, svgSize / rangeZ);

  // Center the map in the SVG
  const offsetX = (svgSize - rangeX * scale) / 2;
  const offsetZ = (svgSize - rangeZ * scale) / 2;

  const mapX = (x: number) => offsetX + (x - minX) * scale;
  const mapZ = (z: number) => svgSize - (offsetZ + (z - minZ) * scale); // Z inverted for top-down

  const lines = [];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    // Determine color based on heat (slip or heavy braking)
    // slip > 1.0 is red, > 0.5 is yellow, else normal
    let strokeColor = "rgba(255, 255, 255, 0.4)";
    let strokeWidth = 2;

    if (p2.slip >= 1.0) {
      strokeColor = "var(--color-neon-red)";
      strokeWidth = 4;
    } else if (p2.slip >= 0.5) {
      strokeColor = "var(--color-neon-orange)";
      strokeWidth = 3;
    } else if (p2.brake > 200) {
      // Heavy braking
      strokeColor = "var(--color-neon-magenta)";
      strokeWidth = 3;
    }

    lines.push(
      <line
        key={i}
        x1={mapX(p1.x)}
        y1={mapZ(p1.z)}
        x2={mapX(p2.x)}
        y2={mapZ(p2.z)}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  // Current car position (last point)
  const lastPoint = points[points.length - 1];
  const cx = mapX(lastPoint.x);
  const cz = mapZ(lastPoint.z);

  return (
    <div className="trackMapContainer">
      <div className="trackMapOverlay">
        <span>LAP {lastPoint.lap}</span>
        <div className="trackMapLegend">
          <span style={{color: "var(--color-neon-red)"}}>■ SLIP LIMIT</span>
          <span style={{color: "var(--color-neon-magenta)"}}>■ HEAVY BRAKE</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="trackMapSvg">
        {lines}
        <circle cx={cx} cy={cz} r="6" fill="var(--color-neon-cyan)" filter="drop-shadow(0 0 4px var(--color-neon-cyan))" />
      </svg>
    </div>
  );
};
