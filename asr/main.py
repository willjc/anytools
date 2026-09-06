"""轻量语音识别服务：faster-whisper（CPU int8），供主应用转写儿童语音。

- 模型在启动时从 HF 镜像（国内可达）下载并常驻内存
- 音频通过 multipart 上传，支持 webm / mp4 / m4a / wav / ogg 等
- 中文短句场景：开启 VAD 过滤静音，禁用跨段上下文
"""

import os
import tempfile

from fastapi import FastAPI, UploadFile

from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("ASR_MODEL_SIZE", "base")
MODEL_DIR = os.environ.get("ASR_MODEL_DIR", "/models")

app = FastAPI()
model: WhisperModel | None = None


@app.on_event("startup")
def load_model() -> None:
    global model
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8", download_root=MODEL_DIR)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "ready": model is not None, "model": MODEL_SIZE}


@app.post("/transcribe")
async def transcribe(file: UploadFile) -> dict:
    if model is None:
        return {"text": "", "error": "模型尚未就绪"}

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        path = tmp.name

    try:
        segments, _info = model.transcribe(
            path,
            language="zh",
            vad_filter=True,
            condition_on_previous_text=False,
        )
        text = "".join(segment.text for segment in segments).strip()
        return {"text": text}
    finally:
        if os.path.exists(path):
            os.unlink(path)
