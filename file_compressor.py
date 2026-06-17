#!/usr/bin/env python3
"""
File Compressor CLI Tool
Compress video and audio files to a target file size
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


def get_file_size_mb(file_path):
    """Get file size in MB"""
    return Path(file_path).stat().st_size / (1024 * 1024)


def compress_video(input_file, output_file=None, target_size_mb=31, quality='medium'):
    """
    Compress video file to target size

    Args:
        input_file: Path to input video file
        output_file: Path to output file (optional)
        target_size_mb: Target file size in MB (default: 31)
        quality: Compression quality - 'low', 'medium', 'high' (default: medium)
    """
    from moviepy import VideoFileClip

    input_path = Path(input_file)

    # Validate input file
    if not input_path.exists():
        print(f"Error: File '{input_file}' not found")
        return False

    # Determine output file name
    if output_file is None:
        output_file = input_path.parent / f"{input_path.stem}_compressed{input_path.suffix}"
    else:
        output_file = Path(output_file)

    # Check if output file already exists
    if output_file.exists():
        response = input(f"'{output_file}' already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Compression cancelled")
            return False

    try:
        input_size = get_file_size_mb(input_file)
        print(f"Input file size: {input_size:.2f} MB")
        print(f"Target file size: {target_size_mb} MB")
        print(f"Compressing '{input_file}'...")

        # Load video
        video = VideoFileClip(str(input_path))
        duration = video.duration

        # Calculate target bitrate
        # Formula: bitrate (kbps) = (target_size_mb * 8192) / duration_seconds
        # We use 90% of target to leave room for overhead
        target_bitrate_kbps = int((target_size_mb * 8192 * 0.9) / duration)

        # Quality presets affect resolution
        quality_settings = {
            'low': {
                'resolution': (640, 360),
                'audio_bitrate': '64k',
                'fps': 24
            },
            'medium': {
                'resolution': (1280, 720),
                'audio_bitrate': '128k',
                'fps': 30
            },
            'high': {
                'resolution': None,  # Keep original
                'audio_bitrate': '192k',
                'fps': None  # Keep original
            }
        }

        settings = quality_settings.get(quality, quality_settings['medium'])

        # Resize video if needed
        if settings['resolution']:
            # Calculate aspect ratio
            aspect_ratio = video.w / video.h
            target_w, target_h = settings['resolution']

            # Only resize if current resolution is larger
            if video.w > target_w or video.h > target_h:
                if aspect_ratio > (target_w / target_h):
                    new_width = target_w
                    new_height = int(target_w / aspect_ratio)
                else:
                    new_height = target_h
                    new_width = int(target_h * aspect_ratio)

                # Make dimensions even (required by some codecs)
                new_width = new_width - (new_width % 2)
                new_height = new_height - (new_height % 2)

                video = video.resized((new_width, new_height))
                print(f"Resizing to {new_width}x{new_height}")

        # Adjust FPS if needed
        if settings['fps'] and video.fps > settings['fps']:
            video = video.with_fps(settings['fps'])
            print(f"Reducing FPS to {settings['fps']}")

        # Adjust bitrate based on current size
        if input_size > target_size_mb:
            print(f"Using video bitrate: {target_bitrate_kbps}k")
            print(f"Using audio bitrate: {settings['audio_bitrate']}")
        else:
            print(f"File is already under {target_size_mb} MB, using standard compression")
            target_bitrate_kbps = '2000k'

        # Write compressed video
        video.write_videofile(
            str(output_file),
            codec='libx264',
            audio_codec='aac',
            bitrate=f"{target_bitrate_kbps}k",
            audio_bitrate=settings['audio_bitrate'],
            preset='medium',
            threads=4
        )

        video.close()

        # Check output size
        output_size = get_file_size_mb(output_file)
        compression_ratio = ((input_size - output_size) / input_size) * 100

        print(f"\n✓ Compression successful!")
        print(f"  Input:  {input_file} ({input_size:.2f} MB)")
        print(f"  Output: {output_file} ({output_size:.2f} MB)")
        print(f"  Saved:  {input_size - output_size:.2f} MB ({compression_ratio:.1f}% reduction)")

        if output_size > target_size_mb:
            print(f"\n⚠ Warning: Output file ({output_size:.2f} MB) is still larger than target ({target_size_mb} MB)")
            print(f"  Try using a lower quality setting: --quality low")
        else:
            print(f"\n✓ Output file is under {target_size_mb} MB!")

        return True

    except Exception as e:
        print(f"Error during compression: {str(e)}")
        if output_file.exists():
            output_file.unlink()  # Delete incomplete file
        return False


def compress_audio(input_file, output_file=None, target_size_mb=31):
    """
    Compress audio file to target size

    Args:
        input_file: Path to input audio file
        output_file: Path to output file (optional)
        target_size_mb: Target file size in MB (default: 31)
    """
    from moviepy import AudioFileClip

    input_path = Path(input_file)

    if not input_path.exists():
        print(f"Error: File '{input_file}' not found")
        return False

    # Determine output file name
    if output_file is None:
        output_file = input_path.parent / f"{input_path.stem}_compressed{input_path.suffix}"
    else:
        output_file = Path(output_file)

    try:
        input_size = get_file_size_mb(input_file)
        print(f"Input file size: {input_size:.2f} MB")
        print(f"Target file size: {target_size_mb} MB")

        if input_size <= target_size_mb:
            print(f"File is already under {target_size_mb} MB!")
            return True

        print(f"Compressing '{input_file}'...")

        # Load audio
        audio = AudioFileClip(str(input_path))
        duration = audio.duration

        # Calculate target bitrate (in kbps)
        target_bitrate_kbps = int((target_size_mb * 8192) / duration)

        # Ensure reasonable bitrate (between 32k and 320k)
        target_bitrate_kbps = max(32, min(320, target_bitrate_kbps))

        print(f"Using bitrate: {target_bitrate_kbps}k")

        # Write compressed audio
        audio.write_audiofile(
            str(output_file),
            bitrate=f"{target_bitrate_kbps}k"
        )

        audio.close()

        output_size = get_file_size_mb(output_file)
        compression_ratio = ((input_size - output_size) / input_size) * 100

        print(f"\n✓ Compression successful!")
        print(f"  Input:  {input_file} ({input_size:.2f} MB)")
        print(f"  Output: {output_file} ({output_size:.2f} MB)")
        print(f"  Saved:  {input_size - output_size:.2f} MB ({compression_ratio:.1f}% reduction)")

        return True

    except Exception as e:
        print(f"Error during compression: {str(e)}")
        return False


def show_help():
    """Show help message"""
    print("""
File Compressor

Compress video and audio files to a target file size (default: 31 MB).

Usage:
    python file_compressor.py <input_file>                           - Compress to 31 MB
    python file_compressor.py <input_file> <output_file>            - Compress with custom output name
    python file_compressor.py <input_file> --size <MB>              - Compress to specific size
    python file_compressor.py <input_file> --quality <low/med/high> - Set quality level
    python file_compressor.py help                                   - Show this help

Options:
    --size <MB>         Target file size in MB (default: 31)
    --quality <level>   Quality level for video: low, medium, high (default: medium)
                        - low: 360p, lower bitrate (smallest files)
                        - medium: 720p, balanced quality/size
                        - high: original resolution, higher bitrate

File Types:
    - Video: MP4, AVI, MOV, MKV, M4V
    - Audio: MP3, WAV, M4A, AAC

Examples:
    python file_compressor.py video.mp4
    python file_compressor.py video.mp4 output.mp4
    python file_compressor.py video.mp4 --size 25
    python file_compressor.py video.mp4 --quality low
    python file_compressor.py video.mp4 --size 20 --quality medium
    python file_compressor.py audio.mp3 --size 10
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

    # Parse arguments
    args = sys.argv[1:]
    input_file = args[0]
    output_file = None
    target_size = 31
    quality = 'medium'

    # Parse optional arguments
    i = 1
    while i < len(args):
        if args[i] == '--size' and i + 1 < len(args):
            target_size = int(args[i + 1])
            i += 2
        elif args[i] == '--quality' and i + 1 < len(args):
            quality = args[i + 1].lower()
            if quality not in ['low', 'medium', 'high']:
                print(f"Invalid quality: {quality}. Using 'medium'")
                quality = 'medium'
            i += 2
        elif not args[i].startswith('--') and i == 1:
            # Second argument without flag is output file
            output_file = args[i]
            i += 1
        else:
            i += 1

    # Determine file type
    input_path = Path(input_file)
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.m4v']
    audio_extensions = ['.mp3', '.wav', '.m4a', '.aac']

    if input_path.suffix.lower() in video_extensions:
        compress_video(input_file, output_file, target_size, quality)
    elif input_path.suffix.lower() in audio_extensions:
        compress_audio(input_file, output_file, target_size)
    else:
        print(f"Unsupported file type: {input_path.suffix}")
        print("Supported types: MP4, AVI, MOV, MKV, MP3, WAV, M4A, AAC")


if __name__ == '__main__':
    main()
