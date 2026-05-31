// ========== 傭兵用多機能ツール ver1.6.1 ==========
// 変更履歴:
// - 履歴レイアウト改修: 削除ボタンを時間の隣に移動
// - LAP超過音声通知機能追加（デフォルトOFF、localStorage保存、ビープ音1800Hz→1600Hz）
// - スマホ表示対応のため+/-ボタン削除（プルダウンのみ）

(function (global) {

  const ExpCalc = {
    // ----- タイマー状態 -----
    timer: null,
    startTime: 0,
    pauseSec: 0,
    lastLapSec: 0,
    jobOffsetSec: 0,
    passbookOffset: 0,
    killCount: 0,
    optCallCount: 1,
    calcLockedUntil: 0,
    ritaOrKuma: "returner",
    lapNotifyEnabled: false,
    lapNotifyFired: false,
    audioCtx: null,

    // ----- 定数 -----
    CALL_LABELS: ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],

    PARTNER_EXP: {
      none:     0,
      mk:       48240,
      hm1:      12060,
      hm2:      24120,
      hm3:      36180,
      tappitsu: 4800,
      gn:       2240,
      sn:       1120,
      zucchini: 9010,
    },

    EXP_PER_LV: 1589326,

    CSV2_TABLE: (function () {
      const rows = [
        ["genki","×","×","×","通帳なし","durahan"],
        ["genki","×","×","×","通帳1",  "durahan"],
        ["genki","×","×","×","通帳2",  "durahan"],
        ["genki","×","×","○","通帳なし","rita_or_kuma"],
        ["genki","×","×","○","通帳1",  "rita_or_kuma"],
        ["genki","×","×","○","通帳2",  "rita_or_kuma"],
        ["genki","×","○","×","通帳なし","rita_or_kuma"],
        ["genki","×","○","×","通帳1",  "durahan"],
        ["genki","×","○","×","通帳2",  "durahan"],
        ["genki","×","○","○","通帳なし","rita_or_kuma"],
        ["genki","×","○","○","通帳1",  "rita_or_kuma"],
        ["genki","×","○","○","通帳2",  "rita_or_kuma"],
        ["genki","○","×","×","通帳なし","durahan"],
        ["genki","○","×","×","通帳1",  "durahan"],
        ["genki","○","×","×","通帳2",  "durahan"],
        ["genki","○","×","○","通帳なし","durahan"],
        ["genki","○","×","○","通帳1",  "durahan"],
        ["genki","○","×","○","通帳2",  "durahan"],
        ["genki","○","○","×","通帳なし","durahan"],
        ["genki","○","○","×","通帳1",  "durahan"],
        ["genki","○","○","×","通帳2",  "durahan"],
        ["genki","○","○","○","通帳なし","durahan"],
        ["genki","○","○","○","通帳1",  "durahan"],
        ["genki","○","○","○","通帳2",  "durahan"],
        ["bakushin","×","×","×","通帳なし","durahan"],
        ["bakushin","×","×","×","通帳1",  "durahan"],
        ["bakushin","×","×","×","通帳2",  "durahan"],
        ["bakushin","×","×","○","通帳なし","durahan"],
        ["bakushin","×","×","○","通帳1",  "durahan"],
        ["bakushin","×","×","○","通帳2",  "durahan"],
        ["bakushin","×","○","×","通帳なし","durahan"],
        ["bakushin","×","○","×","通帳1",  "durahan"],
        ["bakushin","×","○","×","通帳2",  "durahan"],
        ["bakushin","×","○","○","通帳なし","durahan"],
        ["bakushin","×","○","○","通帳1",  "durahan"],
        ["bakushin","×","○","○","通帳2",  "durahan"],
        ["bakushin","○","×","×","通帳なし","durahan"],
        ["bakushin","○","×","×","通帳1",  "durahan"],
        ["bakushin","○","×","×","通帳2",  "durahan"],
        ["bakushin","○","×","○","通帳なし","durahan"],
        ["bakushin","○","×","○","通帳1",  "durahan"],
        ["bakushin","○","×","○","通帳2",  "durahan"],
        ["bakushin","○","○","×","通帳なし","durahan"],
        ["bakushin","○","○","×","通帳1",  "durahan"],
        ["bakushin","○","○","×","通帳2",  "durahan"],
        ["bakushin","○","○","○","通帳なし","rita_or_kuma"],
        ["bakushin","○","○","○","通帳1",  "durahan"],
        ["bakushin","○","○","○","通帳2",  "durahan"],
      ];
      const map = {};
      rows.forEach(([elix,tr,ag,em,pb,result]) => {
        const key = `${elix}|${tr}|${ag}|${em}|${pb}`;
        map[key] = result;
      });
      return map;
    })(),

    CSV1_TABLE: (function () {
      const rows = [
        ["returner",false,false,false,true,false,"genki",11],
        ["returner",false,false,true,true,false,"none",11],
        ["returner",false,false,true,true,false,"genki",10],
        ["returner",true,false,false,true,false,"genki",10],
        ["returner",true,false,true,true,false,"none",10],
        ["returner",true,false,true,true,false,"genki",8],
        ["durahan",false,false,false,false,false,"genki",12],
        ["durahan",false,false,false,false,true,"genki",12],
        ["durahan",false,false,false,true,false,"none",9],
        ["durahan",false,false,false,true,false,"genki",7],
        ["durahan",false,false,false,true,true,"genki",12],
        ["durahan",false,false,true,false,false,"none",12],
        ["durahan",false,false,true,false,false,"genki",9],
        ["durahan",false,false,true,false,true,"none",12],
        ["durahan",false,false,true,false,true,"genki",9],
        ["durahan",false,false,true,true,false,"none",7],
        ["durahan",false,false,true,true,false,"genki",6],
        ["durahan",false,false,true,true,false,"bakushin",11],
        ["durahan",false,false,true,true,true,"none",12],
        ["durahan",false,false,true,true,true,"genki",9],
        ["durahan",false,true,false,true,false,"bakushin",11],
        ["durahan",false,true,true,true,false,"genki",11],
        ["durahan",false,true,true,true,false,"bakushin",9],
        ["durahan",true,false,false,false,false,"genki",10],
        ["durahan",true,false,false,false,true,"genki",10],
        ["durahan",true,false,false,true,false,"none",8],
        ["durahan",true,false,false,true,false,"genki",6],
        ["durahan",true,false,false,true,false,"bakushin",12],
        ["durahan",true,false,false,true,true,"genki",10],
        ["durahan",true,false,true,false,false,"none",10],
        ["durahan",true,false,true,false,false,"genki",8],
        ["durahan",true,false,true,false,true,"none",10],
        ["durahan",true,false,true,false,true,"genki",8],
        ["durahan",true,false,true,true,false,"none",6],
        ["durahan",true,false,true,true,false,"genki",5],
        ["durahan",true,false,true,true,false,"bakushin",10],
        ["durahan",true,false,true,true,true,"none",10],
        ["durahan",true,false,true,true,true,"genki",8],
        ["durahan",true,true,false,true,false,"genki",12],
        ["durahan",true,true,false,true,false,"bakushin",10],
        ["durahan",true,true,true,false,false,"bakushin",12],
        ["durahan",true,true,true,false,true,"bakushin",12],
        ["durahan",true,true,true,true,false,"none",12],
        ["durahan",true,true,true,true,false,"genki",10],
        ["durahan",true,true,true,true,false,"bakushin",9],
        ["durahan",true,true,true,true,true,"bakushin",12],
        ["dearthlicant",false,false,false,true,false,"genki",10],
        ["dearthlicant",false,false,true,true,false,"none",10],
        ["dearthlicant",false,false,true,true,false,"genki",8],
        ["dearthlicant",true,false,false,true,false,"none",12],
        ["dearthlicant",true,false,false,true,false,"genki",9],
        ["dearthlicant",true,false,true,false,false,"genki",12],
        ["dearthlicant",true,false,true,false,true,"genki",12],
        ["dearthlicant",true,false,true,true,false,"none",9],
        ["dearthlicant",true,false,true,true,false,"genki",7],
        ["dearthlicant",true,false,true,true,true,"genki",12],
      ];
      const map = {};
      rows.forEach(([mid,food,tr,em,ag,pb,elix,num]) => {
        const key = `${mid}|${food}|${tr}|${em}|${ag}|${pb}|${elix}`;
        map[key] = num;
      });
      return map;
    })(),

    lookupOptimalMonster: function () {
      const elixir = document.querySelector('input[name="e_exp"]:checked')?.value || "none";
      const tr     = this.$("tr").checked ? "○" : "×";
      const ag     = this.$("ag").checked ? "○" : "×";
      const em     = this.$("em").checked ? "○" : "×";
      const pbVal  = this.$("pb").value;
      const pb     = pbVal === "5000000" ? "通帳1" : pbVal === "10000000" ? "通帳2" : "通帳なし";

      if (elixir === "none") return "durahan";

      const key = `${elixir}|${tr}|${ag}|${em}|${pb}`;
      const result = this.CSV2_TABLE[key];
      if (!result) return "durahan";

      if (result === "rita_or_kuma") {
        return this.ritaOrKuma || "returner";
      }
      return result;
    },

    lookupOptimalCallCount: function () {
      const ms     = this.$("ms").value;
      const food   = this.$("fd").checked;
      const tr     = this.$("tr").checked;
      const em     = this.$("em").checked;
      const ag     = this.$("ag").checked;
      const pbVal  = this.$("pb").value;
      const pb     = pbVal !== "0";
      const elixir = document.querySelector('input[name="e_exp"]:checked')?.value || "none";

      const key = `${ms}|${food}|${tr}|${em}|${ag}|${pb}|${elixir}`;
      if (this.CSV1_TABLE[key] !== undefined) {
        return this.CSV1_TABLE[key];
      }

      const isHighLimit = elixir === "bakushin" || tr;
      const expLimit = isHighLimit ? 1499999 : 599999;
      let opt = 1;
      for (let i = 1; i <= 12; i++) {
        if (this.calcExp(i).common < expLimit) opt = i;
        else break;
      }
      return opt;
    },

    $: function (id) {
      return document.getElementById(id);
    },

    formatTime: function (sec) {
      if (isNaN(sec) || sec < 0 || sec === Infinity) return "00:00.00";
      const minutes = Math.floor(sec / 60);
      const seconds = (sec % 60).toFixed(2).padStart(5, "0");
      return `${minutes.toString().padStart(2, "0")}:${seconds}`;
    },

    getRate: function () {
      let rate = 1.0;
      if (this.$("fd").checked) rate += 0.3;
      const elixirType = document.querySelector('input[name="e_exp"]:checked')?.value || "none";
      if (elixirType === "genki")   rate += 1;
      if (elixirType === "bakushin") rate += 2;
      if (this.$("tr").checked) rate += 1;
      if (this.$("em").checked) rate += 1;
      return rate;
    },

    applyLimit: function (val, limit) {
      const rounded = Math.round(val);
      const isNearInt = Math.abs(val - rounded) < 0.1;
      const ceiled = this.$("fd").checked && isNearInt ? rounded + 1 : Math.ceil(val);
      return Math.min(ceiled, limit);
    },

    calcExp: function (callCount, partnerKey = "none", snap = null) {
      let baseExp, bonusExp;
      if (snap) {
        const msOption = document.querySelector(`#ms option[value="${snap.ms}"]`);
        baseExp  = parseInt(msOption?.dataset.base)  || 0;
        bonusExp = parseInt(msOption?.dataset.bonus) || 0;
      } else {
        const selectedOption = this.$("ms").options[this.$("ms").selectedIndex];
        baseExp  = parseInt(selectedOption.dataset.base)  || 0;
        bonusExp = parseInt(selectedOption.dataset.bonus) || 0;
      }

      const fd       = snap ? snap.fd       : this.$("fd").checked;
      const tr       = snap ? snap.tr       : this.$("tr").checked;
      const ag       = snap ? snap.ag       : this.$("ag").checked;
      const em       = snap ? snap.em       : this.$("em").checked;
      const elixir   = snap ? snap.elixir   : (document.querySelector('input[name="e_exp"]:checked')?.value || "none");
      const pbVal    = snap ? snap.pb       : this.$("pb").value;

      let rate = 1.0;
      if (fd) rate += 0.3;
      if (elixir === "genki")    rate += 1;
      if (elixir === "bakushin") rate += 2;
      if (tr) rate += 1;
      if (em) rate += 1;

      const applyLimitWithFd = (val, limit) => {
        const rounded   = Math.round(val);
        const isNearInt = Math.abs(val - rounded) < 0.1;
        const ceiled    = fd && isNearInt ? rounded + 1 : Math.ceil(val);
        return Math.min(ceiled, limit);
      };

      const partnerExpVal = this.PARTNER_EXP[partnerKey] || 0;
      const hasAngel      = ag;
      const passbookLimit = parseInt(pbVal) || 0;
      const hasPassbook   = passbookLimit > 0;

      const isHighLimit = elixir === "bakushin" || tr;
      const expLimit    = isHighLimit ? 1499999 : 599999;
      const angelLimit  = 599999;

      const rawCommonPerKill = baseExp * rate + bonusExp;
      const rawAngelPerKill  = hasAngel ? baseExp * 2 : 0;
      const rawPartnerCommon = partnerExpVal * rate;
      const rawPartnerAngel  = hasAngel ? partnerExpVal * 2 : 0;

      const rawTotalCommon = rawCommonPerKill * callCount + rawPartnerCommon;
      const rawTotalAngel  = rawAngelPerKill  * callCount + rawPartnerAngel;
      const rawTotal       = rawTotalCommon + rawTotalAngel;

      if (hasPassbook) {
        const commonCapped = Math.min(rawTotalCommon, expLimit);
        const angelCapped  = Math.min(rawTotalAngel, angelLimit);
        const totalOverflow = (rawTotalCommon - commonCapped) + (rawTotalAngel - angelCapped);
        const common = applyLimitWithFd(commonCapped, expLimit);
        const angel  = Math.min(Math.ceil(angelCapped), angelLimit);
        return {
          total:           common + angel,
          common,
          angel,
          overflow:        Math.ceil(totalOverflow),
          rawTotalCapped:  commonCapped + angelCapped,
          rawCommonCapped: commonCapped,
          rawAngelCapped:  angelCapped,
        };
      } else {
        const cappedTotal = Math.min(rawTotal, expLimit);
        const total = applyLimitWithFd(cappedTotal, expLimit);
        return {
          total,
          common:          total,
          angel:           0,
          overflow:        Math.ceil(rawTotal - cappedTotal),
          rawTotalCapped:  cappedTotal,
          rawCommonCapped: cappedTotal,
          rawAngelCapped:  0,
        };
      }
    },

    playLapWarning: function () {
      try {
        if (!this.audioCtx) {
          this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = this.audioCtx;
        const playBeep = (freq, startTime, duration) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.9, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        playBeep(1800, ctx.currentTime,        0.25);
        playBeep(1600, ctx.currentTime + 0.35, 0.35);
      } catch (e) {}
    },

    updateUI: function (autoSetCount = false) {
      const passbookLimit = parseInt(this.$("pb").value) || 0;
      const passbookArea  = this.$("passbookArea");

      if (passbookLimit > 0) {
        passbookArea.classList.remove("hidden");
        this.$("passbookLimitText").textContent = passbookLimit.toLocaleString();
      } else {
        passbookArea.classList.add("hidden");
      }

      this.calcOptimalCallCount();
      if (autoSetCount) this.$("cn").value = this.optCallCount;

      const callCount = parseInt(this.$("cn").value);
      const expResult = this.calcExp(callCount);

      this.$("currentExpDisplay").textContent = expResult.total.toLocaleString();
      this.$("overflowDisplay").style.visibility = expResult.overflow > 0 ? "visible" : "hidden";
      this.$("overflowDisplay").textContent = `溢れ:${expResult.overflow.toLocaleString()}`;
    },

    calcOptimalCallCount: function () {
      this.optCallCount = this.lookupOptimalCallCount();
    },

    getAverageLapSec: function () {
      const lapTimes = [];
      document.querySelectorAll(".exp-row").forEach(el => {
        if (el.dataset.lap && el.dataset.lap !== "-1" &&
            el.dataset.type !== "lap_only" && el.dataset.type !== "job" &&
            el.dataset.main === "true") {
          lapTimes.push(parseFloat(el.dataset.lap));
        }
      });
      if (lapTimes.length === 0) return null;
      return lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    },

    addRow: function (rowId, callCount, expVal, rowType, elapsedSec, lapSec, isMain = false, rawCapped = null, monsterId = null, hasDeathPenalty = false) {
      const row = document.createElement("div");
      row.className = "exp-row h";
      row.dataset.val         = expVal;
      row.dataset.rawValCapped = rawCapped !== null ? rawCapped : expVal;

      const snapshot = {
        fd: this.$("fd").checked,
        tr: this.$("tr").checked,
        ag: this.$("ag").checked,
        em: this.$("em").checked,
        elixir: document.querySelector('input[name="e_exp"]:checked')?.value || "none",
        pb: this.$("pb").value,
        ms: monsterId || this.$("ms").value,
      };
      row.dataset.snapshot    = JSON.stringify(snapshot);
      row.dataset.type        = rowType;
      row.dataset.sec         = elapsedSec;
      row.dataset.lap         = lapSec != null ? lapSec : -1;
      row.dataset.main        = isMain;
      row.dataset.count       = callCount;
      row.dataset.bid         = rowId;
      row.dataset.monsterId   = monsterId || this.$("ms").value;
      row.dataset.desp        = hasDeathPenalty ? "true" : "false";

      const TYPE_LABEL = {
        pass:     "[通]",
        angel:    "[エ]",
        overflow: "[溢]",
        normal:   "",
        lap_only: "[LAP]",
        job:      "転職",
      };
      const TYPE_COLOR = {
        pass:     "#f88",
        angel:    "#5a9eff",
        overflow: "#aaa",
        lap_only: "#2cc9ff",
        job:      "#00bcd4",
      };

      const rowIdHtml = rowId === "LAP"
        ? `<span class="row-id-lap">LAP</span>`
        : `<span class="row-id-normal">#${rowId}</span>`;

      const timeWithDelHtml =
        `<div style="display:flex; align-items:center; gap:4px; width:85px;">` +
        `<div class="time-cell">` +
        `<div class="time-main">${this.formatTime(elapsedSec)}</div>` +
        (lapSec != null && lapSec >= 0
          ? `<div class="time-lap">L ${this.formatTime(lapSec)}</div>`
          : "") +
        `</div>` +
        `<button class="del" style="font-size:16px; padding:0 2px;">×</button>` +
        `</div>`;

      let expHtml;
      if (rowId === "LAP") {
        expHtml = `<div class="exp-cell-lap">LAP MARK</div>`;
      } else if (rowType === "job") {
        expHtml =
          `<div class="exp-cell">` +
          `<span class="exp-label" style="color:${TYPE_COLOR[rowType]}">${TYPE_LABEL[rowType]}</span>` +
          `</div>`;
      } else {
        expHtml =
          `<div class="exp-cell">` +
          `<strong class="exp-value">${expVal.toLocaleString()}</strong>` +
          `<span class="exp-label" style="color:${TYPE_COLOR[rowType]}">${TYPE_LABEL[rowType]}</span>` +
          `</div>`;
      }

      const deathPenaltyHtml =
        `<label class="desp-label">` +
        `<input type="checkbox" class="desp-tgl" ${hasDeathPenalty ? "checked" : ""}>` +
        `<span class="desp-icon">💀</span></label>`;

      const controlsHtml = (rowId !== "LAP" && rowType !== "job")
        ? `<div class="row-controls" style="display:flex; gap:4px; align-items:center; flex:1;">` +
          `<select class="rs" style="flex:1.2;">` +
          `${this.getPartnerOptions(row.dataset.monsterId)}</select>` +
          `<select class="cs" style="width:55px;">` +
          `${this.CALL_LABELS.map((label, i) =>
            i > 0 ? `<option value="${i}" ${i == callCount ? "selected" : ""}>${label}</option>` : ""
          ).join("")}` +
          `</select>` +
          `</div>`
        : `<div class="row-controls-placeholder">----------</div>`;

      row.innerHTML =
        rowIdHtml +
        timeWithDelHtml +
        expHtml +
        deathPenaltyHtml +
        controlsHtml;

      if (rowId !== "LAP" && rowType !== "job") {
        const self = this;

        const recalcRowExp = () => {
          const snap = JSON.parse(row.dataset.snapshot);
          const newCallCount  = parseInt(row.querySelector(".cs").value);
          const newPartnerKey = row.querySelector(".rs").value;
          row.dataset.count   = newCallCount;
          const expResult     = self.calcExp(newCallCount, newPartnerKey, snap);
          const newExpVal     = row.dataset.type === "angel"   ? expResult.angel
                              : row.dataset.type === "pass"    ? expResult.common
                              : expResult.total;
          row.dataset.val          = newExpVal;
          row.dataset.rawValCapped = newExpVal;
          row.querySelector(".exp-value").textContent = newExpVal.toLocaleString();

          self.updateTotal();
        };

        const csSelect = row.querySelector(".cs");
        csSelect.onchange = recalcRowExp;

        const rsSelect = row.querySelector(".rs");
        rsSelect.onchange = recalcRowExp;

        const despCheckbox = row.querySelector(".desp-tgl");
        if (despCheckbox) {
          despCheckbox.onchange = () => {
            row.dataset.desp = despCheckbox.checked ? "true" : "false";
            self.updateTotal();
          };
        }
      }

      const delBtn = row.querySelector(".del");
      if (delBtn) {
        delBtn.onclick = () => {
          const deletedType = row.dataset.type;
          const deletedBid  = row.dataset.bid;

          if (deletedType !== "angel") {
            document.querySelectorAll(".exp-row").forEach(r => {
              if (r !== row && r.dataset.bid === deletedBid && r.dataset.type === "angel") {
                r.remove();
              }
            });
          }
          row.remove();
          this._renumberRows();
          this._recalcLaps();
          this.updateTotal();
        };
      }

      this.$("rowHistory").prepend(row);
      this.updateTotal();
    },

    _renumberRows: function () {
      let num = 1;
      const rows = Array.from(document.querySelectorAll(".exp-row")).reverse();
      rows.forEach(r => {
        const type = r.dataset.type;
        if (type === "lap_only" || type === "job") return;
        const bid = r.dataset.bid;
        if (bid === "LAP") return;
        if (r.dataset.type === "angel") {
          const rowIdEl = r.querySelector(".row-id-normal");
          if (rowIdEl) rowIdEl.textContent = `#${num - 1}`;
        } else {
          r.dataset.bid = num;
          const rowIdEl = r.querySelector(".row-id-normal");
          if (rowIdEl) rowIdEl.textContent = `#${num}`;
          num++;
        }
      });
      this.killCount = num - 1;
    },

    _recalcLaps: function () {
      const rows = Array.from(document.querySelectorAll(".exp-row")).reverse();
      let prevSec = 0;
      rows.forEach(r => {
        const sec = parseFloat(r.dataset.sec);
        if (isNaN(sec)) return;
        const lap = sec - prevSec;
        r.dataset.lap = lap;
        const lapEl = r.querySelector(".time-lap");
        if (lapEl) lapEl.textContent = `L ${this.formatTime(lap)}`;
        prevSec = sec;
      });
      const allRows = document.querySelectorAll(".exp-row");
      if (allRows.length > 0) {
        const latestSec = parseFloat(allRows[0].dataset.sec);
        if (!isNaN(latestSec)) this.lastLapSec = latestSec;
      } else {
        this.lastLapSec = 0;
      }
    },

    updateTotal: function () {
      let totalExp    = 0;
      let passbookExp = 0;
      let lapTimes    = [];
      let penaltyMin  = 0;
      let penaltyMax  = 0;

      document.querySelectorAll(".exp-row").forEach(el => {
        const expVal = parseInt(el.dataset.val) || 0;
        if (!isNaN(expVal)) {
          totalExp += expVal;
          if (el.dataset.type === "pass") passbookExp += expVal;
        }

        if (
          el.dataset.lap &&
          el.dataset.lap !== "-1" &&
          el.dataset.type !== "lap_only" &&
          el.dataset.type !== "job" &&
          el.dataset.main === "true"
        ) {
          lapTimes.push(parseFloat(el.dataset.lap));
        }

        if (
          el.dataset.desp === "true" &&
          el.dataset.lap &&
          el.dataset.lap !== "-1" &&
          el.dataset.type !== "lap_only" &&
          el.dataset.type !== "job"
        ) {
          const rawCapped = parseFloat(el.dataset.rawValCapped) || parseInt(el.dataset.val) || 0;
          const lapSec    = parseFloat(el.dataset.lap);
          if (lapSec > 6.45) {
            penaltyMin += rawCapped * (6.45 / lapSec);
            penaltyMax += rawCapped * (2.58 / lapSec);
          }
        }
      });

      this.$("totalExpDisplay").textContent = Math.ceil(totalExp).toLocaleString();

      const passbookLimit = parseInt(this.$("pb").value) || 0;
      if (passbookLimit > 0) {
        const remaining = Math.max(0, passbookExp - this.passbookOffset);
        this.$("passbookExpDisplay").textContent = Math.ceil(remaining).toLocaleString();
      }

      const hasPenalty = document.querySelectorAll('.exp-row[data-desp="true"]').length > 0;
      const penaltyRef = this.$("penaltyRef");
      if (hasPenalty && penaltyMin > 0) {
        penaltyRef.style.display = "block";
        penaltyRef.innerHTML =
          `デスペナ想定:<br>${Math.ceil(penaltyMax).toLocaleString()}～${Math.ceil(penaltyMin).toLocaleString()}`;
      } else {
        penaltyRef.style.display = "none";
      }

      if (lapTimes.length > 0) {
        const avgSec = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        this.$("avgTimeDisplay").textContent = this.formatTime(avgSec);
        if (avgSec > 0.01) {
          const battles30min = Math.floor(1800 / avgSec);
          const expPerBattle = totalExp / (lapTimes.length || 1);
          this.$("estimatedGoldDisplay").textContent =
            `${Math.round(expPerBattle * battles30min / 1e4)}万～` +
            `${Math.round(expPerBattle * (battles30min + 1) / 1e4)}万`;
        } else {
          this.$("estimatedGoldDisplay").textContent = "--";
        }
      } else {
        this.$("avgTimeDisplay").textContent = "--:--.--";
        this.$("estimatedGoldDisplay").textContent = "--";
      }
    },

    getPartnerOptions: function (monsterId) {
      const baseOptions =
        `<option value="none">お供無</option>` +
        `<option value="hm1">はぐメタ1</option>` +
        `<option value="hm2">はぐメタ2</option>` +
        `<option value="hm3">はぐメタ3</option>` +
        `<option value="mk">メタキン</option>` +
        `<option value="gn">ゲノミー</option>` +
        `<option value="sn">仙人</option>`;
      return monsterId === "dearthlicant"
        ? baseOptions + `<option value="zucchini">ズッキ祖</option>`
        : baseOptions;
    },

    updateTimerDisplay: function (elapsedSec) {
      this.$("timerDisplay").textContent    = this.formatTime(elapsedSec);
      this.$("lapTimeDisplay").textContent  = this.formatTime(elapsedSec - this.lastLapSec);
      const syncSec = Math.max(0, elapsedSec - this.jobOffsetSec);
      this.$("syncDisplay").innerHTML = syncSec > 0
        ? `オプション持続: ${this.formatTime(syncSec)}`
        : "&nbsp;";
    },

    render: function (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const self = this;

      const savedNotify = localStorage.getItem('dqx_lap_notify');
      if (savedNotify !== null) {
        this.lapNotifyEnabled = savedNotify === 'true';
      }

      container.innerHTML = `
<style>
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;padding:0}
  .c{max-width:none;width:100%;margin:0;padding:0;background:transparent;border:none;border-radius:0;font-family:sans-serif;color:#333;line-height:1.25}
  select,input,button{font-family:inherit}
  .h{display:flex;align-items:center;padding:6px 4px;border-bottom:1px solid #eee;font-size:12px;white-space:nowrap;gap:4px}
  .btn-primary{background:#0066cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.2)}
  .btn-danger{background:#e74c3c;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer}
  .btn-info{background:#3498db;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer}
  .btn-warning{background:#fff1f0;border:1px solid #ffa39e;color:#cf1322;border-radius:4px;font-weight:bold;cursor:pointer}
  .btn-teal{background:#00bcd4;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer}
  .panel-bg{background:#f9f9f9;border:1px solid #eee;border-radius:6px}
  .rs,.cs{font-size:12px;padding:2px 4px;min-width:52px}
  .rs{flex:1.2}
  .mono-digit{font-family:'Verdana',system-ui,sans-serif;font-variant-numeric:tabular-nums}
  #timerDisplay,#lapTimeDisplay,#avgTimeDisplay,#passbookExpDisplay,#passbookLimitText{font-family:'Verdana',system-ui,sans-serif;font-variant-numeric:tabular-nums}
  #passbookExpDisplay,#passbookLimitText{font-size:15px;font-weight:bold}
  .timer-row{background:#f8f9fc;border-radius:6px;padding:6px 8px;margin-bottom:6px}
  label{color:#000}
  .text-orange{color:#f39c12}
  .text-green{color:#27ae60}
  .text-cyan{color:#2cc9ff}
  .text-red{color:#e74c3c}
  .sync-small{font-size:9px;color:#888;text-align:right;height:14px;line-height:14px}
  .lap-display{font-size:18px;font-weight:bold;color:#2cc9ff;line-height:24px}
  .timer-right{text-align:right}
  .penalty-ref{font-size:11px;color:#ff6666;margin-top:4px;white-space:pre-line}
  .passbook-area{background:#f0f7ff;border-radius:6px;padding:4px 8px;display:flex;flex-direction:column;gap:3px}
  .passbook-area.hidden{display:none}
  .passbook-info{font-size:13px;text-align:center;font-weight:bold}
  .passbook-buttons{display:flex;gap:6px;justify-content:center}
  .passbook-buttons button{background:#06c;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;flex:1}
  #ms{text-align:center}
  #ms,#pb,#cn,.rs,.cs{border-color:#7ab8ff}
  #btnTimerStop{background:#008888;color:#fff;border:1px solid #00aaaa;border-radius:4px;cursor:pointer;font-weight:bold;padding:2px}
  .btn-copy{background:#008888;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;display:flex;align-items:center;justify-content:center;padding:4px 8px;font-size:12px}
  .btn-oc{background:#fff1f0;border:1px solid #ffa39e;color:#cf1322;border-radius:4px;padding:6px 12px;font-size:12px;cursor:pointer;margin-right:8px}
  .btn-rita-kuma{transition:background 0.15s,color 0.15s,border-color 0.15s}
  .btn-rita-kuma.active-rita-kuma{background:#e8f0ff!important;color:#06c!important;border-color:#7ab8ff!important}
  .btn-rita-kuma:not(.active-rita-kuma){background:#f5f5f5!important;color:#888!important;border-color:#bbb!important}
  
  .exp-card{background:#f0f7ff;border:1px solid #7ab8ff;border-radius:6px}
  .opt-button{background:#f0f7ff;border:1px solid #7ab8ff;border-radius:6px}
  .monster-select{background:#f0f7ff}
  .reward-card{background:#f0f7ff}
  
  .row-id-lap{color:#2cc9ff;font-weight:bold;width:26px;font-size:10px}
  .row-id-normal{color:#999;width:26px;font-size:10px}
  .time-cell{font-family:'Verdana',system-ui,sans-serif;font-variant-numeric:tabular-nums;width:65px}
  .time-main{font-size:11px;font-weight:bold}
  .time-lap{color:#2cc9ff;font-size:10px}
  .exp-cell{width:85px}
  .exp-cell-lap{width:85px;color:#aaa;font-size:10px}
  .exp-value{font-size:13px;min-width:58px;text-align:right;font-family:'Verdana',system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .exp-label{font-size:10px}
  .desp-label{margin:0 2px;display:inline-flex;align-items:center}
  .desp-icon{font-size:9px}
  .del{border:none;background:none;color:#aaa;cursor:pointer;font-size:16px;padding:0 2px}
  .row-controls{display:flex;gap:4px;flex:1;align-items:center}
  .row-controls-placeholder{flex:1;color:#aaa;text-align:center;font-size:10px}
  .notify-toggle { display: flex; align-items: center; gap: 4px; background: #f0f7ff; padding: 2px 8px; border-radius: 20px; font-size: 11px; border: 1px solid #7ab8ff; }
  .notify-toggle input { width: 16px; height: 16px; margin: 0; cursor: pointer; }
  .notify-toggle label { cursor: pointer; font-size: 11px; margin: 0; }
  
  body.dark-mode{background:#0a0a0f}
  body.dark-mode .c{background:#1a1a2a;color:#e8e8f0}
  body.dark-mode select,body.dark-mode input,body.dark-mode button{background:#2a2a3a;color:#e8e8f0}
  body.dark-mode .h{border-bottom-color:#2a2a3a}
  body.dark-mode .panel-bg{background:#0f0f17;border-color:#2a2a3a}
  body.dark-mode .exp-card{background:#2a2f45 !important}
  body.dark-mode .opt-button{background:#2a2f45 !important}
  body.dark-mode .monster-select{background:#2a2f45 !important}
  body.dark-mode .reward-card{background:#2a2f45 !important}
  body.dark-mode #currentExpDisplay{color:#5a9eff !important}
  body.dark-mode #ms{color:#5a9eff !important}
  body.dark-mode .text-orange{color:#ffaa66}
  body.dark-mode .text-green{color:#66ffaa}
  body.dark-mode .text-red{color:#ff8888}
  body.dark-mode #totalExpDisplay{color:#fff}
  body.dark-mode .timer-row{background:#2a2f45}
  body.dark-mode label{color:#e8e8f0}
  body.dark-mode .btn-primary{background:#1a6eaa;color:#fff;border:1px solid #3399cc}
  body.dark-mode .btn-danger{background:#aa3333;color:#fff;border:1px solid #cc5555}
  body.dark-mode .btn-info{background:#1a77aa;color:#fff;border:1px solid #3399cc}
  body.dark-mode .btn-warning{background:#2a1515;border:1px solid #883333;color:#cc7777}
  body.dark-mode .btn-teal{background:#1a8899;color:#fff;border:1px solid #33aabb}
  body.dark-mode .passbook-area{background:#1e2a44}
  body.dark-mode .passbook-buttons button{background:#1a73e8}
  body.dark-mode #btnTimerStop{background:#006666;border:1px solid #008888}
  body.dark-mode .btn-copy{background:#006666}
  body.dark-mode .btn-oc{background:#2a1515;border:1px solid #883333;color:#cc7777}
  body.dark-mode .btn-rita-kuma.active-rita-kuma{background:#2a2f45!important;color:#5a9eff!important;border-color:#7ab8ff!important}
  body.dark-mode .btn-rita-kuma:not(.active-rita-kuma){background:#1a1a2a!important;color:#666!important;border-color:#333!important}
  body.dark-mode #btnOptMonster{background:#1a6eaa;border:1px solid #3399cc}
  body.dark-mode #ms,body.dark-mode #pb,body.dark-mode #cn,body.dark-mode .rs,body.dark-mode .cs{border-color:#7ab8ff}
  body.dark-mode #ms{background-color:#2a2f45}
  body.dark-mode #overflowDisplay{color:#888}
  body.dark-mode #timerDisplay{color:#e8e8f0}
  body.dark-mode #rowHistory{border-top-color:#2a2a3a;background:#1a1a2a}
  body.dark-mode .sync-small{color:#aaa}
  body.dark-mode .penalty-ref{color:#ff8888}
  body.dark-mode .exp-cell-lap{color:#aaa}
  body.dark-mode .row-id-normal{color:#aaa}
  body.dark-mode .row-id-lap{color:#2cc9ff}
  body.dark-mode .time-lap{color:#2cc9ff}
  body.dark-mode .row-controls-placeholder{color:#aaa}
  body.dark-mode .del{color:#aaa}
  body.dark-mode .notify-toggle{background:#2a2f45;border-color:#5a9eff}
</style>

<div class="c">

  <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
    <div class="notify-toggle">
      <input type="checkbox" id="lapNotifyToggle" ${this.lapNotifyEnabled ? 'checked' : ''}>
      <label for="lapNotifyToggle">🔊 LAP</label>
    </div>
    <select id="ms" class="monster-select" style="flex:2;padding:6px;font-size:15px;border:1px solid #7ab8ff;border-radius:4px;font-weight:bold">
      <option value="returner"      data-base="13118" data-bonus="0">リターナーモア</option>
      <option value="durahan"       data-base="22802" data-bonus="4561" selected>デュラハーン</option>
      <option value="hell"          data-base="23990" data-bonus="4798">ヘルガーディアン</option>
      <option value="scare"         data-base="22904" data-bonus="4581">スケアフレイル</option>
      <option value="dearthlicant"  data-base="15191" data-bonus="0">ダースリカント</option>
      <option value="golem_strong"  data-base="20350" data-bonus="0">ゴーレム強</option>
    </select>
    <select id="pb" style="flex:1;padding:6px;font-size:12px;border:1px solid #7ab8ff;border-radius:4px">
      <option value="0" selected>通帳なし</option>
      <option value="5000000">通帳1(500万)</option>
      <option value="10000000">通帳2(1000万)</option>
    </select>
  </div>

  <div style="display:flex;gap:4px;margin-bottom:8px;align-items:stretch">
    <div class="exp-card" style="flex:2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px">
      <span id="currentExpDisplay" style="font-size:22px;font-weight:bold;color:#06c">0</span>
      <span id="overflowDisplay" style="font-size:9px;color:#999;margin-top:2px;visibility:hidden">溢れ:0</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px">
      <button id="btnRita" class="btn-rita-kuma active-rita-kuma" style="flex:1;font-size:11px;padding:3px 7px;border-radius:4px;border:1px solid #7ab8ff;cursor:pointer;font-weight:bold">◯リタ</button>
      <button id="btnKuma" class="btn-rita-kuma" style="flex:1;font-size:11px;padding:3px 7px;border-radius:4px;border:1px solid #bbb;cursor:pointer;font-weight:bold">◯クマ</button>
    </div>
    <button id="btnOptMonster" style="background:#06c;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer;padding:4px 6px;line-height:1.3;white-space:nowrap">最適<br>ﾓﾝｽﾀｰ</button>
    <div style="width:60px">
      <div style="font-size:7px;color:#666;text-align:center">討伐数</div>
      <select id="cn" style="width:100%;padding:2px;font-size:18px;font-weight:bold;border:1px solid #7ab8ff;border-radius:4px;text-align:center">
        <option value="1">A</option><option value="2">B</option><option value="3">C</option>
        <option value="4">D</option><option value="5">E</option><option value="6">F</option>
        <option value="7">G</option><option value="8">H</option><option value="9">I</option>
        <option value="10">J</option><option value="11" selected>K</option><option value="12">L</option>
      </select>
    </div>
  </div>

  <div id="timer-row" class="timer-row" style="padding:6px 8px;margin-bottom:8px;display:flex;gap:6px">
    <div style="flex:1;font-size:12px;display:flex;flex-direction:column;align-items:flex-end;padding-right:50px;justify-content:center">
      <div style="margin-bottom:3px;display:flex;gap:8px">
        <label><input name="e_exp" type="radio" value="none" />無</label>
        <label><input name="e_exp" type="radio" value="genki" checked />元気</label>
        <label><input name="e_exp" type="radio" value="bakushin" />爆伸</label>
      </div>
      <div style="border-top:1px solid #ddd;padding-top:3px;width:100%;display:flex;justify-content:flex-end;gap:14px;font-size:11px;align-items:center">
        <button id="btnBuffReset" class="btn-oc">OC</button>
        <div style="display:flex;flex-direction:column;gap:2px">
          <label><input id="fd" type="checkbox" checked />料理</label>
          <label><input id="tr" type="checkbox" />修練</label>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <label><input id="ag" type="checkbox" />エンゼル</label>
          <label><input id="em" type="checkbox" />皇帝</label>
        </div>
      </div>
    </div>
    <button id="btnTimerStop" style="width:72px;font-size:12px;border-radius:4px;cursor:pointer;font-weight:bold;padding:2px">タイマー<br />開始</button>
  </div>

  <div style="display:flex;gap:6px;margin-bottom:8px">
    <div class="panel-bg" style="flex:6;padding:6px 8px;border-radius:6px;text-align:center">
      <div>
        <span style="font-size:12px;font-weight:bold">総獲得</span>
        <span id="totalExpDisplay" class="mono-digit" style="font-size:22px;font-weight:bold">0</span>
      </div>
      <div id="penaltyRef" class="penalty-ref" style="display:none"></div>
      <div style="font-size:11px;border-top:1px solid #ddd;margin-top:4px;padding-top:4px">
        <div>平均:<strong id="avgTimeDisplay" class="text-orange mono-digit" style="font-size:22px;font-weight:bold">--:--.--</strong></div>
      </div>
    </div>
    <button id="btnCalc" class="btn-primary" style="flex:4;font-size:21px;border-radius:6px">加算</button>
  </div>

  <div class="panel-bg" style="padding:6px;border-radius:6px;margin-bottom:8px">
    <div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start;justify-content:space-between">
      <div id="timerDisplay" class="mono-digit" style="font-size:28px;font-weight:bold">00:00.00</div>
      <div class="timer-right">
        <div id="syncDisplay" class="sync-small">&nbsp;</div>
        <div><span style="font-size:10px">LAP:</span><span id="lapTimeDisplay" class="lap-display mono-digit">00:00.00</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:3px;margin-top:4px">
      <button id="btnAllClear"     class="btn-warning" style="padding:7px;font-size:11px">AC</button>
      <button id="btnTimerPause"   class="btn-danger"  style="padding:7px;font-size:11px">停止</button>
      <button id="btnJob"          class="btn-teal"    style="padding:7px;font-size:11px">転職</button>
      <button id="btnLap"          class="btn-info"    style="padding:7px;font-size:11px">LAP</button>
    </div>
  </div>

  <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
    <button id="btnCopyHistory" class="btn-copy" style="flex:3;white-space:nowrap">履歴コピー</button>
    <div id="estimatedReward" class="reward-card" style="flex:7;border-radius:6px;padding:3px 6px;text-align:center;font-size:12px;display:flex;align-items:center;justify-content:center">
      想定玉給:<span id="estimatedGoldDisplay" class="text-green" style="font-weight:bold;font-size:13px;margin-left:4px">--</span>
    </div>
  </div>

  <div id="passbookArea" class="passbook-area hidden" style="margin-bottom:6px">
    <div class="passbook-info" style="font-size:11px">
      通帳:<strong id="passbookExpDisplay" class="text-red mono-digit" style="font-size:13px">0</strong>/<span id="passbookLimitText" class="mono-digit" style="font-size:13px">0</span>
    </div>
    <div class="passbook-buttons">
      <button id="btnPassbookReset">リセット</button>
      <button id="btnPassbookWithdraw">1Lv分引出</button>
    </div>
  </div>

  <div id="rowHistory" style="margin-top:4px;max-height:250px;overflow-y:auto;border-top:1px solid #eee"></div>
</div>
`;

      const notifyToggle = this.$('lapNotifyToggle');
      if (notifyToggle) {
        notifyToggle.checked = this.lapNotifyEnabled;
        notifyToggle.onchange = (e) => {
          this.lapNotifyEnabled = e.target.checked;
          localStorage.setItem('dqx_lap_notify', this.lapNotifyEnabled);
        };
      }

      // LAPボタン
      this.$("btnLap").onclick = () => {
        const elapsedSec = this.timer
          ? (Date.now() - this.startTime) / 1000
          : this.pauseSec;
        const lapSec = this.timer ? (elapsedSec - this.lastLapSec) : null;
        this.addRow("LAP", 0, 0, "lap_only", elapsedSec, lapSec);
        this.lastLapSec = elapsedSec;
        this.lapNotifyFired = false;
        this.updateTimerDisplay(elapsedSec);
      };

      // 既存のイベントリスナー
      this.$("btnCalc").onclick = () => {
        if (Date.now() < this.calcLockedUntil) return;
        this.lapNotifyFired = false;
        this.killCount++;
        const elapsedSec = this.timer
          ? (Date.now() - this.startTime) / 1000
          : this.pauseSec;
        const lapSec     = this.timer ? (elapsedSec - this.lastLapSec) : null;
        const callCount  = parseInt(this.$("cn").value);
        const expResult  = this.calcExp(callCount);
        const passbookLimit = parseInt(this.$("pb").value) || 0;

        if (passbookLimit > 0) {
          if (expResult.angel > 0) {
            this.addRow(this.killCount, callCount, expResult.angel, "angel", elapsedSec, lapSec, false, expResult.angel, null, false);
          }
          let accumulatedRaw = 0;
          document.querySelectorAll('.exp-row[data-type="pass"]').forEach(el => {
            const raw = parseFloat(el.dataset.rawValCapped);
            if (!isNaN(raw)) accumulatedRaw += raw;
          });
          const remainingRaw = Math.max(0, passbookLimit - (accumulatedRaw - this.passbookOffset));
          const remaining    = Math.ceil(remainingRaw);

          if (remaining >= expResult.common) {
            this.addRow(this.killCount, callCount, expResult.common, "pass", elapsedSec, lapSec, true, expResult.common, null, false);
          } else if (remaining > 0) {
            this.addRow(this.killCount, callCount, expResult.common - remaining, "overflow", elapsedSec, lapSec, false, expResult.common - remaining, null, false);
            this.addRow(this.killCount, callCount, remaining, "pass", elapsedSec, lapSec, true, remaining, null, false);
          } else {
            this.addRow(this.killCount, callCount, expResult.common, "overflow", elapsedSec, lapSec, true, expResult.common, null, false);
          }
        } else {
          this.addRow(this.killCount, callCount, expResult.total, "normal", elapsedSec, lapSec, true, expResult.total, null, false);
        }

        this.lastLapSec = elapsedSec;
        this.updateTimerDisplay(elapsedSec);

        this.calcLockedUntil = Date.now() + 3000;
        const calcBtn = this.$("btnCalc");
        calcBtn.disabled = true;
        calcBtn.style.opacity = "0.5";
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            calcBtn.textContent = `(${countdown})`;
          } else {
            clearInterval(countdownInterval);
            calcBtn.disabled = false;
            calcBtn.style.opacity = "1";
            calcBtn.textContent = "加算";
            this.updateUI();
          }
        }, 1000);
      };

      this.$("btnAllClear").onclick = () => {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.pauseSec       = 0;
        this.startTime      = 0;
        this.lastLapSec     = 0;
        this.killCount      = 0;
        this.jobOffsetSec   = 0;
        this.passbookOffset = 0;
        this.$("rowHistory").innerHTML = "";
        this.updateTimerDisplay(0);
        this.updateTotal();
        this.updateUI();
      };

      this.$("btnPassbookWithdraw").onclick = () => {
        let accumulatedRaw = 0;
        document.querySelectorAll('.exp-row[data-type="pass"]').forEach(el => {
          const raw = parseFloat(el.dataset.rawValCapped);
          if (!isNaN(raw)) accumulatedRaw += raw;
        });
        const balance = accumulatedRaw - this.passbookOffset;
        if (balance <= 0) return;
        const withdrawn = Math.min(this.EXP_PER_LV, balance);
        this.passbookOffset += withdrawn;
        this.updateTotal();
      };

      this.$("btnJob").onclick = () => {
        if (!this.timer && this.pauseSec === 0) return;
        const elapsedSec = this.timer
          ? (Date.now() - this.startTime) / 1000
          : this.pauseSec;
        this.jobOffsetSec += 20;
        if (this.jobOffsetSec > elapsedSec) this.jobOffsetSec = elapsedSec;
        this.updateTimerDisplay(elapsedSec);
        if (this.timer) {
          this.addRow("JOB", 0, 0, "job", elapsedSec, elapsedSec - this.lastLapSec);
          this.lastLapSec = elapsedSec;
        }
      };

      this.$("btnRita").onclick = () => {
        this.ritaOrKuma = "returner";
        this.$("btnRita").classList.add("active-rita-kuma");
        this.$("btnKuma").classList.remove("active-rita-kuma");
        this.updateUI(false);
      };
      this.$("btnKuma").onclick = () => {
        this.ritaOrKuma = "scare";
        this.$("btnKuma").classList.add("active-rita-kuma");
        this.$("btnRita").classList.remove("active-rita-kuma");
        this.updateUI(false);
      };

      this.$("btnOptMonster").onclick = () => {
        const monsterId = this.lookupOptimalMonster();
        this.$("ms").value = monsterId;
        this.updateUI(true);
      };

      this.$("btnTimerStop").onclick = () => {
        if (!this.timer) {
          if (!this.audioCtx) {
            try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
          }
          this.startTime = Date.now() - this.pauseSec * 1000;
          this.timer = setInterval(() => {
            const elapsedSec = (Date.now() - this.startTime) / 1000;
            this.updateTimerDisplay(elapsedSec);

            if (this.lapNotifyEnabled) {
              const avgSec = this.getAverageLapSec();
              const currentLapSec = elapsedSec - this.lastLapSec;
              if (avgSec !== null && currentLapSec > avgSec) {
                if (!this.lapNotifyFired) {
                  this.lapNotifyFired = true;
                  this.playLapWarning();
                }
              } else {
                this.lapNotifyFired = false;
              }
            }
          }, 30);
          this.calcLockedUntil = Math.max(this.calcLockedUntil, Date.now()) + 100;
          this.$("btnCalc").disabled = true;
          this.$("btnCalc").style.opacity = "0.5";
          setTimeout(() => {
            if (Date.now() >= this.calcLockedUntil) {
              this.$("btnCalc").disabled = false;
              this.$("btnCalc").style.opacity = "1";
            }
          }, 100);
        }
      };

      this.$("btnTimerPause").onclick = () => {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          this.pauseSec = (Date.now() - this.startTime) / 1000;
          this.updateTimerDisplay(this.pauseSec);
        }
      };

      this.$("btnPassbookReset").onclick = () => {
        let accumulatedRaw = 0;
        document.querySelectorAll('.exp-row[data-type="pass"]').forEach(el => {
          const raw = parseFloat(el.dataset.rawValCapped);
          if (!isNaN(raw)) accumulatedRaw += raw;
        });
        this.passbookOffset = Math.ceil(accumulatedRaw);
        this.updateTotal();
      };

      this.$("btnCopyHistory").onclick = () => {
        try {
          const lines = [];
          lines.push(`モンスター/${this.$("ms").options[this.$("ms").selectedIndex].text}`);
          lines.push(`総獲得/平均タイム/想定玉給`);
          lines.push(
            `${this.$("totalExpDisplay").textContent.replace(/,/g, "")}` +
            `/${this.$("avgTimeDisplay").textContent}` +
            `/${this.$("estimatedGoldDisplay").textContent}`
          );
          lines.push(``);
          lines.push(`#/戦闘時間/獲得exp/呼び数/お供/種類`);

          document.querySelectorAll(".exp-row").forEach(el => {
            const rowType = el.dataset.type || "";
            const rowId   = el.dataset.bid  || "-";

            if (rowType === "lap_only") {
              lines.push(`${rowId}/LAPMARK////`);
              return;
            }
            if (rowType === "job") {
              const timeStr = this.formatTime(parseFloat(el.dataset.sec) || 0);
              lines.push(`${rowId}/${timeStr}////転職`);
              return;
            }

            const timeStr   = this.formatTime(parseFloat(el.dataset.sec) || 0);
            const expVal    = (parseInt(el.dataset.val) || 0).toString();
            const callIdx   = parseInt(el.dataset.count);
            const callLabel = !isNaN(callIdx) ? (this.CALL_LABELS[callIdx] || "--") : "--";
            const partnerSelect = el.querySelector(".rs");
            const partnerLabel  = partnerSelect
              ? (partnerSelect.options[partnerSelect.selectedIndex]?.text || "お供無")
              : "お供無";
            const typeLabel = rowType === "pass"     ? "通帳"
                            : rowType === "angel"    ? "エンゼル"
                            : rowType === "overflow" ? "溢れ"
                            : "通常";
            lines.push(`${rowId}/${timeStr}/${expVal}/${callLabel}/${partnerLabel}/${typeLabel}`);
          });

          navigator.clipboard.writeText(lines.join("\n"))
            .then(() => alert("履歴をコピーしました"));
        } catch (e) {
          alert("コピー失敗");
        }
      };

      this.$("btnBuffReset").onclick = () => {
        this.$("fd").checked = true;
        this.$("tr").checked = false;
        this.$("ag").checked = false;
        this.$("em").checked = false;
        const genkiradio = document.querySelector('input[name="e_exp"][value="genki"]');
        if (genkiradio) genkiradio.checked = true;
        this.$("pb").value = "0";
        this.updateUI(true);
      };

      document.querySelectorAll('input[name="e_exp"], #fd, #tr, #ag, #em, #ms, #pb').forEach(el => {
        el.onchange = () => this.updateUI(true);
      });

      this.$("cn").onchange = () => this.updateUI(false);

      this.updateUI(true);
    },
  };

  global.Expmercenary = {
    render: ExpCalc.render.bind(ExpCalc),
    destroy: function () {
      if (ExpCalc.timer) {
        clearInterval(ExpCalc.timer);
        ExpCalc.timer = null;
      }
      ExpCalc.startTime      = 0;
      ExpCalc.pauseSec       = 0;
      ExpCalc.lastLapSec     = 0;
      ExpCalc.jobOffsetSec   = 0;
      ExpCalc.passbookOffset = 0;
    },
  };
})(window);
