// src/ExperiencePanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { Leaf, Notebook, ArrowRight, DownloadSimple, LinkSimple } from "@phosphor-icons/react";

// src/experience-data.js
var EXPERIENCE = {
  id: "three-trees-v1",
  title: "\uC78E\uACFC \uB098\uBB34\uAECD\uC9C8\uB85C \uB9CC\uB098\uB294 \uC138 \uB098\uBB34",
  subtitle: "\uC774\uB984\uC744 \uC77D\uACE0, \uD2B9\uC9D5\uC744 \uCC3E\uACE0, \uB098\uC758 \uBC1C\uACAC\uC744 \uB0A8\uACA8\uC694.",
  reviewLabel: "\uC7A5\uC18C \uD655\uC778 \uC804 \uC2DC\uBC94 \uCCB4\uD5D8",
  locationNotice: "\uC2E4\uC81C \uAD00\uCC30 \uC9C0\uC810\uC740 \uC900\uBE44 \uC911\uC774\uC5D0\uC694. \uC774 \uBAA9\uB85D\uC740 \uC120\uD0DD\uD55C \uAE30\uAD00\uC5D0\uC11C \uC138 \uB098\uBB34\uB97C \uBAA8\uB450 \uB9CC\uB0A0 \uC218 \uC788\uB2E4\uB294 \uC548\uB0B4\uAC00 \uC544\uB2D9\uB2C8\uB2E4.",
  safety: "\uD0D0\uBC29\uB85C\uC5D0\uC11C \uBCF4\uC774\uB294 \uBD80\uBD84\uB9CC \uAD00\uCC30\uD574\uC694. \uC78E\uACFC \uAC00\uC9C0\uB97C \uAEBE\uAC70\uB098 \uB098\uBB34\uAECD\uC9C8\uC744 \uBC97\uAE30\uC9C0 \uC54A\uC544\uC694.",
  trees: [
    {
      id: "hinoki",
      name: "\uD3B8\uBC31\uB098\uBB34",
      standardName: "\uD3B8\uBC31",
      scientificName: "Chamaecyparis obtusa",
      theme: "\uC791\uC740 \uC78E\uC744 \uC790\uC138\uD788 \uB4E4\uC5EC\uB2E4\uBD10\uC694",
      feature: "\uC791\uC740 \uBE44\uB298 \uAC19\uC740 \uC78E",
      description: "\uC791\uC740 \uBE44\uB298 \uBAA8\uC591\uC758 \uC78E\uC774 \uBAA8\uC5EC \uAC00\uC9C0\uB97C \uB36E\uACE0 \uC788\uC5B4\uC694. \uC78E \uB4B7\uBA74\uC5D0\uB294 \uD770\uC0C9 \uAE30\uACF5\uC120\uC774 Y\uC790 \uBAA8\uC591\uC73C\uB85C \uB098\uD0C0\uB098\uC694. \uAC00\uAE4C\uC774\uC5D0\uC11C \uBCF4\uC774\uB294 \uC791\uC740 \uC78E\uC758 \uBAA8\uC591\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694.",
      question: "\uC791\uC740 \uC78E\uB4E4\uC774 \uC5B4\uB5BB\uAC8C \uACB9\uCCD0 \uC788\uB098\uC694? \uBCF4\uC774\uB294 \uC78E \uB4B7\uBA74\uC5D0\uC11C \uD770 \uBB34\uB2AC\uB3C4 \uCC3E\uC544\uBCF4\uC138\uC694.",
      hints: ["\uAC00\uC9C0\uB97C \uAEBE\uAC70\uB098 \uC78E\uC744 \uB5BC\uC9C0 \uB9D0\uACE0, \uB208\uB192\uC774\uC5D0\uC11C \uBCF4\uC774\uB294 \uBD80\uBD84\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694.", "\uBB34\uB2AC\uAC00 \uBCF4\uC774\uC9C0 \uC54A\uC73C\uBA74 \u201C\uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694\u201D\uB77C\uACE0 \uC801\uC5B4\uB3C4 \uAD1C\uCC2E\uC544\uC694."],
      placeholder: "\uC608: \uC791\uC740 \uC78E\uC774 \uACB9\uCCD0 \uC788\uC5C8\uC5B4\uC694. \uB4B7\uBA74\uC758 \uBB34\uB2AC\uB294 \uC798 \uBCF4\uC774\uC9C0 \uC54A\uC558\uC5B4\uC694.",
      photo: null,
      location: null,
      reviewed: false,
      sources: [{ label: "\uC0B0\uB9BC\uCCAD \uC0B0\uB9BC\uC6A9\uC5B4\uC0AC\uC804 \xB7 \uD3B8\uBC31", url: "https://www.forest.go.kr/kfsweb/kfi/kfs/mwd/selectMtstWordDictionary.do?mn=NKFS_04_07_01&wrdSn=9956&wrdType=" }]
    },
    {
      id: "cork-oak",
      name: "\uAD74\uCC38\uB098\uBB34",
      standardName: "\uAD74\uCC38\uB098\uBB34",
      scientificName: "Quercus variabilis",
      theme: "\uB098\uBB34\uAECD\uC9C8\uC5D0\uB3C4 \uD2B9\uC9D5\uC774 \uC788\uC5B4\uC694",
      feature: "\uCF54\uB974\uD06C\uCE35\uC774 \uBC1C\uB2EC\uD55C \uAECD\uC9C8",
      description: "\uB098\uBB34\uAECD\uC9C8\uC5D0 \uCF54\uB974\uD06C\uCE35\uC774 \uBC1C\uB2EC\uD558\uB294 \uB098\uBB34\uC608\uC694. \uC78E \uB4B7\uBA74\uC5D0\uB294 \uD770 \uD138\uC774 \uBE7D\uBE7D\uD558\uAC8C \uB098 \uC788\uC5B4\uC694. \uC78E\uBFD0 \uC544\uB2C8\uB77C \uC904\uAE30\uC758 \uBAA8\uC2B5\uB3C4 \uB098\uBB34\uB97C \uC54C\uC544\uBCF4\uB294 \uB2E8\uC11C\uAC00 \uB3FC\uC694.",
      question: "\uAECD\uC9C8\uC5D0 \uC5B4\uB5A4 \uBB34\uB2AC\uC640 \uAC08\uB77C\uC9D0\uC774 \uBCF4\uC774\uB098\uC694? \uAC00\uAE4C\uC6B4 \uB2E4\uB978 \uB098\uBB34\uC640 \uC5B4\uB5BB\uAC8C \uB2E4\uB978\uAC00\uC694?",
      hints: ["\uB098\uBB34\uAECD\uC9C8\uC744 \uBC97\uAE30\uAC70\uB098 \uAE01\uC9C0 \uC54A\uACE0 \uB208\uC73C\uB85C \uAD00\uCC30\uD574\uC694.", "\uAECD\uC9C8 \uBAA8\uC591 \uD558\uB098\uB9CC\uC73C\uB85C \uAD74\uCC38\uB098\uBB34\uB77C\uACE0 \uD655\uC815\uD558\uC9C0 \uC54A\uC544\uC694."],
      placeholder: "\uC608: \uAECD\uC9C8\uC5D0 \uAE4A\uC740 \uC120\uC774 \uC788\uC5C8\uC5B4\uC694. \uC606 \uB098\uBB34\uBCF4\uB2E4 \uC6B8\uD241\uBD88\uD241\uD574 \uBCF4\uC600\uC5B4\uC694.",
      photo: null,
      location: null,
      reviewed: false,
      sources: [{ label: "\uAD74\uCC38\uB098\uBB34 - \uD55C\uAD6D\uBBFC\uC871\uBB38\uD654\uB300\uBC31\uACFC\uC0AC\uC804 \xB7 \uC784\uACBD\uBE48", url: "https://encykorea.aks.ac.kr/Article/E0006759" }]
    },
    {
      id: "japanese-maple",
      name: "\uB2E8\uD48D\uB098\uBB34",
      standardName: "\uB2E8\uD48D\uB098\uBB34",
      scientificName: "Acer palmatum",
      theme: "\uC190\uBC14\uB2E5\uC744 \uB2EE\uC740 \uC78E\uC744 \uCC3E\uC544\uBD10\uC694",
      feature: "\uC190\uBC14\uB2E5\uCC98\uB7FC \uAC08\uB77C\uC9C4 \uC78E",
      description: "\uC78E\uC774 \uC190\uBC14\uB2E5\uCC98\uB7FC \uBCF4\uD1B5 5~7\uAC08\uB798\uB85C \uAC08\uB77C\uC838\uC694. \uD55C \uB098\uBB34\uC5D0\uC11C\uB3C4 \uC78E\uB9C8\uB2E4 \uD06C\uAE30\uC640 \uC0C9\uC774 \uC5B4\uB5BB\uAC8C \uB2E4\uB978\uC9C0 \uC0B4\uD3B4\uBCF4\uC138\uC694. \uC5EC\uAE30\uC11C\uB294 \uB2E8\uD48D\uB098\uBB34(Acer palmatum)\uB97C \uB2E4\uB8E8\uBA70, \uB2F9\uB2E8\uD48D\uB098\uBB34 \uB4F1 \uB2E4\uB978 \uC885\uB958\uB294 \uBCC4\uB3C4\uB85C \uD655\uC778\uD574\uC57C \uD574\uC694.",
      question: "\uB208\uC55E\uC758 \uC78E\uC740 \uBA87 \uAC08\uB798\uC778\uAC00\uC694? \uB2E4\uB978 \uC78E\uB3C4 \uAC19\uC740\uC9C0 \uBE44\uAD50\uD574\uBCF4\uC138\uC694.",
      hints: ["\uC78E\uC774 \uBD89\uC9C0 \uC54A\uC544\uB3C4 \uAD00\uCC30\uD560 \uC218 \uC788\uC5B4\uC694.", "\uC78E\uC744 \uB538 \uD544\uC694\uB294 \uC5C6\uC5B4\uC694. \uC190\uBC14\uB2E5\uC744 \uC606\uC5D0 \uD3BC\uCCD0 \uBAA8\uC591\uB9CC \uBE44\uAD50\uD574\uBCF4\uC138\uC694."],
      placeholder: "\uC608: \uC78E\uC774 \uC77C\uACF1 \uAC08\uB798\uB85C \uBCF4\uC600\uC5B4\uC694. \uC791\uC740 \uC78E\uACFC \uD070 \uC78E\uC758 \uC0C9\uC774 \uB2EC\uB790\uC5B4\uC694.",
      photo: null,
      location: null,
      reviewed: false,
      sources: [{ label: "\uC11C\uC6B8\uB300\uACF5\uC6D0 \uC2DD\uBB3C\uC6D0 \uC140\uD504 \uAC00\uC774\uB4DC \xB7 \uB2E8\uD48D\uB098\uBB34", url: "https://grandpark.seoul.go.kr/board/view/ko/S001003002007/B032.do?bbs_no=104314" }]
    }
  ]
};

// src/center-model.js
var validCenterId = (id) => typeof id === "string" && id.length > 0 && id.length <= 80 && !id.includes("/") && id !== "." && id !== "..";

// src/experience-model.js
var VISIT_NOTE_LIMIT = 300;
var treeIds = new Set(EXPERIENCE.trees.map((t) => t.id));
function updateVisit(visit, treeId, patch) {
  if (!visit || !validCenterId(visit.centerId) || !treeIds.has(treeId)) throw new Error("\uAD00\uCC30 \uB300\uC0C1\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  const old = visit.entries[treeId] || { note: "", observed: false };
  const next = { note: typeof patch.note === "string" ? patch.note.slice(0, VISIT_NOTE_LIMIT) : old.note, observed: typeof patch.observed === "boolean" ? patch.observed : old.observed };
  return { ...visit, entries: { ...visit.entries, [treeId]: next } };
}
function hasVisit(visit) {
  return EXPERIENCE.trees.some((t) => {
    const row = visit?.entries?.[t.id];
    return !!row && (row.observed || !!row.note?.trim());
  });
}
function visitRows(visit) {
  return EXPERIENCE.trees.map((tree) => ({ tree, note: visit?.entries?.[tree.id]?.note || "", observed: visit?.entries?.[tree.id]?.observed === true })).filter((row) => row.observed || row.note.trim());
}
function visitText(visit, centerName) {
  if (typeof centerName !== "string" || centerName.length > 80) throw new Error("\uAE30\uAD00\uBA85\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  const rows = visitRows(visit);
  if (!rows.length) throw new Error("\uAD00\uCC30 \uD45C\uC2DC\uB098 \uBA54\uBAA8\uB97C \uD558\uB098 \uB0A8\uACA8\uC8FC\uC138\uC694.");
  const date = new Date(visit.startedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" });
  return ["\u3147\u3131\u3141\u3147 \xB7 \uC624\uB298 \uB0B4\uAC00 \uBC1C\uACAC\uD55C \uD2B9\uC9D5", `\uAE30\uAD00 \uC120\uD0DD: ${centerName}`, `\uCCB4\uD5D8 \uC2DC\uC791\uC77C: ${date}`, EXPERIENCE.title, "\uC7A5\uC18C \uD655\uC778 \uC804 \uC2DC\uBC94 \uCF58\uD150\uCE20 \xB7 \uBC29\uBB38 \uBC0F \uC2DD\uBB3C \uC885\uC744 \uC778\uC99D\uD558\uB294 \uAE30\uB85D\uC774 \uC544\uB2D9\uB2C8\uB2E4.", "", ...rows.flatMap(({ tree, note, observed }) => [`${tree.name} (${tree.scientificName})`, `\uAD00\uCC30 \uD45C\uC2DC: ${observed ? "\uB0B4\uAC00 \uAD00\uCC30\uD588\uB2E4\uACE0 \uD45C\uC2DC\uD568 \xB7 \uC885 \uD655\uC815 \uC544\uB2D8" : "\uD45C\uC2DC\uD558\uC9C0 \uC54A\uC74C"}`, `\uB098\uC758 \uBA54\uBAA8: ${note.trim() || "\uC791\uC131\uD558\uC9C0 \uC54A\uC558\uC5B4\uC694."}`, ""]), "\uC815\uD655\uD55C \uC704\uCE58\xB7\uC0AC\uC9C4\xB7\uACC4\uC815 \uC815\uBCF4\uB294 \uD3EC\uD568\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."].join("\n");
}
function experienceLink(base, centerId) {
  if (!validCenterId(centerId)) throw new Error("\uAE30\uAD00 ID\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  const url = new URL(base);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("\uC0AC\uC774\uD2B8 \uC8FC\uC18C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  url.search = "";
  url.hash = "";
  url.searchParams.set("center", centerId);
  url.searchParams.set("view", "explore");
  return url.href;
}

// src/ExperiencePanel.jsx
function ExperiencePanel({ center, visit, onChange, onCapture, onPanelState }) {
  const [summary, setSummary] = useState(false), [notice, setNotice] = useState(""), [downloadError, setDownloadError] = useState("");
  const heading = useRef(null), initialized = useRef(false), linkField = useRef(null), alive = useRef(true);
  const rows = visitRows(visit), observed = rows.filter((x) => x.observed).length;
  useEffect(() => {
    onPanelState({ busy: false, dirty: false });
    return () => onPanelState({ busy: false, dirty: false });
  }, [onPanelState]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (initialized.current) heading.current?.focus();
    initialized.current = true;
  }, [summary]);
  function change(treeId, patch) {
    onChange((current) => updateVisit(current?.centerId === center.id ? current : visit, treeId, patch));
  }
  const link = typeof window === "undefined" ? "" : experienceLink(window.location.href, center.id);
  async function copyLink() {
    setNotice("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard");
      await navigator.clipboard.writeText(link);
      if (alive.current) setNotice("\uC774 \uAE30\uAD00\uC758 \uCCB4\uD5D8 \uB9C1\uD06C\uB97C \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.");
    } catch (_) {
      if (!alive.current) return;
      setNotice("\uC544\uB798 \uC8FC\uC18C\uB97C \uAE38\uAC8C \uB204\uB974\uAC70\uB098 \uC120\uD0DD\uD574 \uBCF5\uC0AC\uD574\uC8FC\uC138\uC694.");
      linkField.current?.focus();
      linkField.current?.select();
    }
  }
  function download() {
    setDownloadError("");
    let url;
    try {
      const text = visitText(visit, center.name), blob = new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" });
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "egmy-observation-" + new Date(visit.startedAt + 9 * 60 * 60 * 1e3).toISOString().slice(0, 10) + ".txt";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6e4);
      setNotice("\uAE30\uB85D \uD30C\uC77C \uB0B4\uB824\uBC1B\uAE30\uB97C \uC694\uCCAD\uD588\uC5B4\uC694. \uBE0C\uB77C\uC6B0\uC800\uC758 \uB2E4\uC6B4\uB85C\uB4DC \uBAA9\uB85D\uC5D0\uC11C \uD655\uC778\uD574\uC8FC\uC138\uC694.");
    } catch (e) {
      if (url) URL.revokeObjectURL(url);
      setDownloadError(e.message || "\uAE30\uB85D\uC744 \uB0B4\uB824\uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uBA54\uBAA8\uB97C \uB530\uB85C \uBCF5\uC0AC\uD574 \uBCF4\uAD00\uD574\uC8FC\uC138\uC694.");
    }
  }
  return /* @__PURE__ */ React.createElement("main", { className: "experience-panel" }, /* @__PURE__ */ React.createElement("div", { className: "page-heading" }, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "\uB85C\uADF8\uC778 \uC5C6\uC774 \uC2DC\uC791\uD558\uB294 \uC232 \uAD00\uCC30"), /* @__PURE__ */ React.createElement("h1", { ref: heading, tabIndex: -1 }, summary ? "\uC624\uB298 \uB0B4\uAC00 \uBC1C\uACAC\uD55C \uD2B9\uC9D5" : "\uC138 \uB098\uBB34\uC640 \uCC9C\uCC9C\uD788 \uB9CC\uB098\uC694"), /* @__PURE__ */ React.createElement("p", null, EXPERIENCE.subtitle)), /* @__PURE__ */ React.createElement("div", { className: "experience-banner" }, /* @__PURE__ */ React.createElement("span", { className: "experience-tag" }, EXPERIENCE.reviewLabel), /* @__PURE__ */ React.createElement("h2", null, EXPERIENCE.title), /* @__PURE__ */ React.createElement("p", null, EXPERIENCE.locationNotice), /* @__PURE__ */ React.createElement("p", null, EXPERIENCE.safety)), /* @__PURE__ */ React.createElement("p", { className: "visit-privacy" }, "\uAD00\uCC30 \uBA54\uBAA8\uB294 \uC774 \uD398\uC774\uC9C0\uB97C \uC5F4\uC5B4\uB454 \uB3D9\uC548\uB9CC \uC720\uC9C0\uD574\uC694. \uC0C8\uB85C\uACE0\uCE68\xB7\uCC3D \uB2EB\uAE30\xB7\uAE30\uAD00 \uBCC0\uACBD\xB7\uB85C\uADF8\uC778 \uC0C1\uD0DC \uBCC0\uACBD \uC2DC \uC0AC\uB77C\uC9D1\uB2C8\uB2E4. \uC624\uB798 \uBCF4\uAD00\uD558\uB824\uBA74 \uC694\uC57D\uC5D0\uC11C \uAE30\uB85D\uC744 \uB0B4\uB824\uBC1B\uC73C\uC138\uC694. \uACC4\uC815 \uB3C4\uAC10\uC5D0 \uC790\uB3D9 \uC800\uC7A5\uD558\uAC70\uB098 \uACF5\uAC1C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { className: "experience-views", "aria-label": "\uAD00\uCC30 \uD654\uBA74 \uC120\uD0DD" }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-pressed": !summary, onClick: () => setSummary(false) }, /* @__PURE__ */ React.createElement(Leaf, { size: 20, "aria-hidden": "true" }), "\uB098\uBB34 \uC0B4\uD3B4\uBCF4\uAE30"), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-pressed": summary, onClick: () => setSummary(true) }, /* @__PURE__ */ React.createElement(Notebook, { size: 20, "aria-hidden": "true" }), "\uB0B4 \uAD00\uCC30 \uC694\uC57D")), notice && /* @__PURE__ */ React.createElement("p", { role: "status", className: "visit-status" }, notice), downloadError && /* @__PURE__ */ React.createElement("p", { role: "alert", className: "visit-status text-red-900" }, downloadError), !summary ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "experience-help" }, "\uC6D0\uD558\uB294 \uB098\uBB34\uBD80\uD130 \uC0B4\uD3B4\uBCF4\uC138\uC694. \uBAA8\uB450 \uCC3E\uC9C0 \uC54A\uC544\uB3C4 \uAD1C\uCC2E\uC544\uC694. \uCCB4\uD06C\uC640 \uBA54\uBAA8\uB294 \uB098\uC758 \uAD00\uCC30 \uD45C\uD604\uC774\uBA70, \uB098\uBB34\uC758 \uC885\uC744 \uD655\uC815\uD558\uB294 \uAE30\uB2A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { className: "experience-trees" }, EXPERIENCE.trees.map((tree, i) => {
    const row = visit.entries[tree.id] || { note: "", observed: false };
    return /* @__PURE__ */ React.createElement("article", { key: tree.id, className: "tree-activity", "aria-labelledby": "tree-" + tree.id }, /* @__PURE__ */ React.createElement("div", { className: "tree-activity-heading" }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "0", i + 1), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", null, tree.feature), /* @__PURE__ */ React.createElement("h2", { id: "tree-" + tree.id }, tree.name), /* @__PURE__ */ React.createElement("p", { className: "tree-scientific" }, tree.scientificName))), tree.photo ? /* @__PURE__ */ React.createElement("figure", null, /* @__PURE__ */ React.createElement("img", { src: tree.photo.src, alt: tree.photo.alt }), /* @__PURE__ */ React.createElement("figcaption", null, tree.photo.credit)) : /* @__PURE__ */ React.createElement("div", { className: "tree-photo-pending" }, /* @__PURE__ */ React.createElement(Leaf, { size: 30, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("p", null, "\uB300\uD45C\uC0AC\uC9C4\uC740 \uACE7 \uCD94\uAC00\uD560\uAC8C\uC694"), /* @__PURE__ */ React.createElement("span", null, "\uC9C0\uAE08\uC740 \uC124\uBA85\uACFC \uAD00\uCC30 \uC9C8\uBB38\uC73C\uB85C \uC0B4\uD3B4\uBCF4\uC138\uC694.")), /* @__PURE__ */ React.createElement("h3", null, tree.theme), /* @__PURE__ */ React.createElement("p", { className: "tree-description" }, tree.description), /* @__PURE__ */ React.createElement("div", { className: "tree-question" }, /* @__PURE__ */ React.createElement("span", null, "\uC9C1\uC811 \uC0B4\uD3B4\uBD10\uC694"), /* @__PURE__ */ React.createElement("p", null, tree.question)), /* @__PURE__ */ React.createElement("details", { className: "tree-hints" }, /* @__PURE__ */ React.createElement("summary", null, "\uAD00\uCC30\uD560 \uB54C \uCC38\uACE0\uD574\uC694"), /* @__PURE__ */ React.createElement("ul", null, tree.hints.map((h) => /* @__PURE__ */ React.createElement("li", { key: h }, h)))), /* @__PURE__ */ React.createElement("label", { className: "visit-check" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: row.observed, onChange: (e) => change(tree.id, { observed: e.target.checked }) }), /* @__PURE__ */ React.createElement("span", null, "\uC774 \uB098\uBB34\uB97C \uAD00\uCC30\uD588\uB2E4\uACE0 \uD45C\uC2DC\uD558\uAE30")), /* @__PURE__ */ React.createElement("label", { className: "visit-note" }, "\uB0B4\uAC00 \uBC1C\uACAC\uD55C \uD2B9\uC9D5", /* @__PURE__ */ React.createElement("textarea", { rows: 3, maxLength: VISIT_NOTE_LIMIT, value: row.note, onChange: (e) => change(tree.id, { note: e.target.value }), placeholder: tree.placeholder }), /* @__PURE__ */ React.createElement("span", null, row.note.length, "/", VISIT_NOTE_LIMIT, "\uC790 \xB7 \uC0AC\uC9C4 \uC5C6\uC774 \uBA54\uBAA8\uB9CC \uB0A8\uACA8\uB3C4 \uAD1C\uCC2E\uC544\uC694.")), /* @__PURE__ */ React.createElement("details", { className: "tree-sources" }, /* @__PURE__ */ React.createElement("summary", null, "\uC124\uBA85 \uCD9C\uCC98\uC640 \uD655\uC778 \uC0C1\uD0DC"), /* @__PURE__ */ React.createElement("p", null, "\uCD9C\uCC98 \uC790\uB8CC\uB97C \uBC14\uD0D5\uC73C\uB85C \uC791\uC131\uD55C \uAD50\uC721\uC6A9 \uCD08\uC548\uC785\uB2C8\uB2E4. \uD604\uC7A5 \uB2F4\uB2F9\uC790\uC758 \uC218\uC885\xB7\uC704\uCE58\xB7\uC124\uBA85 \uAC80\uD1A0 \uC804\uC785\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("ul", null, tree.sources.map((s) => /* @__PURE__ */ React.createElement("li", { key: s.url }, /* @__PURE__ */ React.createElement("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, s.label, " \u2197"))))));
  })), /* @__PURE__ */ React.createElement("button", { className: "visit-primary visit-wide", type: "button", onClick: () => setSummary(true) }, "\uB0B4 \uAD00\uCC30 \uBAA8\uC544\uBCF4\uAE30 ", /* @__PURE__ */ React.createElement(ArrowRight, { size: 20, "aria-hidden": "true" }))) : /* @__PURE__ */ React.createElement("section", { className: "visit-summary", "aria-label": "\uC624\uB298\uC758 \uAD00\uCC30 \uCE74\uB4DC" }, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "\u3147\u3131\u3141\u3147 \xB7 \uB098\uC758 \uC232 \uAD00\uCC30"), /* @__PURE__ */ React.createElement("h2", null, "\uC624\uB298 \uB0B4\uAC00 \uBC1C\uACAC\uD55C \uD2B9\uC9D5"), /* @__PURE__ */ React.createElement("p", { className: "visit-center" }, "\uAE30\uAD00 \uC120\uD0DD: ", center.name, center.isDemo ? " \xB7 \uC2DC\uC5F0\uC6A9" : ""), /* @__PURE__ */ React.createElement("p", { className: "visit-date" }, new Date(visit.startedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }), " \xB7 \uCCB4\uD5D8 \uC2DC\uC791\uC77C"), /* @__PURE__ */ React.createElement("p", { className: "visit-count" }, "\uB0B4\uAC00 \uAD00\uCC30\uD588\uB2E4\uACE0 \uD45C\uC2DC\uD55C \uB098\uBB34 ", /* @__PURE__ */ React.createElement("strong", null, observed, "\uC885")), rows.length ? /* @__PURE__ */ React.createElement("ul", { className: "visit-memories" }, rows.map(({ tree, note, observed: observed2 }) => /* @__PURE__ */ React.createElement("li", { key: tree.id }, /* @__PURE__ */ React.createElement("h3", null, tree.name), /* @__PURE__ */ React.createElement("p", { className: "visit-observed" }, observed2 ? "\uB0B4 \uAD00\uCC30 \uD45C\uC2DC \uC788\uC74C \xB7 \uC885 \uD655\uC815 \uC544\uB2D8" : "\uAD00\uCC30 \uD45C\uC2DC \uC5C6\uC774 \uB0A8\uAE34 \uBA54\uBAA8"), /* @__PURE__ */ React.createElement("p", { className: "visit-memo-text" }, note.trim() || "\uBA54\uBAA8\uB294 \uC791\uC131\uD558\uC9C0 \uC54A\uC558\uC5B4\uC694.")))) : /* @__PURE__ */ React.createElement("p", { className: "visit-empty" }, "\uC544\uC9C1 \uB0A8\uAE34 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694. \uB098\uBB34\uB97C \uC0B4\uD3B4\uBCF4\uACE0 \uAD00\uCC30 \uD45C\uC2DC\uB098 \uBA54\uBAA8\uB97C \uD558\uB098 \uB0A8\uACA8\uBCF4\uC138\uC694."), /* @__PURE__ */ React.createElement("p", { className: "experience-help" }, "\uC7A5\uC18C \uD655\uC778 \uC804 \uC2DC\uBC94 \uCCB4\uD5D8\uC785\uB2C8\uB2E4. \uC774 \uCE74\uB4DC\uB294 \uBC29\uBB38 \uC0AC\uC2E4\uC774\uB098 \uC2DD\uBB3C\uC758 \uC885\uC744 \uC778\uC99D\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("button", { type: "button", className: "visit-primary visit-wide", disabled: !rows.length, onClick: download }, /* @__PURE__ */ React.createElement(DownloadSimple, { size: 20, "aria-hidden": "true" }), "\uAD00\uCC30 \uAE30\uB85D \uB0B4\uB824\uBC1B\uAE30 (.txt)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "visit-secondary visit-wide", onClick: () => setSummary(false) }, "\uAD00\uCC30 \uACC4\uC18D\uD558\uAE30")), /* @__PURE__ */ React.createElement("section", { className: "visit-next" }, /* @__PURE__ */ React.createElement("h2", null, "\uB208\uC55E\uC758 \uC2DD\uBB3C\uC774 \uAD81\uAE08\uD558\uB2E4\uBA74"), /* @__PURE__ */ React.createElement("p", null, "\uC0AC\uC9C4 \uAE30\uB85D\uC5D0\uC11C \uB85C\uADF8\uC778\uD55C \uB4A4 AI \uD6C4\uBCF4\uB97C \uBE44\uAD50\uD558\uACE0 \uC0AC\uC9C4\uC744 \uACC4\uC815\uC5D0 \uBCF4\uAD00\uD560 \uC218 \uC788\uC5B4\uC694. \uC5EC\uAE30\uC758 \uAD00\uCC30 \uBA54\uBAA8\uB294 \uC790\uB3D9\uC73C\uB85C \uC62E\uACA8\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("button", { type: "button", className: "visit-secondary visit-wide", onClick: onCapture }, "\uC0AC\uC9C4\uC73C\uB85C \uC54C\uC544\uBCF4\uAE30 ", /* @__PURE__ */ React.createElement(ArrowRight, { size: 20, "aria-hidden": "true" }))), /* @__PURE__ */ React.createElement("details", { className: "visit-entry-link" }, /* @__PURE__ */ React.createElement("summary", null, "\uC774 \uAE30\uAD00\uC758 \uCCB4\uD5D8 \uB9C1\uD06C \uB098\uB204\uAE30"), /* @__PURE__ */ React.createElement("p", null, "\uC774 \uC8FC\uC18C\uB85C \uC811\uC18D\uD558\uBA74 \uB4F1\uB85D\uB41C \uAE30\uAD00\uC744 \uD655\uC778\uD55C \uB4A4 \uC232 \uAD00\uCC30 \uD654\uBA74\uC774 \uC5F4\uB824\uC694. \uBA54\uBAA8\uC640 \uACC4\uC815 \uC815\uBCF4\uB294 \uD3EC\uD568\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("label", null, "\uCCB4\uD5D8 \uC8FC\uC18C", /* @__PURE__ */ React.createElement("input", { ref: linkField, readOnly: true, value: link, onFocus: (e) => e.target.select() })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "visit-secondary", onClick: copyLink }, /* @__PURE__ */ React.createElement(LinkSimple, { size: 18, "aria-hidden": "true" }), "\uCCB4\uD5D8 \uB9C1\uD06C \uBCF5\uC0AC")), /* @__PURE__ */ React.createElement("button", { className: "center-text-button", disabled: !hasVisit(visit), type: "button", onClick: () => {
    if (window.confirm("\uC774 \uAE30\uAD00\uC5D0\uC11C \uB0A8\uAE34 \uBC29\uBB38\uAC1D \uAD00\uCC30 \uBA54\uBAA8\uC640 \uD45C\uC2DC\uB97C \uBAA8\uB450 \uC9C0\uC6B8\uAE4C\uC694? \uACC4\uC815 \uB3C4\uAC10\uC740 \uC0AD\uC81C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")) {
      onChange({ ...visit, entries: {} });
      setNotice("\uAD00\uCC30 \uBA54\uBAA8\uC640 \uD45C\uC2DC\uB97C \uBE44\uC6E0\uC2B5\uB2C8\uB2E4.");
    }
  } }, "\uBC29\uBB38\uAC1D \uAD00\uCC30 \uBA54\uBAA8 \uBE44\uC6B0\uAE30"));
}
export {
  ExperiencePanel as default
};
