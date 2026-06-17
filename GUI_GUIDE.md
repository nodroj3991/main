# 🖥️ Graphical User Interface (GUI) Guide

Easy-to-use visual interface for audio transcription - no Terminal commands needed!

---

## 🚀 Setup (One Time)

### Download the GUI:

```bash
cd ~/Desktop/main

# Download GUI application
curl -o audio_gui.py "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/audio_gui.py"

# Download launcher
curl -o launch_gui.sh "https://raw.githubusercontent.com/nodroj3991/main/claude/implement-feature-mkfgbme72xjmk7fy-K49Y7/launch_gui.sh"

# Make executable
chmod +x audio_gui.py launch_gui.sh
```

---

## 🎯 Launch the GUI

### Option 1: Double-click (easiest)
1. Open Finder
2. Go to `Desktop/main/`
3. Double-click `launch_gui.sh`

### Option 2: From Terminal
```bash
~/Desktop/main/launch_gui.sh
```

### Option 3: Direct Python
```bash
python3 ~/Desktop/main/audio_gui.py
```

---

## 📖 How to Use the GUI

### The Interface

```
┌─────────────────────────────────────────────┐
│     🎙️ Audio Transcription Tool            │
├─────────────────────────────────────────────┤
│ Select File:                                │
│ [/path/to/file.mp4          ] [Browse...]   │
├─────────────────────────────────────────────┤
│ Choose Operation:                           │
│ [🎙️ Quick Transcribe] [🎧 Process Podcast] │
│ [📹 Convert MP4→MP3]                         │
├─────────────────────────────────────────────┤
│ Progress:                                   │
│ Status: Ready                               │
│ [Progress Bar                             ] │
├─────────────────────────────────────────────┤
│ Output:                                     │
│ ┌───────────────────────────────────────┐   │
│ │ Messages and output appear here...    │   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Step-by-Step:

1. **Select Your File**
   - Click "Browse..." button
   - OR drag and drop a file into the window
   
2. **Choose Operation**
   - 🎙️ **Quick Transcribe**: Audio → Text (fastest)
   - 🎧 **Process Podcast**: Full workflow (convert, compress, transcribe)
   - 📹 **Convert MP4→MP3**: Extract audio from video only

3. **Click the Button**
   - Operation starts automatically
   - Progress bar shows activity
   - Output shows real-time messages

4. **Done!**
   - Transcript opens automatically
   - Files saved in same folder as input

---

## 🎨 Features

### ✅ What You Can Do:

- **Browse for files** with file picker dialog
- **Drag and drop** files into the window
- **See real-time progress** in the output window
- **One-click operations** - no typing needed
- **Automatic file opening** when transcription completes
- **Clear status messages** showing what's happening

### 📁 Supported File Types:

**Video:**
- MP4, MOV, AVI, MKV

**Audio:**
- MP3, M4A, WAV, AAC

---

## 🎯 Common Workflows

### 1. Transcribe a Voice Memo

1. Launch GUI
2. Click "Browse..."
3. Select your `.m4a` file
4. Click "🎙️ Quick Transcribe"
5. Wait 1-2 minutes
6. Transcript opens automatically!

### 2. Process a Podcast Video

1. Launch GUI
2. Drag `Sitting down with Scholars 30.mp4` into the window
3. Click "🎧 Process Podcast"
4. Wait 3-5 minutes while it:
   - Converts video to audio
   - Compresses if needed
   - Transcribes to text
5. Transcript opens automatically!

### 3. Just Convert Video to Audio

1. Launch GUI
2. Select your MP4 file
3. Click "📹 Convert MP4→MP3"
4. Wait 1-2 minutes
5. MP3 file created in same folder!

---

## 🔧 Troubleshooting

### GUI won't launch

**Check Python:**
```bash
python3 --version
```
Should show Python 3.x

**Launch manually:**
```bash
cd ~/Desktop/main
python3 audio_gui.py
```

### "Script not found" error

The GUI needs the other scripts to be present:
```bash
ls ~/Desktop/main/
# Should show:
# - quick_transcribe.sh
# - process_podcast.sh  
# - audio_gui.py
# - launch_gui.sh
```

### "Whisper not installed" error

Install dependencies:
```bash
pip install openai-whisper
```

### "FFmpeg not found" error

Install ffmpeg:
```bash
brew install ffmpeg
```

---

## 💡 Pro Tips

### Make a Desktop Shortcut

1. Open Finder
2. Go to `Desktop/main/`
3. Right-click `launch_gui.sh`
4. Click "Make Alias"
5. Drag the alias to your Desktop
6. Rename to "Audio Transcriber"

Now you can double-click from your Desktop!

### Add to Dock

1. Launch the GUI
2. Right-click its icon in the Dock
3. Options → Keep in Dock

### Batch Processing

For multiple files, you can:
1. Process first file
2. While it's running, queue the next
3. Or use the Terminal commands for true batch processing

---

## ⚙️ Advanced: Customize the Interface

The GUI is a Python file you can edit!

**Open in TextEdit:**
```bash
open -a TextEdit ~/Desktop/main/audio_gui.py
```

**Things you can change:**
- Window size: Line 21 `root.geometry("800x600")`
- Button text: Lines with `ttk.Button()`
- Colors and fonts: Add `bg=` and `font=` parameters

---

## 📊 Comparison: GUI vs Terminal

| Feature | GUI | Terminal |
|---------|-----|----------|
| Ease of use | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐ Medium |
| Speed | ⭐⭐⭐ Same | ⭐⭐⭐ Same |
| Batch processing | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Excellent |
| Visual feedback | ⭐⭐⭐⭐⭐ Real-time | ⭐⭐⭐ Text only |
| Automation | ⭐⭐ Manual | ⭐⭐⭐⭐⭐ Scriptable |

**Recommendation:**
- Use **GUI** for occasional, one-off transcriptions
- Use **Terminal** for batch processing many files

---

## 🎯 Examples

### Example 1: Quick Voice Memo Transcription

1. Record voice memo on phone → `New Recording 5.m4a`
2. AirDrop to Mac Downloads folder
3. Open Audio Transcription GUI
4. Click Browse → Select `New Recording 5.m4a`
5. Click "🎙️ Quick Transcribe"
6. Read transcript in 1 minute!

### Example 2: Process Podcast Episode

1. Download Zoom recording → `Episode 31.mp4`
2. Launch GUI
3. Drag `Episode 31.mp4` into GUI window
4. Click "🎧 Process Podcast"
5. Get:
   - `Episode 31.mp3` (audio)
   - `Episode 31_compressed.mp3` (if large)
   - `Episode 31.txt` (transcript)

---

## 🆘 Need Help?

**GUI not working?** Use Terminal commands:
- Quick transcribe: `~/Desktop/main/quick_transcribe.sh "file.m4a"`
- Process podcast: `~/Desktop/main/process_podcast.sh "file.mp4"`

See `COMMAND_SHEET.md` for Terminal reference.

---

**Enjoy the GUI!** 🎉

Much easier than typing commands every time!
