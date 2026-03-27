FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM golang:1.26-alpine AS go-builder
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY internal ./internal
COPY main.go ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/refentra .

FROM alpine:3.22 AS runtime
WORKDIR /app

RUN addgroup -S refentra && adduser -S -G refentra refentra \
  && apk add --no-cache ca-certificates tzdata

COPY --from=go-builder /out/refentra /usr/local/bin/refentra

USER refentra

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/refentra"]
