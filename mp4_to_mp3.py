#!/usr/bin/env python3
"""
MP4 to MP3 Converter CLI Tool
Converts MP4 video files to MP3 audio files
"""
import sys
import os
from pathlib import Path


def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        from moviepy import VideoFileClip
        return True
    except ImportError:
        print("Error: moviepy is not installed.")
        print("Please install it using: pip install moviepy")
        return False


def convert_mp4_to_mp3(input_file, output_file=None, bitrate="192k"):
    """
    Convert MP4 file to MP3

    Args:
        input_file: Path to input MP4 file
        output_file: Path to output MP3 file (optional)
        bitrate: Audio bitrate (default: 192k)
    """
    from moviepy import VideoFileClip

    input_path = Path(input_file)

    # Validate input file
    if not input_path.exists():
        print(f"Error: File '{input_file}' not found")
        return False

    if not input_path.suffix.lower() in ['.mp4', '.m4v', '.mov', '.avi', '.mkv']:
        print(f"Warning: '{input_file}' may not be a valid video file")

    # Determine output file name
    if output_file is None:
        output_file = input_path.with_suffix('.mp3')
    else:
        output_file = Path(output_file)

    # Check if output file already exists
    if output_file.exists():
        response = input(f"'{output_file}' already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Conversion cancelled")
            return False

    try:
        print(f"Converting '{input_file}' to '{output_file}'...")

        # Load video file
        video = VideoFileClip(str(input_path))

        # Extract audio
        audio = video.audio

        if audio is None:
            print(f"Error: No audio track found in '{input_file}'")
            video.close()
            return False

        # Write audio to MP3 file
        audio.write_audiofile(
            str(output_file),
            bitrate=bitrate
        )

        # Clean up
        audio.close()
        video.close()

        # Get file sizes
        input_size = input_path.stat().st_size / (1024 * 1024)  # MB
        output_size = output_file.stat().st_size / (1024 * 1024)  # MB

        print(f"✓ Conversion successful!")
        print(f"  Input:  {input_file} ({input_size:.2f} MB)")
        print(f"  Output: {output_file} ({output_size:.2f} MB)")

        return True

    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        return False


def batch_convert(directory, output_dir=None, bitrate="192k"):
    """
    Convert all MP4 files in a directory to MP3

    Args:
        directory: Directory containing MP4 files
        output_dir: Output directory (optional, defaults to same as input)
        bitrate: Audio bitrate (default: 192k)
    """
    dir_path = Path(directory)

    if not dir_path.exists() or not dir_path.is_dir():
        print(f"Error: '{directory}' is not a valid directory")
        return

    # Find all video files
    video_files = []
    for ext in ['.mp4', '.m4v', '.mov', '.avi', '.mkv']:
        video_files.extend(dir_path.glob(f"*{ext}"))
        video_files.extend(dir_path.glob(f"*{ext.upper()}"))

    if not video_files:
        print(f"No video files found in '{directory}'")
        return

    print(f"Found {len(video_files)} video file(s) to convert")

    # Set output directory
    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
    else:
        out_path = dir_path

    # Convert each file
    success_count = 0
    for video_file in video_files:
        output_file = out_path / video_file.with_suffix('.mp3').name
        if convert_mp4_to_mp3(video_file, output_file, bitrate):
            success_count += 1
        print()  # Add blank line between conversions

    print(f"Batch conversion complete: {success_count}/{len(video_files)} successful")


def show_help():
    """Show help message"""
    print("""
MP4 to MP3 Converter

Convert MP4 video files to MP3 audio files.

Usage:
    python mp4_to_mp3.py <input.mp4>                     - Convert single file
    python mp4_to_mp3.py <input.mp4> <output.mp3>       - Convert with custom output name
    python mp4_to_mp3.py batch <directory>               - Convert all files in directory
    python mp4_to_mp3.py batch <directory> <output_dir>  - Convert all with custom output directory
    python mp4_to_mp3.py help                            - Show this help

Options:
    --bitrate <rate>    Audio bitrate (default: 192k, options: 128k, 192k, 256k, 320k)

Examples:
    python mp4_to_mp3.py video.mp4
    python mp4_to_mp3.py video.mp4 audio.mp3
    python mp4_to_mp3.py video.mp4 --bitrate 320k
    python mp4_to_mp3.py batch ./videos
    python mp4_to_mp3.py batch ./videos ./audio_output
    """)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        show_help()
        return

    # Check dependencies first
    if not check_dependencies():
        return

    command = sys.argv[1].lower()

    if command == 'help':
        show_help()
        return

    # Parse bitrate option
    bitrate = "192k"
    args = sys.argv[1:]
    if '--bitrate' in args:
        idx = args.index('--bitrate')
        if idx + 1 < len(args):
            bitrate = args[idx + 1]
            # Remove bitrate args from the list
            args.pop(idx)
            args.pop(idx)

    if command == 'batch':
        if len(args) < 2:
            print("Error: Please provide a directory path")
            return

        directory = args[1]
        output_dir = args[2] if len(args) > 2 else None
        batch_convert(directory, output_dir, bitrate)

    else:
        # Single file conversion
        input_file = args[0]
        output_file = args[1] if len(args) > 1 else None
        convert_mp4_to_mp3(input_file, output_file, bitrate)


if __name__ == '__main__':
    main()
