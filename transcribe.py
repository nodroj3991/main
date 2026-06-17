#!/usr/bin/env python3
"""
Audio Transcription Tool
Transcribe MP3 and other audio files to text using OpenAI Whisper
"""
import sys
import os
from pathlib import Path


def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import whisper
        return True
    except ImportError:
        print("Error: whisper is not installed.")
        print("Please install it using: pip install openai-whisper")
        return False


def transcribe_audio(input_file, output_file=None, model_size='base', language=None):
    """
    Transcribe audio file to text

    Args:
        input_file: Path to input audio file
        output_file: Path to output text file (optional)
        model_size: Whisper model size - tiny, base, small, medium, large (default: base)
        language: Language code (e.g., 'en', 'es', 'fr') - auto-detect if None
    """
    try:
        import whisper
    except ImportError:
        print("Error: whisper is not installed.")
        print("Please install it using: pip install openai-whisper")
        return False

    input_path = Path(input_file)

    # Validate input file
    if not input_path.exists():
        print(f"Error: File '{input_file}' not found")
        return False

    supported_formats = ['.mp3', '.mp4', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm']
    if input_path.suffix.lower() not in supported_formats:
        print(f"Warning: '{input_path.suffix}' may not be a supported audio format")
        print(f"Supported formats: {', '.join(supported_formats)}")

    # Determine output file name
    if output_file is None:
        output_file = input_path.with_suffix('.txt')
    else:
        output_file = Path(output_file)

    # Check if output file already exists
    if output_file.exists():
        response = input(f"'{output_file}' already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Transcription cancelled")
            return False

    try:
        # Get file size
        file_size_mb = input_path.stat().st_size / (1024 * 1024)

        print(f"\n{'='*60}")
        print(f"Transcribing: {input_file}")
        print(f"File size: {file_size_mb:.2f} MB")
        print(f"Model: {model_size}")
        if language:
            print(f"Language: {language}")
        print(f"{'='*60}\n")

        # Load model
        print(f"Loading Whisper '{model_size}' model...")
        print("(First time may take a few minutes to download the model)")
        model = whisper.load_model(model_size)

        # Transcribe
        print("\nTranscribing audio...")
        print("This may take a few minutes depending on file length and model size...")

        if language:
            result = model.transcribe(str(input_path), language=language, verbose=True)
        else:
            result = model.transcribe(str(input_path), verbose=True)

        # Get transcription text
        transcription = result['text']

        # Detect language if auto-detected
        detected_language = result.get('language', 'unknown')

        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"Transcription of: {input_file}\n")
            f.write(f"Model: {model_size}\n")
            f.write(f"Language: {detected_language}\n")
            f.write("="*60 + "\n\n")

            # Write transcription
            f.write(transcription.strip())
            f.write("\n")

            # Write timestamps if available
            if 'segments' in result and len(result['segments']) > 0:
                f.write("\n\n" + "="*60 + "\n")
                f.write("DETAILED TRANSCRIPT WITH TIMESTAMPS\n")
                f.write("="*60 + "\n\n")

                for segment in result['segments']:
                    start_time = format_timestamp(segment['start'])
                    end_time = format_timestamp(segment['end'])
                    text = segment['text'].strip()
                    f.write(f"[{start_time} -> {end_time}] {text}\n")

        print(f"\n{'='*60}")
        print(f"✓ Transcription complete!")
        print(f"  Input:  {input_file}")
        print(f"  Output: {output_file}")
        print(f"  Language: {detected_language}")
        print(f"  Words: ~{len(transcription.split())}")
        print(f"{'='*60}\n")

        # Print preview
        print("Preview (first 500 characters):")
        print("-" * 60)
        print(transcription[:500].strip())
        if len(transcription) > 500:
            print("...")
        print("-" * 60)

        return True

    except Exception as e:
        print(f"\nError during transcription: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def show_help():
    """Show help message"""
    print("""
Audio Transcription Tool

Transcribe audio files (MP3, WAV, M4A, etc.) to text using OpenAI Whisper.

Usage:
    python transcribe.py <audio_file>                      - Transcribe with default settings
    python transcribe.py <audio_file> <output.txt>         - Custom output file
    python transcribe.py <audio_file> --model <size>       - Choose model size
    python transcribe.py <audio_file> --language <code>    - Specify language
    python transcribe.py help                              - Show this help

Options:
    --model <size>      Model size: tiny, base, small, medium, large
                        - tiny:   Fastest, least accurate (~1GB RAM)
                        - base:   Fast, good accuracy (~1GB RAM) [DEFAULT]
                        - small:  Balanced (~2GB RAM)
                        - medium: Better accuracy (~5GB RAM)
                        - large:  Best accuracy (~10GB RAM)

    --language <code>   Language code (e.g., en, es, fr, de, zh, ja)
                        If not specified, language is auto-detected

Supported Formats:
    MP3, MP4, WAV, M4A, AAC, OGG, FLAC, WebM

Examples:
    # Basic transcription
    python transcribe.py interview.mp3

    # With custom output file
    python transcribe.py podcast.mp3 transcript.txt

    # Higher accuracy (slower)
    python transcribe.py lecture.mp3 --model medium

    # Faster transcription (less accurate)
    python transcribe.py audio.mp3 --model tiny

    # Specify language for better accuracy
    python transcribe.py spanish_audio.mp3 --language es

    # Combine options
    python transcribe.py audio.mp3 output.txt --model small --language en

Notes:
    - First run downloads the model (~100MB - 3GB depending on size)
    - Transcription time varies: ~1-5 minutes per hour of audio
    - Output includes full transcript + timestamped segments
    - Larger models are more accurate but slower and use more RAM
    """)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        show_help()
        return

    # Check dependencies first
    if sys.argv[1].lower() != 'help' and not check_dependencies():
        return

    command = sys.argv[1].lower()

    if command == 'help':
        show_help()
        return

    # Parse arguments
    args = sys.argv[1:]
    input_file = args[0]
    output_file = None
    model_size = 'base'
    language = None

    # Parse optional arguments
    i = 1
    while i < len(args):
        if args[i] == '--model' and i + 1 < len(args):
            model_size = args[i + 1].lower()
            valid_models = ['tiny', 'base', 'small', 'medium', 'large']
            if model_size not in valid_models:
                print(f"Invalid model: {model_size}")
                print(f"Valid models: {', '.join(valid_models)}")
                return
            i += 2
        elif args[i] == '--language' and i + 1 < len(args):
            language = args[i + 1].lower()
            i += 2
        elif not args[i].startswith('--') and i == 1:
            # Second argument without flag is output file
            output_file = args[i]
            i += 1
        else:
            i += 1

    # Transcribe
    transcribe_audio(input_file, output_file, model_size, language)


if __name__ == '__main__':
    main()
