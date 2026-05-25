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

export function parseTelemetry(buffer: Buffer): TelemetryData {
  if (buffer.length !== 324) {
    throw new Error(`Invalid packet size: expected 324 bytes, got ${buffer.length}`);
  }

  const speed = buffer.readFloatLE(256);

  return {
    isRaceOn: buffer.readInt32LE(0),
    timestampMs: buffer.readUInt32LE(4),
    engineMaxRpm: buffer.readFloatLE(8),
    engineIdleRpm: buffer.readFloatLE(12),
    currentEngineRpm: buffer.readFloatLE(16),
    
    acceleration: {
      x: buffer.readFloatLE(20),
      y: buffer.readFloatLE(24),
      z: buffer.readFloatLE(28),
    },
    velocity: {
      x: buffer.readFloatLE(32),
      y: buffer.readFloatLE(36),
      z: buffer.readFloatLE(40),
    },
    angularVelocity: {
      x: buffer.readFloatLE(44),
      y: buffer.readFloatLE(48),
      z: buffer.readFloatLE(52),
    },
    yawPitchRoll: {
      yaw: buffer.readFloatLE(56),
      pitch: buffer.readFloatLE(60),
      roll: buffer.readFloatLE(64),
    },
    normSuspensionTravel: {
      frontLeft: buffer.readFloatLE(68),
      frontRight: buffer.readFloatLE(72),
      rearLeft: buffer.readFloatLE(76),
      rearRight: buffer.readFloatLE(80),
    },
    tireSlipRatio: {
      frontLeft: buffer.readFloatLE(84),
      frontRight: buffer.readFloatLE(88),
      rearLeft: buffer.readFloatLE(92),
      rearRight: buffer.readFloatLE(96),
    },
    wheelRotationSpeed: {
      frontLeft: buffer.readFloatLE(100),
      frontRight: buffer.readFloatLE(104),
      rearLeft: buffer.readFloatLE(108),
      rearRight: buffer.readFloatLE(112),
    },
    wheelOnRumbleStrip: {
      frontLeft: buffer.readInt32LE(116),
      frontRight: buffer.readInt32LE(120),
      rearLeft: buffer.readInt32LE(124),
      rearRight: buffer.readInt32LE(128),
    },
    wheelInPuddle: {
      frontLeft: buffer.readInt32LE(132),
      frontRight: buffer.readInt32LE(136),
      rearLeft: buffer.readInt32LE(140),
      rearRight: buffer.readInt32LE(144),
    },
    surfaceRumble: {
      frontLeft: buffer.readFloatLE(148),
      frontRight: buffer.readFloatLE(152),
      rearLeft: buffer.readFloatLE(156),
      rearRight: buffer.readFloatLE(160),
    },
    tireSlipAngle: {
      frontLeft: buffer.readFloatLE(164),
      frontRight: buffer.readFloatLE(168),
      rearLeft: buffer.readFloatLE(172),
      rearRight: buffer.readFloatLE(176),
    },
    tireCombinedSlip: {
      frontLeft: buffer.readFloatLE(180),
      frontRight: buffer.readFloatLE(184),
      rearLeft: buffer.readFloatLE(188),
      rearRight: buffer.readFloatLE(192),
    },
    suspensionTravelMeters: {
      frontLeft: buffer.readFloatLE(196),
      frontRight: buffer.readFloatLE(200),
      rearLeft: buffer.readFloatLE(204),
      rearRight: buffer.readFloatLE(208),
    },
    
    carOrdinal: buffer.readInt32LE(212),
    carClass: buffer.readInt32LE(216),
    carPerformanceIndex: buffer.readInt32LE(220),
    drivetrainType: buffer.readInt32LE(224),
    numCylinders: buffer.readInt32LE(228),
    
    // FH6 Specific
    carGroup: buffer.readUInt32LE(232),
    smashableVelDiff: buffer.readFloatLE(236),
    smashableMass: buffer.readFloatLE(240),
    
    position: {
      x: buffer.readFloatLE(244),
      y: buffer.readFloatLE(248),
      z: buffer.readFloatLE(252),
    },
    speed,
    speedKmh: speed * 3.6, // m/s to km/h
    power: buffer.readFloatLE(260),
    torque: buffer.readFloatLE(264),
    
    tireTemp: {
      frontLeft: buffer.readFloatLE(268),
      frontRight: buffer.readFloatLE(272),
      rearLeft: buffer.readFloatLE(276),
      rearRight: buffer.readFloatLE(280),
    },
    boost: buffer.readFloatLE(284),
    fuel: buffer.readFloatLE(288),
    distanceTraveled: buffer.readFloatLE(292),
    bestLap: buffer.readFloatLE(296),
    lastLap: buffer.readFloatLE(300),
    currentLap: buffer.readFloatLE(304),
    currentRaceTime: buffer.readFloatLE(308),
    
    lapNumber: buffer.readUInt16LE(312),
    racePosition: buffer.readUInt8(314),
    accel: buffer.readUInt8(315),
    brake: buffer.readUInt8(316),
    clutch: buffer.readUInt8(317),
    handBrake: buffer.readUInt8(318),
    gear: buffer.readUInt8(319),
    steer: buffer.readInt8(320),
    normalizedDrivingLine: buffer.readInt8(321),
    normalizedAIBrakeDiff: buffer.readInt8(322),
  };
}
