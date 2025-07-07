const wsURL = "wss://eew.bcl666.live/";
let ws;

const API_KEY = "金鑰貼這裡";

function connectWebSocket() {
  ws = new WebSocket(wsURL);
  ws.addEventListener("open", function (event) {
    console.log("WebSocket connected");
    sendWebSocketMessage({ type: "region", token: API_KEY });
    sendWebSocketMessage({ type: "eew", token: API_KEY });
    sendWebSocketMessage({ type: "rts", token: API_KEY });
    sendWebSocketMessage({ type: "report", token: API_KEY });
    sendWebSocketMessage({ type: "jmaReport", token: API_KEY });
    sendWebSocketMessage({ type: "station", token: API_KEY });
  });

  ws.addEventListener("error", function (event) {
    console.error("WebSocket error:", event);
  });

  ws.addEventListener("message", function (event) {
    const e = event.data;
    const data = JSON.parse(e);
    switch (data.t) {
      case "region":
        global.region = data;
        break;
      case "rts":
        RTSRequest(data);
        break;
      case "report":
        news(reportFormat(data));
        break;
      case "station":
        $(".station_1_shindo").text(`，實測震度：0，距離震央：-km`);
        $(".station_2_shindo").text(`，實測震度：0，距離震央：-km`);
        global.station = station_exec(data);
        SelectStation();
        break;
      case "forbidden":
        alert("錯誤的金鑰");
        break;
      case "jmaReport":
        news(reportFormat(data), "日本");
        break;
      default:
        EEWRequest(data);
        break;
    }
  });

  ws.addEventListener("close", function (event) {
    console.log("WebSocket connection closed. Reconnecting...");
    setTimeout(connectWebSocket, 2000);
  });
}
connectWebSocket();

function sendWebSocketMessage(t) {
  const json = JSON.stringify(t);
  const encodedData = btoa(unescape(encodeURIComponent(json)));
  if (ws.readyState == WebSocket.OPEN) {
    ws.send(encodedData);
  } else {
    console.error("WebSocket is not connection yet.");
  }
}

function reportFormat(data) {
  const type = data.t;
  let timeStamp = data.time;

  if (type === "jmaReport") {
    timeStamp += 9 * 3600 * 1000;
  } else if (type === "report") {
    timeStamp += 8 * 3600 * 1000;
  }

  const time = formatTimestamp(timeStamp);
  const loc = data.loc;
  const mag = data.mag;
  const depth = data.depth;
  const list = data.list;

  let currentMaxInt = 0;

  global.report.message = "";

  // 通用處理 list 的輔助函式
  const processList = (listData, isJmaReport) => {
    let localMaxInt = 0;
    let tempMessage = "";

    for (const key in listData) {
      if (listData.hasOwnProperty(key)) {
        const keyData = listData[key];

        if (isJmaReport && keyData.int && keyData.int > localMaxInt) {
          localMaxInt = keyData.int;
        }

        tempMessage += `${key}：`;
        const townObject = keyData.town;
        for (const townKey in townObject) {
          if (townObject.hasOwnProperty(townKey)) {
            const townDetails = townObject[townKey];
            if (isJmaReport) {
              tempMessage += `${townKey}震度${townDetails.int}、`;
              if (townDetails.int > localMaxInt) {
                localMaxInt = townDetails.int;
              }
            } else {
              tempMessage += `${townKey}${townDetails.int}級、`;
            }
          }
        }
        tempMessage = tempMessage.slice(0, -1);
        tempMessage += "。";
      }
    }
    if (tempMessage.endsWith("。")) {
      tempMessage = tempMessage.slice(0, -1);
    }

    return { message: tempMessage, maxInt: localMaxInt };
  };

  const processed = processList(list, type === "jmaReport");
  global.report.message = processed.message;
  currentMaxInt = processed.maxInt;

  if (type === "jmaReport") {
    const intensityDetail = global.report.message
      ? `各地の震度は『${global.report.message}』です。`
      : "";

    return `日本時間${time}頃、${loc}を震源とするマグニチュード${mag}の地震が発生しました。震源の深さは${depth}km、最大震度は${currentMaxInt}です。${intensityDetail}詳しくは気象庁のウェブサイトをご覧ください。`;
  } else if (type === "report") {
    return `臺灣時間${time}左右發生規模${mag}地震，震央位於${loc}，深度${depth}公里，各地震度『${global.report.message}』，更多詳細的地震資訊請參閱中央氣象署網站。`;
  }
  return `未知類型的報告。時間：${time}`;
}

function addStyle(endPosition) {
  $("#eew_style").remove();
  const style = $("<style>").attr("id", "eew_style").html(`
            @keyframes scroll {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(${endPosition}px);
                }
            }
        `);
  $("head").append(style);
}

function EEWRequest(data) {
  on_eew(data);
}

function RTSRequest(data) {
  on_rts_data(data);
}
