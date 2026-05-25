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

// テレメトリデータのインターフェース定義
interface TelemetryData {
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

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalogMode, setIsAnalogMode] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

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

  return (
    <div className="dashboardContainer">
      {/* 1. Header Panel */}
      <header className="panel headerPanel">
        <div className="titleSection">
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

        <div className="viewToggle" style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto", marginRight: "16px" }}>
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
          </div>
        </section>

        {/* Center Section - Gauges */}
        <section className="panel centerPanel">
          {isAnalogMode ? (
            <div className="analogMetersWrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", flexGrow: 1 }}>
              <AnalogMeter 
                value={telemetry.speedKmh} 
                min={0} max={400} 
                label="SPEED" unit="km/h" 
                majorTickStep={50} minorTickCount={4} 
                size={220} 
                accentColor="var(--color-neon-cyan)"
              />
              <AnalogMeter 
                value={telemetry.currentEngineRpm} 
                min={0} max={Math.max(telemetry.engineMaxRpm, 8000)} 
                label="RPM" unit={`GEAR: ${getGearLabel(telemetry.gear)}`} 
                majorTickStep={1000} minorTickCount={1} 
                warningValue={telemetry.engineMaxRpm * 0.85}
                dangerValue={telemetry.engineMaxRpm * 0.95}
                size={340} 
                accentColor="var(--color-neon-magenta)"
                valueFormatter={(v) => v / 1000}
              />
              <AnalogMeter 
                value={telemetry.boost} 
                min={-15} max={30} 
                label="BOOST" unit="PSI" 
                majorTickStep={10} minorTickCount={1} 
                warningValue={20}
                size={220} 
                accentColor="var(--color-neon-orange)"
              />
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

        {/* Right Section - G-Force & Thermals */}
        <section className="rightPanel">
          {/* G-Force Card */}
          <div className="panel">
            <h2 className="metaLabel" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
              <TrendingUp size={14} /> G-FORCE
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
                  <div className="tireAndSuspension">
                    <div className="suspensionBarContainer">
                      <div 
                        className="suspensionFill"
                        style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.frontLeft * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div 
                      className="tireVisual" 
                      style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.frontLeft) }} 
                    />
                  </div>
                  <span className="tireTempVal">{Math.round(telemetry.tireTemp.frontLeft)}°C</span>
                  <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.frontLeft * 100)}%</span>
                </div>

                {/* Chassis center */}
                <div className="carChassisIllustration" />

                {/* Front Right */}
                <div className="tireBox">
                  <div className="tireAndSuspension">
                    <div className="suspensionBarContainer">
                      <div 
                        className="suspensionFill"
                        style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.frontRight * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div 
                      className="tireVisual" 
                      style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.frontRight) }} 
                    />
                  </div>
                  <span className="tireTempVal">{Math.round(telemetry.tireTemp.frontRight)}°C</span>
                  <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.frontRight * 100)}%</span>
                </div>

                {/* Rear Left */}
                <div className="tireBox">
                  <div className="tireAndSuspension">
                    <div className="suspensionBarContainer">
                      <div 
                        className="suspensionFill"
                        style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.rearLeft * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div 
                      className="tireVisual" 
                      style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.rearLeft) }} 
                    />
                  </div>
                  <span className="tireTempVal">{Math.round(telemetry.tireTemp.rearLeft)}°C</span>
                  <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.rearLeft * 100)}%</span>
                </div>

                {/* Rear Right */}
                <div className="tireBox">
                  <div className="tireAndSuspension">
                    <div className="suspensionBarContainer">
                      <div 
                        className="suspensionFill"
                        style={{ height: `${Math.min(Math.max(telemetry.normSuspensionTravel.rearRight * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div 
                      className="tireVisual" 
                      style={{ backgroundColor: getTireTempColor(telemetry.tireTemp.rearRight) }} 
                    />
                  </div>
                  <span className="tireTempVal">{Math.round(telemetry.tireTemp.rearRight)}°C</span>
                  <span className="suspTravelVal">SUSP {Math.round(telemetry.normSuspensionTravel.rearRight * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
