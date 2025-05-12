# Robotics Competition Management System

A comprehensive backend system for managing robotics competitions, including team management, match scheduling, scoring, and real-time updates.

## Features

- User authentication and role-based access control
- Team management
- Event creation and management
- Match scheduling and control
- Real-time scoring and updates
- Robot inspection tracking
- Penalty management
- Real-time notifications via WebSockets

## Tech Stack

- Node.js with Express
- TypeScript
- PostgreSQL with Prisma ORM
- JWT for authentication
- Socket.io for real-time updates

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/robotics-competition-management-be.git
   cd robotics-competition-management-be
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   DATABASE_URL="postgresql://postgres:password@localhost:5432/robotics_competition_db"
   ```

4. Set up the database:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:id` - Update a team
- `DELETE /api/teams/:id` - Delete a team

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event
- `POST /api/events/:id/teams` - Add teams to an event
- `DELETE /api/events/:id/teams` - Remove teams from an event

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match by ID
- `POST /api/matches` - Create a new match
- `PUT /api/matches/:id` - Update a match
- `DELETE /api/matches/:id` - Delete a match
- `POST /api/matches/:matchId/scores` - Add score to a match
- `POST /api/matches/:matchId/penalties` - Add penalty to a match
- `GET /api/matches/:matchId/scores` - Get match scores

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Inspections
- `GET /api/inspections` - Get all inspections
- `GET /api/inspections/:id` - Get inspection by ID
- `POST /api/inspections` - Create a new inspection
- `PUT /api/inspections/:id` - Update an inspection
- `DELETE /api/inspections/:id` - Delete an inspection

## WebSocket Events

### Event-related events
- `event-updated` - Emitted when an event is updated
- `event-deleted` - Emitted when an event is deleted
- `event-teams-updated` - Emitted when teams are added/removed from an event

### Match-related events
- `match-created` - Emitted when a match is created
- `match-updated` - Emitted when a match is updated
- `match-deleted` - Emitted when a match is deleted
- `match-score-updated` - Emitted when a score is added to a match
- `match-penalty-updated` - Emitted when a penalty is added to a match

### Inspection-related events
- `inspection-created` - Emitted when an inspection is created
- `inspection-updated` - Emitted when an inspection is updated
- `inspection-deleted` - Emitted when an inspection is deleted

## License

This project is licensed under the MIT License - see the LICENSE file for details.
