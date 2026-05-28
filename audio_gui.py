#!/usr/bin/env python3
"""
Audio Transcription GUI
A simple graphical interface for converting and transcribing audio files
"""

import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext
import threading
import subprocess
import os
from pathlib import Path


class AudioTranscriptionGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Audio Transcription Tool")
        self.root.geometry("800x600")

        # Get tools directory
        self.tools_dir = Path.home() / "Desktop" / "main"

        # Variables
        self.input_file = tk.StringVar()
        self.status_text = tk.StringVar(value="Ready")
        self.current_process = None

        # Create UI
        self.create_ui()

    def create_ui(self):
        """Create the user interface"""

        # Title
        title_label = tk.Label(
            self.root,
            text="🎙️ Audio Transcription Tool",
            font=("Arial", 20, "bold")
        )
        title_label.pack(pady=10)

        # File selection frame
        file_frame = ttk.LabelFrame(self.root, text="Select File", padding=10)
        file_frame.pack(fill="x", padx=20, pady=10)

        # File path entry
        ttk.Entry(
            file_frame,
            textvariable=self.input_file,
            width=70
        ).pack(side="left", padx=5)

        # Browse button
        ttk.Button(
            file_frame,
            text="Browse...",
            command=self.browse_file
        ).pack(side="left")

        # Operation buttons frame
        ops_frame = ttk.LabelFrame(self.root, text="Choose Operation", padding=10)
        ops_frame.pack(fill="x", padx=20, pady=10)

        # Quick Transcribe button
        ttk.Button(
            ops_frame,
            text="🎙️ Quick Transcribe\n(Audio → Text)",
            command=self.quick_transcribe,
            width=25
        ).pack(side="left", padx=10, pady=5)

        # Process Podcast button
        ttk.Button(
            ops_frame,
            text="🎧 Process Podcast\n(Full Workflow)",
            command=self.process_podcast,
            width=25
        ).pack(side="left", padx=10, pady=5)

        # Convert MP4 to MP3 button
        ttk.Button(
            ops_frame,
            text="📹 Convert MP4 → MP3\n(Video to Audio)",
            command=self.convert_mp4_to_mp3,
            width=25
        ).pack(side="left", padx=10, pady=5)

        # Progress frame
        progress_frame = ttk.LabelFrame(self.root, text="Progress", padding=10)
        progress_frame.pack(fill="x", padx=20, pady=10)

        # Status label
        ttk.Label(
            progress_frame,
            textvariable=self.status_text,
            font=("Arial", 12)
        ).pack()

        # Progress bar
        self.progress = ttk.Progressbar(
            progress_frame,
            mode='indeterminate',
            length=700
        )
        self.progress.pack(pady=10)

        # Output frame
        output_frame = ttk.LabelFrame(self.root, text="Output", padding=10)
        output_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Output text area
        self.output_text = scrolledtext.ScrolledText(
            output_frame,
            height=15,
            wrap=tk.WORD,
            font=("Courier", 10)
        )
        self.output_text.pack(fill="both", expand=True)

        # Help text
        help_text = (
            "📖 Quick Guide:\n"
            "• Quick Transcribe: For audio files (MP3, M4A) - just creates transcript\n"
            "• Process Podcast: For videos or large files - converts, compresses, transcribes\n"
            "• Convert MP4→MP3: Extract audio from video files\n\n"
            "Drag and drop files or click Browse to select a file."
        )
        self.output_text.insert("1.0", help_text)

        # Drag and drop (requires tkinterdnd2, optional)
        try:
            self.root.drop_target_register(tk.DND_FILES)
            self.root.dnd_bind('<<Drop>>', self.on_drop)
        except (AttributeError, tk.TclError):
            # Drag and drop not available, that's okay
            # Users can still use the Browse button
            pass

    def on_drop(self, event):
        """Handle drag and drop"""
        file_path = event.data
        # Clean up the path (remove curly braces if present)
        file_path = file_path.strip('{}')
        self.input_file.set(file_path)
        self.log(f"File loaded: {file_path}")

    def browse_file(self):
        """Open file browser"""
        file_types = [
            ("All Supported", "*.mp4 *.m4a *.mp3 *.wav *.mov *.avi *.mkv"),
            ("Video Files", "*.mp4 *.mov *.avi *.mkv"),
            ("Audio Files", "*.mp3 *.m4a *.wav *.aac"),
            ("All Files", "*.*")
        ]

        filename = filedialog.askopenfilename(
            title="Select Audio or Video File",
            filetypes=file_types
        )

        if filename:
            self.input_file.set(filename)
            self.log(f"Selected: {filename}")

    def log(self, message):
        """Add message to output"""
        self.output_text.insert(tk.END, f"\n{message}")
        self.output_text.see(tk.END)
        self.root.update()

    def clear_output(self):
        """Clear output text"""
        self.output_text.delete("1.0", tk.END)

    def run_command(self, command, operation_name):
        """Run a command in a separate thread"""

        def run():
            try:
                self.status_text.set(f"Running: {operation_name}")
                self.progress.start()
                self.clear_output()
                self.log(f"Starting: {operation_name}")
                self.log(f"Command: {' '.join(command)}\n")

                # Run the command
                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )

                # Stream output
                for line in process.stdout:
                    self.log(line.rstrip())

                process.wait()

                if process.returncode == 0:
                    self.status_text.set(f"✅ {operation_name} completed successfully!")
                    self.log(f"\n✅ SUCCESS! {operation_name} completed.")

                    # Open output file if it's a text file
                    if "Transcribe" in operation_name:
                        input_path = Path(self.input_file.get())
                        output_file = input_path.with_suffix('.txt')
                        if output_file.exists():
                            self.log(f"\n📄 Opening transcript: {output_file}")
                            subprocess.run(['open', str(output_file)])
                else:
                    self.status_text.set(f"❌ {operation_name} failed")
                    self.log(f"\n❌ FAILED with exit code {process.returncode}")

            except Exception as e:
                self.status_text.set(f"❌ Error: {str(e)}")
                self.log(f"\n❌ ERROR: {str(e)}")
            finally:
                self.progress.stop()

        # Run in thread to keep UI responsive
        thread = threading.Thread(target=run, daemon=True)
        thread.start()

    def validate_file(self):
        """Check if a file is selected"""
        if not self.input_file.get():
            self.status_text.set("❌ Please select a file first")
            self.log("❌ No file selected. Please browse or drag a file.")
            return False

        if not Path(self.input_file.get()).exists():
            self.status_text.set("❌ File not found")
            self.log(f"❌ File not found: {self.input_file.get()}")
            return False

        return True

    def quick_transcribe(self):
        """Run quick transcription"""
        if not self.validate_file():
            return

        script_path = self.tools_dir / "quick_transcribe.sh"

        if not script_path.exists():
            self.status_text.set("❌ Script not found")
            self.log(f"❌ Script not found: {script_path}")
            self.log("Please run the setup commands first.")
            return

        command = [str(script_path), self.input_file.get()]
        self.run_command(command, "Quick Transcribe")

    def process_podcast(self):
        """Run podcast processing workflow"""
        if not self.validate_file():
            return

        script_path = self.tools_dir / "process_podcast.sh"

        if not script_path.exists():
            self.status_text.set("❌ Script not found")
            self.log(f"❌ Script not found: {script_path}")
            self.log("Please run the setup commands first.")
            return

        command = [str(script_path), self.input_file.get()]
        self.run_command(command, "Process Podcast")

    def convert_mp4_to_mp3(self):
        """Convert MP4 to MP3 using ffmpeg"""
        if not self.validate_file():
            return

        input_path = Path(self.input_file.get())
        output_path = input_path.with_suffix('.mp3')

        # Check if ffmpeg is installed
        try:
            subprocess.run(['ffmpeg', '-version'],
                         capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.status_text.set("❌ FFmpeg not installed")
            self.log("❌ FFmpeg is not installed.")
            self.log("Please run: brew install ffmpeg")
            return

        command = [
            'ffmpeg', '-i', str(input_path),
            '-vn', '-acodec', 'libmp3lame', '-ab', '128k',
            str(output_path), '-y'
        ]
        self.run_command(command, "MP4 to MP3 Conversion")


def main():
    """Main entry point"""
    root = tk.Tk()

    # Try to enable drag and drop
    try:
        from tkinterdnd2 import DND_FILES, TkinterDnD
        root = TkinterDnD.Tk()
    except ImportError:
        # Drag and drop not available, that's okay
        pass

    app = AudioTranscriptionGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
