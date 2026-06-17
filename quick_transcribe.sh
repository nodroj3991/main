#!/bin/bash
#
# Quick Transcribe - Drag an audio/video file to convert speech to text
# Usage: ./quick_transcribe.sh "/path/to/audio.mp3"
#

# Check if file was provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No file provided"
    echo ""
    echo "Usage: Drag and drop an audio or video file onto this script"
    echo "   OR: ./quick_transcribe.sh \"/path/to/your/file.mp3\""
    echo ""
    echo "Supported formats: MP3, MP4, M4A, WAV, AVI, MOV, MKV"
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

echo "=================================================="
echo "🎙️  QUICK TRANSCRIBE"
echo "=================================================="
echo "Input: $INPUT_FILE"
echo ""
echo "Starting transcription..."
echo "This will take a few minutes depending on file length."
echo ""

# Run transcription using the tiny model (fastest)
cd "$TOOLS_DIR"
python transcribe.py "$INPUT_FILE" --model tiny

# Get output file name (same as input but with .txt extension)
OUTPUT_FILE="${INPUT_FILE%.*}.txt"

# Check if output file was actually created
if [ -f "$OUTPUT_FILE" ]; then
    echo ""
    echo "=================================================="
    echo "✅ TRANSCRIPTION COMPLETE!"
    echo "=================================================="
    echo "📄 Transcript saved to:"
    echo "   $OUTPUT_FILE"
    echo ""

    # Get file size
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
    if [ "$FILE_SIZE" -gt 100 ]; then
        echo "Opening transcript..."
        open "$OUTPUT_FILE"
    else
        echo "⚠️  Warning: Transcript file seems empty or very small"
        echo "   Size: $FILE_SIZE bytes"
    fi
else
    echo ""
    echo "=================================================="
    echo "❌ TRANSCRIPTION FAILED"
    echo "=================================================="
    echo ""
    echo "Common issues:"
    echo "  1. Whisper not installed: pip install openai-whisper"
    echo "  2. FFmpeg not installed: brew install ffmpeg"
    echo "  3. NumPy version conflict: pip install 'numpy<2'"
    echo ""
    echo "Expected output: $OUTPUT_FILE"
    echo "File was not created. Check the error messages above."
    exit 1
fi
