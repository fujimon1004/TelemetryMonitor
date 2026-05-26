import React, { useState, useEffect, useRef } from "react";
import "./ShiftLightBar.css";

interface ShiftLightBarProps {
  rpm: number;
  maxRpm: number;
  gear: number;
}

export const ShiftLightBar: React.FC<ShiftLightBarProps> = ({ rpm, maxRpm, gear }) => {
  const percentage = maxRpm > 0 ? Math.min(Math.max(rpm / maxRpm, 0), 1) : 0;
  
  // Define RPM ranges for colors
  const yellowThreshold = 0.75;
  const redThreshold = 0.88;

  // Track gear changes for shift flashing
  const [isShifting, setIsShifting] = useState(false);
  const prevGear = useRef(gear);

  useEffect(() => {
    // If gear changed, trigger flash
    if (gear !== prevGear.current) {
      setIsShifting(true);
      const timer = setTimeout(() => setIsShifting(false), 150);
      prevGear.current = gear;
      return () => clearTimeout(timer);
    }
  }, [gear]);

  // Create 15 LEDs
  const totalLeds = 15;
  const leds = Array.from({ length: totalLeds }).map((_, index) => {
    const ledThreshold = index / totalLeds;
    const isActive = percentage >= ledThreshold;
    
    let colorClass = "led-off";
    if (isActive) {
      if (ledThreshold >= redThreshold) colorClass = "led-red";
      else if (ledThreshold >= yellowThreshold) colorClass = "led-yellow";
      else colorClass = "led-green";
    }

    // Flash all LEDs blue on shift
    if (isShifting) {
      colorClass = "led-flash";
    }

    return (
      <div 
        key={index} 
        className={`shift-led ${colorClass}`}
      />
    );
  });

  return (
    <div className="shiftLightBarContainer">
      {leds}
    </div>
  );
};
