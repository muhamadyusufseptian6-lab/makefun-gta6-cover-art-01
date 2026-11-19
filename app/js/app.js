/* Vice City Cover Studio — editor wiring: photos, panels, caption, downloads.
   Classic script: loaded last, after state.js and cover.js. */

var vcPreviewCanvas = null;
var vcPreviewCtx = null;
var vcDragPanel = -1;
var vcDragLastX = 0;
var vcDragLastY = 0;

function vcEl(id) { return document.getElementById(id); }

function vcShowStatus(text) {
  var line = vcEl("statusLine");
  if (line) line.textContent = text;
}

function vcPreviewSize() {
  var size = VC_SIZES[vcState.sizeKey] || VC_SIZES.square;
  var scale = 620 / Math.max(size.width, size.height);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function vcRenderPreview() {
  if (!vcPreviewCanvas) return;
  var dims = vcPreviewSize();
  if (vcPreviewCanvas.width !== dims.width || vcPreviewCanvas.height !== dims.height) {
    vcPreviewCanvas.width = dims.width;
    vcPreviewCanvas.height = dims.height;
  }
  vcPreviewCtx = vcPreviewCanvas.getContext("2d");
  vcDrawCover(vcPreviewCtx, dims.width, dims.height);
}

function vcRefreshPanelTabs() {
  var tabs = vcEl("panelTabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  var layout = VC_LAYOUTS[vcState.layout] || VC_LAYOUTS.hero3;
  layout.panels.forEach(function (_rect, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = "Panel " + (i + 1);
    if (i === vcState.selectedPanel) b.className = "active";
    b.addEventListener("click", function () {
      vcState.selectedPanel = i;
      vcSaveState();
      vcSyncPanelControls();
      vcRefreshPanelTabs();
      vcRenderPreview();
    });
    tabs.appendChild(b);
  });
}

function vcSyncPanelControls() {
  var layout = VC_LAYOUTS[vcState.layout] || VC_LAYOUTS.hero3;
  var i = Math.min(vcState.selectedPanel, layout.panels.length - 1);
  vcState.selectedPanel = i;
  var panel = vcState.panels[i] || vcDefaultPanel("sample-boulevard");
  var label = vcEl("panelLabel");
  if (label) label.textContent = "Panel " + (i + 1) + " of " + layout.panels.length;
  var select = vcEl("panelPhoto");
  if (select) {
    select.innerHTML = "";
    vcPhotoOrder.forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = vcPhotos[id].name;
      if (id === panel.photoId) opt.selected = true;
      select.appendChild(opt);
    });
  }
  var zoom = vcEl("panelZoom");
  if (zoom) zoom.value = String(Math.round(panel.zoom * 100));
  var zoomValue = vcEl("zoomValue");
  if (zoomValue) zoomValue.textContent = Math.round(panel.zoom * 100) + "%";
  var dx = vcEl("panelDx");
  if (dx) dx.value = String(Math.round(panel.dx * 100));
  var dy = vcEl("panelDy");
  if (dy) dy.value = String(Math.round(panel.dy * 100));
}

function vcRefreshPhotoStrip() {
  var strip = vcEl("photoStrip");
  if (!strip) return;
  strip.innerHTML = "";
  vcPhotoOrder.forEach(function (id) {
    var photo = vcPhotos[id];
    var figure = document.createElement("figure");
    var thumb = document.createElement("img");
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    var cap = document.createElement("figcaption");
    cap.textContent = photo.name;
    figure.appendChild(thumb);
    figure.appendChild(cap);
    figure.addEventListener("click", function () {
      vcAssignPhotoToSelectedPanel(id);
      strip.querySelectorAll("figure").forEach(function (f) { f.classList.remove("picked"); });
      figure.classList.add("picked");
    });
    strip.appendChild(figure);
  });
  vcSyncPanelControls();
}

function vcAssignPhotoToSelectedPanel(id) {
  var panel = vcState.panels[vcState.selectedPanel];
  if (!panel) return;
  panel.photoId = id;
  panel.zoom = 1;
  panel.dx = 0;
  panel.dy = 0;
  vcSaveState();
  vcSyncPanelControls();
  vcRenderPreview();
  vcShowStatus("Panel " + (vcState.selectedPanel + 1) + " now shows " + (vcPhotos[id] ? vcPhotos[id].name : id) + ".");
}

function vcLoadSample(id, fileName, label) {
  if (vcPhotos[id]) return;
  var img = new Image();
  img.onload = function () {
    vcRegisterPhoto(id, img, label);
    vcRefreshPhotoStrip();
    vcRenderPreview();
  };
  img.src = "samples/" + fileName;
}

function vcLoadSamples() {
  vcLoadSample("sample-boulevard", "boulevard.jpg", "Boulevard sample");
  vcLoadSample("sample-pier", "pier.jpg", "Pier sample");
}

function vcLoadUserFiles(fileList) {
  var files = Array.prototype.slice.call(fileList || []);
  var images = files.filter(function (f) { return f.type.indexOf("image/") === 0; });
  if (images.length === 0) {
    vcShowStatus("No image files in that drop. Try a JPG or PNG photo.");
    return;
  }
  var loaded = 0;
  images.forEach(function (file, index) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var id = "user-" + Date.now() + "-" + index;
        vcRegisterPhoto(id, img, file.name);
        loaded++;
        if (loaded === images.length) {
          vcAssignPhotoToSelectedPanel(vcPhotoOrder[vcPhotoOrder.length - 1]);
          vcRefreshPhotoStrip();
          vcShowStatus(images.length + (images.length === 1 ? " photo" : " photos") + " loaded from your machine. Nothing was uploaded.");
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function vcPanelAtPoint(clientX, clientY) {
  var rect = vcPreviewCanvas.getBoundingClientRect();
  var fx = (clientX - rect.left) / rect.width;
  var fy = (clientY - rect.top) / rect.height;
  var layout = VC_LAYOUTS[vcState.layout] || VC_LAYOUTS.hero3;
  for (var i = 0; i < layout.panels.length; i++) {
    var p = layout.panels[i];
    if (fx >= p[0] && fx < p[0] + p[2] && fy >= p[1] && fy < p[1] + p[3]) return i;
  }
  return -1;
}

function vcWirePreviewDrag() {
  vcPreviewCanvas.addEventListener("pointerdown", function (ev) {
    var panel = vcPanelAtPoint(ev.clientX, ev.clientY);
    if (panel < 0) return;
    vcState.selectedPanel = panel;
    vcDragPanel = panel;
    vcDragLastX = ev.clientX;
    vcDragLastY = ev.clientY;
    vcPreviewCanvas.classList.add("dragging");
    vcSyncPanelControls();
    vcRefreshPanelTabs();
    vcPreviewCanvas.setPointerCapture(ev.pointerId);
  });
  vcPreviewCanvas.addEventListener("pointermove", function (ev) {
    if (vcDragPanel < 0) return;
    var rect = vcPreviewCanvas.getBoundingClientRect();
    var panel = vcState.panels[vcDragPanel];
    if (!panel) return;
    panel.dx += (ev.clientX - vcDragLastX) / rect.width;
    panel.dy += (ev.clientY - vcDragLastY) / rect.height;
    panel.dx = Math.max(-1, Math.min(1, panel.dx));
    panel.dy = Math.max(-1, Math.min(1, panel.dy));
    vcDragLastX = ev.clientX;
    vcDragLastY = ev.clientY;
    vcSyncPanelControls();
    vcRenderPreview();
  });
  function endDrag() {
    if (vcDragPanel < 0) return;
    vcDragPanel = -1;
    vcPreviewCanvas.classList.remove("dragging");
    vcSaveState();
  }
  vcPreviewCanvas.addEventListener("pointerup", endDrag);
  vcPreviewCanvas.addEventListener("pointercancel", endDrag);
  vcPreviewCanvas.addEventListener("dragover", function (ev) {
    ev.preventDefault();
    vcPreviewCanvas.classList.add("drop-ready");
  });
  vcPreviewCanvas.addEventListener("dragleave", function () {
    vcPreviewCanvas.classList.remove("drop-ready");
  });
  vcPreviewCanvas.addEventListener("drop", function (ev) {
    ev.preventDefault();
    vcPreviewCanvas.classList.remove("drop-ready");
    if (ev.dataTransfer && ev.dataTransfer.files) vcLoadUserFiles(ev.dataTransfer.files);
  });
}

function vcWireControls() {
  var input = vcEl("photoInput");
  if (input) {
    input.addEventListener("change", function () {
      vcLoadUserFiles(input.files);
      input.value = "";
    });
  }
  var sampleB = vcEl("sampleBoulevard");
  if (sampleB) sampleB.addEventListener("click", function () {
    vcAssignPhotoToSelectedPanel("sample-boulevard");
  });
  var sampleP = vcEl("samplePier");
  if (sampleP) sampleP.addEventListener("click", function () {
    vcAssignPhotoToSelectedPanel("sample-pier");
  });
  var both = vcEl("loadBothSamples");
  if (both) both.addEventListener("click", function () {
    vcLoadSamples();
    vcShowStatus("Sample photos loaded. Pick one for each panel.");
  });

  document.querySelectorAll("[data-layout]").forEach(function (b) {
    b.addEventListener("click", function () {
      vcState.layout = b.getAttribute("data-layout");
      vcState.selectedPanel = 0;
      document.querySelectorAll("[data-layout]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      vcSaveState();
      vcRefreshPanelTabs();
      vcSyncPanelControls();
      vcRenderPreview();
    });
  });
  document.querySelectorAll("[data-grade]").forEach(function (b) {
    b.addEventListener("click", function () {
      vcState.grade = b.getAttribute("data-grade");
      document.querySelectorAll("[data-grade]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      vcSaveState();
      vcRenderPreview();
    });
  });
  var strength = vcEl("gradeStrength");
  if (strength) strength.addEventListener("input", function () {
    vcState.gradeStrength = Number(strength.value);
    var v = vcEl("gradeStrengthValue");
    if (v) v.textContent = strength.value + "%";
    vcSaveState();
    vcRenderPreview();
  });

  var panelPhoto = vcEl("panelPhoto");
  if (panelPhoto) panelPhoto.addEventListener("change", function () {
    vcAssignPhotoToSelectedPanel(panelPhoto.value);
  });
  var zoom = vcEl("panelZoom");
  if (zoom) zoom.addEventListener("input", function () {
    var panel = vcState.panels[vcState.selectedPanel];
    if (!panel) return;
    panel.zoom = Number(zoom.value) / 100;
    var v = vcEl("zoomValue");
    if (v) v.textContent = zoom.value + "%";
    vcSaveState();
    vcRenderPreview();
  });
  var dx = vcEl("panelDx");
  if (dx) dx.addEventListener("input", function () {
    var panel = vcState.panels[vcState.selectedPanel];
    if (!panel) return;
    panel.dx = Number(dx.value) / 100;
    vcSaveState();
    vcRenderPreview();
  });
  var dy = vcEl("panelDy");
  if (dy) dy.addEventListener("input", function () {
    var panel = vcState.panels[vcState.selectedPanel];
    if (!panel) return;
    panel.dy = Number(dy.value) / 100;
    vcSaveState();
    vcRenderPreview();
  });
  var fill = vcEl("fillPanel");
  if (fill) fill.addEventListener("click", function () {
    var panel = vcState.panels[vcState.selectedPanel];
    if (!panel) return;
    panel.zoom = 1;
    panel.dx = 0;
    panel.dy = 0;
    vcSaveState();
    vcSyncPanelControls();
    vcRenderPreview();
    vcShowStatus("Panel " + (vcState.selectedPanel + 1) + " filled with its photo.");
  });

  var titleInput = vcEl("titleInput");
  if (titleInput) titleInput.addEventListener("input", function () {
    vcState.title = titleInput.value;
    vcSaveState();
    vcRenderPreview();
  });
  var subtitleInput = vcEl("subtitleInput");
  if (subtitleInput) subtitleInput.addEventListener("input", function () {
    vcState.subtitle = subtitleInput.value;
    vcSaveState();
    vcRenderPreview();
  });
  var titleSize = vcEl("titleSize");
  if (titleSize) titleSize.addEventListener("input", function () {
    vcState.titleSize = Number(titleSize.value);
    var v = vcEl("titleSizeValue");
    if (v) v.textContent = titleSize.value + " px";
    vcSaveState();
    vcRenderPreview();
  });
  var titleY = vcEl("titleY");
  if (titleY) titleY.addEventListener("input", function () {
    vcState.titleY = Number(titleY.value);
    var v = vcEl("titleYValue");
    if (v) v.textContent = titleY.value + "%";
    vcSaveState();
    vcRenderPreview();
  });
  var titleColor = vcEl("titleColor");
  if (titleColor) titleColor.addEventListener("change", function () {
    vcState.titleColor = titleColor.value;
    vcSaveState();
    vcRenderPreview();
  });

  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () {
      vcState.sizeKey = b.getAttribute("data-size");
      document.querySelectorAll("[data-size]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      vcSaveState();
      vcRenderPreview();
    });
  });
  var reset = vcEl("resetState");
  if (reset) reset.addEventListener("click", function () {
    try { window.localStorage.removeItem(VC_SAVE_KEY); } catch (err) { /* storage off */ }
    vcState = vcDefaultState();
    vcSyncAllControls();
    vcRenderPreview();
    vcShowStatus("Settings reset to the sample cover.");
  });
}

function vcDownloadOne(sizeKey, fileName) {
  vcRenderToCanvas(sizeKey, function (canvas, size) {
    vcDownloadCanvas(canvas, fileName);
    vcShowStatus("Saved " + size.label + " PNG to your downloads.");
  });
}

function vcWireDownloads() {
  var sq = vcEl("downloadSquare");
  if (sq) sq.addEventListener("click", function () { vcDownloadOne("square", "vice-city-cover-1080x1080.png"); });
  var pt = vcEl("downloadPortrait");
  if (pt) pt.addEventListener("click", function () { vcDownloadOne("portrait", "vice-city-cover-1080x1350.png"); });
  var wd = vcEl("downloadWide");
  if (wd) wd.addEventListener("click", function () { vcDownloadOne("wide", "vice-city-cover-1920x1080.png"); });
  var all = vcEl("downloadAll");
  if (all) all.addEventListener("click", function () {
    vcDownloadOne("square", "vice-city-cover-1080x1080.png");
    window.setTimeout(function () { vcDownloadOne("portrait", "vice-city-cover-1080x1350.png"); }, 300);
    window.setTimeout(function () { vcDownloadOne("wide", "vice-city-cover-1920x1080.png"); }, 600);
    vcShowStatus("Saving all three sizes — check your downloads.");
  });
}

function vcSyncAllControls() {
  document.querySelectorAll("[data-layout]").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-layout") === vcState.layout);
  });
  document.querySelectorAll("[data-grade]").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-grade") === vcState.grade);
  });
  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-size") === vcState.sizeKey);
  });
  var strength = vcEl("gradeStrength");
  if (strength) strength.value = String(vcState.gradeStrength);
  var sv = vcEl("gradeStrengthValue");
  if (sv) sv.textContent = vcState.gradeStrength + "%";
  var titleInput = vcEl("titleInput");
  if (titleInput) titleInput.value = vcState.title;
  var subtitleInput = vcEl("subtitleInput");
  if (subtitleInput) subtitleInput.value = vcState.subtitle;
  var titleSize = vcEl("titleSize");
  if (titleSize) titleSize.value = String(vcState.titleSize);
  var tsv = vcEl("titleSizeValue");
  if (tsv) tsv.textContent = vcState.titleSize + " px";
  var titleY = vcEl("titleY");
  if (titleY) titleY.value = String(vcState.titleY);
  var tyv = vcEl("titleYValue");
  if (tyv) tyv.textContent = vcState.titleY + "%";
  var titleColor = vcEl("titleColor");
  if (titleColor) titleColor.value = vcState.titleColor;
  vcRefreshPanelTabs();
  vcSyncPanelControls();
}

function vcStart() {
  vcLoadState();
  vcPreviewCanvas = vcEl("previewCanvas");
  vcWireControls();
  vcWireDownloads();
  vcWirePreviewDrag();
  vcSyncAllControls();
  vcLoadSamples();
  vcRenderPreview();
}

document.addEventListener("DOMContentLoaded", vcStart);
