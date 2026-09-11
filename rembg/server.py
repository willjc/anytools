"""图片去背景服务：rembg + u2netp 轻量模型（模型已烤入镜像，无需联网下载）。"""

import io

from fastapi import FastAPI, UploadFile
from fastapi.responses import Response
from PIL import Image

from rembg import remove, new_session

app = FastAPI()
session = new_session("u2netp")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "u2netp"}


@app.post("/remove")
async def remove_background(file: UploadFile) -> Response:
    data = await file.read()
    result = remove(io.BytesIO(data), session=session)

    # 统一裁掉可能的透明边（rembg 有时会保留大量空白边缘）
    image = Image.open(io.BytesIO(result))
    bbox = image.getchannel("A").getbbox()
    if bbox:
        image = image.crop(bbox)
    output = io.BytesIO()
    image.save(output, format="PNG")
    return Response(content=output.getvalue(), media_type="image/png")
