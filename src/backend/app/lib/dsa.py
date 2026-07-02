import asyncio
import pickle

from sklearn.base import ClassifierMixin
from sklearn.preprocessing import StandardScaler
from collections import deque
from typing import Any

class EvictingAsyncQueue:
    """
    Asyncronous DSA that removes old queued packets
    """
    def __init__(self, maxsize: int):
        self.maxsize = maxsize
        self._queue: deque = deque(maxlen=maxsize)
        self._getter_futures: deque = deque()

    def put_nowait(self, item: Any) -> None:
        """synchronously drops an item into the queue. drops the oldest if full."""
        while self._getter_futures:
            future = self._getter_futures.popleft()
            if not future.done():
                future.set_result(item)
                return
        
        self._queue.append(item)

    async def get(self) -> Any:
        """asynchronously waits for and pops the oldest item in the queue."""
        if self._queue:
            return self._queue.popleft()

        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._getter_futures.append(future)
        return await future

    def task_done(self) -> None:
        """maintains structural compatibility with standard asyncio.Queue APIs."""
        pass


class ScalerLoader:
    """
    Loads scaler in-memory so that pickle class deserialization
    will only happen once
    """
    def __init__(self):
        self.loader: StandardScaler = None
        with open("../../experiment/scaler/scaler.pkl", "rb") as fp:
            self.loader: StandardScaler = pickle.load(fp)
            fp.close()

class ModelLoader:
    """
    Loads scaler in-memory so that pickle class deserialization
    will only happen once
    """
    def __init__(self, model_name: str = "voting_classifier.pkl"):
        self.path_template = "../../experiment/ml_models"
        self.model_name = model_name
        self.load_model()

    def load_model(self):
        with open(f"{self.path_template}/{self.model_name}", "rb") as fp:
            self.model: ClassifierMixin = pickle.load(fp)
            fp.close()

    def get_current_model(self) -> ClassifierMixin:
        return self.model

