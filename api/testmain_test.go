package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwitthein/nousdeux-api/db"
)

// testPool is the shared connection pool for DB-backed tests. It is nil when
// TEST_DATABASE_URL is unset or unreachable, in which case requireDB skips.
//
// To run the DB-backed subset against the local docker compose Postgres:
//
//	TEST_DATABASE_URL="postgres://nousdeux:nousdeux@localhost:5432/nousdeux?sslmode=disable" \
//	  go test ./...
//
// With the var unset, `go test ./...` still passes: all DB tests skip and the
// pure unit tests (validators, requireAuth) run unconditionally.
//
// To stay clear of real data, the harness provisions a uniquely-named schema,
// runs the embedded migrations into it (via search_path), and drops it on
// teardown — so tests never touch the application's own tables.
var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	cleanup, err := setupTestDB(context.Background())
	if err != nil {
		// Provisioning failed: leave testPool nil so DB tests skip rather than
		// fail, and still run the pure unit tests.
		fmt.Fprintf(os.Stderr, "test DB unavailable, skipping DB-backed tests: %v\n", err)
	}

	code := m.Run()

	if cleanup != nil {
		cleanup()
	}
	os.Exit(code)
}

// setupTestDB provisions a disposable schema on TEST_DATABASE_URL, runs the
// embedded migrations into it, and sets testPool. It returns a cleanup func
// (drop schema + close pool) or nil when no database is configured/reachable.
func setupTestDB(ctx context.Context) (func(), error) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		return nil, nil
	}

	// Unique per run so a killed previous run cannot collide with this one.
	schema := fmt.Sprintf("nousdeux_test_%d", time.Now().UnixNano())

	// First connection on the default search_path to (re)create the schema.
	admin, err := db.Connect(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}
	if _, err := admin.Exec(ctx, `DROP SCHEMA IF EXISTS `+schema+` CASCADE`); err != nil {
		admin.Close()
		return nil, fmt.Errorf("drop stale schema: %w", err)
	}
	if _, err := admin.Exec(ctx, `CREATE SCHEMA `+schema); err != nil {
		admin.Close()
		return nil, fmt.Errorf("create schema: %w", err)
	}
	admin.Close()

	// Real test pool pinned to the disposable schema. public stays on the path
	// so shared extensions (pgcrypto's gen_random_uuid) still resolve.
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema + ",public"
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	if err := db.Migrate(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}

	testPool = pool
	return func() {
		dropCtx := context.Background()
		if _, err := pool.Exec(dropCtx, `DROP SCHEMA IF EXISTS `+schema+` CASCADE`); err != nil {
			fmt.Fprintf(os.Stderr, "teardown: drop schema %s: %v\n", schema, err)
		}
		pool.Close()
	}, nil
}

// requireDB skips the calling test when no test database is configured or
// reachable, and otherwise returns the shared pool.
func requireDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	if testPool == nil {
		t.Skip("no test database: set TEST_DATABASE_URL to run DB-backed tests")
	}
	return testPool
}

// newTestApp returns an App wired to the test pool with real SSE brokers and a
// fixed JWT secret, suitable for driving handlers end-to-end against the DB.
func newTestApp(t *testing.T) *App {
	t.Helper()
	app := newApp(requireDB(t), testSecret)
	return app
}

// decodeJSON decodes a recorder's body into dst.
func decodeJSON(rr *httptest.ResponseRecorder, dst any) error {
	return json.NewDecoder(rr.Body).Decode(dst)
}
