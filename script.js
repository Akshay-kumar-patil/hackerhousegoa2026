/* ===================================================================
   HACKER HOUSE GOA 2026 — script.js
   Handles: intro reveal timing, role-lock logic (per team code via
   localStorage), photo upload, canvas badge rendering (front + back),
   flip interaction, and PNG downloads.
=================================================================== */

(function(){
  "use strict";

  /* ---------------- INTRO ---------------- */
  const body = document.body;
  const intro = document.getElementById("intro");
  body.classList.add("intro-active");
  window.addEventListener("load", () => {
    setTimeout(() => {
      intro.classList.add("intro-done");
      body.classList.remove("intro-active");
    }, 2500);
  });
  // Safety net in case 'load' already fired or is slow
  setTimeout(() => {
    if (!intro.classList.contains("intro-done")){
      intro.classList.add("intro-done");
      body.classList.remove("intro-active");
    }
  }, 4000);

  /* ---------------- ROLE DATA ---------------- */
  const ROLES = {
    raja:   { label: "Raja",   tag: "The Visionary", icon: "♛" },
    mantri: { label: "Mantri", tag: "The Strategist", icon: "📜" },
    chor:   { label: "Chor",   tag: "The Hacker",     icon: "🎭" },
    sipahi: { label: "Sipahi", tag: "The Guardian",   icon: "🛡" }
  };

  const teamInput   = document.getElementById("fTeam");
  const nameInput   = document.getElementById("fName");
  let selectedRole = "raja"; // default role if needed anywhere, though we'll remove it mostly

  async function getTeamRoles(code){
    if (!code) return {};
    try {
      const { data, error } = await window.supabaseClient
        .from('team_roles')
        .select('role, builder_name')
        .eq('team_code', code);
      if (error) throw error;
      const roles = {};
      data.forEach(row => {
        roles[row.role] = row.builder_name;
      });
      return roles;
    } catch(e){
      console.error(e);
      return {};
    }
  }

  async function refreshRoleButtons(){
    // Role selection removed
  }

  const addSocialBtn = document.getElementById("addSocialBtn");
  const socialsWrapper = document.getElementById("socialsWrapper");
  
  function updateSocialRemoveButtons() {
    const rows = socialsWrapper.querySelectorAll(".social-row");
    rows.forEach(row => {
      const btn = row.querySelector(".social-remove");
      btn.style.display = rows.length > 1 ? "block" : "none";
    });
    addSocialBtn.style.display = rows.length >= 6 ? "none" : "block";
  }
  
  addSocialBtn.addEventListener("click", () => {
    if (socialsWrapper.querySelectorAll(".social-row").length >= 6) return;
    const firstRow = socialsWrapper.querySelector(".social-row");
    const newRow = firstRow.cloneNode(true);
    newRow.querySelector(".social-input").value = "";
    socialsWrapper.appendChild(newRow);
    updateSocialRemoveButtons();
  });
  
  socialsWrapper.addEventListener("click", (e) => {
    if (e.target.classList.contains("social-remove")) {
      e.target.closest(".social-row").remove();
      updateSocialRemoveButtons();
    }
  });

  // Role buttons removed
  
  let debounceTimer;
  function debouncedRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshRoleButtons, 500);
  }
  teamInput.addEventListener("input", debouncedRefresh);
  nameInput.addEventListener("input", debouncedRefresh);

  async function claimRole(code, role, name){
    const { error } = await window.supabaseClient
      .from('team_roles')
      .insert({ team_code: code, role: role, builder_name: name, claimed_at: new Date().toISOString() });
    if (error) {
      if (error.code === '23505') { // Postgres unique constraint violation
        throw new Error("ALREADY_TAKEN");
      }
      throw error;
    }
  }

  /* ---------------- PHOTO UPLOAD ---------------- */
  const photoInput   = document.getElementById("fPhoto");
  const photoPreview = document.getElementById("photoPreview");
  const photoAdjuster = document.getElementById("photoAdjuster");
  const adjCanvas = document.getElementById("adjCanvas");
  const adjZoom = document.getElementById("adjZoom");
  const adjZoomLabel = document.getElementById("adjZoomLabel");
  const adjZoomOut = document.getElementById("adjZoomOut");
  const adjZoomIn = document.getElementById("adjZoomIn");
  const adjReset = document.getElementById("adjReset");
  
  let photoImage = null; // HTMLImageElement, loaded & ready
  let photoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
  
  function drawAdjuster() {
    if (!photoImage) return;
    const ctx = adjCanvas.getContext("2d");
    ctx.clearRect(0, 0, 160, 160);
    ctx.save();
    ctx.beginPath();
    ctx.arc(80, 80, 80, 0, Math.PI * 2);
    ctx.clip();
    
    const { zoom, offsetX, offsetY } = photoTransform;
    const scaleBase = Math.max(
      160 / photoImage.naturalWidth,
      160 / photoImage.naturalHeight
    );
    const scale = scaleBase * zoom;
    const drawW = photoImage.naturalWidth * scale;
    const drawH = photoImage.naturalHeight * scale;
    
    const adjScale = 80 / 244;
    const drawX = 80 - drawW / 2 + offsetX * adjScale;
    const drawY = 80 - drawH / 2 + offsetY * adjScale;
    
    ctx.drawImage(photoImage, drawX, drawY, drawW, drawH);
    ctx.restore();
    adjZoomLabel.textContent = zoom.toFixed(1) + "×";
    adjZoom.value = zoom;
  }
  
  adjZoom.addEventListener("input", (e) => {
    photoTransform.zoom = parseFloat(e.target.value);
    drawAdjuster();
  });
  adjZoomOut.addEventListener("click", () => {
    photoTransform.zoom = Math.max(0.5, photoTransform.zoom - 0.1);
    drawAdjuster();
  });
  adjZoomIn.addEventListener("click", () => {
    photoTransform.zoom = Math.min(3, photoTransform.zoom + 0.1);
    drawAdjuster();
  });
  adjReset.addEventListener("click", () => {
    photoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
    drawAdjuster();
  });
  
  let isDragging = false;
  let startX, startY, initialOffsetX, initialOffsetY;
  
  function dragStart(clientX, clientY) {
    if (!photoImage) return;
    isDragging = true;
    startX = clientX;
    startY = clientY;
    initialOffsetX = photoTransform.offsetX;
    initialOffsetY = photoTransform.offsetY;
    adjCanvas.style.cursor = "grabbing";
  }
  
  function dragMove(clientX, clientY) {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const cardScale = 244 / 80;
    photoTransform.offsetX = initialOffsetX + dx * cardScale;
    photoTransform.offsetY = initialOffsetY + dy * cardScale;
    drawAdjuster();
  }
  
  function dragEnd() {
    isDragging = false;
    adjCanvas.style.cursor = "grab";
  }
  
  adjCanvas.addEventListener("mousedown", (e) => dragStart(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => dragMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", dragEnd);
  
  adjCanvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      dragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  window.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault(); // Prevent scrolling while dragging inside canvas
      dragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });
  window.addEventListener("touchend", dragEnd);

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        photoImage = img;
        photoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
        photoPreview.style.display = "none";
        photoAdjuster.style.display = "flex";
        drawAdjuster();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------------- TEMPLATE IMAGES ---------------- */
  const TEMPLATE_FRONT_HOLE = "./assets/card-front-hole.png"; // transparent circle cut-out
  const TEMPLATE_BACK       = "./assets/card-back-template.jpg";
  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  let templateFrontHole = null, templateBack = null;
  Promise.all([loadImage(TEMPLATE_FRONT_HOLE), loadImage(TEMPLATE_BACK)]).then(([f,b]) => {
    templateFrontHole = f; templateBack = b;
  }).catch(() => {
    // template failed to load — form will still validate, generation will alert
  });

  function generateQRCode(text) {
    return new Promise((resolve) => {
      const qrContainer = document.getElementById("qrCodeContainer");
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, {
        text: text,
        width: 400,
        height: 400,
        // Keep the QR camera-friendly: dark modules on a white background.
        colorDark : "#0b2818",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
      const resolveQr = () => {
        // QRCode.js may render a canvas or an image. Normalize either result
        // to a canvas so the preview and downloaded back use the same QR.
        const qrCanvas = qrContainer.querySelector("canvas");
        if (qrCanvas) {
          resolve(qrCanvas);
          return;
        }
        const qrImage = qrContainer.querySelector("img");
        if (!qrImage) {
          resolve(null);
          return;
        }
        const normalized = document.createElement("canvas");
        normalized.width = 400;
        normalized.height = 400;
        normalized.getContext("2d").drawImage(qrImage, 0, 0, 400, 400);
        resolve(normalized);
      };
      if (qrContainer.querySelector("canvas")) {
        resolveQr();
      } else {
        const qrImage = qrContainer.querySelector("img");
        if (qrImage && qrImage.complete) resolveQr();
        else if (qrImage) qrImage.addEventListener("load", resolveQr, { once:true });
        else resolve(null);
      }
    });
  }

  /* ---------------- BUILDER ID ---------------- */
  function makeBuilderId(){
    const num = Math.floor(1000 + Math.random()*9000);
    return `HHG26-BLD-${num}`;
  }

  /* ---------------- CANVAS HELPERS ---------------- */
  const W = 1088, H = 1445;
  // Photo hole geometry, calibrated against assets/card-front-hole.png
  const HOLE = { cx: 534, cy: 508, r: 244 };
  // Name plate geometry, calibrated against the front template's empty box
  const PLATE = { x: 274, y: 1148, w: 536, h: 97 };

  function drawCoverImage(ctx, img, x, y, w, h){
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let sx, sy, sw, sh;
    if (imgRatio > boxRatio){
      sh = img.height; sw = sh * boxRatio;
      sx = (img.width - sw) / 2; sy = 0;
    } else {
      sw = img.width; sh = sw / boxRatio;
      sx = 0; sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function fitText(ctx, text, maxWidth, baseSize, family, weight){
    let size = baseSize;
    ctx.font = `${weight} ${size}px ${family}`;
    while (ctx.measureText(text).width > maxWidth && size > 10){
      size -= 1;
      ctx.font = `${weight} ${size}px ${family}`;
    }
    return size;
  }

  function wrapText(ctx, text, maxWidth){
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line){
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function renderFront(canvas, data){
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,W,H);

    // 1. photo, clipped to circle, sits UNDER the template (template has a
    //    transparent hole so the ring/art overlays the photo edge cleanly)
    ctx.save();
    ctx.beginPath();
    ctx.arc(HOLE.cx, HOLE.cy, HOLE.r, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    if (data.photoImage){
      const cx = HOLE.cx, cy = HOLE.cy, r = HOLE.r;
      const { zoom, offsetX, offsetY } = data.photoTransform;
      
      const scaleBase = Math.max(
        (r * 2) / data.photoImage.naturalWidth,
        (r * 2) / data.photoImage.naturalHeight
      );
      const scale = scaleBase * zoom;
      
      const drawW = data.photoImage.naturalWidth * scale;
      const drawH = data.photoImage.naturalHeight * scale;
      
      const drawX = cx - drawW / 2 + offsetX;
      const drawY = cy - drawH / 2 + offsetY;
      
      ctx.drawImage(data.photoImage, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = "#0b2818";
      ctx.fillRect(HOLE.cx-HOLE.r, HOLE.cy-HOLE.r, HOLE.r*2, HOLE.r*2);
    }
    ctx.restore();

    // 2. template art on top (ring + huts + logo), hole already transparent
    if (templateFrontHole) ctx.drawImage(templateFrontHole, 0, 0, W, H);

    // 3. name + builder id / role, inside the plate box
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const plateCx = PLATE.x + PLATE.w/2;

    const nameSize = fitText(ctx, data.name.toUpperCase(), PLATE.w - 30, 40, "Bricolage Grotesque, sans-serif", 800);
    ctx.font = `800 ${nameSize}px Bricolage Grotesque, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.5)";
    ctx.shadowBlur = 6;
    ctx.fillText(data.name.toUpperCase(), plateCx, PLATE.y + PLATE.h*0.40);

    ctx.shadowBlur = 0;
    const sub = `${data.builderId}`;
    const subSize = fitText(ctx, sub, PLATE.w - 30, 21, "JetBrains Mono, monospace", 600);
    ctx.font = `600 ${subSize}px JetBrains Mono, monospace`;
    ctx.fillStyle = "#f0b429";
    ctx.fillText(sub, plateCx, PLATE.y + PLATE.h*0.76);
  }

  function renderBack(canvas, data){
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,W,H);
    if (templateBack) ctx.drawImage(templateBack, 0, 0, W, H);

    const left = 140;
    // Give phone cameras a larger, unobstructed QR target on the card.
    const qrSize = 220;
    const qrY = H - 300;
    const profileQrX = W - 340;
    const right = profileQrX - 40;
    const contentW = right - left;

    function divider(yy){
      ctx.strokeStyle = "rgba(240,180,41,.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(right, yy); ctx.stroke();
    }
    function label(text, yy){
      ctx.textAlign = "left";
      ctx.font = "600 19px JetBrains Mono, monospace";
      ctx.fillStyle = "#f0b429";
      ctx.fillText(text.toUpperCase(), left, yy);
    }
    function value(text, yy, size, weight, color){
      ctx.textAlign = "left";
      ctx.font = `${weight} ${size}px Bricolage Grotesque, sans-serif`;
      ctx.fillStyle = color || "#ffffff";
      ctx.fillText(text, left, yy);
    }

    let y = 845;
    divider(y);

    y += 44; label("Builder ID", y);
    y += 38; value(data.builderId, y, 32, 800);

    y += 52; label("Builder", y);
    const nameSize2 = fitText(ctx, data.name, contentW, 28, "Bricolage Grotesque, sans-serif", 800);
    y += 34; value(data.name, y, nameSize2, 800);
    y += 30;
    ctx.font = "500 18px Inter, sans-serif";
    ctx.fillStyle = "#f6f1e2";
    ctx.globalAlpha = .8;
    ctx.fillText(data.title, left, y);
    ctx.globalAlpha = 1;

    y += 50; label("Tech stack", y);
    const tags = data.stack.split(",").map(s => s.trim()).filter(Boolean);
    let tx = left, ty = y + 30;
    ctx.font = "600 18px JetBrains Mono, monospace";
    tags.forEach(tag => {
      const tw = ctx.measureText(tag).width + 26;
      if (tx + tw > right){ tx = left; ty += 42; }
      ctx.strokeStyle = "rgba(240,180,41,.5)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, tx, ty - 27, tw, 36, 18);
      ctx.stroke();
      ctx.fillStyle = "#f6f1e2";
      ctx.textAlign = "left";
      ctx.fillText(tag, tx + 13, ty - 3);
      tx += tw + 10;
    });
    y = ty + 34;

    y += 12; label("Social / tap link", y);
    y += 34;
    
    const SOCIAL_PREFIX = {
      "Twitter/X": "𝕏",
      "LinkedIn": "in/",
      "GitHub": "gh/",
      "Instagram": "ig/",
      "Website": "🔗",
      "Linktree": "🌲",
      "Other": "🔗"
    };

    let maxSocials = data.socials.length;
    let socialSize = 23;
    let socialSpacing = 34;
    if (maxSocials > 4) {
      socialSize = 19;
      socialSpacing = 28;
    }
    
    ctx.textAlign = "left";
    ctx.font = `600 ${socialSize}px JetBrains Mono, monospace`;
    ctx.fillStyle = "#ffffff";
    data.socials.forEach(soc => {
       const prefix = SOCIAL_PREFIX[soc.platform] || "🔗";
       let fullText = `${prefix} ${soc.url}`;
       
       if (ctx.measureText(fullText).width > contentW) {
         while (ctx.measureText(fullText + "...").width > contentW && fullText.length > 5) {
           fullText = fullText.slice(0, -1);
         }
         fullText += "...";
       }
       
       ctx.fillText(fullText, left, y);
       y += socialSpacing;
    });

    function drawQr(qrCanvas, qrX, labelText){
      if (!qrCanvas) return;
      // Draw rounded square background
      ctx.fillStyle = "#0b2818";
      ctx.strokeStyle = "#f0b429";
      ctx.lineWidth = 3;
      roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 16);
      ctx.fill();
      ctx.stroke();
      
      // Draw QR
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      
      // Draw SCAN TO CONNECT
      ctx.textAlign = "center";
      ctx.font = "600 16px JetBrains Mono, monospace";
      ctx.fillStyle = "#f0b429";
      ctx.fillText(labelText, qrX + qrSize/2, qrY + qrSize + 34);
    }
    drawQr(data.qrCanvas, profileQrX, "SCAN TO CONNECT");
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  function encodeProfileData(data){
    // Short keys plus URI-safe compression keep the profile QR easy to scan.
    const profile = {
      n: data.name,
      t: data.title,
      e: data.team,
      k: data.stack,
      b: data.builderId,
      l: data.socials.map(s => ({ p: s.platform, u: s.url }))
    };
    if (window.LZString) return "lz." + LZString.compressToEncodedURIComponent(JSON.stringify(profile));
    const bytes = new TextEncoder().encode(JSON.stringify(profile));
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function makeProfileUrl(data){
    // Always point the QR at this deployed website, never at a local file or
    // a temporary route from which the badge was generated.
    const url = new URL("/profile.html", window.location.origin);
    url.searchParams.set("data", encodeProfileData(data));
    return url.href;
  }

  /* ---------------- FORM SUBMIT ---------------- */
  const form = document.getElementById("builderForm");
  const formError = document.getElementById("formError");
  const generateBtn = document.getElementById("generateBtn");
  const canvasFront = document.getElementById("canvasFront");
  const canvasBack  = document.getElementById("canvasBack");
  let currentData = null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";

    const name  = nameInput.value.trim();
    const title = document.getElementById("fTitle").value.trim();
    const team  = teamInput.value.trim();
    const stack = document.getElementById("fStack").value.trim();
    
    const socialRows = socialsWrapper.querySelectorAll(".social-row");
    const socialsList = [];
    socialRows.forEach(row => {
      const plat = row.querySelector(".social-platform").value;
      const url = row.querySelector(".social-input").value.trim();
      if (url) socialsList.push({ platform: plat, url: url });
    });

    if (!name || !title || !team || !stack || socialsList.length === 0){
      formError.textContent = "Fill every required field before generating your badge.";
      return;
    }
    if (!photoImage){
      formError.textContent = "Add a photo — it goes inside the badge frame.";
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Loading badge art…";
    
    if (!templateFrontHole || !templateBack){
      try{
        await Promise.race([
          Promise.all([loadImage(TEMPLATE_FRONT_HOLE), loadImage(TEMPLATE_BACK)]).then(([f,b])=>{templateFrontHole=f;templateBack=b;}),
          new Promise((_,rej)=>setTimeout(rej, 6000))
        ]);
      }catch(err){
        formError.textContent = "Badge artwork couldn't load. Check that the assets/ folder is next to index.html.";
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate my builder ID";
        return;
      }
    }
    generateBtn.textContent = "Generating badge...";

    const profileData = {
      name, title, team, stack, socials: socialsList,
      builderId: makeBuilderId()
    };
    const profileUrl = makeProfileUrl(profileData);
    console.log("Encoded QR profile:", profileUrl);
    const qrCanvas = await generateQRCode(profileUrl);

    if (!qrCanvas) {
      formError.textContent = "The QR code could not be generated. Refresh and try again.";
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate my builder ID";
      return;
    }

    currentData = {
      name, title, team, stack, socials: socialsList,
      builderId: profileData.builderId,
      photoImage,
      photoTransform,
      qrCanvas
    };

    // make sure custom fonts are actually loaded before drawing to canvas,
    // otherwise the first render can fall back to a system font
    if (document.fonts && document.fonts.ready){
      try{
        await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 120))]);
      }catch(e){}
    }

    renderFront(canvasFront, currentData);
    renderBack(canvasBack, currentData);

    generateBtn.disabled = false;
    generateBtn.textContent = "Generate my builder ID";
    document.getElementById("card").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------------- FLIP ---------------- */
  const cardFlip = document.getElementById("cardFlip");
  function toggleCardFlip(){
    const flipped = cardFlip.classList.toggle("is-flipped");
    cardFlip.setAttribute("aria-pressed", String(flipped));
    cardFlip.setAttribute("aria-label", flipped ? "Show front of badge" : "Show back of badge");
  }
  cardFlip.addEventListener("click", toggleCardFlip);
  cardFlip.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleCardFlip(); }
  });

  /* ---------------- DOWNLOAD & SHARE ---------------- */
  function downloadCanvas(canvas, filename){
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
  
  function downloadCombinedCard(){
    const combined = document.createElement("canvas");
    combined.width = W * 2;
    combined.height = H;
    const ctx = combined.getContext("2d");
    ctx.drawImage(canvasFront, 0, 0);
    ctx.drawImage(canvasBack, W, 0);
    downloadCanvas(combined, `${currentData.builderId}-builder-card.png`);
  }

  document.getElementById("downloadCard").addEventListener("click", () => {
    if (!currentData){ formError.textContent = "Generate your badge first."; return; }
    downloadCombinedCard();
  });
  
  document.getElementById("shareTwitter").addEventListener("click", () => {
    if (!currentData){ formError.textContent = "Generate your badge first."; return; }
    
    downloadCombinedCard(); // trigger download
    
    const stackSnippet = currentData.stack.split(",").slice(0, 3).map(s=>s.trim()).join(" + ");
    const tweetText = `Just checked in at Hacker House Goa 2026 🌴\n\nBuilding with ${stackSnippet} · Team ${currentData.team.toUpperCase()}\n\n${currentData.socials[0].url}\n\n#HackerHouseGoa #HHG2026 #FrameInGoa #BuildConnectVibe`;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
    
    const toast = document.getElementById("toast");
    toast.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) translateY(150%)";
    }, 4000);
  });

  document.getElementById("regenerateBtn").addEventListener("click", () => {
    form.reset();
    photoImage = null;
    photoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
    photoPreview.style.display = "flex";
    photoAdjuster.style.display = "none";
    photoPreview.innerHTML = "<span>No photo</span>";
    refreshRoleButtons();
    document.getElementById("register").scrollIntoView({ behavior: "smooth" });
  });

  refreshRoleButtons();
})();
