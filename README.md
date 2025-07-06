# HABIT Platform - Human Agent Behavioral Interaction Toolkit

*Research platform for studying human-AI interaction in debate scenarios*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jacopocirica8197gmailcoms-projects/v0-habit-platform-requirements)
[![Built with Love <3](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/dFB1c0F9U8d)

## Overview

HABIT is a comprehensive research platform designed to study human-AI interaction in structured debate environments. The platform features multiple chat room types, comprehensive moderation systems, and support for both AI and human confederates.

## Features

### Chat Room Types
- **1v1 Chat**: Human vs AI Confederate debates
- **1v1 Human Debate**: Human vs Human Confederate debates
- **LLM vs Confederate**: AI opponents for confederate training (random topics/positions)
- **2v1 Chat**: Human vs AI Confederate with intelligent responses
- **2vs4 Chat**: Complex group debates with multiple AI participants
- **Team vs Team**: Red vs Blue team debates with mixed participants

### Moderation System
- **Multi-layer Safety**: OpenAI moderation, contextual analysis, and keyword filtering
- **Silent Background Moderation**: Invisible safety layer that doesn't disrupt conversation flow
- **Automatic Intervention**: Moderator responses for unsafe content with distinctive red styling
- **Real-time Monitoring**: All messages are monitored and logged

### Confederate Support
- **AI Confederates**: Intelligent AI participants using LLMs
- **Human Confederates**: External human participants via direct links
- **Bypass Authentication**: Confederates can join without signup/surveys
- **Automatic Matching**: Smart room assignment and participant matching

## Confederate Access System

### For Researchers
Share confederate links with external participants:

**Human vs Human Debates:**
```
https://www.habitsimulation.xyz/chat/1v1-human/confederate
```

**LLM vs Confederate Training:**
```
https://www.habitsimulation.xyz/chat/llm-vs-confederate
```

### For Confederates
1. Click the provided link
2. Automatically assigned name "Ben"
3. Instantly matched with waiting participants
4. No signup or surveys required

### Technical Details
- Confederates bypass all authentication
- Automatic room polling every 3 seconds
- Full chat functionality with moderation
- 15-minute session duration
- Real-time message synchronization

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)
- OpenAI API key (for AI features)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/habit-platform.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
```

## Deployment

Your project is live at:

**[https://vercel.com/jacopocirica8197gmailcoms-projects/v0-habit-platform-requirements](https://vercel.com/jacopocirica8197gmailcoms-projects/v0-habit-platform-requirements)**

## Architecture

### Database Schema
- **Users**: Participant information and demographics
- **Rooms**: Chat room instances and configurations
- **Messages**: All chat messages with metadata
- **Room Users**: Participant-room relationships

### API Endpoints
- `/api/chat` - AI conversation processing
- `/api/moderate` - Content moderation
- `/api/rooms/*` - Room management
- `/api/email-status` - Email verification

### Security Features
- Content moderation on all messages
- Rate limiting and spam protection
- Secure session management
- Data encryption in transit

## Research Applications

### Data Collection
- Real-time conversation logging
- Participant behavior tracking
- Opinion change measurement
- Interaction pattern analysis

### Experimental Design
- Controlled debate environments
- Randomized topic assignment
- Confederate behavior standardization
- Multi-condition testing

## Development

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### File Structure
```
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utility functions
├── public/              # Static assets
├── styles/              # CSS styles
└── types/               # TypeScript definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please contact the research team or open an issue in the repository.

## Acknowledgments

Built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.
