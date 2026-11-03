/* @module {"name":"photo","exports":["photoReset","loadPhotoImage","wirePhoto"],"uses":["$","T","icon"]} */

  /* =====================================================================
     WINNERS' PHOTO (optional) on the final page: a screenshot (online meetings), a photo from the camera, or a picture from the gallery / computer.
     It is shown on the final page and added to the PDF report. The photo stays in memory only: it is not saved or sent anywhere,
     and it is forgotten when the next quiz ends.
     ===================================================================== */
  var winnerPhoto = null;                // { url: "data:image/jpeg;base64,..." }
  var photoSkipped = false, phStream = null, phFacing = "environment", phMode = "", phPending = "";
  var PH_MAX = 1600;                     // the longest side of the stored picture, in pixels
  function photoCanCamera() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  function photoCanScreen() { return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""); }
  function photoReset() { winnerPhoto = null; photoSkipped = false; paintPhotoBox(); }
  function paintPhotoBox() {
    $("photoBox").hidden = photoSkipped && !winnerPhoto; $("photoAsk").hidden = !!winnerPhoto || photoSkipped; $("photoShow").hidden = !winnerPhoto;
    if (winnerPhoto) $("photoImg").src = winnerPhoto.url;
  }
  function loadPhotoImage() {            // the picture for the PDF
    return new Promise(function (res) { if (!winnerPhoto) { res(null); return; } var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = winnerPhoto.url; });
  }
  function phView(v) { $("phChoose").hidden = v !== "choose"; $("phLive").hidden = v !== "live"; $("phPreviewView").hidden = v !== "preview"; }
  function phStop() { if (phStream) { try { phStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} phStream = null; } try { $("phVideo").srcObject = null; } catch (e) {} }
  function openPhotoModal() {
    phStop(); phView("choose"); $("phMsg").textContent = ""; $("phCamApp").hidden = true; $("phShot").hidden = !photoCanScreen(); $("phModal").hidden = false;
    setTimeout(function () { var b = $("phFile"); if (b) b.focus(); }, 40);
  }
  function closePhotoModal() { phStop(); $("phModal").hidden = true; var b = $("photoAdd"); if (b && !b.closest("[hidden]")) try { b.focus(); } catch (e) {} }
  function phFromSource(src, w, h) {     // draw a frame or picture into a canvas no larger than PH_MAX
    var s = Math.min(1, PH_MAX / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); return c;
  }
  function phShowPreview(canvas) { phPending = canvas.toDataURL("image/jpeg", 0.86); $("phPrevImg").src = phPending; phView("preview"); $("phMsg").textContent = ""; setTimeout(function () { $("phUse").focus(); }, 30); }
  function phCamera() {
    if (!photoCanCamera()) { $("phCapInput").click(); return; }
    phMode = "camera"; phStop(); $("phMsg").textContent = "";
    navigator.mediaDevices.getUserMedia({ video: { facingMode: phFacing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }).then(function (s) {
      phStream = s; phView("live"); $("phLiveTitle").textContent = T("phCamTitle"); $("phSnap").textContent = T("phSnapPhoto"); $("phFlip").hidden = false;
      var v = $("phVideo"); v.srcObject = s; v.play().catch(function () {});
    }).catch(function (e) {
      phView("choose"); $("phMsg").textContent = (e && /NotAllowed|Permission|Security/i.test(e.name || "")) ? T("phCamDenied") : T("phCamFail"); $("phCamApp").hidden = false;
    });
  }
  function phScreen() {
    phMode = "screen"; phStop(); $("phMsg").textContent = "";
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(function (s) {
      phStream = s; phView("live"); $("phLiveTitle").textContent = T("phScreenTitle"); $("phSnap").textContent = T("phSnapShot"); $("phFlip").hidden = true;
      var v = $("phVideo"); v.srcObject = s; v.play().catch(function () {});
      try { s.getVideoTracks()[0].addEventListener("ended", function () { if (phMode === "screen" && !$("phLive").hidden) { phStop(); phView("choose"); } }); } catch (e) {}
    }).catch(function () { phView("choose"); $("phMsg").textContent = T("phScreenFail"); });
  }
  function phSnap() {
    var v = $("phVideo"); if (!v.videoWidth) return;
    var c = phFromSource(v, v.videoWidth, v.videoHeight); phStop(); phShowPreview(c);
  }
  function phFlip() { phFacing = phFacing === "environment" ? "user" : "environment"; phCamera(); }
  function phFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type || "") || file.size > 30 * 1048576) { $("phMsg").textContent = T("phFileFail"); return; }
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () { var c = phFromSource(im, im.naturalWidth, im.naturalHeight); URL.revokeObjectURL(url); phShowPreview(c); };
    im.onerror = function () { URL.revokeObjectURL(url); $("phMsg").textContent = T("phFileFail"); };
    im.src = url;
  }
  function wirePhoto() {
    Array.prototype.forEach.call(document.querySelectorAll("#phModal [data-pic]"), function (n) { n.insertAdjacentHTML("afterbegin", icon(n.getAttribute("data-pic"), 26)); });
    $("photoAdd").addEventListener("click", openPhotoModal); $("photoChange").addEventListener("click", openPhotoModal);
    $("photoSkip").addEventListener("click", function () { photoSkipped = true; paintPhotoBox(); });
    $("photoRemove").addEventListener("click", function () { winnerPhoto = null; photoSkipped = false; paintPhotoBox(); });
    $("phShot").addEventListener("click", phScreen); $("phCam").addEventListener("click", phCamera); $("phCamApp").addEventListener("click", function () { $("phCapInput").click(); });
    $("phFile").addEventListener("click", function () { $("phInput").click(); });
    $("phInput").addEventListener("change", function () { var f = $("phInput").files[0]; $("phInput").value = ""; phFile(f); });
    $("phCapInput").addEventListener("change", function () { var f = $("phCapInput").files[0]; $("phCapInput").value = ""; phFile(f); });
    $("phSnap").addEventListener("click", phSnap); $("phFlip").addEventListener("click", phFlip);
    $("phLiveBack").addEventListener("click", function () { phStop(); phView("choose"); });
    $("phAgain").addEventListener("click", function () { phView("choose"); });
    $("phUse").addEventListener("click", function () { winnerPhoto = { url: phPending }; phPending = ""; paintPhotoBox(); closePhotoModal(); });
    $("phCancel").addEventListener("click", closePhotoModal);
    $("phModal").addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closePhotoModal(); } });
    $("phModal").addEventListener("click", function (e) { if (e.target === $("phModal")) closePhotoModal(); });
  }
