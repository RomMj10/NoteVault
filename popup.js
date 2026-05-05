"use strict";

const ext = (typeof browser !== "undefined") ? browser : chrome;
const $ = id => document.getElementById(id);

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return rawUrl;
  }
}

let config = {};
let notes  = [];
let pendingImages = [];
let tags   = [];
let currentNoteId = null;
let editNoteId = null;
let pageAttach = { url: "", title: "" };

function isValidPage(url) {
  return url && !url.startsWith("about:") && !url.startsWith("moz-extension:");
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
      config = await loadConfig();
      if (config && config.fbProjectId && config.fbApiKey) {
        showApp();
        await fetchCurrentPageUrl();
        await fetchNotes();
        renderNotes();
      } else {
        showSetup();
      }
    } catch(e) {
      console.error("Init:", e);
      showSetup();
    }
    bindEvents();
  });

  async function fetchCurrentPageUrl() {
    try {
      const tabs = await new Promise((res, rej) => {
        ext.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (ext.runtime.lastError) rej(ext.runtime.lastError);
          else res(tabs);
        });
      });
      if (tabs && tabs[0]) {
        pageAttach = {
          url: normalizeUrl(tabs[0].url),
          title: tabs[0].title
        };
      }
    } catch(e) {
      console.warn("Could not get current page URL:", e);
      pageAttach = { url: "", title: "" };
    }
  }

//Storage
function loadConfig() {
  return new Promise((res, rej) => {
    try {
      ext.storage.local.get("nvConfig", r => {
        if (ext.runtime.lastError) rej(ext.runtime.lastError);
        else res(r.nvConfig || {});
      });
    } catch(e) { rej(e); }
  });
}
function saveConfig(cfg) {
  return new Promise((res, rej) => {
    try {
      ext.storage.local.set({ nvConfig: cfg }, () => {
        if (ext.runtime.lastError) rej(ext.runtime.lastError);
        else res();
      });
    } catch(e) { rej(e); }
  });
}

//Screens
function showSetup() {
  $("setup-screen").classList.remove("hidden");
  $("app-screen").classList.add("hidden");
  if (config.fbProjectId)    $("fb-project-id").value    = config.fbProjectId;
  if (config.fbApiKey)       $("fb-api-key").value       = config.fbApiKey;
  if (config.clCloudName)    $("cl-cloud-name").value    = config.clCloudName;
  if (config.clUploadPreset) $("cl-upload-preset").value = config.clUploadPreset;
}
function showApp() {
  $("setup-screen").classList.add("hidden");
  $("app-screen").classList.remove("hidden");
}
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(`view-${name}`).classList.remove("hidden");
}


function bindEvents() {
//save
   $("save-config-btn").addEventListener("click", async () => {
     const fbProjectId    = $("fb-project-id").value.trim();
     const fbApiKey       = $("fb-api-key").value.trim();
     const clCloudName    = $("cl-cloud-name").value.trim();
     const clUploadPreset = $("cl-upload-preset").value.trim();
     if (!fbProjectId || !fbApiKey) { alert("Firebase Project ID and API Key are required."); return; }
     config = { fbProjectId, fbApiKey, clCloudName, clUploadPreset };
     try {
       await saveConfig(config);
       showApp();
       await fetchNotes();
       renderNotes();
     } catch(e) { alert("Config error: " + e.message); }
   });

//Header btn
   $("settings-btn").addEventListener("click", showSetup);
   $("new-note-btn").addEventListener("click", async () => {
     resetCompose();
     pageAttach = { url: "", title: "" };
     try {
       const tabs = await new Promise((res, rej) => {
         ext.tabs.query({ active: true, currentWindow: true }, tabs => {
           if (ext.runtime.lastError) rej(ext.runtime.lastError);
           else res(tabs);
         });
       });
       if (tabs && tabs[0]) {
         pageAttach = { url: tabs[0].url, title: tabs[0].title };
         $("attach-toggle").checked = true;
         $("page-info").textContent = `Attached to: ${pageAttach.title}`;
         $("page-info").classList.remove("hidden");
       }
     } catch(e) { console.warn("Could not get tab info:", e); }
     showView("compose");
   });

  //Back btn
  $("back-btn").addEventListener("click", () => {
    showView("notes");
    renderNotes();
  });


  $("search-input").addEventListener("input", renderNotes);
  $("sort-select").addEventListener("change", renderNotes);


  $("save-note-btn").addEventListener("click", saveNote);

  $("tag-input").addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = $("tag-input").value.trim().replace(/,/g, "");
      if (val && !tags.includes(val) && tags.length < 8) { tags.push(val); renderTagChips(); }
      $("tag-input").value = "";
    }
  });

  //Paste image into textarea
  $("note-body").addEventListener("paste", e => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(i => i.type.startsWith("image/"));
    if (!imageItems.length) return;
    e.preventDefault();
    imageItems.forEach(item => {
      if (pendingImages.length >= 4) { showToast("Max 4 images", "error"); return; }
      const blob = item.getAsFile();
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = ev => {
        pendingImages.push({ dataUrl: ev.target.result, blob });
        renderPreviews();
        // Flash the textarea
        $("note-body").classList.add("paste-flash");
        setTimeout(() => $("note-body").classList.remove("paste-flash"), 500);
      };
      reader.readAsDataURL(blob);
    });
  });

$("close-modal-btn").addEventListener("click", closeModal);
    $("modal-backdrop").addEventListener("click", closeModal);
    $("delete-note-btn").addEventListener("click", deleteCurrentNote);
    $("edit-note-btn").addEventListener("click", editCurrentNote);
    $("attach-toggle").addEventListener("change", (e) => {
      if (!e.target.checked) {
        pageAttach = { url: "", title: "" };
        $("page-info").classList.add("hidden");
      }
    });
  }


function resetCompose() {
  $("note-body").value = "";
  pendingImages = [];
  tags = [];
  pageAttach = { url: "", title: "" };
  renderPreviews();
  renderTagChips();
  $("toast").classList.add("hidden");
  $("page-info").classList.add("hidden");
  editNoteId = null;
  $("save-note-btn").textContent = "Post";
}

function renderPreviews() {
  const wrap = $("attach-previews");
  wrap.innerHTML = "";
  pendingImages.forEach((img, i) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    const im = document.createElement("img"); im.src = img.dataUrl;
    const rm = document.createElement("button");
    rm.className = "preview-remove"; rm.textContent = "×";
    rm.addEventListener("click", () => { pendingImages.splice(i, 1); renderPreviews(); });
    item.append(im, rm);
    wrap.appendChild(item);
  });

  const hint = $("paste-hint");
  if (pendingImages.length > 0) {
    hint.classList.add("has-images");
    hint.childNodes[hint.childNodes.length - 1].textContent = ` ${pendingImages.length} image${pendingImages.length > 1 ? "s" : ""} attached`;
  } else {
    hint.classList.remove("has-images");
    hint.childNodes[hint.childNodes.length - 1].textContent = " Paste images directly into the note";
  }
}

function renderTagChips() {
  const list = $("tags-list"); list.innerHTML = "";
  tags.forEach((tag, i) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = `#${escHtml(tag)} <button>×</button>`;
    chip.querySelector("button").addEventListener("click", () => { tags.splice(i, 1); renderTagChips(); });
    list.appendChild(chip);
  });
}


async function saveNote() {
  const body = $("note-body").value.trim();
  if (!body && !pendingImages.length) { showToast("Write something first!", "error"); return; }
  setBusy(true);
  try {
    let imageUrls = [];
    if (pendingImages.length > 0) {
      if (!config.clCloudName || !config.clUploadPreset) {
        showToast("Add Cloudinary credentials in Settings to attach images.", "error");
        setBusy(false); return;
      }
      imageUrls = await uploadImages(pendingImages);
    }

    const lines = body.split("\n");
    const title = lines[0].slice(0, 80) || "Untitled";
    const attachToggle = $("attach-toggle")?.checked || false;
    const noteData = attachToggle && pageAttach.url ? {
      title, body, tags: [...tags], imageUrls, createdAt: new Date().toISOString(),
      pageUrl: pageAttach.url, pageTitle: pageAttach.title
    } : { title, body, tags: [...tags], imageUrls, createdAt: new Date().toISOString() };
    
    if (editNoteId) {
      const updatedNote = { ...noteData, createdAt: notes.find(n => n.id === editNoteId)?.createdAt || noteData.createdAt };
      await firestoreUpdate(editNoteId, updatedNote);
      const idx = notes.findIndex(n => n.id === editNoteId);
      if (idx >= 0) notes[idx] = { ...updatedNote, id: editNoteId };
      showToast("Updated ✓", "success");
      editNoteId = null;
    } else {
      const savedId = await firestoreCreate(noteData);
      noteData.id = savedId;
      notes.unshift(noteData);
      showToast("Saved ✓", "success");
    }
    ext.storage.local.set({ nvNotes_cache: notes });
    setTimeout(() => { showView("notes"); renderNotes(); }, 900);
  } catch(err) {
    console.error("Save:", err);
    showToast("Error: " + err.message, "error");
  }
  setBusy(false);
}

function setBusy(busy) {
  const btn = $("save-note-btn");
  btn.disabled = busy;
  btn.textContent = busy ? "Saving…" : (editNoteId ? "Update" : "Post");
}

//Firestore API calls
function fbBase() {
  return `https://firestore.googleapis.com/v1/projects/${config.fbProjectId}/databases/(default)/documents/notes`;
}
async function firestoreCreate(note) {
  const res = await fetch(`${fbBase()}?key=${config.fbApiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFS(note))
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  return (await res.json()).name.split("/").pop();
}
async function firestoreList() {
  const res = await fetch(`${fbBase()}?key=${config.fbApiKey}&pageSize=200`);
  if (!res.ok) throw new Error(`List failed ${res.status}`);
  const data = await res.json();
  return (data.documents || []).map(fromFS);
}
async function firestoreDelete(id) {
  const res = await fetch(`${fbBase()}/${id}?key=${config.fbApiKey}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed ${res.status}`);
}
async function firestoreUpdate(id, note) {
  const res = await fetch(`${fbBase()}/${id}?key=${config.fbApiKey}&updateMask.fieldPaths=title&updateMask.fieldPaths=body&updateMask.fieldPaths=tags&updateMask.fieldPaths=imageUrls&updateMask.fieldPaths=pageUrl&updateMask.fieldPaths=pageTitle`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFS(note))
  });
  if (!res.ok) throw new Error(`Update failed ${res.status}`);
}
function toFS(n) {
  return { fields: {
    title:     { stringValue: n.title },
    body:      { stringValue: n.body },
    tags:      { arrayValue: { values: (n.tags||[]).map(t=>({stringValue:t})) } },
    imageUrls: { arrayValue: { values: (n.imageUrls||[]).map(u=>({stringValue:u})) } },
    createdAt: { stringValue: n.createdAt },
    pageUrl:   { stringValue: n.pageUrl || "" },
    pageTitle: { stringValue: n.pageTitle || "" }
  }};
}
function fromFS(doc) {
  const f = doc.fields || {};
  return {
    id:        doc.name.split("/").pop(),
    title:     f.title?.stringValue || "Untitled",
    body:      f.body?.stringValue  || "",
    tags:      (f.tags?.arrayValue?.values||[]).map(v=>v.stringValue),
    imageUrls: (f.imageUrls?.arrayValue?.values||[]).map(v=>v.stringValue),
    createdAt: f.createdAt?.stringValue || "",
    pageUrl:   f.pageUrl?.stringValue || "",
    pageTitle: f.pageTitle?.stringValue || ""
  };
}
async function fetchNotes() {
  try { 
    notes = await firestoreList(); 
    ext.storage.local.set({ nvNotes_cache: notes });
  } catch(e) { 
    console.error("Fetch:", e); notes = []; 
    console.warn("Fetch failed, using cache");
    const cached = await new Promise(res => {
      ext.storage.local.get("nvNotes_cache", r => res(r.nvNotes_cache || []));
    });
    notes = cached;
  }
}

//Cloudinary upload
async function uploadImages(imgs) {
  const urls = [];
  for (const { blob } of imgs) {
    const fd = new FormData();
    fd.append("file", blob);
    fd.append("upload_preset", config.clUploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.clCloudName}/image/upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    urls.push((await res.json()).secure_url);
  }
  return urls;
}

//notes list
function renderNotes() {
    const q    = ($("search-input").value || "").toLowerCase();
    const sort = $("sort-select").value;
    const list = $("notes-list");

    let filtered = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      (n.tags||[]).some(t => t.toLowerCase().includes(q))
    );
    if (sort === "newest")  filtered.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "oldest") filtered.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    else filtered.sort((a,b) => a.title.localeCompare(b.title));

    // Current page highlight banner
    if (pageAttach.url) {
      const existingBanner = document.querySelector(".current-page-banner");
      const currentCount = filtered.filter(n => n.pageUrl === pageAttach.url).length;
      if (!existingBanner) {
        const banner = document.createElement("div");
        banner.className = "current-page-banner";
        const icon = document.createElement("div");
        icon.className = "current-page-icon";
        icon.textContent = "🔗";
        const text = document.createElement("div");
        text.className = "current-page-text";
        const titleSpan = document.createElement("span");
        titleSpan.className = "current-page-title";
        titleSpan.textContent = pageAttach.title || pageAttach.url;
        const countSpan = document.createElement("span");
        countSpan.className = "current-page-count";
        countSpan.textContent = `${currentCount} note${currentCount === 1 ? '' : 's'} from this page`;
        text.append(titleSpan, countSpan);
        banner.append(icon, text);
        list.parentNode.insertBefore(banner, list);
      } else {
        existingBanner.querySelector(".current-page-title").textContent = pageAttach.title || pageAttach.url;
        existingBanner.querySelector(".current-page-count").textContent = `${currentCount} note${currentCount === 1 ? '' : 's'} from this page`;
      }
    } else {
      const existingBanner = document.querySelector(".current-page-banner");
      if (existingBanner) existingBanner.remove();
    }

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const iconDiv = document.createElement("div");
      iconDiv.className = "empty-icon";
      iconDiv.textContent = "✦";
      const p = document.createElement("p");
      if (q) {
        p.textContent = "No notes match your search.";
      } else {
        p.appendChild(document.createTextNode("No notes yet."));
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode("Hit + to start writing."));
      }
      empty.append(iconDiv, p);
      list.appendChild(empty);
      return;
    }

    list.innerHTML = "";
    filtered.forEach(note => {
      const card = document.createElement("div");
      const isCurrentPage = pageAttach.url && note.pageUrl === pageAttach.url;
      card.className = `note-card${isCurrentPage ? ' current-page' : ''}`;
      const left = document.createElement("div");
      left.className = "note-card-left";
      const titleSpan = document.createElement("span");
      titleSpan.className = "note-card-title";
      titleSpan.textContent = note.title;
      if (isCurrentPage) {
        const label = document.createElement("span");
        label.className = "current-page-label";
        label.textContent = "● current page";
        titleSpan.appendChild(document.createTextNode(" "));
        titleSpan.appendChild(label);
      }
      const previewSpan = document.createElement("span");
      previewSpan.className = "note-card-preview";
      previewSpan.textContent = note.body.replace(/\n/g, " ");
      left.append(titleSpan, previewSpan);
      const right = document.createElement("div");
      right.className = "note-card-right";
      const dateSpan = document.createElement("span");
      dateSpan.className = "note-card-date";
      dateSpan.textContent = note.createdAt ? fmtDate(note.createdAt) : "";
      const badgesDiv = document.createElement("div");
      badgesDiv.className = "note-card-badges";
      (note.tags || []).forEach(t => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = `#${t}`;
        badgesDiv.appendChild(badge);
      });
      if ((note.imageUrls || []).length) {
        const imgBadge = document.createElement("span");
        imgBadge.className = "badge img";
        imgBadge.textContent = `🖼 ${note.imageUrls.length}`;
        badgesDiv.appendChild(imgBadge);
      }
      if (note.pageUrl) {
        const pageBadge = document.createElement("span");
        pageBadge.className = "badge page";
        pageBadge.textContent = "🔗";
        badgesDiv.appendChild(pageBadge);
      }
      right.append(dateSpan, badgesDiv);
      const arrow = document.createElement("span");
      arrow.className = "note-card-arrow";
      arrow.textContent = isCurrentPage ? "★" : "›";
      card.append(left, right, arrow);
      card.addEventListener("click", () => openModal(note));
      list.appendChild(card);
    });
  }


function openModal(note) {
  currentNoteId = note.id;
  $("modal-date").textContent = note.createdAt ? fmtDate(note.createdAt) : "";
  let html = `<div class="modal-note-title">${escHtml(note.title)}</div>`;
  html += `<p>${escHtml(note.body).replace(/\n/g, "<br/>")}</p>`;
  if ((note.imageUrls||[]).length) {
    html += `<div class="modal-images">${note.imageUrls.map(u=>`<img src="${escHtml(u)}" />`).join("")}</div>`;
  }
  if ((note.tags||[]).length) {
    html += `<div class="modal-tags">${note.tags.map(t=>`<span class="tag-chip">#${escHtml(t)}</span>`).join("")}</div>`;
  }
  const modalBody = $("modal-body");
  modalBody.innerHTML = "";
  const titleDiv = document.createElement("div");
  titleDiv.className = "modal-note-title";
  titleDiv.textContent = note.title;
  modalBody.appendChild(titleDiv);
  const bodyP = document.createElement("p");
  bodyP.innerHTML = escHtml(note.body).replace(/\n/g, "<br/>");
  modalBody.appendChild(bodyP);
  if ((note.imageUrls||[]).length) {
    const imgDiv = document.createElement("div");
    imgDiv.className = "modal-images";
    note.imageUrls.forEach(u => {
      const img = document.createElement("img");
      img.src = u;
      imgDiv.appendChild(img);
    });
    modalBody.appendChild(imgDiv);
  }
  if ((note.tags||[]).length) {
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "modal-tags";
    note.tags.forEach(t => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = `#${t}`;
      tagsDiv.appendChild(chip);
    });
    modalBody.appendChild(tagsDiv);
  }
  $("note-modal").classList.remove("hidden");
}
function closeModal() { $("note-modal").classList.add("hidden"); currentNoteId = null; }
async function deleteCurrentNote() {
  if (!currentNoteId || !confirm("Delete this note?")) return;
  try {
    await firestoreDelete(currentNoteId);
    notes = notes.filter(n => n.id !== currentNoteId);
    closeModal();
    renderNotes();
    showView("notes");
  } catch(e) { alert("Delete failed: " + e.message); }
}
function editCurrentNote() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  currentNoteId = null;
  closeModal();
  $("note-body").value = note.body;
  tags = [...note.tags];
  renderTagChips();
  editNoteId = note.id;
  $("save-note-btn").textContent = "Update";
  showView("compose");
}


function showToast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
