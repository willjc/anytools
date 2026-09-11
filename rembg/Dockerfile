FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    U2NET_HOME=/app

WORKDIR /app

# 国内 pip 镜像（阿里云），与主镜像策略一致；模型 u2netp.onnx 已随仓库提供
RUN pip install --no-cache-dir \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    fastapi "uvicorn[standard]" python-multipart rembg onnxruntime pillow

COPY u2netp.onnx /app/.u2net/u2netp.onnx
COPY server.py .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
