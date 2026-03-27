# Refentra Tier 2 배포 설계

## 목표
- 단일 VPS에서 `Caddy + refentra-app + PostgreSQL + Redis`를 운영합니다.
- 앱은 GHCR 이미지를 사용하고, 배포는 GitHub Actions 태그 푸시 기반으로 진행합니다.
- DB와 Redis는 외부에 노출하지 않고 Docker 내부 네트워크에서만 접근합니다.

## 권장 인프라
- 호스팅: Hetzner Cloud Ubuntu VPS 1대
- 리버스 프록시: Caddy
- 앱 런타임: Docker Compose
- 데이터:
  - PostgreSQL 16
  - Redis 7

## 서버 구성
- 공개 포트: `80`, `443`
- 비공개 포트:
  - PostgreSQL `5432`
  - Redis `6379`
- 내부 Docker 네트워크:
  - `edge`: Caddy 외부 노출
  - `internal`: app/postgres/redis 통신 전용

## 배포 자산
- [Dockerfile](/Users/wonyong/Desktop/myproject/refentra/Dockerfile)
- [docker-compose.prod.yml](/Users/wonyong/Desktop/myproject/refentra/docker-compose.prod.yml)
- [Caddyfile](/Users/wonyong/Desktop/myproject/refentra/Caddyfile)
- [.env.production.example](/Users/wonyong/Desktop/myproject/refentra/.env.production.example)
- [ci.yml](/Users/wonyong/Desktop/myproject/refentra/.github/workflows/ci.yml)
- [deploy.yml](/Users/wonyong/Desktop/myproject/refentra/.github/workflows/deploy.yml)

## 서버 1회 초기 준비
```bash
sudo mkdir -p /opt/refentra
sudo chown -R "$USER":"$USER" /opt/refentra
cd /opt/refentra
cp /path/to/.env.production.example .env.production
```

서버에 Docker와 Compose 플러그인을 먼저 설치해야 합니다.

## GitHub Secrets
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `REFENTRA_ENV_PRODUCTION`
- `APP_DOMAIN`

`REFENTRA_ENV_PRODUCTION`에는 `.env.production` 전체 내용을 넣습니다.

## 배포 흐름
1. `v*` 태그 푸시
2. GitHub Actions가 GHCR에 앱 이미지를 빌드/푸시
3. 배포 워크플로우가 `docker-compose.prod.yml`, `Caddyfile`를 서버 `/opt/refentra`로 업로드
4. 서버에서 `.env.production`을 갱신하고 `docker compose up -d`
5. `https://<domain>/api/v1/health` 헬스체크 확인

## 롤백
이전 태그로 이미지를 다시 지정해 배포합니다.

```bash
cd /opt/refentra
APP_IMAGE_TAG=v0.6.0 docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## 보안 메모
- `AUTH_COOKIE_SECURE=true`를 유지합니다.
- `AUTH_JWT_SECRET`, `DB_PASSWORD`, `REDIS_PASSWORD`는 강한 값으로 교체해야 합니다.
- 현재 애플리케이션 CORS는 코드에서 기본 허용 설정을 사용합니다. 프로덕션 오리진 제한은 다음 `build` 사이클에서 별도로 하드닝해야 합니다.
- Redis는 `requirepass`를 사용하므로 비밀번호 없이 운영하지 않습니다.

## 운영 리스크
- 단일 VPS 구성이므로 서버 장애 시 앱/DB/Redis가 함께 내려갑니다.
- 현재는 Sentry, UptimeRobot, 배포 알림이 붙지 않았습니다.
- 백업 정책은 아직 없습니다. PostgreSQL/Redis 볼륨 백업은 다음 `ops` 범위입니다.
