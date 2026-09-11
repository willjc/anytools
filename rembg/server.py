"""图片去背景服务：rembg + u2netp 轻量模型（模型已烤入镜像，无需联网下载）。"""

import io

from fastapi import FastAPI, UploadFile
from fastapi.responses import Response
from PIL import Image

from rembg import remove, new_session

app = FastAPI()
session = new_session("u2netp")


def _self_check() -> None:
    """启动自检：跑一次真实推理，让链路故障表现为容器起不来。

    健康检查只探 /health，不碰推理链路；模型加载或推理一旦有问题，部署会
    显示绿灯而 /remove 持续 502。这里把问题提前暴露成启动失败。
    """
    probe = Image.new("RGB", (64, 64), (255, 255, 255))
    cutout = remove(probe, session=session)
    if cutout.mode != "RGBA":
        raise RuntimeError(f"self-check returned {cutout.mode}, expected RGBA")


_self_check()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "u2netp"}


@app.post("/remove")
async def remove_background(file: UploadFile) -> Response:
    data = await file.read()

    # rembg 只接受 bytes / PIL.Image / ndarray，传 BytesIO 会直接抛 ValueError。
    # 交给它 PIL.Image 就能原样拿回 PIL.Image，省掉一次编解码往返。
    image = Image.open(io.BytesIO(data)).convert("RGBA")
    cutout = remove(image, session=session)

    # 统一裁掉可能的透明边（rembg 有时会保留大量空白边缘）
    bbox = cutout.getchannel("A").getbbox()
    if bbox:
        cutout = cutout.crop(bbox)
    output = io.BytesIO()
    cutout.save(output, format="PNG")
    return Response(content=output.getvalue(), media_type="image/png")
