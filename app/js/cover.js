/* Vice City Cover Studio — cover renderer: panels, colour grades, caption.
   Classic script: uses vcState, VC_LAYOUTS, vcPhotos from state.js. */

function vcDrawPhotoCover(ctx, img, x, y, w, h, zoom, dx, dy) {
  var iw = img.naturalWidth || img.width;
  var ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  var scale = Math.max(w / iw, h / ih) * zoom;
  var dw = iw * scale;
  var dh = ih * scale;
  var ox = x + (w - dw) / 2 + dx * w;
  var oy = y + (h - dh) / 2 + dy * h;
  ctx.drawImage(img, ox, oy, dw, dh);
}

function vcApplyGrade(ctx, x, y, w, h, grade, strength) {
  var k = Math.max(0, Math.min(100, strength)) / 100;
  if (k <= 0 || grade === "none") return;
  var g;
  if (grade === "sunset") {
    g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255, 122, 24, 0.55)");
    g.addColorStop(0.55, "rgba(255, 46, 136, 0.35)");
    g.addColorStop(1, "rgba(123, 47, 247, 0.45)");
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = k;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.5 * k;
    ctx.fillStyle = "#ff9a3d";
    ctx.fillRect(x, y, w, h);
  } else if (grade === "neon") {
    g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "rgba(0, 229, 255, 0.5)");
    g.addColorStop(1, "rgba(255, 0, 153, 0.5)");
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = k;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.28 * k;
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(x, y, w, h * 0.45);
    ctx.fillStyle = "#ff0099";
    ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  } else if (grade === "golden") {
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.85 * k;
    ctx.fillStyle = "#ffc46b";
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.4 * k;
    ctx.fillStyle = "#ffdf9e";
    ctx.fillRect(x, y, w, h);
  } else if (grade === "noir") {
    ctx.globalCompositeOperation = "saturation";
    ctx.globalAlpha = k;
    ctx.fillStyle = "#808080";
    ctx.fillRect(x, y, w, h);
    g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    g.addColorStop(1, "rgba(0, 0, 0, 0.30)");
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = k;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function vcApplyVignette(ctx, x, y, w, h, strength) {
  var k = Math.max(0, Math.min(100, strength)) / 100;
  var cx = x + w / 2;
  var cy = y + h / 2;
  var r = Math.max(w, h) * 0.72;
  var g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(0, 0, 0, " + (0.42 * (0.4 + 0.6 * k)).toFixed(3) + ")");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function vcApplyGrain(ctx, x, y, w, h) {
  var rand = vcSeededRandom(20261119);
  var count = Math.floor((w * h) / 9000);
  var i;
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (i = 0; i < count; i++) {
    var px = x + rand() * w;
    var py = y + rand() * h;
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  ctx.restore();
}

function vcDrawCaption(ctx, w, h) {
  var title = (vcState.title || "").trim();
  var subtitle = (vcState.subtitle || "").trim();
  if (!title && !subtitle) return;
  var cy = (vcState.titleY / 100) * h;
  var titlePx = Math.round((vcState.titleSize / 1080) * w);
  var subPx = Math.round(titlePx * 0.34);
  var cx = w / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  /* Soft dark band behind the lettering so it reads on any photo. */
  var band = ctx.createLinearGradient(0, cy - titlePx * 0.9, 0, cy + titlePx * 0.9);
  band.addColorStop(0, "rgba(10, 4, 24, 0)");
  band.addColorStop(0.5, "rgba(10, 4, 24, 0.42)");
  band.addColorStop(1, "rgba(10, 4, 24, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, cy - titlePx * 0.9, w, titlePx * 1.8);
  if (title) {
    ctx.font = titlePx + "px 'Arial Black', Impact, 'Helvetica Neue', sans-serif";
    try { ctx.letterSpacing = Math.round(titlePx * 0.04) + "px"; } catch (err) { /* older canvas: no letter spacing */ }
    ctx.lineWidth = Math.max(2, Math.round(titlePx * 0.09));
    ctx.strokeStyle = "rgba(20, 4, 32, 0.9)";
    ctx.lineJoin = "round";
    ctx.strokeText(title.toUpperCase(), cx, cy - subPx * 0.4);
    ctx.fillStyle = vcState.titleColor || "#ffffff";
    ctx.shadowColor = "rgba(255, 46, 136, 0.55)";
    ctx.shadowBlur = Math.round(titlePx * 0.18);
    ctx.fillText(title.toUpperCase(), cx, cy - subPx * 0.4);
    ctx.shadowBlur = 0;
  }
  if (subtitle) {
    ctx.font = "italic " + subPx + "px Georgia, 'Times New Roman', serif";
    try { ctx.letterSpacing = Math.round(subPx * 0.08) + "px"; } catch (err) { /* older canvas: no letter spacing */ }
    ctx.lineWidth = Math.max(1, Math.round(subPx * 0.08));
    ctx.strokeStyle = "rgba(20, 4, 32, 0.85)";
    var sy = cy + titlePx * 0.52;
    ctx.strokeText(subtitle, cx, sy);
    ctx.fillStyle = "#ffd9ec";
    ctx.fillText(subtitle, cx, sy);
  }
  ctx.restore();
}

/* Draw the whole cover onto ctx at the given pixel size. */
function vcDrawCover(ctx, width, height) {
  var layout = VC_LAYOUTS[vcState.layout] || VC_LAYOUTS.hero3;
  var panels = vcPanelsForLayout(vcState.layout);
  var gap = Math.max(2, Math.round(width * 0.006));
  var i;
  ctx.save();
  ctx.fillStyle = "#0d0a16";
  ctx.fillRect(0, 0, width, height);
  for (i = 0; i < layout.panels.length; i++) {
    var rect = layout.panels[i];
    var px = rect[0] * width + (rect[0] > 0 ? gap / 2 : 0);
    var py = rect[1] * height + (rect[1] > 0 ? gap / 2 : 0);
    var pw = rect[2] * width - (rect[0] > 0 ? gap / 2 : 0) - (rect[0] + rect[2] < 1 ? gap / 2 : 0);
    var ph = rect[3] * height - (rect[1] > 0 ? gap / 2 : 0) - (rect[1] + rect[3] < 1 ? gap / 2 : 0);
    var photo = vcPhotoForPanel(panels[i]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    if (photo) {
      vcDrawPhotoCover(ctx, photo.img, px, py, pw, ph, panels[i].zoom, panels[i].dx, panels[i].dy);
      vcApplyGrade(ctx, px, py, pw, ph, vcState.grade, vcState.gradeStrength);
    } else {
      var bg = ctx.createLinearGradient(px, py, px + pw, py + ph);
      bg.addColorStop(0, "#ff7a18");
      bg.addColorStop(1, "#7b2ff7");
      ctx.fillStyle = bg;
      ctx.fillRect(px, py, pw, ph);
    }
    vcApplyVignette(ctx, px, py, pw, ph, vcState.gradeStrength);
    ctx.restore();
  }
  vcApplyGrain(ctx, 0, 0, width, height);
  vcDrawCaption(ctx, width, height);
  ctx.restore();
}

/* Render the cover at a size key into a fresh canvas and hand it to the callback. */
function vcRenderToCanvas(sizeKey, done) {
  var size = VC_SIZES[sizeKey] || VC_SIZES.square;
  var canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  vcDrawCover(canvas.getContext("2d"), size.width, size.height);
  done(canvas, size);
}

/* Download one canvas as a PNG file with the given file name. */
function vcDownloadCanvas(canvas, fileName) {
  canvas.toBlob(function (blob) {
    if (!blob) return;
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 4000);
  }, "image/png");
}
