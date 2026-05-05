# 📋 COMMAND SHEET - Audio Transcription Tools

Quick reference for daily use. Keep this handy!

---

## 🚀 THE TWO COMMANDS YOU NEED

### 1️⃣ Quick Transcribe (Audio → Text)
```bash
~/Desktop/main/quick_transcribe.sh "FILE_PATH"
```

**Use for:**
- ✅ Voice memos (M4A)
- ✅ MP3 files under 31 MB
- ✅ Already converted audio

**Example:**
```bash
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/New Recording 2.m4a"
```

---

### 2️⃣ Process Podcast (Complete Workflow)
```bash
~/Desktop/main/process_podcast.sh "FILE_PATH"
```

**Use for:**
- ✅ MP4 videos
- ✅ Large audio files (> 31 MB)
- ✅ "Sitting down with Scholars" episodes
- ✅ Zoom/meeting recordings

**Example:**
```bash
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Sitting down with Scholars 30.mp4"
```

**What it does:**
1. Converts MP4 → MP3
2. Compresses to under 31 MB (if needed)
3. Transcribes to text
4. Opens transcript

---

## 🎯 DRAG & DROP METHOD

1. Open Terminal
2. Type: `~/Desktop/main/process_podcast.sh ` (with space)
3. **Drag your file from Finder into Terminal**
4. Press Enter
5. Wait 3-5 minutes
6. Done! Transcript opens automatically

---

## ⚡ SHORTCUTS (Optional)

Add these once:
```bash
echo 'alias transcribe="~/Desktop/main/quick_transcribe.sh"' >> ~/.bash_profile
echo 'alias podcast="~/Desktop/main/process_podcast.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

**Then use:**
```bash
transcribe "audio.m4a"
podcast "video.mp4"
```

---

## 🔧 TROUBLESHOOTING

### If you get: "whisper is not installed"
```bash
python -m pip install openai-whisper
```

### If torch is broken:
```bash
pip uninstall torch
pip install torch
```

### If ffmpeg missing:
```bash
brew install ffmpeg
```

### Test if whisper works (no output = success):
```bash
python -c "import whisper"
```

---

## 📂 WHERE ARE MY FILES?

**Transcripts:** Same folder as your audio file
- Input: `/Users/origininem/Downloads/audio.mp3`
- Output: `/Users/origininem/Downloads/audio.txt`

**Find all transcripts:**
```bash
ls -lh ~/Downloads/*.txt
```

**Check file sizes:**
```bash
ls -lh ~/Downloads/*.mp3
ls -lh ~/Downloads/*.m4a
```

---

## ⏱️ HOW LONG DOES IT TAKE?

| Audio Length | Processing Time |
|--------------|-----------------|
| 10 minutes   | ~1 minute       |
| 30 minutes   | ~2 minutes      |
| 60 minutes   | ~5 minutes      |
| 90 minutes   | ~7 minutes      |

---

## 🎓 EXAMPLES FOR YOUR COMMON FILES

### Voice Memos
```bash
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/New Recording 5.m4a"
```

### Scholars Podcast (Video)
```bash
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Sitting down with Scholars 31.mp4"
```

### Already Converted Podcast (Audio)
```bash
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/Sitting down with Scholars 31.mp3"
```

### Meeting Recording
```bash
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Zoom Meeting.mp4"
```

---

## 📞 QUICK CHECKS

**Verify setup:**
```bash
ls ~/Desktop/main/           # Should show 5 files
python -c "import whisper"   # No output = good
ffmpeg -version              # Shows version = good
```

**Re-download tools if missing:**
```bash
cd ~/Desktop/main
curl -o quick_transcribe.sh "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/quick_transcribe.sh"
curl -o process_podcast.sh "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/process_podcast.sh"
chmod +x *.sh
```

---

## 💡 PRO TIPS

1. **Filenames with spaces need quotes:**
   ```bash
   ~/Desktop/main/podcast.sh "/Users/origininem/Downloads/File With Spaces.mp4"
   ```

2. **Check progress:** The script shows emoji indicators:
   - 📹 = Converting video
   - 🗜️ = Compressing
   - 🎙️ = Transcribing
   - ✅ = Done!

3. **Batch process multiple files:**
   ```bash
   for file in ~/Downloads/Sitting*.mp4; do
       ~/Desktop/main/process_podcast.sh "$file"
   done
   ```

4. **First run downloads AI model (~75 MB)** - only happens once

---

## 🎯 DECISION TREE

```
Do you have a file to transcribe?
│
├─ Is it MP4/video? → Use process_podcast.sh
│
├─ Is it MP3/M4A over 31 MB? → Use process_podcast.sh
│
└─ Is it MP3/M4A under 31 MB? → Use quick_transcribe.sh
```

---

**Keep this file open while you work!**

For complete setup instructions, see: `QUICK_START.md`
