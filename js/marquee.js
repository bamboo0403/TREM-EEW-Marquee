class MarqueeManager {
  constructor(GlobalManager) {
    this.GlobalManager = GlobalManager;
    this.$newsAlertDiv = $(".news_alert div");
    this.$newsAlert = $(".news_alert");
    this.$containerDiv = $(".news-container div");
    this.eew_initial_msg =
      "目前發生有感地震，慎防強烈搖晃，就近避難 [趴下、掩護、穩住]";
    this.eew_initial_msg_jp = "緊急地震速報です、強い揺れに注意してください";
    this.notice_initial_msg =
      "地震無法有效預測，請勿在聊天室發表、轉載、引用或暗喻任何有關地震預測相關言論或文章，以免觸犯氣象法或是社會秩序維護法，也禁止討論任何政治議題，若有不當留言或名稱將直接刪除或封鎖。";
    this.marqueeCounter = 0;
    this.currentPriority = 0;
    this.currentType = null;
    this.marqueeList = ["report", "jmaReport", "notice"];
    this.marqueeIndex = 0;
    this.setupEventListeners();
  }

  getPriority(type) {
    switch (type) {
      case "eew":
      case "jmaEEW":
        return 3;
      case "tsunami":
        return 2;
      case "report":
      case "jmaReport":
      case "news":
        return 1;
      case "notice":
      default:
        return 0;
    }
  }

  stopMarquee() {
    if (this.GlobalManager.newsAlertTimeoutId) {
      clearTimeout(this.GlobalManager.newsAlertTimeoutId);
      this.GlobalManager.newsAlertTimeoutId = null;
    }
    this.$newsAlert.stop(true, true);
    this.$containerDiv.stop(true, true);
    this.resetMarquee();
    this.$newsAlert.css("display", "none");
    this.$containerDiv.text("");
    this.currentPriority = 0;
    this.currentType = null;
  }

  getNextMarqueeType() {
    let list = [];
    if (this.GlobalManager.news_msg.tw) list.push("report");
    if (this.GlobalManager.news_msg.jp) list.push("jmaReport");
    list.push("notice");
    const listStr = list.join(",");
    const oldStr = this.marqueeList.join(",");
    if (listStr !== oldStr) {
      this.marqueeList = list;
      this.marqueeIndex = 0;
    }
    if (this.marqueeIndex >= this.marqueeList.length) this.marqueeIndex = 0;
    return this.marqueeList[this.marqueeIndex];
  }

  playMarqueeLoop() {
    const type = this.getNextMarqueeType();
    if (type === "report") {
      this.news(this.GlobalManager.news_msg.tw, "台灣");
    } else if (type === "jmaReport") {
      this.news(this.GlobalManager.news_msg.jp, "日本");
    } else {
      this.notice(this.notice_initial_msg);
    }
    this.marqueeIndex++;
  }

  playNextAfterHighPriority() {
    this.playMarqueeLoop();
  }

  animateNews(msg, callback) {
    this.$newsAlertDiv.text(msg);
    this.$newsAlert
      .css("display", "flex")
      .animate({ width: "100%" }, this.GlobalManager.ANIMATION_DURATION, () => {
        if (typeof callback === "function") callback();
      });
  }

  eew(eew_msg, type, id) {
    const priority = this.getPriority("eew");
    if (priority < this.currentPriority) return;
    if (priority > this.currentPriority) this.stopMarquee();
    this.currentPriority = priority;
    this.currentType = "eew";
    if (this.GlobalManager.check_eew[id]) return;
    this.GlobalManager.check_eew[id] = true;
    this.$containerDiv.text("");
    const endPosition = -eew_msg.length * 20;
    this.addStyle(endPosition);
    this.animateNews(type, () => {
      this.$containerDiv.text(eew_msg);
      this.$containerDiv.css({
        animation: "unset",
        display: "block",
        textAlign: "center",
      });
      setTimeout(() => {
        this.$newsAlert.animate(
          { width: "255px" },
          this.GlobalManager.ANIMATION_DURATION
        );
        setTimeout(() => {
          this.GlobalManager.check_eew[id] = false;
          this.currentPriority = 0;
          this.currentType = null;
          this.playNextAfterHighPriority();
        }, 25000);
      }, 2000);
    });
  }

  tsunami(data) {
    const now = Date.now();
    if (data.updateTime && now - data.updateTime > 259200000) {
      return;
    }
    const priority = this.getPriority("tsunami");
    if (priority < this.currentPriority) return;
    if (priority > this.currentPriority) this.stopMarquee();
    this.currentPriority = priority;
    this.currentType = "tsunami";
    const id = `${data?.earthquakeInfo?.earthquakeId}-${data?.updateTime}`;
    if (this.GlobalManager.check_tsunami[id]) return;
    this.GlobalManager.check_tsunami[id] = true;
    this.$containerDiv.text("");
    if (data.pageType === "warning" && data.additionalInfo) {
      const msg = data.additionalInfo;
      const endPosition = -msg.length * 29;
      this.addStyle(endPosition);
      const pixelsPerSecond = 50;
      const animationDuration = (msg.length * 11) / pixelsPerSecond;
      const alertTitle = "日本津波情報";
      const dummyElement = $("<span>")
        .css({
          "font-size": "2rem",
          "font-weight": "bold",
          "white-space": "nowrap",
          padding: "10px 24px",
          position: "absolute",
          visibility: "hidden",
        })
        .text(alertTitle)
        .appendTo("body");
      const alertWidth = `${dummyElement.outerWidth()}px`;
      dummyElement.remove();
      this.animateNews(alertTitle, () => {
        this.$containerDiv.text(msg);
        this.$containerDiv.css("display", "block");
        if (this.GlobalManager.newsAlertTimeoutId) {
          clearTimeout(this.GlobalManager.newsAlertTimeoutId);
        }
        this.GlobalManager.newsAlertTimeoutId = setTimeout(() => {
          this.resetMarquee();
          this.$containerDiv.css(
            "animation",
            `scroll ${animationDuration}s linear`
          );
          this.$newsAlert.animate(
            { width: alertWidth },
            this.GlobalManager.ANIMATION_DURATION
          );
          const onAnimationEnd = () => {
            this.$containerDiv.off("animationend", onAnimationEnd);
            this.$containerDiv.text("");
            setTimeout(() => {
              this._showTsunamiFlip(data, id, true);
            }, 1500);
          };
          this.$containerDiv.on("animationend", onAnimationEnd);
        }, 2000);
      });
      return;
    }
    this._showTsunamiFlip(data, id, false);
  }

  _showTsunamiFlip(data, id, fromAdditionalInfo) {
    let maxArrival = null;
    let maxArrivalStr = "";
    const list = data.warnings || data.observations || [];
    if (list.length > 0) {
      for (const item of list) {
        if (item.maxArrivalTime) {
          if (!maxArrival || item.maxArrivalTime > maxArrival) {
            maxArrival = item.maxArrivalTime;
          }
        }
      }
      if (maxArrival) {
        let t = maxArrival;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
          t = t.slice(5, 16);
        }
        maxArrivalStr = `これまでの最大到達時刻：${t}`;
      }
    }
    this.$containerDiv.html(
      `<div class="tsunami-flip-container"><div class="tsunami-flip-item"></div></div>`
    );
    const $flipItem = this.$containerDiv.find(".tsunami-flip-item");
    function getHeightHtml(heightStr, firstWave, maxArrivalTime) {
      let firstWaveStr = "";
      if (firstWave) {
        let t = firstWave;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
          t = t.slice(5, 16);
        }
        firstWaveStr = `、第一波：${t}`;
      }
      let maxArrivalStrLocal = "";
      if (maxArrivalTime) {
        let t = maxArrivalTime;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(t)) {
          t = t.slice(5, 16);
        }
        maxArrivalStrLocal = `、これまでの最大到達時刻：${t}`;
      }
      let displayHeightStr = heightStr.replace(
        /([\d.]+)m(以上)?/g,
        (match, p1, p2) => `${p1}メーター${p2 ? p2 : ""}`
      );
      const match = displayHeightStr.match(
        /([\d.]+)\s*(メーター|ft|フィート)?/i
      );
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2] || "メーター";
        let meterValue = value;
        if (unit.toLowerCase().includes("ft") || unit.includes("フィート")) {
          meterValue = value * 0.3048;
        }
        const rest = displayHeightStr.slice(match[0].length);
        if (meterValue >= 1) {
          return `<span style='color:#d32f2f;font-weight:bold;'>${match[0]}</span> ${rest}${firstWaveStr}${maxArrivalStrLocal}`;
        } else {
          return `<span style='color:#1976d2'>${match[0]}</span> ${rest}${firstWaveStr}${maxArrivalStrLocal}`;
        }
      } else {
        return `<span style='color:#1976d2'>${displayHeightStr}</span>${firstWaveStr}${maxArrivalStrLocal}`;
      }
    }
    const intervalMs = 3500;
    const self = this;
    function showWarning(idx) {
      if (idx >= list.length) {
        setTimeout(() => {
          self.GlobalManager.check_tsunami[id] = false;
          self.currentPriority = 0;
          self.currentType = null;
          setTimeout(() => {
            self.playNextAfterHighPriority();
          }, 1500);
        }, 500);
        return;
      }
      const item = list[idx];
      const area = item.area || item.location || "";
      $flipItem.removeClass("flip-in");
      setTimeout(() => {
        $flipItem.html(
          `<div>${area} ${getHeightHtml(
            item.height || "-",
            item.firstWave,
            item.maxArrivalTime
          )}</div>`
        );
        $flipItem.addClass("flip-in");
        setTimeout(() => {
          showWarning.call(self, idx + 1);
        }, intervalMs);
      }, 50);
    }
    this.addStyle(-300);
    if (!fromAdditionalInfo) {
      this.animateNews("日本津波情報", () => {
        this.$containerDiv.css({
          animation: "unset",
          display: "block",
          textAlign: "center",
        });
        setTimeout(() => {
          this.$newsAlert.animate(
            { width: "255px" },
            this.GlobalManager.ANIMATION_DURATION
          );
          showWarning.call(this, 0);
        }, 2000);
      });
    } else {
      this.$containerDiv.css({
        animation: "unset",
        display: "block",
        textAlign: "center",
      });
      setTimeout(() => {
        showWarning.call(this, 0);
      }, 0);
    }
  }

  news(msg, reportType = "台灣") {
    const priority = this.getPriority("news");
    if (priority < this.currentPriority) return;
    if (priority > this.currentPriority) this.stopMarquee();
    this.currentPriority = priority;
    this.currentType = "news";
    if (reportType === "台灣") {
      this.GlobalManager.news_msg.tw = msg;
    } else if (reportType === "日本") {
      this.GlobalManager.news_msg.jp = msg;
    }
    const currentMsg =
      reportType === "台灣"
        ? this.GlobalManager.news_msg.tw
        : this.GlobalManager.news_msg.jp;
    const endPosition = -currentMsg.length * 29;
    this.addStyle(endPosition);
    const pixelsPerSecond = 50;
    const animationDuration = (currentMsg.length * 11) / pixelsPerSecond;
    const showReportType = !!this.GlobalManager.news_msg.jp;
    const alertTitle = showReportType ? `${reportType}地震報告` : `地震報告`;
    const dummyElement = $("<span>")
      .css({
        "font-size": "2rem",
        "font-weight": "bold",
        "white-space": "nowrap",
        padding: "10px 24px",
        position: "absolute",
        visibility: "hidden",
      })
      .text(alertTitle)
      .appendTo("body");
    const alertWidth = `${dummyElement.outerWidth()}px`;
    dummyElement.remove();
    this.animateNews(alertTitle, () => {
      this.$containerDiv.text(currentMsg);
      this.$containerDiv.css("display", "block");
      if (this.GlobalManager.newsAlertTimeoutId) {
        clearTimeout(this.GlobalManager.newsAlertTimeoutId);
      }
      this.GlobalManager.newsAlertTimeoutId = setTimeout(() => {
        this.resetMarquee();
        this.$containerDiv.css(
          "animation",
          `scroll ${animationDuration}s infinite linear`
        );
        this.$newsAlert.animate(
          { width: alertWidth },
          this.GlobalManager.ANIMATION_DURATION
        );
      }, 2000);
    });
  }

  notice(notice_msg) {
    const priority = this.getPriority("notice");
    if (priority < this.currentPriority) return;
    if (priority > this.currentPriority) this.stopMarquee();
    this.currentPriority = priority;
    this.currentType = "notice";
    const endPosition = -notice_msg.length * 33;
    this.addStyle(endPosition);
    this.resetMarquee();
    this.$newsAlert.animate(
      { width: "0px" },
      this.GlobalManager.ANIMATION_DURATION,
      () => {
        this.$newsAlert.css("display", "none");
      }
    );
    this.$containerDiv.text(notice_msg);
  }

  setupEventListeners() {
    this.$containerDiv.on("animationiteration", () => {
      this.currentPriority = 0;
      this.currentType = null;
      this.playMarqueeLoop();
    });
  }

  resetMarquee() {
    this.$containerDiv.css({ animation: "none" }).width();
    this.$containerDiv.css("animation", `scroll 40s infinite linear`);
  }

  addStyle(endPosition) {
    $("#eew_style").remove();
    const style = $("<style>").attr("id", "eew_style").html(`
        @keyframes scroll {
          from { transform: translateX(100%); }
          to { transform: translateX(${endPosition}px); }
        }
      `);
    $("head").append(style);
  }
}

window.MarqueeManager = new MarqueeManager(window.GlobalManager);
