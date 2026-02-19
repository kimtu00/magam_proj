# ML 예측 시스템 배포 가이드

## 개요

이 문서는 마감 소진율 예측 ML 시스템을 실제 프로덕션 환경에 배포하는 방법을 설명합니다.

## 시스템 아키텍처

```
┌─────────────────┐
│  Next.js App    │
│  (Vercel)       │
└────────┬────────┘
         │
         │ HTTP POST /predict
         │
         ▼
┌─────────────────┐
│  Flask ML API   │
│  (ML Server)    │
└────────┬────────┘
         │
         │ Model Loading
         │
         ▼
┌─────────────────┐
│  .pkl Models    │
│  (File System)  │
└─────────────────┘
```

## 필수 사항

### 1. Python 환경 (ML 서버)

```bash
# Python 3.9 이상 필요
python --version

# 가상환경 생성
cd ml
python -m venv venv

# 활성화 (Mac/Linux)
source venv/bin/activate

# 활성화 (Windows)
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일 생성 (ml 폴더 내):

```bash
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
```

### 3. 데이터베이스 마이그레이션

```bash
# Next.js 프로젝트 루트에서
# Supabase 마이그레이션 적용
# 20260209020000_create_prediction_training.sql
# 20260209030000_create_collect_training_function.sql
# 20260209040000_create_prediction_logs.sql
```

## 배포 단계

### Step 1: 학습 데이터 수집

```bash
# 최초 1회: 기존 데이터 마이그레이션 (Admin API)
POST /api/admin/prediction/migrate

# 자동: 매일 새벽 2시 Vercel Cron
# GET /api/cron/collect-training
```

### Step 2: 모델 학습

```bash
cd ml

# 학습 데이터 1000건 이상 확보 후 실행
python train_model.py

# 결과 확인
# - ml/models/sell_through_model.pkl
# - ml/models/preprocessor.pkl
# - ml/models/model_metadata.json
# - ml/reports/*.png
```

### Step 3: Flask API 서버 배포

#### 옵션 A: 로컬 개발 서버

```bash
cd ml
python api_server.py

# 서버 실행됨: http://localhost:5001
```

#### 옵션 B: 프로덕션 배포 (Gunicorn + Nginx)

```bash
# Gunicorn 설치
pip install gunicorn

# Gunicorn 실행 (4 workers)
gunicorn -w 4 -b 0.0.0.0:5001 api_server:app

# 또는 systemd 서비스로 등록
sudo nano /etc/systemd/system/ml-api.service
```

**systemd 서비스 예시:**

```ini
[Unit]
Description=ML Prediction API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/myproj/ml
Environment="PATH=/home/ubuntu/myproj/ml/venv/bin"
ExecStart=/home/ubuntu/myproj/ml/venv/bin/gunicorn -w 4 -b 0.0.0.0:5001 api_server:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ml-api
sudo systemctl start ml-api
sudo systemctl status ml-api
```

#### 옵션 C: Docker 배포

```dockerfile
# ml/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "api_server:app"]
```

```bash
# 빌드
docker build -t ml-prediction-api .

# 실행
docker run -d -p 5001:5001 \
  -e DATABASE_URL="postgresql://..." \
  --name ml-api \
  ml-prediction-api
```

### Step 4: Next.js 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

```bash
ML_SERVICE_URL="http://your-ml-server-ip:5001"
# 또는 도메인
ML_SERVICE_URL="https://ml.yourdomain.com"
```

### Step 5: Nginx 리버스 프록시 (선택사항)

```nginx
# /etc/nginx/sites-available/ml-api
server {
    listen 80;
    server_name ml.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ml-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL 인증서 설정 (Let's Encrypt)
sudo certbot --nginx -d ml.yourdomain.com
```

## 모델 재학습 스케줄러

### 방법 1: Cron (ML 서버)

```bash
# crontab -e
0 3 * * 1 cd /home/ubuntu/myproj/ml && /home/ubuntu/myproj/ml/venv/bin/python train_model.py >> /var/log/ml-retrain.log 2>&1
```

### 방법 2: Vercel Cron (권장)

이미 설정됨:
- 매주 월요일 새벽 3시 `/api/cron/retrain-model` 호출
- 실제 재학습은 ML 서버에서 수동 실행 필요

## 모니터링

### 헬스 체크

```bash
# ML API 서버 상태 확인
curl http://localhost:5001/health

# 응답:
# {
#   "status": "ok",
#   "model_loaded": true,
#   "timestamp": "2024-01-15T10:00:00"
# }
```

### 로그 확인

```bash
# systemd 서비스 로그
sudo journalctl -u ml-api -f

# Docker 로그
docker logs -f ml-api

# Gunicorn 로그
tail -f /var/log/gunicorn/ml-api.log
```

## 성능 최적화

### 1. 모델 캐싱

Flask API는 서버 시작 시 모델을 메모리에 로드합니다. 재시작 없이는 모델이 업데이트되지 않습니다.

모델 업데이트 후:

```bash
sudo systemctl restart ml-api
# 또는
docker restart ml-api
```

### 2. 예측 응답 시간

- 목표: 200ms 이하
- 현재: 평균 50-150ms (모델 캐싱 시)
- 병목: DB 쿼리 (store features)

최적화 방안:
- Store features 캐싱 (Redis)
- 비동기 예측 (Celery + RabbitMQ)

### 3. 스케일링

**수평 스케일링:**

```bash
# 여러 워커 실행
gunicorn -w 8 -b 0.0.0.0:5001 api_server:app

# 또는 여러 인스턴스 + 로드밸런서
```

**로드밸런서 (Nginx):**

```nginx
upstream ml_api {
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    location / {
        proxy_pass http://ml_api;
    }
}
```

## 트러블슈팅

### 문제: 모델 로딩 실패

**증상:**
```
❌ Failed to load model: [Errno 2] No such file or directory: 'models/sell_through_model.pkl'
```

**해결:**
```bash
# 1. 모델 파일 확인
ls -la ml/models/

# 2. 모델 학습 실행
cd ml
python train_model.py

# 3. 서버 재시작
sudo systemctl restart ml-api
```

### 문제: DB 연결 실패

**증상:**
```
Error fetching store features: could not connect to server
```

**해결:**
```bash
# 1. DATABASE_URL 확인
echo $DATABASE_URL

# 2. 네트워크 연결 확인
psql $DATABASE_URL -c "SELECT 1;"

# 3. 방화벽 설정 확인 (Supabase는 5432 포트)
```

### 문제: Next.js에서 ML 서비스 연결 실패

**증상:**
```
ML prediction service is currently unavailable
```

**해결:**
```bash
# 1. ML_SERVICE_URL 확인
echo $ML_SERVICE_URL

# 2. ML API 서버 상태 확인
curl http://your-ml-server:5001/health

# 3. 방화벽/보안그룹 확인 (5001 포트 열림?)
```

## 보안 고려사항

1. **API 인증**
   - 현재: 인증 없음 (내부 네트워크 가정)
   - 프로덕션: API 키 또는 JWT 인증 추가 권장

2. **HTTPS**
   - Nginx + Let's Encrypt 사용

3. **방화벽**
   - ML API 서버는 Next.js 서버에서만 접근 가능하도록 설정

4. **환경 변수**
   - DATABASE_URL에 민감한 정보 포함
   - .env 파일 절대 커밋하지 말 것

## 참고 자료

- [Flask 배포 가이드](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [Gunicorn 문서](https://docs.gunicorn.org/)
- [Nginx 리버스 프록시](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Scikit-learn 모델 배포](https://scikit-learn.org/stable/model_persistence.html)
