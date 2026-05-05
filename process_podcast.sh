#!/bin/bash
#
# Process Podcast - Complete workflow for podcast/meeting processing
# - Converts MP4 to MP3 (if needed)
# - Compresses audio to under 31 MB
# - Transcribes to text with timestamps
# - Creates summary and labels
#
# Usage: ./process_podcast.sh "/path/to/video.mp4"
#

# Check if file was provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No file provided"
    echo ""
    echo "Usage: Drag and drop a video or audio file onto this script"
    echo "   OR: ./process_podcast.sh \"/path/to/your/file.mp4\""
    echo ""
    echo "What this script does:"
    echo "  1. Converts MP4 to MP3 (if video file)"
    echo "  2. Compresses audio to under 31 MB (if needed)"
    echo "  3. Transcribes audio to text"
    echo "  4. Opens the transcript when done"
    echo ""
    exit 1
fi

INPUT_FILE="$1"

# Check if file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    exit 1
fi

# Set tools directory (change this if you moved the tools to a different location)
TOOLS_DIR="$HOME/Desktop/main"

# Check if tools directory exists
if [ ! -d "$TOOLS_DIR" ]; then
    echo "❌ Error: Tools directory not found: $TOOLS_DIR"
    echo "Please update the TOOLS_DIR variable in this script to point to your tools location"
    exit 1
fi

cd "$TOOLS_DIR"

# Get file info
FILENAME=$(basename "$INPUT_FILE")
EXTENSION="${FILENAME##*.}"
BASENAME="${FILENAME%.*}"
DIRNAME=$(dirname "$INPUT_FILE")

echo "=================================================="
echo "🎧  PODCAST PROCESSING WORKFLOW"
echo "=================================================="
echo "Input: $FILENAME"
echo "Type: $EXTENSION"
echo ""

# Step 1: Convert to MP3 if it's a video file
if [[ "$EXTENSION" =~ ^(mp4|MP4|m4v|M4V|mov|MOV|avi|AVI|mkv|MKV)$ ]]; then
    echo "📹 Step 1: Converting video to MP3..."
    echo "---------------------------------------------------"

    AUDIO_FILE="$DIRNAME/$BASENAME.mp3"

    # Check if MP3 already exists
    if [ -f "$AUDIO_FILE" ]; then
        echo "⚠️  MP3 already exists: $AUDIO_FILE"
        echo "   Using existing file..."
    else
        # Convert using ffmpeg
        ffmpeg -i "$INPUT_FILE" -vn -acodec libmp3lame -ab 128k "$AUDIO_FILE" -y 2>&1 | grep -E "Duration|time=|error"

        if [ $? -ne 0 ]; then
            echo "❌ Conversion failed"
            exit 1
        fi

        echo "✅ Conversion complete!"
    fi

    echo ""
else
    # Already an audio file
    AUDIO_FILE="$INPUT_FILE"
    echo "🎵 Input is already an audio file, skipping conversion"
    echo ""
fi

# Step 2: Check file size and compress if needed
echo "📊 Step 2: Checking file size..."
echo "---------------------------------------------------"

FILE_SIZE=$(stat -f%z "$AUDIO_FILE" 2>/dev/null || stat -c%s "$AUDIO_FILE" 2>/dev/null)
FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))

echo "Current size: ${FILE_SIZE_MB} MB"

if [ $FILE_SIZE_MB -gt 31 ]; then
    echo "⚠️  File is over 31 MB, compressing..."

    COMPRESSED_FILE="$DIRNAME/${BASENAME}_compressed.mp3"

    # Compress to 64k bitrate
    ffmpeg -i "$AUDIO_FILE" -b:a 64k "$COMPRESSED_FILE" -y 2>&1 | grep -E "Duration|time=|error"

    if [ $? -eq 0 ]; then
        FINAL_AUDIO="$COMPRESSED_FILE"

        # Check new size
        NEW_SIZE=$(stat -f%z "$FINAL_AUDIO" 2>/dev/null || stat -c%s "$FINAL_AUDIO" 2>/dev/null)
        NEW_SIZE_MB=$((NEW_SIZE / 1024 / 1024))

        echo "✅ Compressed to ${NEW_SIZE_MB} MB"
    else
        echo "⚠️  Compression failed, using original file"
        FINAL_AUDIO="$AUDIO_FILE"
    fi
else
    echo "✅ File size is OK (under 31 MB)"
    FINAL_AUDIO="$AUDIO_FILE"
fi

echo ""

# Step 3: Transcribe
echo "🎙️  Step 3: Transcribing audio to text..."
echo "---------------------------------------------------"
echo "This may take 2-5 minutes depending on audio length..."
echo ""

python transcribe.py "$FINAL_AUDIO" --model tiny

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Transcription failed"
    exit 1
fi

# Step 4: Open results
TRANSCRIPT_FILE="${FINAL_AUDIO%.*}.txt"

echo ""
echo "=================================================="
echo "✅ PODCAST PROCESSING COMPLETE!"
echo "=================================================="
echo ""
echo "📂 Results:"
echo "   Audio:      $FINAL_AUDIO"
echo "   Transcript: $TRANSCRIPT_FILE"
echo ""
echo "   Size:       ${FILE_SIZE_MB} MB → ${NEW_SIZE_MB:-$FILE_SIZE_MB} MB"
echo ""
echo "Opening transcript..."

# Open the transcript file
if [ -f "$TRANSCRIPT_FILE" ]; then
    open "$TRANSCRIPT_FILE"
else
    echo "⚠️  Transcript file not found: $TRANSCRIPT_FILE"
fi

echo ""
echo "Done! 🎉"
