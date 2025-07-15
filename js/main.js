class StationManager {
  constructor(Global, functionHandler, Marquee) {
    this.GlobalManager = Global;
    this.functionHandler = functionHandler;
    this.Marquee = Marquee;
    this.setupEventListeners();
  }

  SelectStation() {
    const sortedKeys = Object.keys(this.GlobalManager.station).sort((a, b) => {
      const uuidA = this.GlobalManager.station[a].uuid.split("-")[1];
      const uuidB = this.GlobalManager.station[b].uuid.split("-")[1];
      return uuidA.localeCompare(uuidB);
    });
    this.stationOptions = sortedKeys.map((key) => {
      const stations = this.GlobalManager.station[key];
      if (key == "13379360") {
        stations.Loc = "重慶市 北碚區";
      } else if (key == "7735548") {
        stations.Loc = "南楊州市 和道邑";
      }
      const lastThreeKeys = key.slice(-3);
      return {
        uuid: stations.uuid,
        label: `${stations.Loc} (${lastThreeKeys})`,
        Loc: stations.Loc,
        key: key,
      };
    });
    const rts1 = sessionStorage.getItem("rts1");
    const rts2 = sessionStorage.getItem("rts2");
    if (rts1) {
      const found = this.stationOptions.find((opt) => opt.uuid === rts1);
      if (found) $(".station_1_search").val(found.label);
      this.GlobalManager.setting.rts1 = rts1;
    }
    if (rts2) {
      const found = this.stationOptions.find((opt) => opt.uuid === rts2);
      if (found) $(".station_2_search").val(found.label);
      this.GlobalManager.setting.rts2 = rts2;
    }
  }

  station_exec(station_data) {
    let stations = {};
    for (
      let k = 0, k_ks = Object.keys(station_data), n = k_ks.length;
      k < n;
      k++
    ) {
      const station_id = k_ks[k];
      const station_ = station_data[station_id];
      const station_net = station_.net == "MS-Net" ? "H" : "L";
      let station_new_id = "",
        station_code = "000",
        Loc = "",
        area = "",
        Lat = 0,
        Long = 0;
      if (station_ !== "station") {
        let latest = station_.info[0];
        if (station_.info.length > 1)
          for (let i = 1; i < station_.info.length; i++) {
            const currentTime = new Date(station_.info[i].time);
            const latestTime = new Date(latest.time);
            if (currentTime > latestTime) latest = station_.info[i];
          }
        if (this.GlobalManager.region) {
          for (
            let i = 0,
              ks = Object.keys(this.GlobalManager.region),
              j = ks.length;
            i < j;
            i++
          ) {
            const reg_id = ks[i];
            const reg = this.GlobalManager.region[reg_id];

            for (
              let r = 0, r_ks = Object.keys(reg), l = r_ks.length;
              r < l;
              r++
            ) {
              const ion_id = r_ks[r];
              const ion = reg[ion_id];
              if (ion.code == latest.code) {
                station_code = latest.code.toString();
                Loc = `${reg_id} ${ion_id}`;
                area = ion.area;
                Lat = latest.lat;
                Long = latest.lon;
              }
            }
          }
          station_new_id = `${station_net}-${station_code}-${station_id}`;
          stations[station_id] = { uuid: station_new_id, Lat, Long, Loc, area };
        }
      }
    }
    this.GlobalManager.station = stations;
    return stations;
  }

  on_rts_data(data) {
    data.Alert = Object.keys(this.GlobalManager.detection_list).length !== 0;
    const detection_location = data.area ?? [];
    this.GlobalManager.rts_station_init.rts1.loc = " - - -  - - ";
    this.GlobalManager.rts_station_init.rts1.intensity = "--";
    this.GlobalManager.rts_station_init.rts1.pga = "--";
    this.GlobalManager.rts_station_init.rts2.loc = " - - -  - - ";
    this.GlobalManager.rts_station_init.rts2.intensity = "--";
    this.GlobalManager.rts_station_init.rts2.pga = "--";
    this.GlobalManager.max_pga = 0;
    this.GlobalManager.max_intensity = 0;
    this.GlobalManager.rts_intensity_number = 0;
    this.GlobalManager.detection_list = data.box ?? {};
    for (const key of Object.keys(this.GlobalManager.detection_list)) {
      if (
        this.GlobalManager.max_intensity <
        this.GlobalManager.detection_list[key]
      ) {
        this.GlobalManager.max_intensity =
          this.GlobalManager.detection_list[key];
      }
    }
    if (data.station) {
      for (const station_id of Object.keys(data.station)) {
        if (!this.GlobalManager.station[station_id]) {
          continue;
        }
        const info = this.GlobalManager.station[station_id];
        const station_data = data.station[station_id];
        const intensity = this.functionHandler.intensity_float_to_int(
          station_data.i
        );
        if (data.Alert) {
          if (
            station_data.alert &&
            station_data.pga > this.GlobalManager.max_pga
          ) {
            this.GlobalManager.max_pga = station_data.pga;
          }
        } else if (station_data.pga > this.GlobalManager.max_pga) {
          this.GlobalManager.max_pga = station_data.pga;
        }

        //測站1
        if (this.GlobalManager.setting.rts1.includes(info.uuid)) {
          this.GlobalManager.rts_station_init.rts1.loc = info.Loc;
          this.GlobalManager.station_1.Lat = info.Lat;
          this.GlobalManager.station_1.Lon = info.Long;
          this.GlobalManager.rts_station_init.rts1.intensity = station_data.i;
          this.GlobalManager.rts_intensity_number = intensity;
          this.GlobalManager.rts_station_init.rts1.pga = station_data.pga;
        }

        //測站2
        if (this.GlobalManager.setting.rts2.includes(info.uuid)) {
          this.GlobalManager.rts_station_init.rts2.loc = info.Loc;
          this.GlobalManager.station_2.Lat = info.Lat;
          this.GlobalManager.station_2.Lon = info.Long;
          this.GlobalManager.rts_station_init.rts2.intensity = station_data.i;
          this.GlobalManager.rts_intensity_number = intensity;
          this.GlobalManager.rts_station_init.rts2.pga = station_data.pga;
        }
      }
    }

    $(".location_intensity_1").text(
      `${this.GlobalManager.rts_station_init.rts1.loc}，PGA：${this.GlobalManager.rts_station_init.rts1.pga}gal`
    );

    $(".location_intensity_2").text(
      `${this.GlobalManager.rts_station_init.rts2.loc}，PGA：${this.GlobalManager.rts_station_init.rts2.pga}gal`
    );

    $(".max_gal").text(`最大加速度：${this.GlobalManager.max_pga}gal`);
    $(".time").text(`${this.functionHandler.formatTimestamp(data.time)}`);
    $(".epic_intensity").text(
      `觀測最大震度：${this.functionHandler.int_to_intensity(
        this.GlobalManager.max_intensity
      )}`
    );

    if (
      data.Alert &&
      this.GlobalManager.max_intensity > this.GlobalManager.rts.intensity &&
      this.GlobalManager.rts.intensity != 10
    ) {
      const loc = detection_location[0] ?? "未知區域";
      if (this.GlobalManager.max_intensity > 3) {
        this.GlobalManager.rts.intensity = 10;
        this.GlobalManager.notification = "🟥 強震檢測";
      } else if (this.GlobalManager.max_intensity > 1) {
        this.GlobalManager.rts.intensity = 3;
        this.GlobalManager.notification = "🟨 震動檢測";
      } else {
        this.GlobalManager.rts.intensity = 1;
        this.GlobalManager.notification = "🟩 弱反應";
      }
      $(".notification").text(
        `[檢測]${this.GlobalManager.notification} location:${loc}\n 最大加速度:${this.GlobalManager.max_pga}\n 最大震度:${this.GlobalManager.max_intensity}`
      );
    }
  }

  on_eew(data) {
    if (data.type !== "eew-cwb") return;
    let location_station_1_dist = `，距離震央：${
      Math.round(this.functionHandler.eew_location_info(data, "station_1").dist)
        ? Math.round(
            this.functionHandler.eew_location_info(data, "station_1").dist
          )
        : "-"
    }`;
    let location_station_2_dist = `，距離震央：${
      Math.round(this.functionHandler.eew_location_info(data, "station_2").dist)
        ? Math.round(
            this.functionHandler.eew_location_info(data, "station_2").dist
          )
        : "-"
    }`;

    this.GlobalManager.loc_shindo.s1 = `，實測震度：${
      this.GlobalManager.intensity_list[
        Math.round(
          this.functionHandler.intensity_float_to_int(
            this.functionHandler.eew_location_info(data, "station_1").i
          )
        )
      ] || 0
    }`;
    this.GlobalManager.loc_shindo.s2 = `，實測震度：${
      this.GlobalManager.intensity_list[
        Math.round(
          this.functionHandler.intensity_float_to_int(
            this.functionHandler.eew_location_info(data, "station_2").i
          )
        )
      ] || 0
    }`;

    $(".station_1_shindo").text(
      `${this.GlobalManager.loc_shindo.s1}${location_station_1_dist}km`
    );
    $(".station_2_shindo").text(
      `${this.GlobalManager.loc_shindo.s2}${location_station_2_dist}km`
    );
    setTimeout(() => {
      $(".station_1_shindo").text(`，實測震度：0，距離震央：-km`);
      $(".station_2_shindo").text(`，實測震度：0，距離震央：-km`);
    }, 40000);

    this.Marquee.eew(
      this.Marquee.eew_initial_msg,
      "地震速報",
      `${data.id}-${data.serial}`
    );
  }

  on_eew_jp(data) {
    if (data.type !== "eew-jma") return;
    this.Marquee.eew(
      this.Marquee.eew_initial_msg_jp,
      "日本地震速報",
      `${data.id}-${data.serial}`
    );
  }

  setupEventListeners() {
    $(document).on("input focus", ".station_1_search", (event) => {
      const val = $(event.target).val().toLowerCase();
      let matched = [];
      if (/^\d+/.test(val)) {
        matched = this.stationOptions.filter(
          (opt) =>
            opt.uuid.toLowerCase().includes(val) ||
            opt.key.startsWith(val) ||
            opt.label.toLowerCase().includes(val)
        );
        matched.sort((a, b) => {
          const aStart =
            a.uuid.toLowerCase().startsWith(val) || a.key.startsWith(val);
          const bStart =
            b.uuid.toLowerCase().startsWith(val) || b.key.startsWith(val);
          if (aStart && !bStart) return -1;
          if (!aStart && bStart) return 1;
          return 0;
        });
      } else {
        matched = this.stationOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(val) ||
            opt.uuid.toLowerCase().includes(val) ||
            opt.key.includes(val)
        );
      }
      const dropdown = $(".station_1_dropdown");
      dropdown.empty();
      if (matched.length > 0 && val.length > 0) {
        matched.forEach((opt) => {
          dropdown.append(
            `<div class='dropdown-item' data-uuid='${opt.uuid}'>${opt.label}</div>`
          );
        });
        dropdown.addClass("active");
      } else {
        dropdown.removeClass("active");
      }
    });
    $(document).on(
      "mousedown",
      ".station_1_dropdown .dropdown-item",
      (event) => {
        const uuid = $(event.target).data("uuid");
        const label = $(event.target).text();
        $(".station_1_search").val(label);
        this.GlobalManager.setting.rts1 = uuid;
        sessionStorage.setItem("rts1", uuid);
        $(".station_1_dropdown").removeClass("active");
      }
    );
    $(document).on("blur", ".station_1_search", (event) => {
      setTimeout(() => {
        $(".station_1_dropdown").removeClass("active");
      }, 150);
    });
    $(document).on("input focus", ".station_2_search", (event) => {
      const val = $(event.target).val().toLowerCase();
      let matched = [];
      if (/^\d+/.test(val)) {
        matched = this.stationOptions.filter(
          (opt) =>
            opt.uuid.toLowerCase().includes(val) ||
            opt.key.startsWith(val) ||
            opt.label.toLowerCase().includes(val)
        );
        matched.sort((a, b) => {
          const aStart =
            a.uuid.toLowerCase().startsWith(val) || a.key.startsWith(val);
          const bStart =
            b.uuid.toLowerCase().startsWith(val) || b.key.startsWith(val);
          if (aStart && !bStart) return -1;
          if (!aStart && bStart) return 1;
          return 0;
        });
      } else {
        matched = this.stationOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(val) ||
            opt.uuid.toLowerCase().includes(val) ||
            opt.key.includes(val)
        );
      }
      const dropdown = $(".station_2_dropdown");
      dropdown.empty();
      if (matched.length > 0 && val.length > 0) {
        matched.forEach((opt) => {
          dropdown.append(
            `<div class='dropdown-item' data-uuid='${opt.uuid}'>${opt.label}</div>`
          );
        });
        dropdown.addClass("active");
      } else {
        dropdown.removeClass("active");
      }
    });
    $(document).on(
      "mousedown",
      ".station_2_dropdown .dropdown-item",
      (event) => {
        const uuid = $(event.target).data("uuid");
        const label = $(event.target).text();
        $(".station_2_search").val(label);
        this.GlobalManager.setting.rts2 = uuid;
        sessionStorage.setItem("rts2", uuid);
        $(".station_2_dropdown").removeClass("active");
      }
    );
    $(document).on("blur", ".station_2_search", (event) => {
      setTimeout(() => {
        $(".station_2_dropdown").removeClass("active");
      }, 150);
    });
  }
}

window.StationManager = new StationManager(
  window.GlobalManager,
  window.functionHandler,
  window.MarqueeManager
);
