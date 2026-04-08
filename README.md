# book-management-portal

Full-stack Book Management Portal built with Next.js, NestJS, Prisma, and SQLite. Features authentication, role-based access, book CRUD operations, feedback system, API docs, and testing.

## Features

### Authentication & Authorization

- JWT-based authentication with secure token storage
- Role-based access control (Admin & User roles)
- Protected routes on both frontend and backend
- Automatic token refresh handling

### Book Management

- **Admin**: Full CRUD operations (Create, Read, Update, Delete)
- **All Users**: Browse books with pagination and filtering
- Search by title, author, or ISBN
- Detailed book information with publication dates
- Responsive card-based UI with consistent sizing

### Feedback System

- **Users**: Submit ratings (1-5 stars) and reviews on books
- **Admins**: Moderate feedback (approve/reject)
- View aggregated ratings and review counts
- Filter feedback by status (All, Pending, Approved)

### Admin Dashboard

- Moderate user reviews
- Manage book collection
- View feedback statistics
- User-friendly interface with tabs and filters

## Tech Stack

### Backend

- **Framework**: NestJS (TypeScript)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit + integration tests)

### Frontend

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **UI Library**: Material UI (MUI)
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios with interceptors
- **Styling**: MUI's sx prop, responsive design

### DevOps

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Version Control**: Git

## Project Structure

```
book-management-portal/
├── backend/                      # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Database migrations
│   │   ├── seed.ts              # Database seeding
│   │   └── dev.db               # SQLite database (dev)
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── __tests__/       # Unit & integration tests
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── roles.guard.ts
│   │   ├── books/               # Books module
│   │   │   ├── dto/
│   │   │   ├── __tests__/
│   │   │   ├── books.controller.ts
│   │   │   └── books.service.ts
│   │   ├── feedback/            # Feedback module
│   │   │   ├── dto/
│   │   │   ├── __tests__/
│   │   │   ├── feedback.controller.ts
│   │   │   └── feedback.service.ts
│   │   ├── users/               # Users module
│   │   │   ├── dto/
│   │   │   ├── __tests__/
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── common/              # Shared utilities
│   │   │   └── prisma/          # Prisma service
│   │   ├── app.module.ts        # Root module
│   │   └── main.ts              # Application entry
│   ├── Dockerfile               # Backend container
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── auth/
│   │   │   │   ├── login/       # Login page
│   │   │   │   └── signup/      # Signup page
│   │   │   ├── books/
│   │   │   │   ├── page.tsx     # Books listing
│   │   │   │   ├── new/         # Add book (Admin)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Book details
│   │   │   │       ├── edit/             # Edit book (Admin)
│   │   │   │       └── feedback/         # Submit review
│   │   │   ├── admin/
│   │   │   │   └── feedback/    # Moderate reviews (Admin)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── globals.css
│   │   │   └── providers.tsx    # Theme & Auth providers
│   │   ├── components/
│   │   │   └── DashboardLayout.tsx  # Sidebar layout
│   │   ├── hooks/
│   │   │   └── useAuth.tsx      # Auth context & hook
│   │   └── lib/
│   │       ├── api.ts           # Axios instance
│   │       └── auth.ts          # Auth utilities
│   ├── Dockerfile               # Frontend container
│   ├── .dockerignore
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml           # Container orchestration
├── env.example                  # Environment template
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Docker** & **Docker Compose** (for containerized setup)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd book-management-portal
   ```

2. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

3. **Build and run containers**

   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api

5. **Stop containers**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp ../env.example .env
   ```

4. **Set up database**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Start development server**

   ```bash
   npm run start:dev
   ```

   Backend will be available at http://localhost:3001

#### Frontend Setup

1. **Open a new terminal and navigate to frontend**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env.local file
   echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   Frontend will be available at http://localhost:3000

## Testing

### Backend Tests

```bash
cd backend

# Run all tests (unit + integration)
npm run test
```

### Test Structure

- **Unit Tests**: Test services and controllers in isolation with mocked dependencies
- **Integration Tests**: Test component interactions with real database

Example test files:

- `src/auth/__tests__/auth.service.spec.ts` - Unit tests
- `src/auth/__tests__/auth.integration.spec.ts` - Integration tests

## 📖 API Documentation

The backend API is fully documented using Swagger/OpenAPI.

**Access Swagger UI**: http://localhost:3001/api

### Key Endpoints

#### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token

#### Books

- `GET /books` - List books (paginated)
- `GET /books/:id` - Get book details
- `POST /books` - Create book (Admin only)
- `PATCH /books/:id` - Update book (Admin only)
- `DELETE /books/:id` - Delete book (Admin only)

#### Feedback

- `GET /feedback` - List all feedback (Admin only)
- `GET /feedback/book/:bookId` - Get feedback for a book
- `POST /feedback` - Submit feedback (Authenticated)
- `PATCH /feedback/:id` - Update feedback approval (Admin only)
- `DELETE /feedback/:id` - Delete feedback (Admin only)

#### Users

- `GET /users/me` - Get current user profile
- `GET /users` - List users (Admin only)
- `PATCH /users/:id/role` - Update user role (Admin only)

## Database Schema

### Models

**User**

- id, name, email, password (hashed)
- roleId (foreign key to Role)
- createdAt, updatedAt

**Role**

- id, name (USER, ADMIN)

**Book**

- id, title, author, isbn, description
- publishedAt, createdAt, updatedAt

**Feedback**

- id, rating (1-5), comment
- userId, bookId (foreign keys)
- isApproved, createdAt, updatedAt

## Design Decisions

### Architecture

**Modular Design**: Backend follows NestJS module pattern for clear separation of concerns.

**JWT Authentication**: Stateless authentication with role-based guards for scalability.

**Repository Pattern**: Prisma ORM provides a clean data access layer.

**API-First**: RESTful API design with Swagger documentation for easy integration.

### Frontend

**App Router**: Next.js 13+ App Router for modern routing and layouts.

**Component Architecture**: Reusable components with consistent styling via MUI.

**Context API**: Simple global state management for authentication.

**Form Validation**: Zod schemas ensure type-safe form validation.

**Responsive Design**: Mobile-first approach with MUI breakpoints.

### Testing

**Co-located Tests**: Tests live next to the code they test for easy maintenance.

**Test Pyramid**: Focus on unit tests, with integration tests for critical flows.

**Real Database**: Integration tests use SQLite for realistic scenarios.

### DevOps

**Environment Variables**: Centralized configuration via .env files.

**Git Hygiene**: Clear commit messages with conventional format.

## Default Credentials

After seeding the database, you can login with:

**Admin User:**

- Email: admin@example.com
- Password: Admin123!

**Regular User:**

- Email: user@example.com
- Password: User123!

## Environment Variables

See `env.example` for all required environment variables:

### Backend (.env in backend/)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
```

### Frontend (.env.local in frontend/)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Deployment

### CI/CD Pipeline

The project includes a GitHub Actions CI/CD pipeline that:
- Automatically runs tests on pull requests and pushes
- Builds and validates both frontend and backend
- Ensures code quality with linting and type checking
- Provides automated deployment capabilities

### Docker Deployment

The application is containerized and ready for deployment

## License

This project is licensed under the MIT License.
