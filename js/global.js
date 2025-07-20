class GlobalManager {
  constructor() {
    this.report = {
      message: "",
    };
    this.detection_list = {};
    this.tw_lang_data = {};
    this.station = {};
    this.region = {};
    this.intensity_list = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5⁻",
      "5⁺",
      "6⁻",
      "6⁺",
      "7",
    ];
    this.intensity_map = {
      1: "震度1",
      2: "震度2",
      3: "震度3",
      4: "震度4",
      5: "震度5弱",
      6: "震度5強",
      7: "震度6弱",
      8: "震度6強",
      9: "震度7",
    };
    this.station_1 = {
      Lat: 0,
      Lon: 0,
    };
    this.station_2 = {
      Lat: 0,
      Lon: 0,
    };
    this.setting = {
      rts1: "L-235-13204180",
      rts2: "L-235-13204180",
    };
    this.rts = {
      intensity: -1,
      pga: 0,
    };
    this.rts_station_init = {
      rts1: {
        loc: " - - -  - - ",
        pga: "--",
        intensity: "--",
      },
      rts2: {
        loc: " - - -  - - ",
        pga: "--",
        intensity: "--",
      },
    };
    this.rts_intensity_number = 0;
    this.max_pga = 0;
    this.max_intensity = 0;
    this.notification = "";
    this.loc_shindo = {
      s1: "",
      s2: "",
    };
    this.news_msg = {
      tw: "",
      jp: "",
    };
    this.ANIMATION_DURATION = 200;
    this.check_eew = {};
    this.check_tsunami = {};
    this.newsAlertTimeoutId = null;
    this.marqueeQueue = [];
    this.isMarqueeRunning = false;
    this.currentMarqueeType = null;
  }
}

window.GlobalManager = new GlobalManager();
