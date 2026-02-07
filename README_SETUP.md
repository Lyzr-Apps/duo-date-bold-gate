# DoubleMate - AI-Powered Dating App

A modern dating application with conversational AI onboarding and intelligent daily matchmaking.

## Features Implemented

### 1. Conversational Onboarding
- AI-powered chat interface to build user profiles
- Natural question-and-answer flow
- Collects all user preferences through conversation
- Profile Builder Agent (ID: 698781e787eeda742a24accd)

### 2. Daily Match System
- One curated match per day for each user
- AI analyzes compatibility based on:
  - Shared interests (30%)
  - Location proximity (20%)
  - Age compatibility (15%)
  - Preference alignment (15%)
  - Ideal date compatibility (10%)
  - Overall personality fit (10%)
- Daily Match Agent (ID: 6987820187eeda742a24acd1)

### 3. Like/Dislike System
- Users can like or dislike their daily match
- Mutual likes unlock chat functionality
- One match shown per day

### 4. Chat System
- Real-time messaging for mutual matches
- Clean, intuitive interface
- Message history

### 5. User Profiles
- View and manage profile information
- Display interests, preferences, and bio

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/doublemate?schema=public"

# Lyzr API Key
LYZR_API_KEY=your-lyzr-api-key-here

# Agent IDs
PROFILE_BUILDER_AGENT_ID=698781e787eeda742a24accd
DAILY_MATCH_AGENT_ID=6987820187eeda742a24acd1
VENUE_RECOMMENDATION_AGENT_ID=69877e88516690c4422a963e
```

### 2. Database Setup

```bash
# Install Prisma
npm install prisma @prisma/client

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Seed database with test users
npx prisma db seed
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## AI Agents

### Profile Builder Agent
- **ID**: 698781e787eeda742a24accd
- **Purpose**: Conducts conversational onboarding interviews
- **Model**: Perplexity sonar-pro
- **Features**: Memory-enabled for context retention

### Daily Match Agent
- **ID**: 6987820187eeda742a24acd1
- **Purpose**: Curates one high-quality match per day
- **Model**: Perplexity sonar-pro
- **Algorithm**: Multi-factor compatibility scoring

### Venue Recommendation Agent
- **ID**: 69877e88516690c4422a963e
- **Purpose**: Suggests date venues based on interests
- **Model**: Perplexity sonar-pro
- **Note**: For future feature implementation

## Database Schema

### UserProfile
- User information (name, age, location, etc.)
- Interests and preferences
- Partner preferences
- Onboarding status

### Match
- Daily matches between users
- Like/dislike status
- Mutual match tracking
- Compatibility scores

### Message
- Chat messages between mutual matches
- Sender/receiver tracking
- Read status

## API Routes

### Onboarding
- `POST /api/onboarding/chat` - Chat with Profile Builder Agent
- `POST /api/onboarding/complete` - Save completed profile

### Matches
- `POST /api/matches/daily` - Get today's match
- `POST /api/matches/respond` - Like/dislike a match

### Chat
- `GET /api/chat/messages?matchId={id}` - Get chat messages
- `POST /api/chat/messages` - Send a message

## User Flow

1. **Onboarding**: User chats with AI to build profile
2. **Daily Match**: System shows one curated match each day
3. **Response**: User likes or dislikes the match
4. **Mutual Match**: If both like each other, chat unlocks
5. **Chat**: Users can message and plan dates

## Theme

**Rose Garden (rose-light)**
- Warm rose and blush tones
- Glass card effects
- Inviting, approachable atmosphere
- Perfect for dating applications

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Rose Garden theme
- **Database**: PostgreSQL + Prisma
- **AI**: Lyzr AI Agents (Perplexity models)
- **Icons**: react-icons

## Notes

- No toast notifications (as requested)
- No emoji characters, only react-icons
- Agent handles OAuth automatically
- Database required for full functionality
- AI agents need valid Lyzr API key
