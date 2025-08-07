CRUSH guide for HouseholdTodoApp

Build & run
- Start Metro: npm start
- Android debug: npm run android
- iOS debug: npm run ios (run bundle install && bundle exec pod install first if native deps change)

Lint, format, types
- Lint: npm run lint (eslint, config: .eslintrc.js extends @react-native)
- Format: Prettier (.prettierrc.js: singleQuote, trailingComma=all, arrowParens=avoid)
- Typecheck: npx tsc -p tsconfig.json (extends @react-native/typescript-config)

Tests (Jest, React Native preset)
- All tests: npm test
- Watch mode: npm test -- --watch
- Single file: npm test -- __tests__/App.test.tsx
- Pattern/name: npm test -- -t "renders correctly"
- Coverage: npm test -- --coverage

Imports & modules
- Use relative imports within src/, prefer absolute only if tsconfig paths added (none set)
- Group: external modules, absolute (if any), relative; newline between groups
- Use type-only imports (import type {Foo}) for types

Code style & naming
- TS everywhere; avoid any; prefer explicit types and React.FC avoided
- Components: PascalCase; files: PascalCase for components; hooks: useX; vars camelCase; constants UPPER_SNAKE
- Functions are pure where possible; keep files focused

React Native patterns
- Use React Navigation v7 APIs (installed)
- React Query for server state; AsyncStorage for local via src/services/offline
- Styles in src/styles/global.ts; avoid inline styles for shared tokens

Error handling & logging
- Wrap async/await with try/catch; no silent catches
- Surface user errors with react-native-toast-message; log dev errors with console.warn/error only

CI/local tips
- Node >=18 required (see package.json engines)
- Metro config: metro.config.js; Babel preset: @react-native/babel-preset

Copilot/Cursor rules
- No .cursor/rules or .github/copilot-instructions.md found; none to mirror
