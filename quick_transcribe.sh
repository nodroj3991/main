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

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ TRANSCRIPTION COMPLETE!"
    echo "=================================================="

    # Get output file name (same as input but with .txt extension)
    OUTPUT_FILE="${INPUT_FILE%.*}.txt"
    echo "📄 Transcript saved to:"
    echo "   $OUTPUT_FILE"
    echo ""
    echo "Opening transcript..."
    open "$OUTPUT_FILE"
else
    echo ""
    echo "❌ Transcription failed. Check the error above."
    exit 1
fi
