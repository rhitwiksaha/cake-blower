document.addEventListener("DOMContentLoaded", function() {
  const cake = document.getElementById("cake");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(left, top, isOut = false) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    console.log("Adding candle at:", left, top);

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    if (isOut) {
      candle.classList.add("out");
    }

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

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

  // ------------------------------
  // SAVE & LOAD LOGIC
  // ------------------------------
  async function saveCake(candles, message) {
    // Convert DOM candles → plain objects
    const candleData = candles.map(c => ({
      left: parseInt(c.style.left, 10),
      top: parseInt(c.style.top, 10),
      out: c.classList.contains("out")
    }));

    const { data, error } = await supabase
      .from("cakes")
      .insert([{ candles: candleData, message }])
      .select();

    if (error) {
      console.error("Error saving cake:", error);
    } else {
      const cakeId = data[0].id;
      const basePath = window.location.pathname.replace(/\/[^/]*$/, "");
      const shareLink = `${window.location.origin}${basePath}/view.html?id=${cakeId}`;
      const linkSection = document.getElementById("linkSection");
      const linkInput = document.getElementById("shareLink");

      linkInput.value = shareLink;
      linkSection.style.display = "block";

      document.getElementById("copyLinkBtn").onclick = () => {
        linkInput.select();
        document.execCommand("copy");
        document.getElementById("copyLinkBtn").textContent = "Copied! ✅";
        setTimeout(() => {
          document.getElementById("copyLinkBtn").textContent = "Copy";
        }, 2000);
      };
    }
  }

  document.getElementById("saveCakeBtn").addEventListener("click", async () => {
    console.log("Generate Link button clicked ✅");
    const message = document.getElementById("messageInput").value;
    await saveCake(candles, message); // use global candles array
  });

});