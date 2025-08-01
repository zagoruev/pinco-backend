# Pinco Backend

Annotation widget backend built with NestJS, TypeORM, and MySQL.

## Features

- 🔐 JWT authentication with HTTP-only cookies
- 👥 Multi-tenant architecture with role-based access control
- 💬 Real-time comments and replies with @mention notifications
- 📸 Screenshot support with pluggable storage strategies
- 📧 Email notifications via SMTP
- 🔄 RESTful API following OpenAPI specification
- 🚀 Production-ready with PM2 and Docker support

## Prerequisites

- Node.js 18.x or 20.x
- MySQL 5.7+ or 8.0+
- Yarn package manager

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

2. Install dependencies

```bash
yarn install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations

```bash
yarn migration:run
```

## Development

```bash
# Start development server with hot-reload
yarn start:dev

# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Run linter
yarn lint
```

## Production

### Build

```bash
# Build for production
yarn build

# Or use the build script
./scripts/build.sh
```

## API Documentation

Once the application is running, visit `/docs` to view the Swagger API documentation.

## Project Structure

```
src/
├── common/           # Shared guards, decorators, filters
├── config/           # Configuration files
├── health/           # Health check module
├── migrations/       # TypeORM migrations
└── modules/          # Feature modules
    ├── auth/         # Authentication
    ├── comment/      # Comments and views
    ├── notification/ # Email notifications
    ├── reply/        # Comment replies
    ├── screenshot/   # Screenshot handling
    ├── site/         # Site management
    ├── user/         # User management
    └── widget/       # Widget generation
```

## License

Proprietary
