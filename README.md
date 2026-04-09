# BookNest

Full-stack book management platform built with NestJS, Next.js 15, Prisma, and SQLite. Features JWT authentication, role-based access control, book CRUD, feedback moderation system, Swagger API docs, Docker containerization, and CI/CD pipeline.

## Features

### Authentication & Authorization

- JWT-based authentication with Passport.js strategy
- Role-based access control (Admin & User roles)
- Protected routes on both frontend and backend
- Automatic 401 handling with token cleanup and redirect

### Book Management

- **Admin**: Full CRUD operations (Create, Read, Update, Delete)
- **All Users**: Browse books with pagination and filtering
- Search by title, author, or ISBN
- Detailed book information with publication dates
- Responsive card grid with gradient headers and rating badges

### Feedback System

- **Users**: Submit ratings (1-5 stars) and reviews per book (one review per user per book)
- **Admins**: Moderate feedback (approve/reject)
- View aggregated ratings and review counts
- Filter feedback by status (All, Pending, Approved)
- Ownership-based edit/delete permissions

### Admin Dashboard

- User management with search, role assignment, and deletion
- User statistics (total users, admins, regular users)
- Feedback moderation with approve/reject workflow
- User detail dialog with feedback history

## Tech Stack

### Backend

- **Framework**: NestJS 10 (TypeScript)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI with typed response entities
- **Testing**: Jest (unit + integration tests)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Material UI (MUI) 7 with custom design token system
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios with request/response interceptors

### DevOps

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (4-job pipeline)
- **Version Control**: Git

## Project Structure

```
booknest/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (User, Role, Book, Feedback)
│   │   ├── migrations/              # Database migrations
│   │   └── seed.ts                  # Seed data (20 books, 2 users, 2 roles)
│   ├── src/
│   │   ├── auth/                    # Authentication module
│   │   │   ├── dto/                 # LoginDto, SignupDto
│   │   │   ├── entities/            # LoginResponse, UserProfile, Role entities
│   │   │   ├── __tests__/           # Unit & integration tests
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts      # Passport JWT strategy with typed payload
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts       # Role-based access with ForbiddenException
│   │   │   ├── roles.decorator.ts
│   │   │   └── index.ts             # Barrel export for guards/decorators
│   │   ├── books/                   # Books module
│   │   │   ├── dto/                 # CreateBook, UpdateBook, QueryBook
│   │   │   ├── entities/            # BookEntity, BookWithFeedback
│   │   │   ├── __tests__/
│   │   │   ├── books.controller.ts
│   │   │   └── books.service.ts
│   │   ├── feedback/                # Feedback module
│   │   │   ├── dto/                 # CreateFeedback, UpdateFeedback, QueryFeedback
│   │   │   ├── entities/            # FeedbackEntity with relation summaries
│   │   │   ├── __tests__/
│   │   │   ├── feedback.controller.ts
│   │   │   └── feedback.service.ts
│   │   ├── users/                   # Users module
│   │   │   ├── dto/                 # UpdateUser, QueryUser, ChangeRole
│   │   │   ├── entities/            # UserEntity, UserStats
│   │   │   ├── __tests__/
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── common/                  # Shared infrastructure
│   │   │   ├── entities/            # PaginationMeta, MessageResponse
│   │   │   └── prisma/              # Global PrismaService with lifecycle hooks
│   │   ├── app.module.ts
│   │   └── main.ts                  # Bootstrap with JWT validation, CORS, Swagger
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── auth/login/          # Login page
│   │   │   ├── auth/signup/         # Signup page
│   │   │   ├── books/               # Book listing, detail, create, edit
│   │   │   ├── books/[id]/feedback/ # Submit review
│   │   │   ├── my-feedback/         # User's own reviews
│   │   │   ├── admin/users/         # User management (Admin)
│   │   │   ├── admin/feedback/      # Feedback moderation (Admin)
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── globals.css          # Base styles (Inter font, resets)
│   │   │   └── providers.tsx        # MUI theme + QueryClient + AuthProvider
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx   # Sidebar with active route highlighting
│   │   │   ├── PublicNavbar.tsx      # Shared nav for public pages
│   │   │   └── PublicFooter.tsx      # Shared footer for public pages
│   │   ├── hooks/
│   │   │   └── useAuth.tsx           # Auth context & hook
│   │   └── lib/
│   │       ├── api.ts                # Axios with JWT interceptors
│   │       └── auth.ts               # Auth API calls & localStorage helpers
│   ├── Dockerfile
│   └── package.json
│
├── .github/workflows/ci.yml         # CI pipeline (tests, build, Docker, lint)
├── docker-compose.yml                # Container orchestration
├── env.example                       # Environment variable template
└── package.json                      # Root orchestrator (concurrently)
```

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm**
- **Docker** & **Docker Compose** (for containerized setup)

### Option 1: Docker Setup (Recommended)

```bash
git clone <repository-url>
cd booknest
cp env.example .env
# Edit .env — set a real JWT_SECRET
docker compose up -d --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api

Stop containers:

```bash
docker compose down
```

### Option 2: Local Development

**Backend:**

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Backend available at http://localhost:3001

**Frontend (new terminal):**

```bash
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
npm run dev
```

Frontend available at http://localhost:3000

**Both at once (from root):**

```bash
npm install
npm run dev
```

## Testing

```bash
cd backend

# Run all tests (unit + integration)
npm run test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage
npm run test:cov
```

Tests are co-located with source code in `__tests__/` folders. Unit tests mock dependencies; integration tests use a real SQLite database.

## API Documentation

Swagger UI is available at http://localhost:3001/api when the backend is running.

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/signup | - | Register new user |
| POST | /auth/login | - | Login, get JWT |
| GET | /auth/profile | JWT | Get current user |
| GET | /books | - | List books (paginated) |
| GET | /books/:id | - | Get book details |
| POST | /books | Admin | Create book |
| PATCH | /books/:id | Admin | Update book |
| DELETE | /books/:id | Admin | Delete book |
| POST | /feedback | JWT | Submit review |
| GET | /feedback | Admin | List all feedback |
| GET | /feedback/book/:bookId | - | Get book reviews |
| GET | /feedback/my-feedback | JWT | Get own reviews |
| PATCH | /feedback/:id | JWT | Update review |
| DELETE | /feedback/:id | JWT | Delete review |
| PATCH | /feedback/:id/approve | Admin | Approve review |
| PATCH | /feedback/:id/reject | Admin | Reject review |
| GET | /users | Admin | List users |
| GET | /users/me | JWT | Get own profile |
| GET | /users/stats | Admin | Get user statistics |
| PATCH | /users/:id | Admin | Update user |
| PATCH | /users/:id/role | Admin | Change user role |
| DELETE | /users/:id | Admin | Delete user |

## Database Schema

| Model | Fields | Notes |
|-------|--------|-------|
| **User** | id, name, email, password (hashed), roleId | Unique email, cascading delete on feedback |
| **Role** | id, name, description | USER and ADMIN |
| **Book** | id, title, author, isbn, description, publishedAt | Unique ISBN |
| **Feedback** | id, rating (1-5), comment, userId, bookId, isApproved | Unique per user+book pair |

## Design Decisions

### Backend Architecture

- **Feature-module pattern**: Each domain (auth, books, feedback, users) is self-contained with consistent 5-layer structure (module, controller, service, DTOs, entities)
- **SOLID principles**: Single responsibility per layer, barrel exports for Open/Closed, `readonly` injected dependencies for Dependency Inversion
- **Typed Prisma queries**: `Prisma.BookWhereInput` etc. instead of `any` for compile-time safety
- **Response entities**: `@ApiProperty` decorated classes for typed Swagger schemas and explicit return types
- **Shared infrastructure**: `buildPaginationMeta()` utility and `MessageResponse` entity reused across all modules
- **Fail-fast startup**: JWT_SECRET validated at boot, `enableShutdownHooks()` for graceful container shutdown

### Frontend Architecture

- **MUI design token system**: Custom palette, typography, shadows, and 14 component overrides in a single `providers.tsx`
- **Layout separation**: `DashboardLayout` (sidebar + active route) for authenticated pages, `PublicNavbar`/`PublicFooter` for public pages
- **SSR-safe patterns**: `QueryClient` in `useState`, localStorage access guarded by client-side checks
- **Form validation**: Zod schemas with React Hook Form for type-safe validation

### CI/CD Pipeline

4 GitHub Actions jobs on push/PR to main and develop:
1. **Backend tests**: Install, generate Prisma, migrate, run Jest, build
2. **Frontend build**: Install, build Next.js, verify output
3. **Docker build**: Build both images with Buildx + GHA cache (no push)
4. **Lint check**: Prettier on backend, `tsc --noEmit` on frontend

## Default Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## License

This project is licensed under the MIT License.
