#!/usr/bin/env python3
"""
Simple task management CLI tool
"""
import json
import sys
from datetime import datetime
from pathlib import Path

TASKS_FILE = Path.home() / '.tasks.json'


def load_tasks():
    """Load tasks from JSON file"""
    if TASKS_FILE.exists():
        with open(TASKS_FILE, 'r') as f:
            return json.load(f)
    return []


def save_tasks(tasks):
    """Save tasks to JSON file"""
    with open(TASKS_FILE, 'w') as f:
        json.dump(tasks, f, indent=2)


def add_task(description):
    """Add a new task"""
    tasks = load_tasks()
    task = {
        'id': len(tasks) + 1,
        'description': description,
        'completed': False,
        'created_at': datetime.now().isoformat()
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"✓ Task added: {description}")


def list_tasks():
    """List all tasks"""
    tasks = load_tasks()
    if not tasks:
        print("No tasks found.")
        return

    print("\nTasks:")
    print("-" * 50)
    for task in tasks:
        status = "✓" if task['completed'] else " "
        print(f"[{status}] {task['id']}. {task['description']}")
    print("-" * 50)
    print(f"Total: {len(tasks)} tasks")


def complete_task(task_id):
    """Mark a task as complete"""
    tasks = load_tasks()
    for task in tasks:
        if task['id'] == task_id:
            task['completed'] = True
            save_tasks(tasks)
            print(f"✓ Task {task_id} marked as complete")
            return
    print(f"Task {task_id} not found")


def delete_task(task_id):
    """Delete a task"""
    tasks = load_tasks()
    tasks = [t for t in tasks if t['id'] != task_id]
    # Reassign IDs
    for i, task in enumerate(tasks, 1):
        task['id'] = i
    save_tasks(tasks)
    print(f"✓ Task {task_id} deleted")


def show_help():
    """Show help message"""
    print("""
Task Manager CLI

Usage:
    python task_manager.py add "task description"    - Add a new task
    python task_manager.py list                      - List all tasks
    python task_manager.py complete <id>             - Mark task as complete
    python task_manager.py delete <id>               - Delete a task
    python task_manager.py help                      - Show this help
    """)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        show_help()
        return

    command = sys.argv[1].lower()

    if command == 'add':
        if len(sys.argv) < 3:
            print("Error: Please provide a task description")
            return
        add_task(' '.join(sys.argv[2:]))

    elif command == 'list':
        list_tasks()

    elif command == 'complete':
        if len(sys.argv) < 3:
            print("Error: Please provide a task ID")
            return
        try:
            complete_task(int(sys.argv[2]))
        except ValueError:
            print("Error: Task ID must be a number")

    elif command == 'delete':
        if len(sys.argv) < 3:
            print("Error: Please provide a task ID")
            return
        try:
            delete_task(int(sys.argv[2]))
        except ValueError:
            print("Error: Task ID must be a number")

    elif command == 'help':
        show_help()

    else:
        print(f"Unknown command: {command}")
        show_help()


if __name__ == '__main__':
    main()
