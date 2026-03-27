package server

import "testing"

func TestParseCSV(t *testing.T) {
	t.Parallel()

	got := ParseCSV(" http://localhost:5173, https://refentra.example.com ,, http://127.0.0.1:8080 ")
	want := []string{
		"http://localhost:5173",
		"https://refentra.example.com",
		"http://127.0.0.1:8080",
	}

	if len(got) != len(want) {
		t.Fatalf("expected %d items, got %d", len(want), len(got))
	}

	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("expected %q at index %d, got %q", want[i], i, got[i])
		}
	}
}

func TestDefaultSecurityConfigProvidesRestrictedDefaults(t *testing.T) {
	t.Parallel()

	config := DefaultSecurityConfig()
	if len(config.CORSAllowOrigins) == 0 {
		t.Fatal("expected default CORS origins to be configured")
	}

	if !config.CORSAllowCredentials {
		t.Fatal("expected CORS credentials to be enabled by default")
	}

	if config.RateLimitRequests <= 0 {
		t.Fatal("expected positive rate limit")
	}

	if config.ContentSecurityPolicy == "" {
		t.Fatal("expected content security policy to be set")
	}
}
