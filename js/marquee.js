/********************************************************
	此代碼需搭配WS或者拉EWW，請自行設定執行函數傳入參數，例如:	*
	eew('這是地震速報');									*
	news('這是地震報告');									*
	notice('這是公告');									*
by.miyashooooo											*
********************************************************/

class MarqueeManager {
  constructor(GlobalManager) {
    this.GlobalManager = GlobalManager;
    this.$newsAlertDiv = $(".news_alert div");
    this.$newsAlert = $(".news_alert");
    this.$containerDiv = $(".news-container div");
    this.eew_initial_msg =
      "目前發生有感地震，慎防強烈搖晃，就近避難 [趴下、掩護、穩住]";
    this.notice_initial_msg =
      "地震無法有效預測，請勿在聊天室發表、轉載、引用或暗喻任何有關地震預測相關言論或文章，以免觸犯氣象法或是社會秩序維護法，也禁止討論任何政治議題，若有不當留言或名稱將直接刪除或封鎖。";
    this.marqueeCounter = 0;
    this.counter = 0;
    this.setupEventListeners();
  }

  animateNews(msg, callback) {
    this.$newsAlertDiv.text(msg);
    this.$newsAlert
      .css("display", "flex")
      .animate({ width: "100%" }, this.GlobalManager.ANIMATION_DURATION, () => {
        if (typeof callback === "function") callback();
      });
  }

  eew(eew_msg) {
    if (this.GlobalManager.check_eew) return;
    this.GlobalManager.check_eew = true;
    this.$containerDiv.text("");
    const endPosition = -eew_msg.length * 20;
    this.addStyle(endPosition);
    this.animateNews("地震速報", () => {
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
          this.GlobalManager.check_eew = false;
          this.notice(this.notice_initial_msg);
        }, 25000);
      }, 2000);
    });
  }

  news(msg, reportType = "台灣") {
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
      this.counter++;
      if (this.counter % 3 === 0) {
        if (this.GlobalManager.news_msg.tw && this.GlobalManager.news_msg.jp) {
          const nextType = this.marqueeCounter % 2 === 0 ? "台灣" : "日本";
          this.news(
            nextType === "台灣"
              ? this.GlobalManager.news_msg.tw
              : this.GlobalManager.news_msg.jp,
            nextType
          );
          this.marqueeCounter++;
        } else if (this.GlobalManager.news_msg.tw) {
          this.news(this.GlobalManager.news_msg.tw, "台灣");
        } else if (this.GlobalManager.news_msg.jp) {
          this.news(this.GlobalManager.news_msg.jp, "日本");
        } else {
          this.notice(this.notice_initial_msg);
        }
      } else {
        this.notice(this.notice_initial_msg);
      }
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
