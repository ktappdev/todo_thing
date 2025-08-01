# CRUSH.md

Repo: Go (Gin + GORM) backend for household todos. No tests found yet. SQLite DB file: household_todo.db.

Build/run
- Build: go build ./...
- Run: go run ./...
- Tidy deps: go mod tidy
- Vendoring (if needed): go mod vendor

Lint/format/typecheck
- Format: go fmt ./...
- Vet (static checks): go vet ./...
- Lint (if golangci-lint present): golangci-lint run ./...

Testing
- All tests: go test ./...
- Single package: go test ./path/to/pkg
- Single test: go test -run ^TestName$ ./path/to/pkg

Project structure
- main.go wires routes and CORS, controllers hold handlers, models define GORM models with UUIDs, config/database.go opens SQLite, utils has helpers.

Code style
- Imports: stdlib, then external, then internal (household-todo-backend/...), grouped and gofmt-sorted.
- Formatting: enforce gofmt/goimports; one statement per line; no comments with secrets.
- Types: use explicit types; prefer string UUIDs; time pointers for optional fields; enums via custom string type (TaskCategory).
- Naming: Exported types/methods use PascalCase; private helpers camelCase; JSON tags use lowerCamelCase.
- Errors: return JSON {"error": msg} with appropriate HTTP status; never leak internals; log.Fatal only at startup; use Save/Create error checks.
- DB: use GORM with explicit foreign keys and Preload for relations; always check errors; use transactions for multi-step writes if consistency matters.
- HTTP: validate input via ShouldBindJSON with binding tags; use PATCH/PUT per semantics; keep handlers small, delegate to helpers where needed.

AI assistant notes
- Include .crush dir in .gitignore; avoid committing DB files; run fmt/vet before PRs.
