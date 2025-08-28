document.addEventListener("DOMContentLoaded", () => {
  const cake = document.getElementById("cake");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];

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

    // Add saved candles
    data.candles.forEach(candleData => {
      addCandle(candleData.left, candleData.top, candleData.out);
    });

    document.getElementById("messageDisplay").textContent = data.message || "";
  }

  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    loadCake(params.get("id"));
  }
});
