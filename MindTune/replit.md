# FORSTA - Audio Generation Application

## Overview

FORSTA is a full-stack audio generation application that creates custom subliminal audio tracks with binaural beats and affirmations. The application combines a React frontend with an Express.js backend, utilizing PostgreSQL for data persistence and modern web audio APIs for sound generation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with fallback to PostgreSQL sessions
- **API Design**: RESTful endpoints with JSON responses
- **Validation**: Zod schemas shared between frontend and backend

### Audio Processing
- **Web Audio API**: Client-side binaural beat generation
- **Speech Synthesis**: Browser's SpeechSynthesis API for affirmations
- **Audio Formats**: WAV blob generation for downloads

## Key Components

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Audio Sessions Table**: Stores user-generated audio configurations including affirmations, frequency settings, and metadata

### API Endpoints
- `POST /api/audio-sessions` - Create new audio session
- `GET /api/audio-sessions/:userId` - Retrieve user's audio sessions  
- `GET /api/audio-sessions/session/:id` - Get specific audio session

### Frontend Components
- **AudioGenerator**: Main interface for creating subliminal audio tracks
- **FrequencyGuide**: Educational component explaining brainwave frequencies
- **Audio Controls**: Play/pause, volume, and progress controls

### Audio Service
- Binaural beat generation using dual-channel sine waves
- Speech synthesis integration for affirmation playback
- Audio mixing and blob creation for file downloads

## Data Flow

1. **User Input**: User enters affirmations and selects audio parameters (frequency, volume, duration, voice)
2. **Validation**: Form data validated using Zod schemas
3. **Audio Generation**: Client-side audio processing creates binaural beats and speech synthesis
4. **Session Storage**: Audio configuration saved to database via API
5. **Playback**: Generated audio played through Web Audio API
6. **Export**: Audio can be downloaded as WAV file

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- Express.js with middleware (express, tsx for TypeScript execution)
- Database layer (Drizzle ORM, @neondatabase/serverless, connect-pg-simple)

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons

### Audio Processing
- Web Audio API (browser native)
- SpeechSynthesis API (browser native)

### Development Tools
- TypeScript for type safety
- Vite for fast development builds
- ESBuild for production bundling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with automatic restart on file changes
- **Database**: Neon PostgreSQL (configured via DATABASE_URL)

### Production Build
- **Frontend**: Vite build outputs to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- DATABASE_URL required for PostgreSQL connection
- Supports both development and production NODE_ENV modes
- Session storage automatically configures based on database availability

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Added upload/recording features, changed pause to stop button, increased Basic downloads to 15/month, added preview buttons
- July 03, 2025. Fixed Premium user video duration limits - now properly supports up to 2 hours (7200 seconds) for all video creation methods
- July 03, 2025. Removed video template selection for Premium users, providing direct access to professional video creation studio
- July 03, 2025. Reorganized premium page layout by moving Audio Control Center above Subliminal Video Creator section
- July 03, 2025. Implemented membership-based access controls: Free users (1min audio, no downloads), Basic users (30min audio, downloads enabled), Premium users (2hr video creation, all features)
- July 03, 2025. Added 1-day free trial system for Basic and Premium tiers without download capabilities - users can test features before purchasing
- July 05, 2025. Fixed audio generation system - removed 30-second duration limit, improved AudioContext buffer handling for longer audio tracks, enhanced error logging
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```