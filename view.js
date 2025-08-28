document.addEventListener("DOMContentLoaded", () => {
  const cake = document.getElementById("cake");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  function addCandle(left, top, isOut = false) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    if (isOut) {
      candle.classList.add("out");
    }

    cake.appendChild(candle);
    candles.push(candle);
  }

  function isBlowing() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;
    return average > 40; // sensitivity threshold
  }

  function blowOutCandles() {
    let blownOut = 0;

    if (isBlowing()) {
      candles.forEach((candle) => {
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }

    if (blownOut > 0) {
      updateCandleCount();
    }
  }

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }

  async function loadCake(id) {
    const { data, error } = await supabase
      .from("cakes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading cake:", error);
      return;
    }

    document.querySelectorAll(".candle").forEach(c => c.remove());
    candles = [];

    data.candles.forEach(candleData => {
      addCandle(candleData.left, candleData.top, candleData.out);
    });

    const msgBox = document.getElementById("messageBox");
    const msgDisplay = document.getElementById("messageDisplay");

    msgDisplay.textContent = data.message || "🎂 Happy Birthday!";
    msgBox.style.display = "block";
  }

  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    loadCake(params.get("id"));
  }
});
