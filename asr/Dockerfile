FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_ENDPOINT=https://hf-mirror.com

WORKDIR /app

# 国内 pip 镜像（阿里云），与主镜像的 apt 镜像策略一致
RUN pip install --no-cache-dir \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    fastapi "uvicorn[standard]" python-multipart faster-whisper

COPY main.py .

ENV ASR_MODEL_SIZE=base \
    OMP_NUM_THREADS=2

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
