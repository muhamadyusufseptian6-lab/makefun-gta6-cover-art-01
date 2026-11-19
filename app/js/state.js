/* Vice City Cover Studio — state, panel layouts, photo registry, saved settings.
   Classic script: loaded before cover.js and app.js. No network use. */

var VC_LAYOUTS = {
  single: {
    label: "Single hero",
    panels: [[0, 0, 1, 1]]
  },
  hero3: {
    label: "Hero + 3",
    panels: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.3334], [0.62, 0.3334, 0.38, 0.3333], [0.62, 0.6667, 0.38, 0.3333]]
  },
  split2: {
    label: "2-panel split",
    panels: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]]
  },
  strip3: {
    label: "3-panel strip",
    panels: [[0, 0, 0.3334, 1], [0.3334, 0, 0.3333, 1], [0.6667, 0, 0.3333, 1]]
  },
  grid4: {
    label: "4-panel grid",
    panels: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
  }
};

var VC_GRADES = ["sunset", "neon", "golden", "noir"];

var VC_SIZES = {
  square: { label: "1080 x 1080", width: 1080, height: 1080 },
  portrait: { label: "1080 x 1350", width: 1080, height: 1350 },
  wide: { label: "1920 x 1080", width: 1920, height: 1080 }
};

var VC_SAVE_KEY = "viceCityCoverStudio.v1";

function vcDefaultPanel(photoId) {
  return { photoId: photoId, zoom: 1, dx: 0, dy: 0 };
}

function vcDefaultState() {
  return {
    layout: "hero3",
    grade: "sunset",
    gradeStrength: 70,
    title: "VICE CITY",
    subtitle: "a Leonida story",
    titleSize: 96,
    titleY: 76,
    titleColor: "#ffffff",
    sizeKey: "square",
    selectedPanel: 0,
    panels: [
      vcDefaultPanel("sample-boulevard"),
      vcDefaultPanel("sample-pier"),
      vcDefaultPanel("sample-boulevard"),
      vcDefaultPanel("sample-pier")
    ]
  };
}

var vcState = vcDefaultState();

/* Photos live only in memory (never in saved settings): id -> { img, name }. */
var vcPhotos = {};
var vcPhotoOrder = [];

function vcRegisterPhoto(id, img, name) {
  vcPhotos[id] = { img: img, name: name };
  if (vcPhotoOrder.indexOf(id) < 0) vcPhotoOrder.push(id);
}

function vcPhotoForPanel(panel) {
  if (panel && vcPhotos[panel.photoId]) return vcPhotos[panel.photoId];
  return vcPhotos["sample-boulevard"] || null;
}

function vcPanelsForLayout(layoutKey) {
  var layout = VC_LAYOUTS[layoutKey] || VC_LAYOUTS.hero3;
  var out = [];
  var i;
  for (i = 0; i < layout.panels.length; i++) {
    var saved = vcState.panels[i] || vcDefaultPanel("sample-boulevard");
    out.push(saved);
  }
  return out;
}

function vcSaveState() {
  try {
    var copy = {
      layout: vcState.layout,
      grade: vcState.grade,
      gradeStrength: vcState.gradeStrength,
      title: vcState.title,
      subtitle: vcState.subtitle,
      titleSize: vcState.titleSize,
      titleY: vcState.titleY,
      titleColor: vcState.titleColor,
      sizeKey: vcState.sizeKey,
      selectedPanel: vcState.selectedPanel,
      panels: vcState.panels.map(function (p) {
        return { photoId: p.photoId, zoom: p.zoom, dx: p.dx, dy: p.dy };
      })
    };
    window.localStorage.setItem(VC_SAVE_KEY, JSON.stringify(copy));
  } catch (err) {
    /* Storage may be off in a locked-down browser; the editor still works. */
  }
}

function vcLoadState() {
  var raw = null;
  try {
    raw = window.localStorage.getItem(VC_SAVE_KEY);
  } catch (err) {
    return;
  }
  if (!raw) return;
  var saved = null;
  try {
    saved = JSON.parse(raw);
  } catch (err) {
    return;
  }
  if (!saved || typeof saved !== "object") return;
  var fresh = vcDefaultState();
  var keys = ["layout", "grade", "gradeStrength", "title", "subtitle",
    "titleSize", "titleY", "titleColor", "sizeKey", "selectedPanel"];
  keys.forEach(function (key) {
    if (saved[key] !== undefined) fresh[key] = saved[key];
  });
  if (!VC_LAYOUTS[fresh.layout]) fresh.layout = "hero3";
  if (VC_GRADES.indexOf(fresh.grade) < 0) fresh.grade = "sunset";
  if (!VC_SIZES[fresh.sizeKey]) fresh.sizeKey = "square";
  if (Array.isArray(saved.panels)) {
    saved.panels.forEach(function (p, i) {
      if (p && typeof p.photoId === "string") {
        fresh.panels[i] = {
          photoId: p.photoId,
          zoom: typeof p.zoom === "number" ? p.zoom : 1,
          dx: typeof p.dx === "number" ? p.dx : 0,
          dy: typeof p.dy === "number" ? p.dy : 0
        };
      }
    });
  }
  fresh.selectedPanel = 0;
  vcState = fresh;
}

/* Deterministic pseudo-random numbers (fixed seed) so grain never changes a render. */
function vcSeededRandom(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
