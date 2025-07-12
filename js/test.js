class TestEEWManager {
  constructor(Station) {
    this.Station = Station;
  }

  eew_test() {
    const eew_data = {
      author: "cwa",
      id: "1130703",
      serial: 4,
      status: 1,
      final: 0,
      eq: {
        time: 1715327118000,
        lon: 121.8,
        lat: 24.24,
        depth: 0,
        mag: 7.5,
        loc: "花蓮縣北部外海",
        max: 7,
      },
      time: 1715441622570,
      type: "eew-cwb",
      replay_timestamp: 1715327118000,
      replay_time: 1715327140000,
      timestamp: null,
    };
    this.Station.on_eew(eew_data, "websocket");
  }

  eew_test_jp() {
    const eew_data = {
      t: "jmaEEW",
      author: "jma",
      type: "eew-jma",
      id: "20250712005905",
      serial: 4,
      status: 1,
      final: true,
      eq: {
        time: 1752249539000,
        lon: 141.9,
        lat: 37.3,
        depth: 40,
        mag: 3.5,
        loc: "福島県沖",
        max: 1,
      },
      time: 1752249602000,
    };
    this.Station.on_eew_jp(eew_data);
  }
}

window.TestEEWManager = new TestEEWManager(window.StationManager);
