import React from 'react';
import './AnalogMeter.css';

interface AnalogMeterProps {
  value: number;
  min?: number;
  max: number;
  startAngle?: number; // 12時方向を0度とした場合の開始角度 (-135など)
  endAngle?: number;   // 終了角度 (135など)
  label?: string;      // RPM, Speed, Boost など
  unit?: string;       // km/h, PSI など
  majorTickStep: number;
  minorTickCount?: number;
  warningValue?: number;
  dangerValue?: number;
  size?: number;
  accentColor?: string;
  valueFormatter?: (val: number) => string | number;
}

export const AnalogMeter: React.FC<AnalogMeterProps> = ({
  value,
  min = 0,
  max,
  startAngle = -135,
  endAngle = 135,
  label,
  unit,
  majorTickStep,
  minorTickCount = 4,
  warningValue,
  dangerValue,
  size = 240,
  accentColor = "var(--color-neon-cyan)",
  valueFormatter = (v) => Math.round(v)
}) => {
  // 値を min ~ max の範囲に丸める
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const clampedValue = clamp(value, min, max);

  // 値から角度への変換
  const valueToAngle = (val: number) => {
    const range = max - min;
    const angleRange = endAngle - startAngle;
    return startAngle + ((val - min) / range) * angleRange;
  };

  const currentAngle = valueToAngle(clampedValue);

  // 目盛り（Ticks）の生成
  const ticks = [];
  for (let v = min; v <= max; v += majorTickStep) {
    const angle = valueToAngle(v);

    let tickColor = "rgba(255, 255, 255, 0.7)";
    if (dangerValue && v >= dangerValue) tickColor = "var(--color-neon-red)";
    else if (warningValue && v >= warningValue) tickColor = "var(--color-neon-orange)";

    ticks.push({ value: v, angle, isMajor: true, color: tickColor });

    if (v < max) {
      const minorStep = majorTickStep / (minorTickCount + 1);
      for (let i = 1; i <= minorTickCount; i++) {
        const minorV = v + minorStep * i;
        if (minorV < max) {
          const minorAngle = valueToAngle(minorV);
          let minorColor = "rgba(255, 255, 255, 0.3)";
          if (dangerValue && minorV >= dangerValue) minorColor = "rgba(255, 51, 51, 0.5)"; // 薄い赤
          else if (warningValue && minorV >= warningValue) minorColor = "rgba(255, 159, 0, 0.5)"; // 薄いオレンジ
          ticks.push({ value: minorV, angle: minorAngle, isMajor: false, color: minorColor });
        }
      }
    }
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;
  const textRadius = size * 0.30;

  return (
    <div className="analogMeterContainer" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景のリング */}
        <circle 
          cx={cx} cy={cy} r={radius} 
          fill="rgba(0,0,0,0.4)" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="2" 
        />

        {/* Ticks 描画 */}
        {ticks.map((tick, i) => {
          const rad = (tick.angle - 90) * (Math.PI / 180); // 0度を12時方向に補正
          const outerR = radius;
          const innerR = tick.isMajor ? radius - (size * 0.04) : radius - (size * 0.02);
          const x1 = cx + outerR * Math.cos(rad);
          const y1 = cy + outerR * Math.sin(rad);
          const x2 = cx + innerR * Math.cos(rad);
          const y2 = cy + innerR * Math.sin(rad);

          return (
            <g key={i}>
              <line 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke={tick.color} 
                strokeWidth={tick.isMajor ? 2.5 : 1} 
              />
              {tick.isMajor && (
                <text
                  x={cx + textRadius * Math.cos(rad)}
                  y={cy + textRadius * Math.sin(rad)}
                  fill={tick.color}
                  fontSize={size * 0.05}
                  fontFamily="var(--font-display)"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {valueFormatter ? valueFormatter(tick.value) : tick.value}
                </text>
              )}
            </g>
          );
        })}

        {/* 針 (Needle) */}
        <g transform={`rotate(${currentAngle}, ${cx}, ${cy})`}>
          <polygon
            points={`${cx - size * 0.012},${cy} ${cx + size * 0.012},${cy} ${cx},${cy - radius + size * 0.02}`}
            fill={accentColor}
            style={{ filter: `drop-shadow(0 0 6px ${accentColor})`, transition: 'all 0.08s ease-out' }}
          />
          <circle cx={cx} cy={cy} r={size * 0.03} fill="#111" stroke={accentColor} strokeWidth="1.5" />
        </g>

        {/* 針のキャップの中心 */}
        <circle cx={cx} cy={cy} r={size * 0.01} fill={accentColor} />

        {/* デジタル値とラベル表示 */}
        <text 
          x={cx} y={cy + size * 0.18} 
          fill="#fff" 
          fontSize={size * 0.12} 
          fontFamily="var(--font-display)" 
          fontWeight="900" 
          textAnchor="middle"
        >
          {Math.round(clampedValue)}
        </text>
        
        {unit && (
          <text 
            x={cx} y={cy + size * 0.28} 
            fill="var(--color-text-muted)" 
            fontSize={size * 0.045} 
            fontFamily="var(--font-display)" 
            fontWeight="700" 
            textAnchor="middle"
          >
            {unit}
          </text>
        )}
        
        {label && (
          <text 
            x={cx} y={cy + size * 0.4} 
            fill="rgba(255,255,255,0.4)" 
            fontSize={size * 0.05} 
            fontFamily="var(--font-display)" 
            fontWeight="900" 
            textAnchor="middle" 
            letterSpacing="2"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};
