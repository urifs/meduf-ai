"""
Task Manager for Background AI Processing
Handles long-running AI consensus tasks asynchronously
"""
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from enum import Enum
from concurrent.futures import ThreadPoolExecutor


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskManager:
    """
    Manages asynchronous background tasks
    Stores task status and results in memory
    """
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.cleanup_interval = 3600  # 1 hour
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    def create_task(self, task_type: str) -> str:
        """Create a new task and return its ID"""
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "id": task_id,
            "type": task_type,
            "status": TaskStatus.PENDING,
            "result": None,
            "error": None,
            "created_at": datetime.utcnow(),
            "completed_at": None,
            "progress": 0
        }
        return task_id
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID"""
        return self.tasks.get(task_id)
    
    def update_status(self, task_id: str, status: TaskStatus, progress: int = None):
        """Update task status"""
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = status
            if progress is not None:
                self.tasks[task_id]["progress"] = progress
    
    def complete_task(self, task_id: str, result: Any):
        """Mark task as completed with result"""
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = TaskStatus.COMPLETED
            self.tasks[task_id]["result"] = result
            self.tasks[task_id]["completed_at"] = datetime.utcnow()
            self.tasks[task_id]["progress"] = 100
    
    def fail_task(self, task_id: str, error: str):
        """Mark task as failed with error message"""
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = TaskStatus.FAILED
            self.tasks[task_id]["error"] = error
            self.tasks[task_id]["completed_at"] = datetime.utcnow()
    
    async def execute_task(
        self, 
        task_id: str, 
        func: Callable, 
        *args, 
        **kwargs
    ):
        """
        Execute a task function in background
        Handles errors and updates status automatically
        """
        try:
            self.update_status(task_id, TaskStatus.PROCESSING, progress=10)
            print(f"🔄 Task {task_id} started")
            
            # Create a background task to simulate progress updates
            async def update_progress():
                await asyncio.sleep(5)
                self.update_status(task_id, TaskStatus.PROCESSING, progress=30)
                await asyncio.sleep(10)
                self.update_status(task_id, TaskStatus.PROCESSING, progress=50)
                await asyncio.sleep(10)
                self.update_status(task_id, TaskStatus.PROCESSING, progress=70)
                await asyncio.sleep(10)
                self.update_status(task_id, TaskStatus.PROCESSING, progress=85)
            
            # Start progress updater
            progress_task = asyncio.create_task(update_progress())
            
            # Execute the actual function
            result = await func(*args, **kwargs)
            
            # Cancel progress updater if still running
            progress_task.cancel()
            
            # Mark as completed
            self.complete_task(task_id, result)
            print(f"✅ Task {task_id} completed successfully")
            
        except Exception as e:
            error_msg = str(e)
            self.fail_task(task_id, error_msg)
            print(f"❌ Task {task_id} failed: {error_msg}")
    
    async def cleanup_old_tasks(self):
        """Remove tasks older than cleanup_interval (background job)"""
        while True:
            try:
                now = datetime.utcnow()
                expired_tasks = [
                    task_id for task_id, task in self.tasks.items()
                    if (now - task["created_at"]).total_seconds() > self.cleanup_interval
                ]
                
                for task_id in expired_tasks:
                    del self.tasks[task_id]
                
                if expired_tasks:
                    print(f"🧹 Cleaned up {len(expired_tasks)} old tasks")
                    
            except Exception as e:
                print(f"Error in cleanup: {e}")
            
            # Run cleanup every 10 minutes
            await asyncio.sleep(600)


# Global task manager instance
task_manager = TaskManager()
