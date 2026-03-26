package auth

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrRefreshSessionNotFound = errors.New("refresh session not found")

type RefreshSession struct {
	UserID      string    `json:"user_id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	ExpiresAt   time.Time `json:"expires_at"`
	RotatedFrom string    `json:"rotated_from,omitempty"`
	UserAgent   string    `json:"user_agent,omitempty"`
}

type SessionStore interface {
	SaveRefreshSession(ctx context.Context, token string, session RefreshSession, ttl time.Duration) error
	LoadRefreshSession(ctx context.Context, token string) (RefreshSession, error)
	DeleteRefreshSession(ctx context.Context, token string) error
}

type RedisSessionStore struct {
	client *redis.Client
}

func NewRedisSessionStore(client *redis.Client) *RedisSessionStore {
	return &RedisSessionStore{client: client}
}

func (s *RedisSessionStore) SaveRefreshSession(ctx context.Context, token string, session RefreshSession, ttl time.Duration) error {
	encoded, err := json.Marshal(session)
	if err != nil {
		return err
	}

	return s.client.Set(ctx, token, encoded, ttl).Err()
}

func (s *RedisSessionStore) LoadRefreshSession(ctx context.Context, token string) (RefreshSession, error) {
	value, err := s.client.Get(ctx, token).Result()
	if errors.Is(err, redis.Nil) {
		return RefreshSession{}, ErrRefreshSessionNotFound
	}
	if err != nil {
		return RefreshSession{}, err
	}

	var session RefreshSession
	if err := json.Unmarshal([]byte(value), &session); err != nil {
		return RefreshSession{}, err
	}

	return session, nil
}

func (s *RedisSessionStore) DeleteRefreshSession(ctx context.Context, token string) error {
	err := s.client.Del(ctx, token).Err()
	if errors.Is(err, redis.Nil) {
		return nil
	}

	return err
}

type MemorySessionStore struct {
	mu       sync.Mutex
	sessions map[string]RefreshSession
}

func NewMemorySessionStore() *MemorySessionStore {
	return &MemorySessionStore{
		sessions: map[string]RefreshSession{},
	}
}

func (s *MemorySessionStore) SaveRefreshSession(_ context.Context, token string, session RefreshSession, _ time.Duration) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.sessions[token] = session
	return nil
}

func (s *MemorySessionStore) LoadRefreshSession(_ context.Context, token string) (RefreshSession, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[token]
	if !ok {
		return RefreshSession{}, ErrRefreshSessionNotFound
	}

	return session, nil
}

func (s *MemorySessionStore) DeleteRefreshSession(_ context.Context, token string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.sessions, token)
	return nil
}
