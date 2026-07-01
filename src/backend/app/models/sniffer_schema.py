from pydantic import BaseModel, Field


class FilterUpdateRequest(BaseModel):
    filter: str = Field(..., description="BPF filter string to apply, e.g. 'tcp and port 80'")
