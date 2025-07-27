# Claude Development Guide for Pinco Backend

## Project Overview

This is the backend for the Pinco annotation widget system. It's built with:
- NestJS v11 with TypeScript strict mode
- TypeORM with MySQL
- JWT authentication via HTTP-only signed cookies
- Role-based access control (ADMIN, SITE_OWNER, COMMENTER)

## Key Conventions

### TypeScript
- **NEVER use `any` type** - all types must be explicit
- Strict mode is enabled: `strictNullChecks`, `noImplicitAny`
- Use ES2022 target

### Testing
- TDD approach required - write tests first
- Minimum 95% code coverage
- All endpoints must have e2e tests

### Code Style
- Use class-validator for all DTOs
- Use TypeORM migrations for all schema changes
- Follow NestJS module pattern - all related files in same module

## Common Commands

```bash
# Development
yarn start:dev              # Start with hot reload
yarn test                   # Run unit tests
yarn test:e2e              # Run e2e tests
yarn lint                  # Run linter
yarn build                 # Build for production

# Database
yarn migration:generate <name>  # Generate migration
yarn migration:run             # Run migrations
yarn migration:revert         # Revert last migration

# Production
yarn pm2:start            # Start with PM2
yarn pm2:logs            # View logs
```

## Architecture Patterns

### Authentication Flow
1. Login endpoints: `/auth/login` (password) and `/auth/login?secret=XXX` (token)
2. JWT stored in HTTP-only signed cookie named `auth-token`
3. Guards: `CookieAuthGuard` (authentication), `OriginGuard` (site validation), `RolesGuard` (authorization)

### Multi-tenancy
- Sites are isolated by domain
- Users can belong to multiple sites with different roles
- Origin header determines current site context

### Event-Driven Notifications
- Domain events: `comment.created`, `reply.created`, `user.invited`
- Email notifications for @mentions and invites
- Uses EventEmitter2 for async event handling

## Common Issues

### TypeORM Migration Generation
If you see "Data type 'Object' is not supported", add explicit `type: 'varchar'` to nullable string columns.

### Cookie Authentication in Tests
Use `cookie-signature` to properly sign cookies:
```typescript
const signedToken = cookieSignature.sign(token, 'test-secret');
.set('Cookie', [`auth-token=s:${signedToken}`])
```

### Module Dependencies
Each module using guards needs access to required repositories:
- `OriginGuard` needs `Site` repository
- Add to module imports: `TypeOrmModule.forFeature([..., Site])`

## Important Files

- `instruction.md` - AI-optimized implementation plan with milestones
- `backend.md` - Detailed API specifications and entity definitions
- `.env.example` - All available configuration options

## Frontend Contract

The backend must return responses matching the exact structure expected by the frontend. See `backend.md` for detailed response formats, especially for:
- Comment responses with nested replies
- User responses with formatted roles
- Site responses with user counts

## Security Notes

- Passwords hashed with Argon2
- Secret tokens expire after 7 days
- CORS configured per-site from database
- Rate limiting on login endpoints
- All inputs validated with class-validator

## Performance Considerations

- Use query builder with joins for complex queries
- Avoid N+1 queries with proper relations
- Screenshots stored locally by default (pluggable strategy)
- PM2 cluster mode for production scaling