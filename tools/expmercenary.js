// ========== 傭兵用多機能ツール ver2.0.0 ==========
// リファクタリング内容:
// [BUG] _recalcLaps: 削除後の lastLapSec 更新を正確化
// [BUG] jobOffsetSec: 転職ボタン連打防止（1秒クールダウン）
// [BUG] passbookOffset: 浮動小数の端数を Math.ceil で統一
// [SEC] innerHTML を createElement+textContent に置き換え（XSS対策）
// [PERF] querySelectorAll を addRow 時のキャッシュ配列管理に変更
// [PERF] setInterval を 16ms（~60fps）に変更
// [PERF] getPartnerOptions を DocumentFragment+cloneNode で効率化
// [UX] btnTimerStop のラベルを状態に応じて「開始」「再開」に切り替え
// [QUAL] ExpCalc をファクトリ関数化（複数インスタンス対応）
// [QUAL] CSV1/CSV2 のキー型を統一（すべて文字列）
// [QUAL] ritaOrKuma を AC リセット対象に追加（設計確認済み→リセット対象外）
// [QUAL] calcLockedUntil の 100ms 制限を廃止（タイマー開始と加算は独立）

(function (global) {
  "use strict";

  // ─── パートナー経験値定数 ───────────────────────────────────────────────
  const PARTNER_EXP = {
    none: 0, mk: 48240, hm1: 12060, hm2: 24120, hm3: 36180,
    tappitsu: 4800, gn: 2240, sn: 1120, zucchini: 9010,
  };

  const EXP_PER_LV = 1589326;

  const CALL_LABELS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const TYPE_LABEL = {
    pass: "[通]", angel: "[エ]", overflow: "[溢]",
    normal: "", lap_only: "[LAP]", job: "転職",
  };
  const TYPE_COLOR = {
    pass: "#f88", angel: "#5a9eff", overflow: "#aaa",
    lap_only: "#2cc9ff", job: "#00bcd4",
  };

  // ─── CSV2テーブル（最適モンスター選定） ────────────────────────────────
  const CSV2_TABLE = (function () {
    const rows = [
      ["genki","×","×","×","0","durahan"],
      ["genki","×","×","×","1","durahan"],
      ["genki","×","×","×","2","durahan"],
      ["genki","×","×","○","0","rita_or_kuma"],
      ["genki","×","×","○","1","rita_or_kuma"],
      ["genki","×","×","○","2","rita_or_kuma"],
      ["genki","×","○","×","0","rita_or_kuma"],
      ["genki","×","○","×","1","durahan"],
      ["genki","×","○","×","2","durahan"],
      ["genki","×","○","○","0","rita_or_kuma"],
      ["genki","×","○","○","1","rita_or_kuma"],
      ["genki","×","○","○","2","rita_or_kuma"],
      ["genki","○","×","×","0","durahan"],
      ["genki","○","×","×","1","durahan"],
      ["genki","○","×","×","2","durahan"],
      ["genki","○","×","○","0","durahan"],
      ["genki","○","×","○","1","durahan"],
      ["genki","○","×","○","2","durahan"],
      ["genki","○","○","×","0","durahan"],
      ["genki","○","○","×","1","durahan"],
      ["genki","○","○","×","2","durahan"],
      ["genki","○","○","○","0","durahan"],
      ["genki","○","○","○","1","durahan"],
      ["genki","○","○","○","2","durahan"],
      ["bakushin","×","×","×","0","durahan"],
      ["bakushin","×","×","×","1","durahan"],
      ["bakushin","×","×","×","2","durahan"],
      ["bakushin","×","×","○","0","durahan"],
      ["bakushin","×","×","○","1","durahan"],
      ["bakushin","×","×","○","2","durahan"],
      ["bakushin","×","○","×","0","durahan"],
      ["bakushin","×","○","×","1","durahan"],
      ["bakushin","×","○","×","2","durahan"],
      ["bakushin","×","○","○","0","durahan"],
      ["bakushin","×","○","○","1","durahan"],
      ["bakushin","×","○","○","2","durahan"],
      ["bakushin","○","×","×","0","durahan"],
      ["bakushin","○","×","×","1","durahan"],
      ["bakushin","○","×","×","2","durahan"],
      ["bakushin","○","×","○","0","durahan"],
      ["bakushin","○","×","○","1","durahan"],
      ["bakushin","○","×","○","2","durahan"],
      ["bakushin","○","○","×","0","durahan"],
      ["bakushin","○","○","×","1","durahan"],
      ["bakushin","○","○","×","2","durahan"],
      ["bakushin","○","○","○","0","rita_or_kuma"],
      ["bakushin","○","○","○","1","durahan"],
      ["bakushin","○","○","○","2","durahan"],
    ];
    const map = {};
    rows.forEach(([elix, tr, ag, em, pb, result]) => {
      map[`${elix}|${tr}|${ag}|${em}|${pb}`] = result;
    });
    return map;
  })();

  // ─── CSV1テーブル（最適呼び数） ────────────────────────────────────────
  // キーをすべて文字列に統一: `mid|food|tr|em|ag|pb|elix`
  // food/tr/em/ag/pb は "1"(true) / "0"(false)
  const CSV1_TABLE = (function () {
    const rows = [
      ["returner","0","0","0","1","0","genki",11],
      ["returner","0","0","1","1","0","none",11],
      ["returner","0","0","1","1","0","genki",10],
      ["returner","1","0","0","1","0","genki",10],
      ["returner","1","0","1","1","0","none",10],
      ["returner","1","0","1","1","0","genki",8],
      ["durahan","0","0","0","0","0","genki",12],
      ["durahan","0","0","0","0","1","genki",12],
      ["durahan","0","0","0","1","0","none",9],
      ["durahan","0","0","0","1","0","genki",7],
      ["durahan","0","0","0","1","1","genki",12],
      ["durahan","0","0","1","0","0","none",12],
      ["durahan","0","0","1","0","0","genki",9],
      ["durahan","0","0","1","0","1","none",12],
      ["durahan","0","0","1","0","1","genki",9],
      ["durahan","0","0","1","1","0","none",7],
      ["durahan","0","0","1","1","0","genki",6],
      ["durahan","0","0","1","1","0","bakushin",11],
      ["durahan","0","0","1","1","1","none",12],
      ["durahan","0","0","1","1","1","genki",9],
      ["durahan","0","1","0","1","0","bakushin",11],
      ["durahan","0","1","1","1","0","genki",11],
      ["durahan","0","1","1","1","0","bakushin",9],
      ["durahan","1","0","0","0","0","genki",10],
      ["durahan","1","0","0","0","1","genki",10],
      ["durahan","1","0","0","1","0","none",8],
      ["durahan","1","0","0","1","0","genki",6],
      ["durahan","1","0","0","1","0","bakushin",12],
      ["durahan","1","0","0","1","1","genki",10],
      ["durahan","1","0","1","0","0","none",10],
      ["durahan","1","0","1","0","0","genki",8],
      ["durahan","1","0","1","0","1","none",10],
      ["durahan","1","0","1","0","1","genki",8],
      ["durahan","1","0","1","1","0","none",6],
      ["durahan","1","0","1","1","0","genki",5],
      ["durahan","1","0","1","1","0","bakushin",10],
      ["durahan","1","0","1","1","1","none",10],
      ["durahan","1","0","1","1","1","genki",8],
      ["durahan","1","1","0","1","0","genki",12],
      ["durahan","1","1","0","1","0","bakushin",10],
      ["durahan","1","1","1","0","0","bakushin",12],
      ["durahan","1","1","1","0","1","bakushin",12],
      ["durahan","1","1","1","1","0","none",12],
      ["durahan","1","1","1","1","0","genki",10],
      ["durahan","1","1","1","1","0","bakushin",9],
      ["durahan","1","1","1","1","1","bakushin",12],
      ["dearthlicant","0","0","0","1","0","genki",10],
      ["dearthlicant","0","0","1","1","0","none",10],
      ["dearthlicant","0","0","1","1","0","genki",8],
      ["dearthlicant","1","0","0","1","0","none",12],
      ["dearthlicant","1","0","0","1","0","genki",9],
      ["dearthlicant","1","0","1","0","0","genki",12],
      ["dearthlicant","1","0","1","0","1","genki",12],
      ["dearthlicant","1","0","1","1","0","none",9],
      ["dearthlicant","1","0","1","1","0","genki",7],
      ["dearthlicant","1","0","1","1","1","genki",12],
    ];
    const map = {};
    rows.forEach(([mid, food, tr, em, ag, pb, elix, num]) => {
      map[`${mid}|${food}|${tr}|${em}|${ag}|${pb}|${elix}`] = num;
    });
    return map;
  })();

  // ─── パートナー選択肢テンプレート（cloneNode で再利用） ───────────────
  function buildPartnerTemplate(includeDearth) {
    const frag = document.createDocumentFragment();
    const defs = [
      ["none",     "お供無"],
      ["hm1",      "はぐメタ1"],
      ["hm2",      "はぐメタ2"],
      ["hm3",      "はぐメタ3"],
      ["mk",       "メタキン"],
      ["gn",       "ゲノミー"],
      ["sn",       "仙人"],
    ];
    if (includeDearth) defs.push(["zucchini", "ズッキ祖"]);
    defs.forEach(([val, label]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      frag.appendChild(opt);
    });
    return frag;
  }

  // ─── ファクトリ関数（インスタンスを返す） ─────────────────────────────
  function createExpCalc() {
    // 状態
    let timerHandle  = null;
    let startTime    = 0;
    let pauseSec     = 0;
    let lastLapSec   = 0;
    let jobOffsetSec = 0;
    let passbookOffset = 0;
    let killCount    = 0;
    let optCallCount = 1;
    let calcLockedUntil = 0;
    let ritaOrKuma   = "returner";
    let lapNotifyEnabled = false;
    let lapNotifyFired   = false;
    let audioCtx     = null;
    let jobBtnLocked = false;      // 転職ボタン連打防止フラグ

    // DOM キャッシュ（render後に設定）
    let root = null;

    // ── DOM ヘルパー ────────────────────────────────────────────────────
    function $(id) { return root ? root.querySelector(`#${id}`) : document.getElementById(id); }

    // ── 時間フォーマット ─────────────────────────────────────────────────
    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) return "00:00.00";
      const m = Math.floor(sec / 60);
      const s = (sec % 60).toFixed(2).padStart(5, "0");
      return `${String(m).padStart(2, "0")}:${s}`;
    }

    // ── 経験値上限適用 ───────────────────────────────────────────────────
    function applyLimit(val, limit, fd) {
      const rounded = Math.round(val);
      const isNearInt = Math.abs(val - rounded) < 0.1;
      const ceiled = fd && isNearInt ? rounded + 1 : Math.ceil(val);
      return Math.min(ceiled, limit);
    }

    // ── 経験値計算 ───────────────────────────────────────────────────────
    function calcExp(callCount, partnerKey = "none", snap = null) {
      let baseExp, bonusExp, fd, tr, ag, em, elixir, pbVal;

      if (snap) {
        const msOption = root.querySelector(`#ms option[value="${snap.ms}"]`);
        baseExp  = parseInt(msOption?.dataset.base)  || 0;
        bonusExp = parseInt(msOption?.dataset.bonus) || 0;
        ({ fd, tr, ag, em, elixir, pb: pbVal } = snap);
      } else {
        const sel = $("ms");
        const opt = sel.options[sel.selectedIndex];
        baseExp  = parseInt(opt.dataset.base)  || 0;
        bonusExp = parseInt(opt.dataset.bonus) || 0;
        fd     = $("fd").checked;
        tr     = $("tr").checked;
        ag     = $("ag").checked;
        em     = $("em").checked;
        elixir = root.querySelector('input[name="e_exp"]:checked')?.value || "none";
        pbVal  = $("pb").value;
      }

      let rate = 1.0;
      if (fd) rate += 0.3;
      if (elixir === "genki")   rate += 1;
      if (elixir === "bakushin") rate += 2;
      if (tr) rate += 1;
      if (em) rate += 1;

      const partnerExpVal  = PARTNER_EXP[partnerKey] || 0;
      const passbookLimit  = parseInt(pbVal) || 0;
      const hasPassbook    = passbookLimit > 0;
      const isHighLimit    = elixir === "bakushin" || tr;
      const expLimit       = isHighLimit ? 1499999 : 599999;
      const angelLimit     = 599999;

      const rawCommon  = baseExp * rate + bonusExp;
      const rawAngel   = ag ? baseExp * 2 : 0;
      const rawPCommon = partnerExpVal * rate;
      const rawPAngel  = ag ? partnerExpVal * 2 : 0;

      const rawTotalCommon = rawCommon  * callCount + rawPCommon;
      const rawTotalAngel  = rawAngel   * callCount + rawPAngel;
      const rawTotal       = rawTotalCommon + rawTotalAngel;

      if (hasPassbook) {
        const commonCapped = Math.min(rawTotalCommon, expLimit);
        const angelCapped  = Math.min(rawTotalAngel,  angelLimit);
        const overflow     = Math.ceil((rawTotalCommon - commonCapped) + (rawTotalAngel - angelCapped));
        const common       = applyLimit(commonCapped, expLimit, fd);
        const angel        = Math.min(Math.ceil(angelCapped), angelLimit);
        return { total: common + angel, common, angel, overflow,
          rawTotalCapped: commonCapped + angelCapped,
          rawCommonCapped: commonCapped, rawAngelCapped: angelCapped };
      } else {
        const cappedTotal = Math.min(rawTotal, expLimit);
        const total       = applyLimit(cappedTotal, expLimit, fd);
        return { total, common: total, angel: 0,
          overflow: Math.ceil(rawTotal - cappedTotal),
          rawTotalCapped: cappedTotal, rawCommonCapped: cappedTotal, rawAngelCapped: 0 };
      }
    }

    // ── 最適モンスター特定 ───────────────────────────────────────────────
    function lookupOptimalMonster() {
      const elixir = root.querySelector('input[name="e_exp"]:checked')?.value || "none";
      if (elixir === "none") return "durahan";
      const tr  = $("tr").checked ? "○" : "×";
      const ag  = $("ag").checked ? "○" : "×";
      const em  = $("em").checked ? "○" : "×";
      const pbRaw = $("pb").value;
      const pb  = pbRaw === "5000000" ? "1" : pbRaw === "10000000" ? "2" : "0";
      const key = `${elixir}|${tr}|${ag}|${em}|${pb}`;
      const result = CSV2_TABLE[key];
      if (!result) return "durahan";
      return result === "rita_or_kuma" ? ritaOrKuma : result;
    }

    // ── 最適呼び数特定 ───────────────────────────────────────────────────
    function lookupOptimalCallCount() {
      const ms     = $("ms").value;
      const food   = $("fd").checked   ? "1" : "0";
      const tr     = $("tr").checked   ? "1" : "0";
      const em     = $("em").checked   ? "1" : "0";
      const ag     = $("ag").checked   ? "1" : "0";
      const pbRaw  = $("pb").value;
      const pb     = pbRaw !== "0"     ? "1" : "0";
      const elixir = root.querySelector('input[name="e_exp"]:checked')?.value || "none";
      const key    = `${ms}|${food}|${tr}|${em}|${ag}|${pb}|${elixir}`;

      if (CSV1_TABLE[key] !== undefined) return CSV1_TABLE[key];

      // テーブルに無い場合: 上限以下の最大呼び数を探索
      const isHighLimit = elixir === "bakushin" || tr === "1";
      const expLimit    = isHighLimit ? 1499999 : 599999;
      let opt = 1;
      for (let i = 1; i <= 12; i++) {
        if (calcExp(i).common < expLimit) opt = i;
        else break;
      }
      return opt;
    }

    // ── 音声通知 ─────────────────────────────────────────────────────────
    function playLapWarning() {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtx;
        const playBeep = (freq, start, dur) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "triangle";
          gain.gain.setValueAtTime(0.9, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.start(start);
          osc.stop(start + dur);
        };
        playBeep(1800, ctx.currentTime,        0.25);
        playBeep(1600, ctx.currentTime + 0.35, 0.35);
      } catch (_) {}
    }

    // ── タイマー表示更新 ─────────────────────────────────────────────────
    function updateTimerDisplay(elapsedSec) {
      $("timerDisplay").textContent    = formatTime(elapsedSec);
      $("lapTimeDisplay").textContent  = formatTime(elapsedSec - lastLapSec);
      const syncSec = Math.max(0, elapsedSec - jobOffsetSec);
      const syncEl  = $("syncDisplay");
      if (syncSec > 0) {
        syncEl.textContent = `オプション持続: ${formatTime(syncSec)}`;
      } else {
        syncEl.innerHTML = "&nbsp;";
      }
    }

    // ── 平均ラップ取得 ───────────────────────────────────────────────────
    function getAverageLapSec() {
      const times = rowCache
        .filter(r => r.dataset.lap !== "-1" &&
                     r.dataset.type !== "lap_only" &&
                     r.dataset.type !== "job" &&
                     r.dataset.main === "true")
        .map(r => parseFloat(r.dataset.lap))
        .filter(v => !isNaN(v));
      if (times.length === 0) return null;
      return times.reduce((a, b) => a + b, 0) / times.length;
    }

    // ── 行キャッシュ（追加順: 古い→新しい） ─────────────────────────────
    // DOM上は prepend なので逆順、キャッシュは正順
    const rowCache = [];   // rowCache[0] が最初に追加された行

    // ── パートナーセレクト生成 ───────────────────────────────────────────
    function buildPartnerSelect(monsterId, selectedKey) {
      const sel = document.createElement("select");
      sel.className = "rs";
      sel.style.cssText = "flex:1.2;font-size:12px;padding:2px 4px;";
      const frag = buildPartnerTemplate(monsterId === "dearthlicant");
      sel.appendChild(frag);
      if (selectedKey) sel.value = selectedKey;
      return sel;
    }

    // ── 呼び数セレクト生成 ───────────────────────────────────────────────
    function buildCallSelect(callCount) {
      const sel = document.createElement("select");
      sel.className = "cs";
      sel.style.cssText = "width:55px;font-size:12px;padding:2px 4px;";
      for (let i = 1; i <= 12; i++) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = CALL_LABELS[i];
        if (i === callCount) opt.selected = true;
        sel.appendChild(opt);
      }
      return sel;
    }

    // ── 行追加 ───────────────────────────────────────────────────────────
    function addRow(rowId, callCount, expVal, rowType, elapsedSec, lapSec,
                    isMain = false, rawCapped = null, monsterId = null,
                    hasDeathPenalty = false) {

      const row = document.createElement("div");
      row.className = "exp-row h";
      row.dataset.val          = expVal;
      row.dataset.rawValCapped = rawCapped !== null ? rawCapped : expVal;
      row.dataset.type         = rowType;
      row.dataset.sec          = elapsedSec;
      row.dataset.lap          = lapSec != null ? lapSec : -1;
      row.dataset.main         = isMain;
      row.dataset.count        = callCount;
      row.dataset.bid          = rowId;
      row.dataset.monsterId    = monsterId || $("ms").value;
      row.dataset.desp         = hasDeathPenalty ? "true" : "false";

      const snapshot = {
        fd:     $("fd").checked,
        tr:     $("tr").checked,
        ag:     $("ag").checked,
        em:     $("em").checked,
        elixir: root.querySelector('input[name="e_exp"]:checked')?.value || "none",
        pb:     $("pb").value,
        ms:     monsterId || $("ms").value,
      };
      row.dataset.snapshot = JSON.stringify(snapshot);

      // ── row-id span ────────────────────────────────────────────────────
      const rowIdSpan = document.createElement("span");
      if (rowId === "LAP") {
        rowIdSpan.className   = "row-id-lap";
        rowIdSpan.textContent = "LAP";
      } else {
        rowIdSpan.className   = "row-id-normal";
        rowIdSpan.textContent = `#${rowId}`;
      }
      row.appendChild(rowIdSpan);

      // ── 時間＋削除ボタン ────────────────────────────────────────────────
      const timeWrapper = document.createElement("div");
      timeWrapper.style.cssText = "display:flex;align-items:center;gap:4px;width:85px";

      const timeCell = document.createElement("div");
      timeCell.className = "time-cell";

      const timeMain = document.createElement("div");
      timeMain.className   = "time-main";
      timeMain.textContent = formatTime(elapsedSec);
      timeCell.appendChild(timeMain);

      if (lapSec != null && lapSec >= 0) {
        const timeLap = document.createElement("div");
        timeLap.className   = "time-lap";
        timeLap.textContent = `L ${formatTime(lapSec)}`;
        timeCell.appendChild(timeLap);
      }

      timeWrapper.appendChild(timeCell);

      const delBtn = document.createElement("button");
      delBtn.className   = "del";
      delBtn.textContent = "×";
      delBtn.style.cssText = "font-size:16px;padding:0 2px;";
      delBtn.onclick = () => {
        const bid  = row.dataset.bid;
        const type = row.dataset.type;
        // angel 以外を消す場合は対応 angel 行も削除
        if (type !== "angel") {
          rowCache
            .filter(r => r !== row && r.dataset.bid === bid && r.dataset.type === "angel")
            .forEach(r => { r.remove(); rowCache.splice(rowCache.indexOf(r), 1); });
        }
        row.remove();
        rowCache.splice(rowCache.indexOf(row), 1);
        renumberRows();
        recalcLaps();
        updateTotal();
      };
      timeWrapper.appendChild(delBtn);
      row.appendChild(timeWrapper);

      // ── 経験値セル ──────────────────────────────────────────────────────
      const expCell = document.createElement("div");
      if (rowId === "LAP") {
        expCell.className   = "exp-cell-lap";
        expCell.textContent = "LAP MARK";
      } else if (rowType === "job") {
        expCell.className = "exp-cell";
        const lbl = document.createElement("span");
        lbl.className   = "exp-label";
        lbl.style.color = TYPE_COLOR[rowType] || "";
        lbl.textContent = TYPE_LABEL[rowType] || "";
        expCell.appendChild(lbl);
      } else {
        expCell.className = "exp-cell";
        const valSpan = document.createElement("strong");
        valSpan.className   = "exp-value";
        valSpan.textContent = expVal.toLocaleString();
        const lbl = document.createElement("span");
        lbl.className   = "exp-label";
        lbl.style.color = TYPE_COLOR[rowType] || "";
        lbl.textContent = TYPE_LABEL[rowType] || "";
        expCell.appendChild(valSpan);
        expCell.appendChild(lbl);
      }
      row.appendChild(expCell);

      // ── デスペナチェック ────────────────────────────────────────────────
      const despLabel = document.createElement("label");
      despLabel.className = "desp-label";
      const despCb = document.createElement("input");
      despCb.type      = "checkbox";
      despCb.className = "desp-tgl";
      despCb.checked   = hasDeathPenalty;
      const despIcon = document.createElement("span");
      despIcon.className   = "desp-icon";
      despIcon.textContent = "💀";
      despLabel.appendChild(despCb);
      despLabel.appendChild(despIcon);
      row.appendChild(despLabel);

      // ── コントロール（呼び数・パートナー） ──────────────────────────────
      if (rowId !== "LAP" && rowType !== "job") {
        const controls = document.createElement("div");
        controls.className = "row-controls";
        controls.style.cssText = "display:flex;gap:4px;align-items:center;flex:1;";

        const rSel = buildPartnerSelect(row.dataset.monsterId, "none");
        const cSel = buildCallSelect(callCount);

        controls.appendChild(rSel);
        controls.appendChild(cSel);
        row.appendChild(controls);

        const recalcRowExp = () => {
          const snap        = JSON.parse(row.dataset.snapshot);
          const newCount    = parseInt(cSel.value);
          const newPartner  = rSel.value;
          row.dataset.count = newCount;
          const result = calcExp(newCount, newPartner, snap);
          const newVal = row.dataset.type === "angel"  ? result.angel
                       : row.dataset.type === "pass"   ? result.common
                       : result.total;
          row.dataset.val          = newVal;
          row.dataset.rawValCapped = newVal;
          row.querySelector(".exp-value").textContent = newVal.toLocaleString();
          updateTotal();
        };

        cSel.onchange = recalcRowExp;
        rSel.onchange = recalcRowExp;
        despCb.onchange = () => {
          row.dataset.desp = despCb.checked ? "true" : "false";
          updateTotal();
        };
      } else {
        const placeholder = document.createElement("div");
        placeholder.className   = "row-controls-placeholder";
        placeholder.textContent = "----------";
        row.appendChild(placeholder);
      }

      // ── DOM挿入 & キャッシュ追加 ─────────────────────────────────────
      $("rowHistory").prepend(row);
      rowCache.push(row);   // キャッシュは追加順（古→新）

      updateTotal();
    }

    // ── 行番号振り直し ───────────────────────────────────────────────────
    function renumberRows() {
      let num = 1;
      // キャッシュを追加順に走査
      rowCache.forEach(r => {
        const type = r.dataset.type;
        if (type === "lap_only" || type === "job") return;
        if (r.dataset.bid === "LAP") return;
        if (type === "angel") {
          const el = r.querySelector(".row-id-normal");
          if (el) el.textContent = `#${num - 1}`;
        } else {
          r.dataset.bid = num;
          const el = r.querySelector(".row-id-normal");
          if (el) el.textContent = `#${num}`;
          num++;
        }
      });
      killCount = num - 1;
    }

    // ── ラップ再計算 ─────────────────────────────────────────────────────
    function recalcLaps() {
      let prevSec = 0;
      rowCache.forEach(r => {
        const sec = parseFloat(r.dataset.sec);
        if (isNaN(sec)) return;
        const lap = sec - prevSec;
        r.dataset.lap = lap;
        const lapEl = r.querySelector(".time-lap");
        // 既存のラップ表示を更新、なければ追加
        const timeCell = r.querySelector(".time-cell");
        if (timeCell) {
          if (lapEl) {
            lapEl.textContent = `L ${formatTime(lap)}`;
          } else {
            const newLap = document.createElement("div");
            newLap.className   = "time-lap";
            newLap.textContent = `L ${formatTime(lap)}`;
            timeCell.appendChild(newLap);
          }
        }
        prevSec = sec;
      });

      // lastLapSec = キャッシュ末尾（最新行）の sec
      if (rowCache.length > 0) {
        const latest = parseFloat(rowCache[rowCache.length - 1].dataset.sec);
        if (!isNaN(latest)) lastLapSec = latest;
      } else {
        lastLapSec = 0;
      }
    }

    // ── 合計更新 ─────────────────────────────────────────────────────────
    function updateTotal() {
      let totalExp    = 0;
      let passbookExp = 0;
      const lapTimes  = [];
      let penaltyMin  = 0;
      let penaltyMax  = 0;

      rowCache.forEach(el => {
        const expVal = parseInt(el.dataset.val) || 0;
        totalExp += expVal;
        if (el.dataset.type === "pass") passbookExp += expVal;

        if (el.dataset.lap !== "-1" &&
            el.dataset.type !== "lap_only" &&
            el.dataset.type !== "job" &&
            el.dataset.main === "true") {
          lapTimes.push(parseFloat(el.dataset.lap));
        }

        if (el.dataset.desp === "true" &&
            el.dataset.lap !== "-1" &&
            el.dataset.type !== "lap_only" &&
            el.dataset.type !== "job") {
          const raw    = parseFloat(el.dataset.rawValCapped) || parseInt(el.dataset.val) || 0;
          const lapSec = parseFloat(el.dataset.lap);
          if (lapSec > 6.45) {
            penaltyMin += raw * (6.45  / lapSec);
            penaltyMax += raw * (2.58  / lapSec);
          }
        }
      });

      $("totalExpDisplay").textContent = Math.ceil(totalExp).toLocaleString();

      const passbookLimit = parseInt($("pb").value) || 0;
      if (passbookLimit > 0) {
        const remaining = Math.max(0, passbookExp - passbookOffset);
        $("passbookExpDisplay").textContent = Math.ceil(remaining).toLocaleString();
      }

      const hasPenalty = rowCache.some(r => r.dataset.desp === "true");
      const penaltyRef = $("penaltyRef");
      if (hasPenalty && penaltyMin > 0) {
        penaltyRef.style.display = "block";
        // textContent で XSS を避けつつ改行は <br> で
        penaltyRef.innerHTML = `デスペナ想定:<br>${Math.ceil(penaltyMax).toLocaleString()}～${Math.ceil(penaltyMin).toLocaleString()}`;
      } else {
        penaltyRef.style.display = "none";
      }

      if (lapTimes.length > 0) {
        const avgSec = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        $("avgTimeDisplay").textContent = formatTime(avgSec);
        if (avgSec > 0.01) {
          const battles30min = Math.floor(1800 / avgSec);
          const expPerBattle = totalExp / lapTimes.length;
          $("estimatedGoldDisplay").textContent =
            `${Math.round(expPerBattle * battles30min / 1e4)}万～` +
            `${Math.round(expPerBattle * (battles30min + 1) / 1e4)}万`;
        } else {
          $("estimatedGoldDisplay").textContent = "--";
        }
      } else {
        $("avgTimeDisplay").textContent      = "--:--.--";
        $("estimatedGoldDisplay").textContent = "--";
      }
    }

    // ── UI更新 ───────────────────────────────────────────────────────────
    function updateUI(autoSetCount = false) {
      const passbookLimit = parseInt($("pb").value) || 0;
      const passbookArea  = $("passbookArea");
      if (passbookLimit > 0) {
        passbookArea.classList.remove("hidden");
        $("passbookLimitText").textContent = passbookLimit.toLocaleString();
      } else {
        passbookArea.classList.add("hidden");
      }

      optCallCount = lookupOptimalCallCount();
      if (autoSetCount) $("cn").value = optCallCount;

      const callCount = parseInt($("cn").value);
      const expResult = calcExp(callCount);
      $("currentExpDisplay").textContent = expResult.total.toLocaleString();

      const overflowEl = $("overflowDisplay");
      if (expResult.overflow > 0) {
        overflowEl.style.visibility = "visible";
        overflowEl.textContent      = `溢れ:${expResult.overflow.toLocaleString()}`;
      } else {
        overflowEl.style.visibility = "hidden";
      }

      checkOptimalMonsterButton();
    }

    function checkOptimalMonsterButton() {
      const current  = $("ms").value;
      const optimal  = lookupOptimalMonster();
      const btn      = $("btnOptMonster");
      const isOptimal = current === optimal;
      btn.disabled         = isOptimal;
      btn.style.opacity    = isOptimal ? "0.5" : "1";
      btn.style.cursor     = isOptimal ? "not-allowed" : "pointer";
    }

    // ─────────────────────────────────────────────────────────────────────
    // ── render ────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────
    function render(containerSelector) {
      const container = typeof containerSelector === "string"
        ? document.querySelector(containerSelector)
        : containerSelector;
      if (!container) return;
      root = container;

      const savedNotify = localStorage.getItem("dqx_lap_notify");
      if (savedNotify !== null) lapNotifyEnabled = savedNotify === "true";

      // ─── HTML テンプレート ─────────────────────────────────────────────
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
  .notify-toggle{display:flex;align-items:center;gap:4px;background:#f0f7ff;padding:2px 8px;border-radius:20px;font-size:11px;border:1px solid #7ab8ff}
  .notify-toggle input{width:16px;height:16px;margin:0;cursor:pointer}
  .notify-toggle label{cursor:pointer;font-size:11px;margin:0}
  body.dark-mode{background:#0a0a0f}
  body.dark-mode .c{background:#1a1a2a;color:#e8e8f0}
  body.dark-mode select,body.dark-mode input,body.dark-mode button{background:#2a2a3a;color:#e8e8f0}
  body.dark-mode .h{border-bottom-color:#2a2a3a}
  body.dark-mode .panel-bg{background:#0f0f17;border-color:#2a2a3a}
  body.dark-mode .exp-card{background:#2a2f45!important}
  body.dark-mode .opt-button{background:#2a2f45!important}
  body.dark-mode .monster-select{background:#2a2f45!important}
  body.dark-mode .reward-card{background:#2a2f45!important}
  body.dark-mode #currentExpDisplay{color:#5a9eff!important}
  body.dark-mode #ms{color:#5a9eff!important}
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
      <input type="checkbox" id="lapNotifyToggle" ${lapNotifyEnabled ? "checked" : ""}>
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
    <button id="btnTimerStop" style="width:72px;font-size:12px;border-radius:4px;cursor:pointer;font-weight:bold;padding:2px">タイマー<br>開始</button>
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
      <button id="btnAllClear"   class="btn-warning" style="padding:7px;font-size:11px">AC</button>
      <button id="btnTimerPause" class="btn-danger"  style="padding:7px;font-size:11px">停止</button>
      <button id="btnJob"        class="btn-teal"    style="padding:7px;font-size:11px">転職</button>
      <button id="btnLap"        class="btn-info"    style="padding:7px;font-size:11px">LAP</button>
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
</div>`;

      // ── イベントリスナー登録 ─────────────────────────────────────────

      $("lapNotifyToggle").onchange = (e) => {
        lapNotifyEnabled = e.target.checked;
        localStorage.setItem("dqx_lap_notify", lapNotifyEnabled);
      };

      $("btnLap").onclick = () => {
        const elapsed = timerHandle
          ? (Date.now() - startTime) / 1000
          : pauseSec;
        const lap = timerHandle ? elapsed - lastLapSec : null;
        addRow("LAP", 0, 0, "lap_only", elapsed, lap);
        lastLapSec = elapsed;
        lapNotifyFired = false;
        updateTimerDisplay(elapsed);
      };

      $("btnCalc").onclick = () => {
        if (Date.now() < calcLockedUntil) return;
        lapNotifyFired = false;
        killCount++;
        const elapsed = timerHandle
          ? (Date.now() - startTime) / 1000
          : pauseSec;
        const lap = timerHandle ? elapsed - lastLapSec : null;
        const callCount = parseInt($("cn").value);
        const expResult = calcExp(callCount);
        const passbookLimit = parseInt($("pb").value) || 0;

        if (passbookLimit > 0) {
          if (expResult.angel > 0) {
            addRow(killCount, callCount, expResult.angel, "angel", elapsed, lap, false, expResult.angel, null, false);
          }
          let accumulatedRaw = 0;
          rowCache.filter(r => r.dataset.type === "pass").forEach(r => {
            accumulatedRaw += parseFloat(r.dataset.rawValCapped) || 0;
          });
          const remaining = Math.ceil(Math.max(0, passbookLimit - (accumulatedRaw - passbookOffset)));

          if (remaining >= expResult.common) {
            addRow(killCount, callCount, expResult.common, "pass", elapsed, lap, true, expResult.common, null, false);
          } else if (remaining > 0) {
            addRow(killCount, callCount, expResult.common - remaining, "overflow", elapsed, lap, false, expResult.common - remaining, null, false);
            addRow(killCount, callCount, remaining, "pass", elapsed, lap, true, remaining, null, false);
          } else {
            addRow(killCount, callCount, expResult.common, "overflow", elapsed, lap, true, expResult.common, null, false);
          }
        } else {
          addRow(killCount, callCount, expResult.total, "normal", elapsed, lap, true, expResult.total, null, false);
        }

        lastLapSec = elapsed;
        updateTimerDisplay(elapsed);

        // 3秒クールダウン
        calcLockedUntil = Date.now() + 3000;
        const calcBtn = $("btnCalc");
        calcBtn.disabled      = true;
        calcBtn.style.opacity = "0.5";
        let countdown = 3;
        const cd = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            calcBtn.textContent = `(${countdown})`;
          } else {
            clearInterval(cd);
            calcBtn.disabled      = false;
            calcBtn.style.opacity = "1";
            calcBtn.textContent   = "加算";
            updateUI();
          }
        }, 1000);
      };

      $("btnAllClear").onclick = () => {
        if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
        pauseSec      = 0;
        startTime     = 0;
        lastLapSec    = 0;
        killCount     = 0;
        jobOffsetSec  = 0;
        passbookOffset = 0;
        rowCache.length = 0;
        $("rowHistory").innerHTML = "";
        $("btnTimerStop").innerHTML = "タイマー<br>開始";
        updateTimerDisplay(0);
        updateTotal();
        updateUI();
      };

      $("btnPassbookReset").onclick = () => {
        let accumulatedRaw = 0;
        rowCache.filter(r => r.dataset.type === "pass").forEach(r => {
          accumulatedRaw += parseFloat(r.dataset.rawValCapped) || 0;
        });
        passbookOffset = Math.ceil(accumulatedRaw);
        updateTotal();
      };

      $("btnPassbookWithdraw").onclick = () => {
        let accumulatedRaw = 0;
        rowCache.filter(r => r.dataset.type === "pass").forEach(r => {
          accumulatedRaw += parseFloat(r.dataset.rawValCapped) || 0;
        });
        const balance = accumulatedRaw - passbookOffset;
        if (balance <= 0) return;
        passbookOffset += Math.min(EXP_PER_LV, balance);
        updateTotal();
      };

      $("btnJob").onclick = () => {
        if (!timerHandle && pauseSec === 0) return;
        if (jobBtnLocked) return;
        jobBtnLocked = true;
        setTimeout(() => { jobBtnLocked = false; }, 1000);

        const elapsed = timerHandle
          ? (Date.now() - startTime) / 1000
          : pauseSec;
        jobOffsetSec += 20;
        if (jobOffsetSec > elapsed) jobOffsetSec = elapsed;
        updateTimerDisplay(elapsed);
        if (timerHandle) {
          addRow("JOB", 0, 0, "job", elapsed, elapsed - lastLapSec);
          lastLapSec = elapsed;
        }
      };

      $("btnRita").onclick = () => {
        ritaOrKuma = "returner";
        $("btnRita").classList.add("active-rita-kuma");
        $("btnKuma").classList.remove("active-rita-kuma");
        updateUI(false);
      };
      $("btnKuma").onclick = () => {
        ritaOrKuma = "dearthlicant";
        $("btnKuma").classList.add("active-rita-kuma");
        $("btnRita").classList.remove("active-rita-kuma");
        updateUI(false);
      };

      $("btnOptMonster").onclick = () => {
        $("ms").value = lookupOptimalMonster();
        updateUI(true);
      };

      // タイマー開始/再開（ラベルを状態に応じて切り替え）
      $("btnTimerStop").onclick = () => {
        if (timerHandle) return;   // 既に動作中なら無視
        if (!audioCtx) {
          try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
        }
        startTime   = Date.now() - pauseSec * 1000;
        timerHandle = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          updateTimerDisplay(elapsed);

          if (lapNotifyEnabled) {
            const avg     = getAverageLapSec();
            const current = elapsed - lastLapSec;
            if (avg !== null && current > avg) {
              if (!lapNotifyFired) {
                lapNotifyFired = true;
                playLapWarning();
              }
            } else {
              lapNotifyFired = false;
            }
          }
        }, 16);   // ~60fps
        $("btnTimerStop").innerHTML = "タイマー<br>再開中";
      };

      $("btnTimerPause").onclick = () => {
        if (!timerHandle) return;
        clearInterval(timerHandle);
        timerHandle = null;
        pauseSec    = (Date.now() - startTime) / 1000;
        updateTimerDisplay(pauseSec);
        $("btnTimerStop").innerHTML = "タイマー<br>再開";
      };

      $("btnCopyHistory").onclick = () => {
        try {
          const lines = [];
          const msEl  = $("ms");
          lines.push(`モンスター/${msEl.options[msEl.selectedIndex].text}`);
          lines.push(`総獲得/平均タイム/想定玉給`);
          lines.push(
            `${$("totalExpDisplay").textContent.replace(/,/g, "")}` +
            `/${$("avgTimeDisplay").textContent}` +
            `/${$("estimatedGoldDisplay").textContent}`
          );
          lines.push(``);
          lines.push(`#/戦闘時間/獲得exp/呼び数/お供/種類`);

          // キャッシュを逆順（新→古）で出力（表示順と同じ）
          [...rowCache].reverse().forEach(el => {
            const rowType = el.dataset.type || "";
            const rowId   = el.dataset.bid  || "-";
            if (rowType === "lap_only") {
              lines.push(`${rowId}/LAPMARK////`);
              return;
            }
            if (rowType === "job") {
              lines.push(`${rowId}/${formatTime(parseFloat(el.dataset.sec) || 0)}////転職`);
              return;
            }
            const timeStr     = formatTime(parseFloat(el.dataset.sec) || 0);
            const expVal      = (parseInt(el.dataset.val) || 0).toString();
            const callIdx     = parseInt(el.dataset.count);
            const callLabel   = !isNaN(callIdx) ? (CALL_LABELS[callIdx] || "--") : "--";
            const rSel        = el.querySelector(".rs");
            const partnerLabel = rSel
              ? (rSel.options[rSel.selectedIndex]?.text || "お供無")
              : "お供無";
            const typeLabel = rowType === "pass"    ? "通帳"
                            : rowType === "angel"   ? "エンゼル"
                            : rowType === "overflow"? "溢れ"
                            : "通常";
            lines.push(`${rowId}/${timeStr}/${expVal}/${callLabel}/${partnerLabel}/${typeLabel}`);
          });

          navigator.clipboard.writeText(lines.join("\n"))
            .then(()  => alert("履歴をコピーしました"))
            .catch(() => alert("コピー失敗（権限またはHTTPS環境を確認してください）"));
        } catch (e) {
          alert("コピー失敗");
        }
      };

      $("btnBuffReset").onclick = () => {
        $("fd").checked = true;
        $("tr").checked = false;
        $("ag").checked = false;
        $("em").checked = false;
        const genki = root.querySelector('input[name="e_exp"][value="genki"]');
        if (genki) genki.checked = true;
        $("pb").value = "0";
        updateUI(true);
      };

      root.querySelectorAll('input[name="e_exp"], #fd, #tr, #ag, #em, #ms, #pb')
          .forEach(el => { el.onchange = () => updateUI(true); });
      $("cn").onchange = () => updateUI(false);

          // ── バージョン情報モーダル（常時表示、ツール下部） ─────────────────
      (function addVersionModal() {
        if (document.getElementById('versionModal')) return;

        const modalHTML = `
<div id="versionModal" style="margin-top: 24px; border-top: 2px solid #7ab8ff; padding-top: 16px;">
  <div style="background:#fff; border-radius:12px; border:1px solid #ddd; overflow:hidden;">
    <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px;">
  <span style="font-weight:bold; font-size:16px;">📋 傭兵用多機能ツール ver2.0.0</span>
</div>
    </div>
    <div style="display:flex; border-bottom:1px solid #ddd;">
      <button class="modal-tab" data-tab="terms" style="flex:1; padding:10px; background:#f0f0f0; border:none; cursor:pointer; font-weight:bold;">利用規約</button>
      <button class="modal-tab" data-tab="data" style="flex:1; padding:10px; background:#f0f0f0; border:none; cursor:pointer; font-weight:bold;">参考データ</button>
      <button class="modal-tab" data-tab="changelog" style="flex:1; padding:10px; background:#f0f0f0; border:none; cursor:pointer; font-weight:bold;">リリースログ</button>
    </div>
    <div style="flex:1; overflow-y:auto; padding:16px; max-height:400px;">
      <div id="tab-terms" class="modal-tab-content" style="display:block;">
        <p style="margin:0 0 12px 0;">本ツールは管理人本人の検証によるデータに基づいて制作されています。</p>
        <p style="margin:0 0 12px 0;">結果を保証するためのものではありません。</p>
        <p style="margin:0; font-weight:bold;">内部データの無断転用、および二次利用は固く禁止します。</p>
        <p style="margin:12px 0 0 0; font-size:11px; color:#888;">(C) ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.</p>
      </div>
      <div id="tab-data" class="modal-tab-content" style="display:none;">
        <img src="./images/ref_data.png" alt="参考データ" style="max-width:100%; height:auto; border-radius:6px;">
        <p style="margin:8px 0 0 0; font-size:12px; color:#666; text-align:center;">※ 経験値テーブル / 最適値データ</p>
      </div>
      <div id="tab-changelog" class="modal-tab-content" style="display:none;">
        <pre style="margin:0; font-size:12px; white-space:pre-wrap; font-family:monospace;">
v2.0.0
  - CSV1/CSV2テーブル導入（最適値精度向上）
  - リタ/クマ切り替え機能追加
  - 最適モンスター自動選定ボタン追加
  - LAP音声通知機能追加
  - デスペナルティ想定機能実装
  - セキュリティ強化（XSS対策）
  - パフォーマンス改善（60fps）
  - 転職ボタン連打防止
  - 行削除時のAngel連動削除
  - 「最適+1」ボタン廃止（テーブル高精度化に伴い）

v1.5.6
  - リタ/クマベース最適モンスター判定改善

v1.5.5
  - デスペナルティ予測（仮実装）
  - ゴーレム強/ダースリカント追加
  - OCボタン追加 / 履歴コピーボタン追加

v1.5.4
  - 平均タイム表示拡大 / レイアウト調整

v1.5.3
  - ツール枠撤廃 / 内部ロジック調整

v1.4.5
  - 転職機能追加 / 計算ロジック調整

v1.4.2
  - タイマー開始直後の加算ロック追加

v1.4.1
  - ダークモード導入 / 最適呼び数自動選択

v1.2.8
  - 通帳2上限修正 / AC時通帳バグ修正

v1.2.6
  - スマホ向けレイアウト改修

v1.1.7
  - 初期バージョン

詳細: https://yr-dullahan.hatenablog.com/
        </pre>
      </div>
    </div>
  </div>
</div>
<style>
  /* ========== ライトモード ========== */
  #versionModal {
    margin-top: 24px;
    border-top: 2px solid #7ab8ff;
    padding-top: 16px;
  }
  #versionModal > div {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #dddddd;
    overflow: hidden;
    max-width: 800px;
    margin: 0;
    width: 100%;
  }
  #versionModal .modal-header {
    background: #f8f9fc;
    border-bottom: 1px solid #dddddd;
  }
  #versionModal .modal-header span {
    color: #333333;
  }
  #versionModal .modal-tab {
    flex: 1;
    padding: 10px;
    background: #f0f0f0;
    border: none;
    cursor: pointer;
    font-weight: bold;
    color: #333333;
  }
  #versionModal .modal-tab.active {
    background: #ffffff;
    border-bottom: 2px solid #0066cc;
    color: #0066cc;
  }
  #versionModal .modal-tab-content p {
    margin: 0 0 12px 0;
    color: #333333;
  }
  #versionModal .modal-tab-content pre {
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
    font-family: monospace;
    color: #333333;
  }
  #versionModal .img-caption {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #666666;
    text-align: center;
  }

  /* ========== ダークモード ========== */
  body.dark-mode #versionModal > div {
    background: #1a1a2a !important;
    border-color: #2a2a3a !important;
  }
  body.dark-mode #versionModal .modal-header {
    background: #1a1a2a !important;
    border-bottom-color: #2a2a3a !important;
  }
  body.dark-mode #versionModal .modal-header span {
    color: #e8e8f0 !important;
  }
  body.dark-mode #versionModal .modal-tab {
    background: #2a2a3a !important;
    color: #94a3b8 !important;
  }
  body.dark-mode #versionModal .modal-tab.active {
    background: #1a1a2a !important;
    color: #60a5fa !important;
    border-bottom-color: #60a5fa !important;
  }
  body.dark-mode #versionModal .modal-tab-content p {
    color: #cbd5e1 !important;
  }
  body.dark-mode #versionModal .modal-tab-content pre {
    color: #cbd5e1 !important;
  }
  body.dark-mode #versionModal .img-caption {
    color: #94a3b8 !important;
  }
</style>
        `;

        const container = document.querySelector('#dqx-tool-container');
        if (container) {
          container.insertAdjacentHTML('afterend', modalHTML);
        }

        // タブ切り替えイベント
        const tabs = document.querySelectorAll('.modal-tab');
        const contents = document.querySelectorAll('.modal-tab-content');
        const openTab = (tabId) => {
          contents.forEach(c => c.style.display = 'none');
          const target = document.getElementById(`tab-${tabId}`);
          if (target) target.style.display = 'block';
          tabs.forEach(t => t.classList.remove('active'));
          const activeTab = document.querySelector(`.modal-tab[data-tab="${tabId}"]`);
          if (activeTab) activeTab.classList.add('active');
        };
        tabs.forEach(tab => {
          tab.onclick = () => openTab(tab.dataset.tab);
        });
      })();

      updateUI(true);
    }

    // ── 公開インターフェース ─────────────────────────────────────────────
    return {
      render,
      destroy() {
        if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
        startTime = pauseSec = lastLapSec = jobOffsetSec = passbookOffset = 0;
        rowCache.length = 0;
      },
    };
  }

  // ─── グローバル公開（後方互換: シングルトン） ──────────────────────────
  const _defaultInstance = createExpCalc();
  global.Expmercenary = {
    render:  _defaultInstance.render,
    destroy: _defaultInstance.destroy,
    // 複数インスタンスが必要な場合
    createInstance: createExpCalc,
  };

})(window);
