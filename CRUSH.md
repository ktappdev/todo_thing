CRUSH guide for this monorepo (React Native app + Go backend)

Frontend (HouseholdTodoApp)
- Start Metro: npm start (react-native start)
- Android debug: npm run android; iOS debug: npm run ios (run CocoaPods when native deps change)
- Lint: npm run lint (eslint, config: .eslintrc.js extends @react-native)
- Format: npx prettier --write . (Prettier config: .prettierrc.js singleQuote, trailingComma: all, arrowParens: avoid)
- Typecheck: npx tsc -p tsconfig.json (@react-native/typescript-config)
- Tests (Jest): all: npm test; watch: npm test -- --watch; single file: npm test -- __tests__/App.test.tsx; by name: npm test -- -t "name"; coverage: npm test -- --coverage
- Build web preview: n/a; use Expo/CLI for native builds as configured

Backend (backend/ – Go Gin + GORM + SQLite)
- Build: go build ./...; Run: go run ./...; Deps: go mod tidy; optional vendor: go mod vendor
- Lint/format: go fmt ./...; Static: go vet ./...; If available: golangci-lint run ./...
- Tests: all: go test ./...; package: go test ./path; single test: go test -run ^TestName$ ./path

Code style (TS/React Native)
- Imports: group std/external, then absolute (none configured), then relative; newline between groups; use import type {T} for types
- Types: avoid any; prefer explicit props/state; no React.FC; narrow axios responses to typed DTOs in src/types
- Naming: components PascalCase; hooks useX; variables camelCase; constants UPPER_SNAKE; files for components PascalCase.tsx
- Formatting: Prettier required; keep functions small; avoid inline styles for shared tokens (see src/styles/global.ts)
- Error handling: wrap async with try/catch; surface user-safe messages (Toast), log dev-only with console.warn/error; never log secrets

Code style (Go)
- Imports grouped: std, third-party, internal; gofmt/goimports ordering
- Naming: exported PascalCase, unexported camelCase; JSON tags lowerCamelCase
- Errors: return JSON {"error": msg} with appropriate status; log.Fatal only at startup; check DB ops; use transactions for multi-step writes

AI helpers and rules
- No Cursor/Copilot rules found (.cursor/rules, .cursorrules, .github/copilot-instructions.md)
- Add .crush to .gitignore; do not commit secrets, DB files, or build artifacts
