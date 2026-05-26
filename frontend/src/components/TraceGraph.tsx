import React from "react";
import type { TracePoint } from "../hooks/useTelemetryHistory";
import "./TraceGraph.css";

interface TraceGraphProps {
  history: TracePoint[];
}

export const TraceGraph: React.FC<TraceGraphProps> = ({ history }) => {
  if (history.length === 0) {
    return <div className="traceGraphContainer empty">WAITING FOR TELEMETRY DATA...</div>;
  }

  // Define SVG dimensions
  const width = 800; // ViewBox width
  const height = 150; // ViewBox height
  
  // Calculate X spacing
  const maxPoints = 300; // Same as hook
  const dx = width / maxPoints;

  // We want to align the points to the right (latest point at the right edge)
  // If we have fewer than maxPoints, they still shift in from the right.
  const startX = width - (history.length * dx);

  // Generate path strings for each trace
  // Accel: 0-255 -> scale to 0-height
  // Brake: 0-255 -> scale to 0-height
  // Steer: -127 to 127 -> scale to 0-height, centered at height/2

  let accelPath = "";
  let brakePath = "";
  let steerPath = "";

  history.forEach((point, i) => {
    const x = startX + i * dx;
    
    // Y coordinates (SVG 0 is top, height is bottom, so we invert)
    const accelY = height - (point.accel / 255) * height;
    const brakeY = height - (point.brake / 255) * height;
    
    // Steer is centered
    const steerNormalized = (point.steer + 127) / 254; // 0 to 1
    const steerY = height - steerNormalized * height;

    if (i === 0) {
      accelPath += `${x},${accelY} `;
      brakePath += `${x},${brakeY} `;
      steerPath += `${x},${steerY} `;
    } else {
      accelPath += `L${x},${accelY} `;
      brakePath += `L${x},${brakeY} `;
      steerPath += `L${x},${steerY} `;
    }
  });

  return (
    <div className="traceGraphContainer">
      <div className="traceGraphLabels">
        <span style={{ color: "var(--color-neon-green)" }}>THR</span>
        <span style={{ color: "var(--color-neon-red)" }}>BRK</span>
        <span style={{ color: "var(--color-neon-cyan)" }}>STR</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="traceGraphSvg">
        {/* Grid lines */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="0" x2={width} y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        
        {/* Paths */}
        <path d={`M${accelPath}`} fill="none" stroke="var(--color-neon-green)" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${brakePath}`} fill="none" stroke="var(--color-neon-red)" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${steerPath}`} fill="none" stroke="var(--color-neon-cyan)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
