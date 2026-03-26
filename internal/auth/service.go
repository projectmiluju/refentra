package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserIDKey    = "auth_user_id"
	ContextUserEmailKey = "auth_user_email"
	ContextUserNameKey  = "auth_user_name"
)

var (
	ErrAuthenticationRequired = errors.New("authentication required")
	ErrInvalidCredentials     = errors.New("invalid credentials")
	ErrSessionExpired         = errors.New("session expired")
)

type MockUser struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Config struct {
	JWTSecret         string
	AccessTTL         time.Duration
	RefreshTTL        time.Duration
	AccessCookieName  string
	RefreshCookieName string
	CookieSecure      bool
	CookieSameSite    http.SameSite
	MockEmail         string
	MockPassword      string
}

type AccessTokenClaims struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type Service struct {
	sessionStore  SessionStore
	jwtSecret     []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
	mockUser      MockUser
	mockPassword  string
	cookieSecure  bool
	sameSite      http.SameSite
	accessCookie  string
	refreshCookie string
}

func NewService(sessionStore SessionStore, config Config) *Service {
	return &Service{
		sessionStore: sessionStore,
		jwtSecret:    []byte(config.JWTSecret),
		accessTTL:    config.AccessTTL,
		refreshTTL:   config.RefreshTTL,
		mockUser: MockUser{
			ID:    "user-1234",
			Name:  "김개발",
			Email: config.MockEmail,
		},
		mockPassword:  config.MockPassword,
		cookieSecure:  config.CookieSecure,
		sameSite:      config.CookieSameSite,
		accessCookie:  config.AccessCookieName,
		refreshCookie: config.RefreshCookieName,
	}
}

func (s *Service) Login(ctx context.Context, email string, password string, userAgent string) (MockUser, TokenPair, error) {
	if email != s.mockUser.Email || password != s.mockPassword {
		return MockUser{}, TokenPair{}, ErrInvalidCredentials
	}

	return s.issueSession(ctx, s.mockUser, "", userAgent)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string, userAgent string) (MockUser, TokenPair, error) {
	if refreshToken == "" {
		return MockUser{}, TokenPair{}, ErrAuthenticationRequired
	}

	session, err := s.sessionStore.LoadRefreshSession(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, ErrRefreshSessionNotFound) {
			return MockUser{}, TokenPair{}, ErrSessionExpired
		}

		return MockUser{}, TokenPair{}, err
	}

	if session.ExpiresAt.Before(time.Now()) {
		_ = s.sessionStore.DeleteRefreshSession(ctx, refreshToken)
		return MockUser{}, TokenPair{}, ErrSessionExpired
	}

	if err := s.sessionStore.DeleteRefreshSession(ctx, refreshToken); err != nil {
		return MockUser{}, TokenPair{}, err
	}

	user := MockUser{
		ID:    session.UserID,
		Name:  session.Name,
		Email: session.Email,
	}

	return s.issueSession(ctx, user, refreshToken, userAgent)
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}

	return s.sessionStore.DeleteRefreshSession(ctx, refreshToken)
}

func (s *Service) Authenticate(accessToken string) (MockUser, error) {
	if accessToken == "" {
		return MockUser{}, ErrAuthenticationRequired
	}

	claims := &AccessTokenClaims{}
	parsed, err := jwt.ParseWithClaims(accessToken, claims, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})
	if err != nil || !parsed.Valid {
		return MockUser{}, ErrAuthenticationRequired
	}

	return MockUser{
		ID:    claims.Subject,
		Name:  claims.Name,
		Email: claims.Email,
	}, nil
}

func (s *Service) SetAuthCookies(w http.ResponseWriter, pair TokenPair) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.accessCookie,
		Value:    pair.AccessToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: s.sameSite,
		Secure:   s.cookieSecure,
		MaxAge:   int(s.accessTTL.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     s.refreshCookie,
		Value:    pair.RefreshToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: s.sameSite,
		Secure:   s.cookieSecure,
		MaxAge:   int(s.refreshTTL.Seconds()),
	})
}

func (s *Service) ClearAuthCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.accessCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: s.sameSite,
		Secure:   s.cookieSecure,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     s.refreshCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: s.sameSite,
		Secure:   s.cookieSecure,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func (s *Service) AccessCookieName() string {
	return s.accessCookie
}

func (s *Service) RefreshCookieName() string {
	return s.refreshCookie
}

func (s *Service) issueSession(ctx context.Context, user MockUser, rotatedFrom string, userAgent string) (MockUser, TokenPair, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return MockUser{}, TokenPair{}, err
	}

	refreshToken, err := generateOpaqueToken()
	if err != nil {
		return MockUser{}, TokenPair{}, err
	}

	refreshSession := RefreshSession{
		UserID:      user.ID,
		Email:       user.Email,
		Name:        user.Name,
		ExpiresAt:   time.Now().Add(s.refreshTTL),
		RotatedFrom: rotatedFrom,
		UserAgent:   userAgent,
	}
	if err := s.sessionStore.SaveRefreshSession(ctx, refreshToken, refreshSession, s.refreshTTL); err != nil {
		return MockUser{}, TokenPair{}, err
	}

	return user, TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) generateAccessToken(user MockUser) (string, error) {
	claims := AccessTokenClaims{
		Email: user.Email,
		Name:  user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessTTL)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func generateOpaqueToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return hex.EncodeToString(buffer), nil
}
