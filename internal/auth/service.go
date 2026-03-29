package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	ContextUserIDKey    = "auth_user_id"
	ContextUserEmailKey = "auth_user_email"
	ContextUserNameKey  = "auth_user_name"
	MinimumPasswordLen  = 8
)

var (
	ErrAuthenticationRequired = errors.New("authentication required")
	ErrInvalidCredentials     = errors.New("invalid credentials")
	ErrSessionExpired         = errors.New("session expired")
	ErrDuplicateEmail         = errors.New("duplicate email")
)

type User struct {
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

type UserStore interface {
	CreateUser(ctx context.Context, input CreateUserInput) (User, error)
	FindUserByEmail(ctx context.Context, email string) (StoredUser, error)
}

type CreateUserInput struct {
	Name         string
	Email        string
	PasswordHash string
}

type StoredUser struct {
	User
	PasswordHash string
}

type Service struct {
	sessionStore  SessionStore
	userStore     UserStore
	jwtSecret     []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
	cookieSecure  bool
	sameSite      http.SameSite
	accessCookie  string
	refreshCookie string
}

func NewService(sessionStore SessionStore, userStore UserStore, config Config) *Service {
	return &Service{
		sessionStore:  sessionStore,
		userStore:     userStore,
		jwtSecret:     []byte(config.JWTSecret),
		accessTTL:     config.AccessTTL,
		refreshTTL:    config.RefreshTTL,
		cookieSecure:  config.CookieSecure,
		sameSite:      config.CookieSameSite,
		accessCookie:  config.AccessCookieName,
		refreshCookie: config.RefreshCookieName,
	}
}

func (s *Service) Signup(ctx context.Context, name string, email string, password string, userAgent string) (User, TokenPair, error) {
	passwordHash, err := HashPassword(password)
	if err != nil {
		return User{}, TokenPair{}, err
	}

	user, err := s.userStore.CreateUser(ctx, CreateUserInput{
		Name:         name,
		Email:        email,
		PasswordHash: passwordHash,
	})
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			return User{}, TokenPair{}, ErrDuplicateEmail
		}

		return User{}, TokenPair{}, err
	}

	return s.issueSession(ctx, user, "", userAgent)
}

func (s *Service) Login(ctx context.Context, email string, password string, userAgent string) (User, TokenPair, error) {
	storedUser, err := s.userStore.FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return User{}, TokenPair{}, ErrInvalidCredentials
		}

		return User{}, TokenPair{}, err
	}

	if err := ComparePassword(storedUser.PasswordHash, password); err != nil {
		return User{}, TokenPair{}, ErrInvalidCredentials
	}

	return s.issueSession(ctx, storedUser.User, "", userAgent)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string, userAgent string) (User, TokenPair, error) {
	if refreshToken == "" {
		return User{}, TokenPair{}, ErrAuthenticationRequired
	}

	session, err := s.sessionStore.LoadRefreshSession(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, ErrRefreshSessionNotFound) {
			return User{}, TokenPair{}, ErrSessionExpired
		}

		return User{}, TokenPair{}, err
	}

	if session.ExpiresAt.Before(time.Now()) {
		_ = s.sessionStore.DeleteRefreshSession(ctx, refreshToken)
		return User{}, TokenPair{}, ErrSessionExpired
	}

	if err := s.sessionStore.DeleteRefreshSession(ctx, refreshToken); err != nil {
		return User{}, TokenPair{}, err
	}

	user := User{
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

func (s *Service) Authenticate(accessToken string) (User, error) {
	if accessToken == "" {
		return User{}, ErrAuthenticationRequired
	}

	claims := &AccessTokenClaims{}
	parsed, err := jwt.ParseWithClaims(accessToken, claims, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})
	if err != nil || !parsed.Valid {
		return User{}, ErrAuthenticationRequired
	}

	return User{
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

func (s *Service) issueSession(ctx context.Context, user User, rotatedFrom string, userAgent string) (User, TokenPair, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return User{}, TokenPair{}, err
	}

	refreshToken, err := generateOpaqueToken()
	if err != nil {
		return User{}, TokenPair{}, err
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
		return User{}, TokenPair{}, err
	}

	return user, TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *Service) generateAccessToken(user User) (string, error) {
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

func HashPassword(password string) (string, error) {
	encoded, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(encoded), nil
}

func ComparePassword(encodedPassword string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(encodedPassword), []byte(password))
}

func generateOpaqueToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return hex.EncodeToString(buffer), nil
}
