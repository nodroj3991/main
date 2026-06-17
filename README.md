# Utility Tools Collection

A collection of useful command-line tools and GUI applications for audio/video processing.

## 🖥️ NEW! Graphical User Interface

**No Terminal commands needed!** Use the easy GUI for drag-and-drop transcription.

### Quick Launch:
```bash
~/Desktop/main/launch_gui.sh
```

**Features:**
- 🖱️ Drag and drop files
- 🎯 One-click operations
- 📊 Real-time progress display
- 📝 Automatic transcript opening
- 🎨 User-friendly interface

**See:** `GUI_GUIDE.md` for complete instructions

---

## Quick Start Scripts (Command Line)

### Quick Transcribe - Simple Audio to Text

Drag and drop any audio/video file to convert speech to text instantly!

```bash
./quick_transcribe.sh "/Users/origininem/Downloads/audio.mp3"
```

**What it does:**
- Transcribes any audio/video file to text
- Uses fast AI model for quick results
- Automatically opens the transcript when done

### Process Podcast - Complete Workflow

Full automation for podcast/meeting processing!

```bash
./process_podcast.sh "/Users/origininem/Downloads/Sitting down with Scholars 29.mp4"
```

**What it does:**
1. ✅ Converts MP4 video to MP3 audio (if needed)
2. ✅ Compresses to under 31 MB (if needed)
3. ✅ Transcribes to text with timestamps
4. ✅ Opens transcript automatically

**Perfect for:** Podcasts, meetings, interviews, lectures

---

## Individual Tools

### 1. Task Manager CLI

A simple command-line task management tool.

**Features:**
- Add tasks with descriptions
- List all tasks
- Mark tasks as complete
- Delete tasks
- Persistent storage using JSON

**Usage:**
```bash
# Add a new task
python task_manager.py add "Buy groceries"

# List all tasks
python task_manager.py list

# Complete a task
python task_manager.py complete 1

# Delete a task
python task_manager.py delete 1
```

### 2. MP4 to MP3 Converter

Convert MP4 video files to MP3 audio files with ease.

**Features:**
- Convert single MP4 files to MP3
- Batch convert entire directories
- Custom output filenames and directories
- Adjustable audio bitrate (128k, 192k, 256k, 320k)
- Supports multiple video formats (MP4, M4V, MOV, AVI, MKV)
- File size reporting

**Usage:**
```bash
# Convert a single file
python mp4_to_mp3.py video.mp4

# Convert with custom output name
python mp4_to_mp3.py video.mp4 audio.mp3

# Convert with higher quality
python mp4_to_mp3.py video.mp4 --bitrate 320k

# Batch convert all videos in a directory
python mp4_to_mp3.py batch ./videos

# Batch convert with custom output directory
python mp4_to_mp3.py batch ./videos ./audio_output
```

### 3. File Compressor

Compress video and audio files to a target file size (perfect for keeping files under size limits like 31 MB).

**Features:**
- Compress videos to target file size (default: 31 MB)
- Compress audio files with automatic bitrate calculation
- Multiple quality presets (low/medium/high)
- Smart resolution and FPS adjustment
- Supports multiple formats (MP4, AVI, MOV, MKV, MP3, WAV)
- Detailed compression statistics

**Usage:**
```bash
# Compress video to 31 MB (default)
python file_compressor.py video.mp4

# Compress to specific size
python file_compressor.py video.mp4 --size 25

# Compress with quality settings
python file_compressor.py video.mp4 --quality low      # 360p, smallest
python file_compressor.py video.mp4 --quality medium   # 720p, balanced
python file_compressor.py video.mp4 --quality high     # original res

# Compress with custom output name
python file_compressor.py video.mp4 compressed.mp4

# Compress audio files
python file_compressor.py audio.mp3 --size 10

# Combine options
python file_compressor.py video.mp4 --size 20 --quality low
```

### 4. Audio Transcription Tool

Transcribe audio files to text using OpenAI's Whisper AI model.

**Features:**
- Transcribe MP3, WAV, M4A, and other audio formats to text
- Multiple model sizes (tiny to large) for speed vs accuracy tradeoff
- Automatic language detection or manual specification
- Timestamped transcripts with segment breakdowns
- Supports 99+ languages
- Works offline after initial model download

**Usage:**
```bash
# Basic transcription (uses 'base' model)
python transcribe.py interview.mp3

# With custom output file
python transcribe.py podcast.mp3 transcript.txt

# Higher accuracy (slower, uses more RAM)
python transcribe.py lecture.mp3 --model medium

# Faster transcription (less accurate)
python transcribe.py audio.mp3 --model tiny

# Specify language for better accuracy
python transcribe.py spanish_audio.mp3 --language es

# Combine options
python transcribe.py audio.mp3 output.txt --model small --language en
```

**Model Sizes:**
- `tiny` - Fastest, ~1GB RAM, good for quick transcripts
- `base` - Default, balanced speed and accuracy
- `small` - Better accuracy, ~2GB RAM
- `medium` - High accuracy, ~5GB RAM
- `large` - Best accuracy, ~10GB RAM (slow)

### 5. QR Code Generator

An enhanced web-based QR code generator with multiple features (see qr-generator.html).

## Installation

```bash
pip install -r requirements.txt
```

## Future Enhancements

**Task Manager:**
- Task priorities
- Due dates
- Task categories/tags
- Search functionality
- Export to different formats

**MP4 to MP3 Converter:**
- Progress bars for large files
- Audio quality presets
- Metadata preservation
- Trim/cut audio before export

**File Compressor:**
- Two-pass encoding for better quality
- Batch compression for directories
- Preview mode to estimate output size
- Custom codec selection

**Audio Transcription:**
- Batch transcription for multiple files
- Export to multiple formats (SRT, VTT for subtitles)
- Speaker diarization (identify different speakers)
- Real-time transcription from microphone
