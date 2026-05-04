<div align="center">

<br />

<img src="icons/icon96.png" width="72" height="72" alt="NoteVault icon" />

<h1>NoteVault</h1>

<p>A dark, editorial note-taking extension for Firefox and Zen Browser.<br />
Capture thoughts, paste images, tag and search — all synced to your own Firebase.</p>

<br />

![Firefox](https://img.shields.io/badge/Firefox-Extension-FF7139?logo=firefox&logoColor=white)
![Manifest V2](https://img.shields.io/badge/Manifest-V2-4A90D9)
![Firebase](https://img.shields.io/badge/Storage-Firebase_Firestore-FFCA28?logo=firebase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?logo=cloudinary&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e)

<br />

</div>

---

## Overview

NoteVault is a minimal, fast browser extension built for writers, researchers, and anyone who thinks in fragments. It lives in your toolbar and gets out of your way — open it, write, paste a screenshot, tag it, close it.

Your notes are stored in **your own** Firebase Firestore project. No shared server, no subscription, no lock-in. Images are uploaded to your own Cloudinary account. Free tiers on both cover most personal use indefinitely.

---

## Features

- **Instant capture** — open the popup and start writing immediately, notes list loads first if you already have notes
- **Paste images** — paste screenshots or copied images directly into the text area with `Ctrl+V` / `⌘V`, no file picker needed
- **Tags** — type a tag and press `Enter` to organize notes, searchable
- **Search & sort** — filter across title, body, and tags in real time; sort by newest, oldest, or alphabetical
- **Your own storage** — Firebase Firestore for text (free up to 1 GB), Cloudinary for images (free up to 25 GB)
- **Dark editorial design** — warm ink-on-paper palette built for focused writing
- **Works in Zen Browser** — Zen is Firefox-based; the extension loads identically

---

## Screenshots


---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/RomMj10/NoteVault.git
cd notevault
```

### 2. Load the extension

**Firefox / Zen Browser:**

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from the cloned folder
4. The NoteVault icon appears in your toolbar

> **Note:** Temporary add-ons are removed on browser restart. See [Publishing](#publishing) to install permanently.

### 3. Set up Firebase

NoteVault needs a Firebase project for note storage.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. In the project, go to **Build → Firestore Database** → **Create database** → choose **Test mode**
3. Go to **Project Settings → General** → scroll to **Your apps** → click the **`</>`** web icon
4. Register an app (any name) — you'll see a config object with `apiKey` and `projectId`
5. Copy both values into NoteVault's setup screen

### 4. Set up Cloudinary (optional — for image uploads)

Only needed if you want to attach images to notes.

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload → Upload presets**
3. Add a preset, set signing mode to **Unsigned**, save
4. Copy your **Cloud Name** and **preset name** into NoteVault's setup screen

---

## Firestore Security Rules

After setup, update your Firestore rules from the Firebase Console under **Firestore → Rules**. The default test mode rules expire — replace them with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if true;
    }
  }
}
```

For a personal-use extension this is fine. If you share your Firebase project with others, restrict access using Firebase Authentication.

---

## Project Structure

```
notevault/
├── manifest.json       # Extension manifest (MV2)
├── popup.html          # Main popup markup
├── popup.css           # Styles — dark editorial theme
├── popup.js            # All extension logic
├── background.js       # Background service worker
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon96.png
```

---

## How It Works

NoteVault is entirely client-side. There is no backend, no proxy, no middleman.

- **Text notes** are written directly to Firebase Firestore via its REST API using your project's API key
- **Images** are uploaded directly to Cloudinary using an unsigned upload preset
- **Credentials** are stored locally in `browser.storage.local` — they never leave your browser except to call Firebase and Cloudinary directly
- The extension requests only two permissions: `storage` and `activeTab`

---

## Privacy

NoteVault does not collect any data. Your notes go directly from your browser to your Firebase project. Your images go directly from your browser to your Cloudinary account. The extension author has no access to either.

You are responsible for your own Firebase and Cloudinary account security.

---

## License

MIT — do whatever you want with it.

---

<div align="center">
  <sub>Built for Firefox and Zen Browser &nbsp;·&nbsp; Stores your data in your own cloud &nbsp;·&nbsp; No subscriptions</sub>
</div>
