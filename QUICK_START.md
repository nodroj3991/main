# Quick Start Guide - Audio Transcription Tools

Complete guide for transcribing podcasts, meetings, and audio files.

## 🚀 ONE-TIME SETUP (First Time Only)

Run these commands once to set everything up:

### 1. Create Tools Directory
```bash
mkdir -p ~/Desktop/main
cd ~/Desktop/main
```

### 2. Install Required Software
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv bash)"' >> ~/.bash_profile
source ~/.bash_profile

# Install FFmpeg
brew install ffmpeg

# Install Python libraries
pip install "numpy<2" numba openai-whisper moviepy
```

### 3. Download All Tools
```bash
cd ~/Desktop/main

# Python tools
curl -o transcribe.py "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/transcribe.py"
curl -o mp4_to_mp3.py "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/mp4_to_mp3.py"
curl -o file_compressor.py "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/file_compressor.py"

# Workflow scripts
curl -o quick_transcribe.sh "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/quick_transcribe.sh"
curl -o process_podcast.sh "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/process_podcast.sh"

# Make executable
chmod +x *.sh *.py
```

### 4. Verify Installation
```bash
# Check all files are present
ls -lh ~/Desktop/main/

# Test whisper
python -c "import whisper; print('Whisper installed successfully')"

# Test ffmpeg
ffmpeg -version | head -1
```

You should see:
- ✅ 5 files in ~/Desktop/main
- ✅ "Whisper installed successfully"
- ✅ FFmpeg version info

---

## 🎯 DAILY USAGE

### Option 1: Quick Transcribe (Simple Audio → Text)

**When to use:** You have an audio file and just want the transcript.

```bash
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/AUDIO_FILE.m4a"
```

**Examples:**
```bash
# Voice memo
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/New Recording 2.m4a"

# MP3 file
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/interview.mp3"

# Already converted podcast
~/Desktop/main/quick_transcribe.sh "/Users/origininem/Downloads/Sitting down with Scholars 29.mp3"
```

**What it does:**
- ✅ Transcribes audio to text using AI
- ✅ Creates `.txt` file in same folder
- ✅ Opens transcript automatically
- ⏱️ Takes 1-3 minutes per hour of audio

**Output:**
- `AUDIO_FILE.txt` with full transcript and timestamps

---

### Option 2: Process Podcast (Complete Workflow)

**When to use:** You have a video file (MP4) or large audio that needs processing.

```bash
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/VIDEO_FILE.mp4"
```

**Examples:**
```bash
# Podcast video
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Sitting down with Scholars 30.mp4"

# Zoom recording
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Meeting Jan 15.mp4"

# Large audio file
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/long-interview.mp3"
```

**What it does:**
1. 📹 Converts MP4 → MP3 (extracts audio)
2. 📊 Checks file size
3. 🗜️ Compresses to under 31 MB if needed
4. 🎙️ Transcribes to text
5. 📂 Opens transcript automatically

**Output:**
- `FILE.mp3` (audio extracted)
- `FILE_compressed.mp3` (if compression needed)
- `FILE.txt` (transcript)

---

## 📋 COMPLETE WORKFLOW EXAMPLE

### Processing a "Sitting down with Scholars" Episode

```bash
# 1. Open Terminal

# 2. Run the process command
~/Desktop/main/process_podcast.sh "/Users/origininem/Downloads/Sitting down with Scholars 31.mp4"

# 3. Wait 3-5 minutes while it:
#    - Extracts audio from video (1-2 min)
#    - Compresses if needed (1 min)
#    - Transcribes speech to text (2-3 min)

# 4. Transcript opens automatically!
```

**You'll get:**
- ✅ `Sitting down with Scholars 31.mp3` - Audio file
- ✅ `Sitting down with Scholars 31_compressed.mp3` - If over 31 MB
- ✅ `Sitting down with Scholars 31.txt` - Full transcript

---

## 🎨 EASIER SHORTCUTS (Optional)

Add these to your `~/.bash_profile` for super simple commands:

```bash
echo 'alias transcribe="~/Desktop/main/quick_transcribe.sh"' >> ~/.bash_profile
echo 'alias podcast="~/Desktop/main/process_podcast.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

**Then you can just type:**

```bash
transcribe "/Users/origininem/Downloads/audio.m4a"
podcast "/Users/origininem/Downloads/video.mp4"
```

---

## 🔧 MANUAL OPERATIONS (Advanced)

### Convert MP4 to MP3 Only

```bash
ffmpeg -i "INPUT.mp4" -vn -acodec libmp3lame -ab 128k "OUTPUT.mp3"
```

### Compress Audio to Specific Size

```bash
# To ~30 MB (64k bitrate)
ffmpeg -i "INPUT.mp3" -b:a 64k "OUTPUT.mp3"

# To ~22 MB (48k bitrate)
ffmpeg -i "INPUT.mp3" -b:a 48k "OUTPUT.mp3"

# To ~15 MB (32k bitrate)
ffmpeg -i "INPUT.mp3" -b:a 32k "OUTPUT.mp3"
```

### Transcribe with Different AI Models

```bash
# Fastest (less accurate)
python ~/Desktop/main/transcribe.py "FILE.mp3" --model tiny

# Balanced (recommended)
python ~/Desktop/main/transcribe.py "FILE.mp3" --model base

# Most accurate (slower)
python ~/Desktop/main/transcribe.py "FILE.mp3" --model medium
```

---

## ⚠️ TROUBLESHOOTING

### "Error: whisper is not installed"

```bash
pip install openai-whisper
```

### "Error: ffmpeg not found"

```bash
brew install ffmpeg
```

### NumPy version conflicts

```bash
pip install --force-reinstall "numpy<2" numba
```

### "Tools directory not found"

```bash
ls ~/Desktop/main/
# Should show 5 files. If empty, re-run the download commands from setup.
```

### Check if everything is working

```bash
# Check whisper
python -c "import whisper"

# Check ffmpeg
ffmpeg -version

# Check tools exist
ls ~/Desktop/main/
```

---

## 📱 PRO TIPS

### Drag and Drop Files

1. Type the command but don't press Enter
2. Drag the file from Finder into Terminal
3. Press Enter

Example:
```bash
~/Desktop/main/podcast.sh [DRAG FILE HERE]
```

### Batch Process Multiple Files

```bash
# Process all MP4s in Downloads
for file in ~/Downloads/*.mp4; do
    ~/Desktop/main/process_podcast.sh "$file"
done
```

### Check File Sizes

```bash
# See all audio files and their sizes
ls -lh ~/Downloads/*.mp3
ls -lh ~/Downloads/*.m4a
```

### Find Transcript Files

```bash
# List all transcripts
ls -lh ~/Downloads/*.txt
```

---

## 📊 EXPECTED PROCESSING TIMES

| File Type | Duration | Processing Time |
|-----------|----------|-----------------|
| 10-min audio | 10 min | ~1 minute |
| 30-min podcast | 30 min | ~2-3 minutes |
| 1-hour video | 60 min | ~5-7 minutes |
| 2-hour meeting | 120 min | ~10-15 minutes |

**Breakdown:**
- MP4 → MP3 conversion: ~1 min per hour of video
- Compression: ~30 seconds
- Transcription (tiny model): ~1-2 min per hour of audio
- Transcription (base model): ~2-4 min per hour of audio
- Transcription (medium model): ~5-10 min per hour of audio

---

## 🎯 WHICH TOOL FOR WHICH FILE?

| Your File | Size | Use This |
|-----------|------|----------|
| `*.mp4` (video) | Any | `process_podcast.sh` |
| `*.m4a` (voice memo) | < 31 MB | `quick_transcribe.sh` |
| `*.m4a` (voice memo) | > 31 MB | `process_podcast.sh` |
| `*.mp3` (podcast) | < 31 MB | `quick_transcribe.sh` |
| `*.mp3` (podcast) | > 31 MB | `process_podcast.sh` |
| "Sitting down with Scholars *.mp4" | Any | `process_podcast.sh` |

---

## 📞 NEED HELP?

1. Check the error message - it usually tells you what's missing
2. Run the verification commands in "Verify Installation"
3. Make sure you're using the full file path with quotes
4. Check that the file actually exists at that path

---

**Last Updated:** January 2026
**Repository:** https://github.com/nodroj3991/main
