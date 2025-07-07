const $newsAlertLi = $(".news_alert li");
const $newsAlert = $(".news_alert");
const $containerUl = $(".news-container ul");
const $containerLi = $(".news-container li");
let eew_msg = "目前發生有感地震，慎防強烈搖晃，就近避難 [趴下、掩護、穩住]";
let notice_msg =
  "地震無法有效預測，請勿在聊天室發表、轉載、引用或暗喻任何有關地震預測相關言論或文章，以免觸犯氣象法或是社會秩序維護法，也禁止討論任何政治議題，若有不當留言或名稱將直接刪除或封鎖。";

/********************************************************
	此代碼需搭配WS或者拉EWW，請自行設定執行函數傳入參數，例如:	*
	eew('這是地震速報');									*
	news('這是地震報告');									*
	notice('這是公告');									*
by.miyashooooo											*
********************************************************/

/**彈窗動畫**/
function animateNews(msg, callback, reportType = "台灣") {
  $newsAlertLi.text(msg);
  $newsAlert
    .css("display", "block")
    .animate({ width: "100%" }, global.ANIMATION_DURATION, function () {
      if (typeof callback == "function") {
        callback();
      }
    });
}

/**地震速報**/
function eew(eew_msg) {
  if (global.check_eew) return;
  global.check_eew = true;
  $containerLi.text("");
  const msgLength = eew_msg.length;
  const endPosition = -msgLength * 20;
  addStyle(endPosition);
  animateNews("地震速報", function () {
    $containerLi.text(eew_msg);
    $containerUl.css({
      animation: "unset",
      display: "block",
      textAlign: "center",
    });
    setTimeout(function () {
      $newsAlert.animate({ width: "255px" }, global.ANIMATION_DURATION);
      setTimeout(function () {
        global.check_eew = false;
        notice(notice_msg);
      }, 25000);
    }, 2000);
  });
}

let marqueeCounter = 0;
let endPos = 0;

/**地震報告**/
function news(msg, reportType = "台灣") {
  if (reportType === "台灣") {
    global.news_msg.tw = msg;
  } else if (reportType === "日本") {
    global.news_msg.jp = msg;
  }

  let currentMsg = "";
  if (reportType === "台灣") {
    currentMsg = global.news_msg.tw;
  } else if (reportType === "日本") {
    currentMsg = global.news_msg.jp;
  }

  const msgLength = currentMsg.length;
  const endPosition = -msgLength * 29;
  addStyle(endPosition);
  const pixelsPerSecond = 50;
  const animationDuration = (msgLength * 11) / pixelsPerSecond;

  const showReportType = global.news_msg.jp !== ""; // Check if jmaReport is present
  const alertTitle = showReportType ? `地震報告[${reportType}]` : `地震報告`;
  const alertWidth = showReportType ? "255px" : "175px";

  animateNews(
    alertTitle,
    function () {
      $containerLi.text(currentMsg);
      $containerUl.css("display", "block");
      if (global.newsAlertTimeoutId) {
        clearTimeout(global.newsAlertTimeoutId);
      }
      global.newsAlertTimeoutId = setTimeout(function () {
        resetMarquee();
        $containerUl.css(
          "animation",
          `scroll ${animationDuration}s infinite linear`
        );
        $newsAlert.animate({ width: alertWidth }, global.ANIMATION_DURATION);
      }, 2000);
    },
    reportType
  );
}

let counter = 0;

/**跑馬燈事件**/
$containerUl.on("animationiteration", function () {
  counter++;
  if (counter % 3 === 0) {
    if (global.news_msg.tw && global.news_msg.jp) {
      if (marqueeCounter % 2 === 0) {
        news(global.news_msg.tw, "台灣");
      } else {
        news(global.news_msg.jp, "日本");
      }
      marqueeCounter++;
    } else if (global.news_msg.tw) {
      news(global.news_msg.tw, "台灣");
    } else if (global.news_msg.jp) {
      news(global.news_msg.jp, "日本");
    } else {
      notice(notice_msg);
    }
  } else {
    notice(notice_msg);
  }
});

/**例行公告**/
function notice(notice_msg) {
  const msgLength = notice_msg.length;
  const endPosition = -msgLength * 33;
  addStyle(endPosition);
  resetMarquee();
  $newsAlert.animate({ width: "0px" }, global.ANIMATION_DURATION, function () {
    $newsAlert.css("display", "none");
  });
  $containerLi.text(notice_msg);
}

/**重置跑馬燈位置**/
function resetMarquee() {
  $containerUl
    .css({
      animation: "none",
      width: "auto",
    })
    .width();
  $containerUl.css("animation", `scroll 40s infinite linear`);
}
