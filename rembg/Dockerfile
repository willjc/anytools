FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    U2NET_HOME=/app

WORKDIR /app

# 国内 pip 镜像（阿里云），与主镜像策略一致；模型 u2netp.onnx 已随仓库提供
RUN pip install --no-cache-dir \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    fastapi "uvicorn[standard]" python-multipart rembg onnxruntime pillow

# rembg 按 <U2NET_HOME>/models/<model>/<file>.onnx 查找模型（见 rembg/sessions/
# base.py 的 model_dir 与 resolve_existing）。模型必须预置在这个路径下，否则
# rembg 判定模型缺失、转去下载，第一步 makedirs 就撞上只读文件系统而崩溃重启。
COPY u2netp.onnx /app/models/u2netp/u2netp.onnx
COPY server.py .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
