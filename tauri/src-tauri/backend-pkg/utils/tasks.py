"""
Task tracking for active downloads and generations.
"""

from typing import Optional, Dict, List
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class DownloadTask:
    """Represents an active download task."""
    model_name: str
    status: str = "downloading"  # downloading, extracting, complete, error
    started_at: datetime = field(default_factory=datetime.utcnow)
    error: Optional[str] = None


@dataclass
class GenerationTask:
    """Represents an active generation task."""
    task_id: str
    profile_id: str
    text_preview: str  # First 50 chars of text
    text_length: int = 0  # Total text length
    started_at: datetime = field(default_factory=datetime.utcnow)
    phase: str = "preparing"  # preparing, generating, saving, complete
    estimated_duration_seconds: Optional[float] = None


class TaskManager:
    """Manages active downloads and generations."""
    
    def __init__(self):
        self._active_downloads: Dict[str, DownloadTask] = {}
        self._active_generations: Dict[str, GenerationTask] = {}
        self._generation_stats: Dict[str, float] = {}  # profile_id -> chars_per_second
    
    def start_download(self, model_name: str) -> None:
        """Mark a download as started."""
        self._active_downloads[model_name] = DownloadTask(
            model_name=model_name,
            status="downloading",
        )
    
    def complete_download(self, model_name: str) -> None:
        """Mark a download as complete."""
        if model_name in self._active_downloads:
            del self._active_downloads[model_name]
    
    def error_download(self, model_name: str, error: str) -> None:
        """Mark a download as failed."""
        if model_name in self._active_downloads:
            self._active_downloads[model_name].status = "error"
            self._active_downloads[model_name].error = error
    
    def start_generation(self, task_id: str, profile_id: str, text: str) -> None:
        """Mark a generation as started."""
        text_preview = text[:50] + "..." if len(text) > 50 else text
        
        # Simple heuristic for duration: ~0.08s per char for 1.7B model
        # This is a very rough estimate and should be tuned
        estimated_duration = len(text) * 0.08
        if estimated_duration < 2: estimated_duration = 2
        
        self._active_generations[task_id] = GenerationTask(
            task_id=task_id,
            profile_id=profile_id,
            text_preview=text_preview,
            text_length=len(text),
            phase="preparing",
            estimated_duration_seconds=estimated_duration
        )
        
    def update_generation_phase(self, task_id: str, phase: str) -> None:
        """Update phase of a generation task."""
        if task_id in self._active_generations:
            self._active_generations[task_id].phase = phase
    
    def complete_generation(self, task_id: str, actual_duration_seconds: Optional[float] = None) -> None:
        """Mark a generation as complete and record stats."""
        if task_id in self._active_generations:
            task = self._active_generations[task_id]
            
            # Update performance stats if we have timing data
            if actual_duration_seconds and actual_duration_seconds > 0:
                chars_per_second = task.text_length / actual_duration_seconds
                # Moving average: 70% new, 30% old
                old_rate = self._generation_stats.get(task.profile_id, 50)
                self._generation_stats[task.profile_id] = 0.7 * chars_per_second + 0.3 * old_rate
            
            del self._active_generations[task_id]
    
    def get_active_downloads(self) -> List[DownloadTask]:
        """Get all active downloads."""
        return list(self._active_downloads.values())
    
    def get_active_generations(self) -> List[GenerationTask]:
        """Get all active generations."""
        return list(self._active_generations.values())
    
    def is_download_active(self, model_name: str) -> bool:
        """Check if a download is active."""
        return model_name in self._active_downloads
    
    def is_generation_active(self, task_id: str) -> bool:
        """Check if a generation is active."""
        return task_id in self._active_generations


# Global task manager instance
_task_manager: Optional[TaskManager] = None


def get_task_manager() -> TaskManager:
    """Get or create the global task manager."""
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager
