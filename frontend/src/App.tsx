import { useEffect, useState, useRef } from "react";
import { 
  Activity, 
  Flame, 
  Compass, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp, 
  Layers
} from "lucide-react";
import "./App.css";
import { AnalogMeter } from "./components/AnalogMeter";
import { calculateTractionPosition } from "./utils/traction";

// テレメトリデータのインターフェース定義
export interface TelemetryData {
  isRaceOn: number;
  timestampMs: number;
  engineMaxRpm: number;
  engineIdleRpm: number;
  currentEngineRpm: number;
  acceleration: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  yawPitchRoll: { yaw: number; pitch: number; roll: number };
  normSuspensionTravel: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  tireSlipRatio: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  wheelRotationSpeed: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  wheelOnRumbleStrip: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  wheelInPuddle: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  surfaceRumble: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  tireSlipAngle: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  tireCombinedSlip: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  suspensionTravelMeters: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  carOrdinal: number;
  carClass: number;
  carPerformanceIndex: number;
  drivetrainType: number;
  numCylinders: number;
  carGroup: number;
  smashableVelDiff: number;
  smashableMass: number;
  position: { x: number; y: number; z: number };
  speed: number;
  speedKmh: number;
  power: number;
  torque: number;
  tireTemp: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  boost: number;
  fuel: number;
  distanceTraveled: number;
  bestLap: number;
  lastLap: number;
  currentLap: number;
  currentRaceTime: number;
  lapNumber: number;
  racePosition: number;
  accel: number;
  brake: number;
  clutch: number;
  handBrake: number;
  gear: number;
  steer: number;
  normalizedDrivingLine: number;
  normalizedAIBrakeDiff: number;
}

// 初期モックデータ（未接続時のプレースホルダー）
const initialTelemetry: TelemetryData = {
  isRaceOn: 0,
  timestampMs: 0,
  engineMaxRpm: 8000,
  engineIdleRpm: 1000,
  currentEngineRpm: 0,
  acceleration: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
  yawPitchRoll: { yaw: 0, pitch: 0, roll: 0 },
  normSuspensionTravel: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  tireSlipRatio: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  wheelRotationSpeed: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  wheelOnRumbleStrip: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  wheelInPuddle: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  surfaceRumble: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  tireSlipAngle: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  tireCombinedSlip: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  suspensionTravelMeters: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  carOrdinal: 0,
  carClass: 0,
  carPerformanceIndex: 0,
  drivetrainType: 0,
  numCylinders: 0,
  carGroup: 0,
  smashableVelDiff: 0,
  smashableMass: 0,
  position: { x: 0, y: 0, z: 0 },
  speed: 0,
  speedKmh: 0,
  power: 0,
  torque: 0,
  tireTemp: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  boost: 0,
  fuel: 0,
  distanceTraveled: 0,
  bestLap: 0,
  lastLap: 0,
  currentLap: 0,
  currentRaceTime: 0,
  lapNumber: 0,
  racePosition: 0,
  accel: 0,
  brake: 0,
  clutch: 0,
  handBrake: 0,
  gear: 0,
  steer: 0,
  normalizedDrivingLine: 0,
  normalizedAIBrakeDiff: 0,
};

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00.000";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}

import { ShiftLightBar } from "./components/ShiftLightBar";
import { TraceGraph } from "./components/TraceGraph";
import { TrackMap } from "./components/TrackMap";
import { useTelemetryHistory } from "./hooks/useTelemetryHistory";

export type DashboardMode = "SETUP" | "QUALIFY" | "RACE";

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalogMode, setIsAnalogMode] = useState(true);
  const [activeMode, setActiveMode] = useState<DashboardMode>("SETUP");
  const wsRef = useRef<WebSocket | null>(null);

  const { traceHistory, mapPoints } = useTelemetryHistory(telemetry);

  // WebSocket 接続・自動再接続
  useEffect(() => {
    function connect() {
      const wsUrl = "ws://localhost:8080";
      console.log(`Connecting to WebSocket: ${wsUrl}...`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected.");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (e) {
          console.error("Failed to parse telemetry message", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Retrying in 2 seconds...");
        setIsConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // ギアの表記変換
  const getGearLabel = (gearNum: number): string => {
    if (gearNum === 0) return "R";
    if (gearNum === 10 || gearNum === 11) return "N";
    return gearNum.toString(); // 1=1速、2=2速...
  };

  // クラス名の表記変換
  const getCarClassLabel = (classNum: number): { label: string; className: string } => {
    switch (classNum) {
      case 0: return { label: "D", className: "badge-d" };
      case 1: return { label: "C", className: "badge-c" };
      case 2: return { label: "B", className: "badge-b" };
      case 3: return { label: "A", className: "badge-a" };
      case 4: return { label: "S1", className: "badge-s1" };
      case 5: return { label: "S2", className: "badge-s2" };
      case 6: return { label: "X", className: "badge-x" };
      default: return { label: "--", className: "badge-default" };
    }
  };

  // 駆動方式
  const getDrivetrainLabel = (typeNum: number): string => {
    switch (typeNum) {
      case 0: return "FWD";
      case 1: return "RWD";
      case 2: return "AWD";
      default: return "---";
    }
  };

  // タイヤ温度ヒートマップ色
  const getTireTempColor = (temp: number): string => {
    if (temp <= 0) return "rgba(255, 255, 255, 0.05)"; // データ無し時
    if (temp < 60) return "#0066ff"; // 冷えている（青）
    if (temp < 80) return "#00e5ff"; // 適温手前（シアン）
    if (temp < 98) return "#39ff14"; // 適温（グリーン）
    if (temp < 110) return "#ff9f00"; // やや過熱（オレンジ）
    return "#ff3333"; // オーバーヒート（赤）
  };

  // タイヤコンディション用クラス
  const getTireClasses = (position: 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight'): string => {
    let classes = "tireVisual";
    if (telemetry.wheelInPuddle[position] > 0) classes += " puddle";
    if (telemetry.wheelOnRumbleStrip[position] > 0) classes += " rumble";
    
    const slipRatio = Math.abs(telemetry.tireSlipRatio[position] || 0);
    const slipAngle = Math.abs(telemetry.tireSlipAngle[position] || 0);
    if (slipRatio > 1.0 || slipAngle > 1.0) classes += " severe-slip";
    else if (slipRatio > 0.5 || slipAngle > 0.5) classes += " slip";
    
    return classes;
  };

  // タコメーター円弧の長さ計算
  // 半径160の円弧 (270度分)。円周 2 * PI * 160 = 1005.3。270度 = 753.98。
  const r = 160;
  const strokeLength = 2 * Math.PI * r;
  const arcLength = strokeLength * 0.75; // 270度分 = 753.98
  
  const rpmPercent = telemetry.currentEngineRpm / (telemetry.engineMaxRpm || 8000);
  const safeRpmPercent = Math.min(Math.max(rpmPercent, 0), 1);
  const strokeDashoffset = arcLength - safeRpmPercent * arcLength;

  // タコメーター警告クラスの判定
  const isShiftWarning = telemetry.currentEngineRpm > telemetry.engineMaxRpm * 0.85;
  const isRevLimit = telemetry.currentEngineRpm > telemetry.engineMaxRpm * 0.95;

  let tachometerClass = "normal";
  if (isRevLimit) {
    tachometerClass = "danger";
  } else if (isShiftWarning) {
    tachometerClass = "warning";
  }

  // Gフォースのプロット位置算出 (±1.5Gレンジ)
  // X = 左右G (accel.x), Z = 前後G (accel.z)。
  // 1G = 9.80665 m/s^2。
  const maxG = 1.5;
  const gForceX = telemetry.acceleration.x / 9.80665;
  const gForceZ = telemetry.acceleration.z / 9.80665;

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const dotLeft = 50 + clamp(gForceX / maxG, -1, 1) * 50;
  // 前方への加速時、Z値はマイナスになることが多いため反転させて画面の上方向にプロット
  const dotTop = 50 + clamp(-gForceZ / maxG, -1, 1) * 50;

  // 出力の馬力換算 (Watts -> HP)
  const horsepower = Math.round(telemetry.power / 745.7);

  // 各輪のトラクション（スリップ）データを計算
  const flTraction = calculateTractionPosition(
    telemetry.tireSlipAngle.frontLeft,
    telemetry.tireSlipRatio.frontLeft,
    telemetry.tireCombinedSlip.frontLeft
  );
  const frTraction = calculateTractionPosition(
    telemetry.tireSlipAngle.frontRight,
    telemetry.tireSlipRatio.frontRight,
    telemetry.tireCombinedSlip.frontRight
  );
  const rlTraction = calculateTractionPosition(
    telemetry.tireSlipAngle.rearLeft,
    telemetry.tireSlipRatio.rearLeft,
    telemetry.tireCombinedSlip.rearLeft
  );
  const rrTraction = calculateTractionPosition(
    telemetry.tireSlipAngle.rearRight,
    telemetry.tireSlipRatio.rearRight,
    telemetry.tireCombinedSlip.rearRight
  );

  return (
    <div className="dashboardContainer">
      {/* 1. Header Panel */}
      <header className="panel headerPanel">
        <div className="titleSection" style={{ flex: 1 }}>
          <h1>FORZA HORIZON 6</h1>
          <div className="statusIndicator">
            <span className={`statusDot ${isConnected ? "connected" : "disconnected"}`} />
            {isConnected ? (
              <span style={{ color: "var(--color-neon-green)" }}>
                <Wifi size={14} style={{ display: "inline", marginRight: "4px" }} />
                TELEMETRY CONNECTED (30000)
              </span>
            ) : (
              <span style={{ color: "var(--color-neon-red)" }}>
                <WifiOff size={14} style={{ display: "inline", marginRight: "4px" }} />
                NO LINK - WAITING FOR GAME...
              </span>
            )}
          </div>
        </div>

        <div className="modeTabsContainer" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div className="modeTabs" style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "4px" }}>
            {(["QUALIFY", "RACE", "SETUP"] as DashboardMode[]).map(mode => (
              <button 
                key={mode}
                onClick={() => setActiveMode(mode)}
                style={{
                  background: activeMode === mode ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "none",
                  color: activeMode === mode ? "var(--color-neon-cyan)" : "var(--color-text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "12px",
                  padding: "6px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeMode === mode ? "0 0 10px rgba(0, 229, 255, 0.2)" : "none"
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="viewToggle" style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", color: isAnalogMode ? "var(--color-text-muted)" : "var(--color-neon-cyan)" }}>DIGITAL</span>
          <button 
            onClick={() => setIsAnalogMode(!isAnalogMode)}
            style={{
              width: "40px", height: "20px", borderRadius: "10px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)", position: "relative", cursor: "pointer", padding: 0
            }}
          >
            <div style={{
              position: "absolute", top: "2px", left: isAnalogMode ? "20px" : "2px",
              width: "14px", height: "14px", borderRadius: "50%", background: "var(--color-neon-cyan)",
              transition: "left 0.2s ease"
            }} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", color: isAnalogMode ? "var(--color-neon-cyan)" : "var(--color-text-muted)" }}>ANALOG</span>
        </div>

        {isConnected && (
          <div className="carMetaInfo">
            <div className="metaItem">
              <span className="metaLabel">Car ID</span>
              <span className="metaValue">#{telemetry.carOrdinal}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">Class & PI</span>
              <span style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                <span className={`classBadge ${getCarClassLabel(telemetry.carClass).className}`}>
                  {getCarClassLabel(telemetry.carClass).label}
                </span>
                <span className="metaValue">{telemetry.carPerformanceIndex}</span>
              </span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">Drivetrain</span>
              <span className="metaValue">{getDrivetrainLabel(telemetry.drivetrainType)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">Cylinders</span>
              <span className="metaValue">{telemetry.numCylinders} CYL</span>
            </div>
          </div>
        )}
      </header>

      {/* 2. Main Grid */}
      {activeMode === "SETUP" && (
        <>
          <main className="dashboardGrid">
        {/* Left Section - Inputs & Laps */}
        <section className="leftPanel">
          {/* Race Laps / Times */}
          <div className="panel raceStatsPanel">
            <h2 className="metaLabel" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
              <Clock size={14} /> RACE TIMING
            </h2>
            <div className="statRow">
              <span className="statLabel">LAP</span>
              <span className="statValue" style={{ color: "var(--color-neon-cyan)" }}>
                {telemetry.lapNumber || 1}
              </span>
            </div>
            <div className="statRow">
              <span className="statLabel">POSITION</span>
              <span className="statValue">
                {telemetry.racePosition || "--"}
              </span>
            </div>
            <div className="statRow">
              <span className="statLabel">CURRENT</span>
              <span className="statValue">{formatTime(telemetry.currentLap)}</span>
            </div>
            <div className="statRow">
              <span className="statLabel">LAST LAP</span>
              <span className="statValue">{formatTime(telemetry.lastLap)}</span>
            </div>
            <div className="statRow">
              <span className="statLabel">BEST LAP</span>
              <span className="statValue" style={{ color: "var(--color-neon-green)" }}>
                {formatTime(telemetry.bestLap)}
              </span>
            </div>
            <div className="statRow">
              <span className="statLabel">TOTAL TIME</span>
              <span className="statValue">{formatTime(telemetry.currentRaceTime)}</span>
            </div>
          </div>

          {/* Pedal Inputs */}
          <div className="panel pedalInputPanel">
            <h2 className="metaLabel" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
              <Layers size={14} /> PEDAL INPUTS
            </h2>
            <div className="pedalBarsContainer">
              {/* Accel */}
              <div className="pedalBarWrapper">
                <div className="pedalTrack">
                  <div 
                    className="pedalFill accel" 
                    style={{ height: `${(telemetry.accel / 255) * 100}%` }} 
                  />
                </div>
                <span className="pedalLabel">THR</span>
                <span className="pedalValue">{Math.round((telemetry.accel / 255) * 100)}%</span>
              </div>

              {/* Brake */}
              <div className="pedalBarWrapper">
                <div className="pedalTrack">
                  <div 
                    className="pedalFill brake" 
                    style={{ height: `${(telemetry.brake / 255) * 100}%` }} 
                  />
                </div>
                <span className="pedalLabel">BRK</span>
                <span className="pedalValue">{Math.round((telemetry.brake / 255) * 100)}%</span>
              </div>

              {/* Clutch */}
              <div className="pedalBarWrapper">
                <div className="pedalTrack">
                  <div 
                    className="pedalFill clutch" 
                    style={{ height: `${(telemetry.clutch / 255) * 100}%` }} 
                  />
                </div>
                <span className="pedalLabel">CLT</span>
                <span className="pedalValue">{Math.round((telemetry.clutch / 255) * 100)}%</span>
              </div>

              {/* Handbrake */}
              <div className="pedalBarWrapper">
                <div className="pedalTrack">
                  <div 
                    className="pedalFill handBrake" 
                    style={{ height: `${(telemetry.handBrake / 255) * 100}%` }} 
                  />
                </div>
                <span className="pedalLabel">HBR</span>
                <span className="pedalValue">{Math.round((telemetry.handBrake / 255) * 100)}%</span>
              </div>
            </div>

            {/* Steering */}
            <div className="steeringContainer">
              <div className="steeringHeader">
                <span className="steeringLabel">STEER</span>
                <span className="steeringValue">{Math.round((telemetry.steer / 127) * 100)}%</span>
              </div>
              <div className="steeringTrack">
                <div 
                  className="steeringFill" 
                  style={{ 
                    left: telemetry.steer < 0 ? `${50 + (telemetry.steer / 127) * 50}%` : "50%",
                    width: `${Math.abs(telemetry.steer / 127) * 50}%`,
                    backgroundColor: "var(--color-neon-cyan)"
                  }} 
                />
                <div className="steeringCenterMark" />
              </div>
            </div>
          </div>
        </section>

        {/* Center Section - Gauges */}
        <section className="panel centerPanel">
          <div style={{ width: "240px", height: "16px", margin: "0 auto", marginBottom: "16px" }}>
            <ShiftLightBar rpm={telemetry.currentEngineRpm} maxRpm={telemetry.engineMaxRpm || 8000} gear={telemetry.gear} />
          </div>
          {isAnalogMode ? (
            <div className="analogMetersWrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2%", width: "100%", flexGrow: 1 }}>
              <div style={{ flex: 1 }}>
                <AnalogMeter 
                  value={telemetry.speedKmh} 
                  min={0} max={400} 
                  label="SPEED" unit="km/h" 
                  majorTickStep={50} minorTickCount={4} 
                  size={180} 
                  accentColor="var(--color-neon-cyan)"
                />
              </div>
              <div style={{ flex: 1.5 }}>
                <AnalogMeter 
                  value={telemetry.currentEngineRpm} 
                  min={0} max={Math.max(telemetry.engineMaxRpm, 8000)} 
                  label="RPM" unit={`GEAR: ${getGearLabel(telemetry.gear)}`} 
                  majorTickStep={1000} minorTickCount={1} 
                  warningValue={telemetry.engineMaxRpm * 0.85}
                  dangerValue={telemetry.engineMaxRpm * 0.95}
                  size={260} 
                  accentColor="var(--color-neon-magenta)"
                  valueFormatter={(v) => v / 1000}
                />
              </div>
              <div style={{ flex: 1 }}>
                <AnalogMeter 
                  value={telemetry.boost} 
                  min={-15} max={30} 
                  label="BOOST" unit="PSI" 
                  majorTickStep={10} minorTickCount={1} 
                  warningValue={20}
                  size={180} 
                  accentColor="var(--color-neon-orange)"
                />
              </div>
            </div>
          ) : (
            <div className="gaugeContainer">
              <svg viewBox="0 0 360 360" className="gaugeSvg">
                {/* Define Neon Gradients */}
                <defs>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0066ff" />
                    <stop offset="100%" stopColor="#00e5ff" />
                  </linearGradient>
                </defs>

                {/* Backing Arc (270 degrees) */}
                <circle
                  cx="180"
                  cy="180"
                  r={r}
                  className="gaugeTrack"
                  strokeDasharray={`${arcLength} ${strokeLength}`}
                  transform="rotate(135 180 180)" /* Center the 270 degree arc pointing up */
                />

                {/* Active Fill Arc */}
                <circle
                  cx="180"
                  cy="180"
                  r={r}
                  className={`gaugeFill ${tachometerClass}`}
                  strokeDasharray={`${arcLength} ${strokeLength}`}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(135 180 180)"
                />
              </svg>

              {/* Inner Dashboard Displays */}
              <div className="gaugeCenterText">
                <div className={`gearDisplay ${isRevLimit ? "revLimit" : isShiftWarning ? "shiftUp" : ""}`}>
                  {getGearLabel(telemetry.gear)}
                </div>
                <div className="speedDisplay">
                  {Math.round(telemetry.speedKmh)}
                </div>
                <div className="speedUnit">km/h</div>
                <div className="rpmText">
                  RPM <span className="rpmValue">{Math.round(telemetry.currentEngineRpm)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Engine & Stats Grid */}
          <div className="centerStatsBottom">
            <div className="centerStatBox">
              <span className="centerStatLabel" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Flame size={12} color="var(--color-neon-magenta)" /> POWER
              </span>
              <span className="centerStatVal" style={{ color: "var(--color-neon-magenta)" }}>
                {horsepower} <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>HP</span>
              </span>
            </div>

            <div className="centerStatBox">
              <span className="centerStatLabel" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Compass size={12} color="var(--color-neon-cyan)" /> TORQUE
              </span>
              <span className="centerStatVal">
                {Math.round(telemetry.torque)} <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Nm</span>
              </span>
            </div>

            <div className="centerStatBox">
              <span className="centerStatLabel" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Activity size={12} color="var(--color-neon-orange)" /> BOOST
              </span>
              <span className="centerStatVal" style={{ color: "var(--color-neon-orange)" }}>
                {telemetry.boost.toFixed(1)} <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>PSI</span>
              </span>
            </div>
          </div>
        </section>

        <section className="rightPanel">
          {/* G-Force Card */}
          <div className="panel">
            <h2 className="metaLabel" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
              <TrendingUp size={14} /> G-FORCE & ATTITUDE
            </h2>
            <div className="gforceContainer">
              <div className="gforceGrid">
                <div className="gforceAxisCrossX" />
                <div className="gforceAxisCrossY" />
                
                {/* Dot movement */}
                <div 
                  className="gforceDot" 
                  style={{
                    left: `${dotLeft}%`,
                    top: `${dotTop}%`
                  }}
                />

                {/* Grid markings */}
                <span className="gforceLabels gLabelTop">1.5G</span>
                <span className="gforceLabels gLabelBottom">1.5G</span>
                <span className="gforceLabels gLabelLeft">1.5G</span>
                <span className="gforceLabels gLabelRight">1.5G</span>
              </div>
              <div className="gValueOverlay">
                <span>LAT: <strong style={{ color: "var(--color-neon-cyan)" }}>{gForceX.toFixed(2)}G</strong></span>
                <br />
                <span>LNG: <strong style={{ color: "var(--color-neon-orange)" }}>{gForceZ.toFixed(2)}G</strong></span>
              </div>
            </div>

            {/* Attitude Indicator (Pitch/Roll) */}
            <div className="attitudeContainer" style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>PITCH / ROLL</span>
                <span>YAW: {Math.round(telemetry.yawPitchRoll.yaw * (180 / Math.PI))}°</span>
              </h3>
              <div className="attitudeHorizon" style={{ 
                height: "60px", 
                borderRadius: "4px", 
                overflow: "hidden", 
                position: "relative",
                background: "linear-gradient(to bottom, #1e88e5 50%, #8d6e63 50%)",
                transform: `rotate(${telemetry.yawPitchRoll.roll * (180 / Math.PI)}deg)`
              }}>
                <div style={{
                  position: "absolute",
                  left: 0, right: 0,
                  top: `calc(50% + ${telemetry.yawPitchRoll.pitch * (180 / Math.PI) * 2}px)`,
                  height: "2px",
                  background: "#fff",
                  boxShadow: "0 0 5px rgba(0,0,0,0.5)"
                }} />
                {/* Center crosshair */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "20px", height: "20px", border: "2px solid #ffeb3b", borderRadius: "50%", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40px", height: "2px", background: "#ffeb3b", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Tire Thermal Diagram & Suspension Travel */}
          <div className="panel" style={{ flexGrow: 1 }}>
            <h2 className="metaLabel" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
              <Flame size={14} /> TYRE STATUS & SUSPENSION
            </h2>
            
            <div className="carLayoutContainer">
              <div className="carGrid">
                {/* Front Left */}
                <div className="tireBox">
                  <div className="tireGraphics">
                    <div className="tireAndSuspension">
                      <div className="suspensionBarContainer">
                        <div 
                          className="suspensionFill"
                          style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.frontLeft * 100, 0), 100)}%` }}
                        />
                      </div>
                      <div 
                        className={getTireClasses('frontLeft')} 
                        style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.frontLeft) }} 
                      />
                      <div className="rumbleBarContainer">
                        <div className="rumbleFill" style={{ height: `${Math.min(telemetry.surfaceRumble.frontLeft * 50, 100)}%` }} />
                      </div>
                    </div>
                    {/* 摩擦円 (トラクションサークル) */}
                    <div className="tractionCircleContainer">
                      <svg viewBox="0 0 100 100" className="tractionCircleSvg">
                        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={flTraction.x} cy={flTraction.y} r="6" className={`tractionDot ${flTraction.colorState}`} />
                      </svg>
                    </div>
                  </div>
                  <div className="tireStats">
                    <span className="tireTempVal">{Math.round(telemetry.tireTemp.frontLeft)}°C</span>
                    <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.frontLeft * 100)}%</span>
                    <span className="suspTravelVal" style={{ fontSize: "9px" }}>WHL {Math.round(Math.abs(telemetry.wheelRotationSpeed.frontLeft * 9.5493))}RPM</span>
                  </div>
                </div>

                {/* Chassis center */}
                <div className="carChassisIllustration" />

                {/* Front Right */}
                <div className="tireBox" style={{ flexDirection: "row-reverse" }}>
                  <div className="tireGraphics">
                    <div className="tireAndSuspension">
                      <div className="rumbleBarContainer">
                        <div className="rumbleFill" style={{ height: `${Math.min(telemetry.surfaceRumble.frontRight * 50, 100)}%` }} />
                      </div>
                      <div 
                        className={getTireClasses('frontRight')} 
                        style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.frontRight) }} 
                      />
                      <div className="suspensionBarContainer">
                        <div 
                          className="suspensionFill"
                          style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.frontRight * 100, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* 摩擦円 (トラクションサークル) */}
                    <div className="tractionCircleContainer">
                      <svg viewBox="0 0 100 100" className="tractionCircleSvg">
                        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={frTraction.x} cy={frTraction.y} r="6" className={`tractionDot ${frTraction.colorState}`} />
                      </svg>
                    </div>
                  </div>
                  <div className="tireStats" style={{ alignItems: "flex-end" }}>
                    <span className="tireTempVal">{Math.round(telemetry.tireTemp.frontRight)}°C</span>
                    <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.frontRight * 100)}%</span>
                    <span className="suspTravelVal" style={{ fontSize: "9px" }}>WHL {Math.round(Math.abs(telemetry.wheelRotationSpeed.frontRight * 9.5493))}RPM</span>
                  </div>
                </div>

                {/* Rear Left */}
                <div className="tireBox">
                  <div className="tireGraphics">
                    <div className="tireAndSuspension">
                      <div className="suspensionBarContainer">
                        <div 
                          className="suspensionFill"
                          style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.rearLeft * 100, 0), 100)}%` }}
                        />
                      </div>
                      <div 
                        className={getTireClasses('rearLeft')} 
                        style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.rearLeft) }} 
                      />
                      <div className="rumbleBarContainer">
                        <div className="rumbleFill" style={{ height: `${Math.min(telemetry.surfaceRumble.rearLeft * 50, 100)}%` }} />
                      </div>
                    </div>
                    {/* 摩擦円 (トラクションサークル) */}
                    <div className="tractionCircleContainer">
                      <svg viewBox="0 0 100 100" className="tractionCircleSvg">
                        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={rlTraction.x} cy={rlTraction.y} r="6" className={`tractionDot ${rlTraction.colorState}`} />
                      </svg>
                    </div>
                  </div>
                  <div className="tireStats">
                    <span className="tireTempVal">{Math.round(telemetry.tireTemp.rearLeft)}°C</span>
                    <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.rearLeft * 100)}%</span>
                    <span className="suspTravelVal" style={{ fontSize: "9px" }}>WHL {Math.round(Math.abs(telemetry.wheelRotationSpeed.rearLeft * 9.5493))}RPM</span>
                  </div>
                </div>

                {/* Rear Right */}
                <div className="tireBox" style={{ flexDirection: "row-reverse" }}>
                  <div className="tireGraphics">
                    <div className="tireAndSuspension">
                      <div className="rumbleBarContainer">
                        <div className="rumbleFill" style={{ height: `${Math.min(telemetry.surfaceRumble.rearRight * 50, 100)}%` }} />
                      </div>
                      <div 
                        className={getTireClasses('rearRight')} 
                        style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.rearRight) }} 
                      />
                      <div className="suspensionBarContainer">
                        <div 
                          className="suspensionFill"
                          style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.rearRight * 100, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* 摩擦円 (トラクションサークル) */}
                    <div className="tractionCircleContainer">
                      <svg viewBox="0 0 100 100" className="tractionCircleSvg">
                        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={rrTraction.x} cy={rrTraction.y} r="6" className={`tractionDot ${rrTraction.colorState}`} />
                      </svg>
                    </div>
                  </div>
                  <div className="tireStats" style={{ alignItems: "flex-end" }}>
                    <span className="tireTempVal">{Math.round(telemetry.tireTemp.rearRight)}°C</span>
                    <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.rearRight * 100)}%</span>
                    <span className="suspTravelVal" style={{ fontSize: "9px" }}>WHL {Math.round(Math.abs(telemetry.wheelRotationSpeed.rearRight * 9.5493))}RPM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
        <div className="panel" style={{ marginTop: "24px", padding: "16px" }}>
          <TraceGraph history={traceHistory} />
        </div>
      </>
      )}

      {activeMode === "QUALIFY" && (
        <main className="qualifyMode" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "20px" }}>
          <div style={{ fontSize: "160px", fontFamily: "var(--font-display)", fontWeight: 900, lineHeight: 1, color: "var(--color-neon-cyan)", textShadow: "0 0 40px rgba(0,229,255,0.4)" }}>
            {formatTime(telemetry.currentLap)}
          </div>
          <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>BEST LAP</div>
              <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", color: "var(--color-neon-green)" }}>{formatTime(telemetry.bestLap)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>SPEED</div>
              <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", color: "#fff" }}>{Math.round(telemetry.speedKmh)} <span style={{fontSize:"14px"}}>km/h</span></div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>GEAR</div>
              <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", color: "#fff" }}>{getGearLabel(telemetry.gear)}</div>
            </div>
          </div>
        </main>
      )}

      {activeMode === "RACE" && (
        <main className="raceMode" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginTop: "24px" }}>
          <section className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
            <TrackMap points={mapPoints} />
          </section>
          <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>POS</div>
                <div style={{ fontSize: "48px", fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--color-neon-orange)", lineHeight: 1 }}>{telemetry.racePosition || "-"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>LAP</div>
                <div style={{ fontSize: "48px", fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--color-neon-cyan)", lineHeight: 1 }}>{telemetry.lapNumber || "-"}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
               <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>FUEL</div>
                <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", fontWeight: 900, color: telemetry.fuel < 0.1 ? "var(--color-neon-red)" : "var(--color-neon-green)" }}>{Math.round(telemetry.fuel * 100)}%</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>FRONT TEMP</div>
                <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", fontWeight: 900, color: "#fff" }}>{Math.round((telemetry.tireTemp.frontLeft + telemetry.tireTemp.frontRight) / 2)}°C</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>REAR TEMP</div>
                <div style={{ fontSize: "32px", fontFamily: "var(--font-display)", fontWeight: 900, color: "#fff" }}>{Math.round((telemetry.tireTemp.rearLeft + telemetry.tireTemp.rearRight) / 2)}°C</div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
