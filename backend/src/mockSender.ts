import dgram from "node:dgram";

const TARGET_HOST = "127.0.0.1";
const TARGET_PORT = 30000;
const INTERVAL_MS = 16; // ~60fps

console.log(`=== Forza Horizon 6 Telemetry Mock Sender ===`);
console.log(`Sending mock telemetry to ${TARGET_HOST}:${TARGET_PORT} every ${INTERVAL_MS}ms...`);

const client = dgram.createSocket("udp4");
let timestamp = 0;
let angle = 0; // 変化用のアングル値

setInterval(() => {
  const buffer = Buffer.alloc(324);
  timestamp += INTERVAL_MS;
  angle += 0.02;

  // 1. レース中フラグ (1 = レース中)
  buffer.writeInt32LE(1, 0);

  // 2. タイムスタンプ
  buffer.writeUInt32LE(timestamp, 4);

  // 3. RPM・エンジン特性
  const maxRpm = 8000.0;
  const idleRpm = 1000.0;
  // RPMは正弦波で 1500〜7500 を変動
  const currentRpm = idleRpm + 1000 + (Math.sin(angle) + 1) * 2500;
  buffer.writeFloatLE(maxRpm, 8);
  buffer.writeFloatLE(idleRpm, 12);
  buffer.writeFloatLE(currentRpm, 16);

  // 4. 加速度 (Gフォース表示テスト用)
  const accelX = Math.sin(angle) * 0.5; // 左右G
  const accelY = 9.8; // 重力
  const accelZ = Math.cos(angle) * 0.3; // 前後G
  buffer.writeFloatLE(accelX, 20);
  buffer.writeFloatLE(accelY, 24);
  buffer.writeFloatLE(accelZ, 28);

  // 5. 姿勢角 (Yaw, Pitch, Roll)
  const yaw = angle % (Math.PI * 2);
  const pitch = Math.sin(angle * 2) * 0.05;
  const roll = Math.cos(angle * 2) * 0.05;
  buffer.writeFloatLE(yaw, 56);
  buffer.writeFloatLE(pitch, 60);
  buffer.writeFloatLE(roll, 64);

  // 6. タイヤ温度（ダミー値）
  const baseTemp = 75.0 + Math.sin(angle) * 5.0;
  buffer.writeFloatLE(baseTemp, 268); // FL
  buffer.writeFloatLE(baseTemp + 1.0, 272); // FR
  buffer.writeFloatLE(baseTemp - 2.0, 276); // RL
  buffer.writeFloatLE(baseTemp - 1.0, 280); // RR

  // 7. 基本車両属性
  buffer.writeInt32LE(1234, 212); // carOrdinal
  buffer.writeInt32LE(5, 216); // carClass (Sクラス)
  buffer.writeInt32LE(900, 220); // performanceIndex
  buffer.writeInt32LE(2, 224); // drivetrainType (AWD)
  buffer.writeInt32LE(8, 228); // numCylinders

  // 8. FH6追加フィールド
  buffer.writeUInt32LE(1, 232); // carGroup
  buffer.writeFloatLE(0.0, 236); // smashableVelDiff
  buffer.writeFloatLE(0.0, 240); // smashableMass

  // 9. 速度と座標
  // 速度はRPMに比例するように設定 (m/s)
  const speed = (currentRpm / maxRpm) * 60.0; // max 60m/s (216km/h)
  buffer.writeFloatLE(speed, 256);

  // 座標 (円軌道を走っているようにシミュレート)
  const posX = Math.sin(angle * 0.1) * 500;
  const posY = 100.0 + Math.sin(angle * 0.05) * 5;
  const posZ = Math.cos(angle * 0.1) * 500;
  buffer.writeFloatLE(posX, 244);
  buffer.writeFloatLE(posY, 248);
  buffer.writeFloatLE(posZ, 252);

  // 出力・トルク（ダミー）
  const power = currentRpm * 50.0; // Watts
  const torque = 400.0 - (currentRpm / maxRpm) * 100.0;
  buffer.writeFloatLE(power, 260);
  buffer.writeFloatLE(torque, 264);

  // ブースト・燃料・走行距離
  const boost = Math.max(0, Math.sin(angle) * 15.0);
  buffer.writeFloatLE(boost, 284);
  buffer.writeFloatLE(0.75 - (timestamp / 1000000) % 0.75, 288); // 燃料減少
  buffer.writeFloatLE(timestamp * 0.03, 292); // 走行距離

  // ラップとタイム
  buffer.writeFloatLE(90.5, 296); // bestLap
  buffer.writeFloatLE(92.3, 300); // lastLap
  buffer.writeFloatLE((timestamp / 1000) % 92.3, 304); // currentLap
  buffer.writeFloatLE(timestamp / 1000, 308); // currentRaceTime

  // ラップ数・順位
  buffer.writeUInt16LE(Math.floor(timestamp / 92300) + 1, 312); // lapNumber
  buffer.writeUInt8(3, 314); // racePosition (3位)

  // 10. プレイヤー入力
  // アクセル・ブレーキをRPMに連動
  const accel = currentRpm > 4000 ? 255 : 120;
  const brake = currentRpm < 2000 ? 150 : 0;
  buffer.writeUInt8(accel, 315);
  buffer.writeUInt8(brake, 316);
  buffer.writeUInt8(0, 317); // clutch
  buffer.writeUInt8(0, 318); // handBrake

  // ギア (RPMの高さで自動シフト風にシミュレート)
  let gear = 1; // 1速
  if (currentRpm > 6000) gear = 4;
  else if (currentRpm > 4500) gear = 3;
  else if (currentRpm > 3000) gear = 2;
  buffer.writeUInt8(gear + 1, 319); // 1=N, 2=1速...なので gear+1

  // ステアリング (左右に振る)
  const steer = Math.round(Math.sin(angle) * 80);
  buffer.writeInt8(steer, 320);

  // 11. 送信
  client.send(buffer, 0, buffer.length, TARGET_PORT, TARGET_HOST, (err) => {
    if (err) {
      console.error("Error sending mock packet:", err);
    }
  });
}, INTERVAL_MS);
