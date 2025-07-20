class FunctionHandler {
  constructor(GlobalManager) {
    this.GlobalManager = GlobalManager;
    this.API_KEY = "bWl5YXNob29vb29fdGVzdAJasper881005";
    if (sessionStorage.getItem("rts1")) {
      this.GlobalManager.setting.rts1 = sessionStorage.getItem("rts1");
    }
    if (sessionStorage.getItem("rts2")) {
      this.GlobalManager.setting.rts2 = sessionStorage.getItem("rts2");
    }
    this.storage = {
      init: () => {
        try {
          let json = JSON.parse(localStorage.Config);
          if (json.ver != ver) {
            json = { ver };
          }
          localStorage.Config = JSON.stringify(json);
          return json;
        } catch (err) {
          localStorage.Config = JSON.stringify({});
          return false;
        }
      },
      getItem: (key) => {
        try {
          const json = JSON.parse(localStorage.Config);
          return json[key];
        } catch (err) {
          return false;
        }
      },
      setItem: (key, value) => {
        try {
          const json = JSON.parse(localStorage.Config);
          json[key] = value;
          localStorage.Config = JSON.stringify(json);
          return true;
        } catch (err) {
          return false;
        }
      },
    };
  }

  pga_to_float(pga) {
    return 2 * Math.log10(pga) + 0.7;
  }

  now_time() {
    const utc = new Date();
    const now = new Date(
      utc.getTime() + utc.getTimezoneOffset() * 60000 + 28800000
    );
    return now.getTime();
  }

  formatTimestamp(timestamp, type) {
    const date = new Date(timestamp);
    date.setUTCHours(date.getUTCHours() + (type === "report" ? 8 : 9));
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  int_to_intensity(int) {
    return this.GlobalManager.intensity_list[int];
  }

  intensity_float_to_int(float) {
    return float < 0
      ? 0
      : float < 4.5
      ? Math.round(float)
      : float < 5
      ? 5
      : float < 5.5
      ? 6
      : float < 6
      ? 7
      : float < 6.5
      ? 8
      : 9;
  }

  eew_location_info(data, t) {
    let locinfo;
    if (t == "station_1") {
      locinfo = this.GlobalManager.station_1;
    } else if (t == "station_2") {
      locinfo = this.GlobalManager.station_2;
    }
    const dist_surface = this.dis(
      data.eq.lat,
      data.eq.lon,
      locinfo.Lat,
      locinfo.Lon
    );
    const dist = Math.sqrt(this.pow(dist_surface) + this.pow(data.eq.depth));
    const pga =
      1.657 *
      Math.pow(Math.E, 1.533 * data.eq.mag) *
      Math.pow(dist, -1.607) *
      1.751;
    let i = this.pga_to_float(pga);
    if (i > 3) {
      i = this.eew_i(
        [data.eq.lat, data.eq.lon],
        [locinfo.Lat, locinfo.Lon],
        data.eq.depth,
        data.eq.mag
      );
    }
    return {
      dist,
      i,
    };
  }

  pow(int) {
    return Math.pow(int, 2);
  }

  eew_i(epicenterLocaltion, pointLocaltion, depth, magW) {
    const long = 10 ** (0.5 * magW - 1.85) / 2;
    const epicenterDistance = this.dis(
      epicenterLocaltion[0],
      epicenterLocaltion[1],
      pointLocaltion[0],
      pointLocaltion[1]
    );
    const hypocenterDistance =
      (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
    const x = Math.max(hypocenterDistance, 3);
    const gpv600 =
      10 **
      (0.58 * magW +
        0.0038 * depth -
        1.29 -
        Math.log10(x + 0.0028 * 10 ** (0.5 * magW)) -
        0.002 * x);
    const arv = 1.0;
    const pgv400 = gpv600 * 1.31;
    const pgv = pgv400 * arv;
    return 2.68 + 1.72 * Math.log10(pgv);
  }

  dis(latA, lngA, latB, lngB) {
    latA = (latA * Math.PI) / 180;
    lngA = (lngA * Math.PI) / 180;
    latB = (latB * Math.PI) / 180;
    lngB = (lngB * Math.PI) / 180;
    const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
    const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
    const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
    const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
    return (
      Math.acos(
        sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)
      ) * 6371.008
    );
  }

  reportFormat(data) {
    const type = data.t;
    let timeStamp = data.time;
    const time = this.formatTimestamp(timeStamp, type);
    const loc = data.loc;
    const mag = data.mag;
    const depth = data.depth;
    const list = data.list;
    let currentMaxInt = 0;
    this.GlobalManager.report.message = "";
    const processList = (listData, isJmaReport, isTaiwanReport) => {
      let localMaxInt = 0;
      let tempMessage = "";
      for (const key in listData) {
        if (listData.hasOwnProperty(key)) {
          const keyData = listData[key];
          if (
            (isJmaReport || isTaiwanReport) &&
            keyData.int &&
            keyData.int > localMaxInt
          ) {
            localMaxInt = keyData.int;
          }
          tempMessage += `${key}：`;
          const townObject = keyData.town;
          for (const townKey in townObject) {
            if (townObject.hasOwnProperty(townKey)) {
              const townDetails = townObject[townKey];
              if (isJmaReport) {
                tempMessage += `${townKey}${
                  this.GlobalManager.intensity_map[townDetails.int]
                }、`;
                if (townDetails.int > localMaxInt) {
                  localMaxInt = townDetails.int;
                }
              } else if (isTaiwanReport) {
                const intStr =
                  this.GlobalManager.intensity_map[townDetails.int];
                const match = intStr.match(/^震度([1-4])$/);
                if (match) {
                  tempMessage += `${townKey}${match[1]}級、`;
                } else {
                  tempMessage += `${townKey}${intStr.replace("震度", "")}、`;
                }
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
    const isJmaReport = type === "jmaReport";
    const isTaiwanReport = type === "report";
    const processed = processList(list, isJmaReport, isTaiwanReport);
    this.GlobalManager.report.message = processed.message;
    currentMaxInt = processed.maxInt;
    if (isJmaReport) {
      const intensityDetail = this.GlobalManager.report.message
        ? `各地の震度は『${this.GlobalManager.report.message}』です。`
        : "";
      let warnMsg = "";
      if (
        typeof data.warn_message === "string" &&
        data.warn_message.trim() &&
        data.warn_message.trim() !== "この地震による津波の心配はありません。"
      ) {
        warnMsg = `${data.warn_message.trim()}、`;
      }
      return `日本時間${time}頃、${loc}を震源とするマグニチュード${mag}の地震が発生しました。震源の深さは${depth}km、最大震度は${
        this.GlobalManager.intensity_map[currentMaxInt]
      }です。${intensityDetail}${
        warnMsg ? warnMsg : ""
      }詳しくは気象庁のウェブサイトをご覧ください。`;
    } else if (isTaiwanReport) {
      let maxIntStr = this.GlobalManager.intensity_map[currentMaxInt];
      const match = maxIntStr.match(/^震度([1-4])$/);
      if (match) {
        maxIntStr = `${match[1]}級`;
      } else {
        maxIntStr = maxIntStr.replace("震度", "");
      }
      return `臺灣時間${time}左右，${loc}發生規模${mag}地震，深度${depth}公里，最大震度${maxIntStr}，各地震度『${this.GlobalManager.report.message}』，更多詳細的地震資訊請參閱中央氣象署網站。`;
    }
    return `未知類型的報告。時間：${time}`;
  }

  formatJmaTsunami(data) {
    let maxArrival = null;
    const list = data.warnings || data.observations || [];
    if (list.length > 0) {
      for (const item of list) {
        if (item.maxArrivalTime) {
          if (!maxArrival || item.maxArrivalTime > maxArrival) {
            maxArrival = item.maxArrivalTime;
          }
        }
      }
    }
    let maxArrivalStr = "";
    if (maxArrival) {
      let t = maxArrival;
      if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
        t = t.slice(5, 16);
      }
      maxArrivalStr = `これまでの最大到達時刻：${t}`;
    }
    const formattedList = list.map((item) => {
      let displayHeightStr = (item.height || "-").replace(
        /([\d.]+)m(以上)?/g,
        (match, p1, p2) => `${p1}メーター${p2 ? p2 : ""}`
      );
      let firstWaveStr = "";
      if (item.firstWave) {
        let t = item.firstWave;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
          t = t.slice(5, 16);
        }
        firstWaveStr = `、第一波：${t}`;
      }
      let maxArrivalStrLocal = "";
      if (item.maxArrivalTime) {
        let t = item.maxArrivalTime;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
          t = t.slice(5, 16);
        }
        maxArrivalStrLocal = `、これまでの最大到達時刻：${t}`;
      }
      return {
        area: item.area || item.location || "",
        displayHeightStr,
        firstWaveStr,
        maxArrivalStrLocal,
      };
    });
    return {
      additionalInfo: data.additionalInfo || "",
      maxArrivalStr,
      formattedList,
    };
  }
}

window.functionHandler = new FunctionHandler(window.GlobalManager);
