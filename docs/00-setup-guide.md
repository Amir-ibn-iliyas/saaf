# 00 — Setup guide (computer pe kya install karna hai)

Ye sab **ek baar** install karna hai. Har tool ke baad "Check" wala command chalao aur
version dikhna chahiye. Kuch fail ho toh Claude ko error paste karke pucho.

## Windows (recommended tarika: winget)
Start menu → **Terminal** (ya PowerShell) kholo aur ek-ek line chalao:

```powershell
winget install -e --id Git.Git
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.12
winget install -e --id Gyan.FFmpeg
winget install -e --id Google.AndroidStudio
```
Sab install hone ke baad **Terminal band karke dobara kholo** (PATH update hone ke liye).

### Check
```powershell
git --version
node -v          # v22 ya usse naya
npm -v
python --version # Python 3.12.x
ffmpeg -version
```

### Windows pe Python ki common problem
Agar `python` likhne pe Microsoft Store khul jaye ya kuch na ho:
1. Settings → Apps → Advanced app settings → **App execution aliases**
2. `python.exe` aur `python3.exe` wale dono switch **Off** karo
3. Terminal dobara kholo, `python --version` chalao

Agar winget na chale: https://www.python.org/downloads/ se Python 3.12 ka installer lo, aur
install ke pehle screen pe **"Add python.exe to PATH"** zaroor tick karo.

## macOS
Pehle Homebrew (https://brew.sh) install karo, phir:
```bash
brew install git node python@3.12 ffmpeg
brew install --cask android-studio
```
Check: `node -v`, `python3.12 --version`, `ffmpeg -version`.
(macOS pe commands mein `python` ki jagah `python3.12` use hoga.)

## Android Studio (emulator)
1. Android Studio kholo → setup wizard mein default options se SDK install hone do.
2. **More Actions → Virtual Device Manager → Create device** → Pixel (koi bhi) → latest
   Android image → Finish → ▶ se start karo.
3. Ya apna Android phone use karo: phone mein **Developer options → USB debugging** on karo.

## VS Code + Claude Code
1. VS Code install karo (https://code.visualstudio.com).
2. Extensions mein **Claude Code** search karke install karo aur login karo.
3. File → Open Folder → apna `saaf` folder kholo.

## Python kab chahiye?
Sirf **video server** (Phase 3) ke liye. Phase 0–2 (image wala kaam) Node.js se chalega.
Phir bhi abhi install kar lo taaki beech mein rukna na pade.

Python project ka setup agent khud karega, is tarike se (sirf jaankari ke liye):
```powershell
cd server
python -m venv .venv
.venv\Scripts\activate          # macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
