# Task Manager CLI

A simple command-line task management tool written in Python.

## Features

- Add tasks with descriptions
- List all tasks
- Mark tasks as complete
- Delete tasks
- Persistent storage using JSON

## Installation

```bash
pip install -r requirements.txt
```

## Usage

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

## Future Enhancements

- Task priorities
- Due dates
- Task categories/tags
- Search functionality
- Export to different formats
