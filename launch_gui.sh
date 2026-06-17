#!/bin/bash
#
# Launch the Audio Transcription GUI
#

# Get script directory
TOOLS_DIR="$HOME/Desktop/main"

cd "$TOOLS_DIR"

# Check if Python GUI file exists
if [ ! -f "audio_gui.py" ]; then
    echo "❌ Error: audio_gui.py not found in $TOOLS_DIR"
    echo "Please download it first."
    exit 1
fi

echo "🚀 Launching Audio Transcription GUI..."
echo ""

# Launch the GUI
python3 audio_gui.py

# If launch fails
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to launch GUI"
    echo ""
    echo "Common issues:"
    echo "  1. Python not installed"
    echo "  2. Tkinter not available"
    echo ""
    echo "Try running from Terminal:"
    echo "  python3 ~/Desktop/main/audio_gui.py"
fi
