let model;
let currentDeviceId = null;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const camBtn = document.querySelector(".camBtn");

const maxObjSlider = document.getElementById("maxObj");
const maxObjVal = document.getElementById("maxObjVal");
const minScoreSlider = document.getElementById("minScore");
const minScoreVal = document.getElementById("minScoreVal");

maxObjSlider.oninput = () => maxObjVal.textContent = maxObjSlider.value;
minScoreSlider.oninput = () => minScoreVal.textContent = minScoreSlider.value;

// クラスマッピング
const CLASS_MAP = {
  "scissors": "Pen",
  "toothbrush": "Pen",
  "knife": "Pen",
  "fork": "Pen",
  "spoon": "Pen",
  "baseball bat": "Pen",
  "pencil": "Pen",

  "remote": "Egg",

  "wine glass": "Key",
  "cell phone": "Phone",

  "coin": "Key" // ← COCOには無いが誤認処理用
};

// 完全無視
const IGNORE = new Set([
  "person", "cup", "bottle", "bowl",
  "chair", "sofa", "tv", "dog", "cat",
  "bed", "bench", "potted plant", "dining table", "refrigerator"
]);

// 色設定修正版（Phone→blue）
const COLORS = {
  Pen: "yellow",
  Egg: "blue",
  Key: "white",
  Phone: "blue",
};

async function loadModel() {
  model = await cocoSsd.load();
}

async function startCamera(deviceId = null) {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId }} : { facingMode: "user" },
    audio: false
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  detect();
}

startBtn.addEventListener("click", async () => {
  await loadModel();
  startCamera(null);
});

camBtn.addEventListener("click", async () => {
  const id = camBtn.dataset.id;
  currentDeviceId = id;
  await loadModel();
  startCamera(id);
});

async function detect() {
  const predictions = await model.detect(video);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxObj = parseInt(maxObjSlider.value);
  const minScore = parseInt(minScoreSlider.value) / 100;

  let count = 0;

  predictions.forEach(pred => {
    if (count >= maxObj) return;

    const orig = pred.class;
    const score = pred.score;
    if (score < minScore) return;
    if (IGNORE.has(orig)) return;

    const mapped = CLASS_MAP[orig] || "Basic";
    if (mapped === "Basic") return;

    const color = COLORS[mapped] || "lime";

    let [x, y, width, height] = pred.bbox;

    // UIと重ならないように右30px以上へずらす
    if (x < 200) x = 220;

    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = color;
    ctx.font = "40px sans-serif";
    ctx.fillText(mapped, x, y > 40 ? y - 10 : y + 40);

    count++;
  });

  requestAnimationFrame(detect);
}
