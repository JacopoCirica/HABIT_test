# LLM vs Confederate Debate Instructions

## Overview
The LLM vs Confederate room allows confederates to debate against AI opponents with randomized positions on random topics. This provides a controlled testing environment for confederate training and debate practice.

## Access Instructions

### For Confederates
1. **Access Link**: Navigate to `/chat/llm-vs-confederate`
2. **Automatic Setup**: The system will automatically:
   - Assign you the name "Ben" 
   - Select a random debate topic from available topics
   - Create an AI opponent with a random position (agree/disagree)
   - Set up the debate room immediately (no waiting)

## How It Works

### Room Creation Process
1. **Random Topic Selection**: One of these topics is randomly chosen:
   - Vaccination Policy
   - Climate Change Policy  
   - Immigration Policy
   - Gun Control Policy
   - Healthcare System Reform

2. **Random AI Position**: The AI is assigned either:
   - **Agree**: Supports the topic statement
   - **Disagree**: Opposes the topic statement

3. **AI Personality**: The AI is given a random name and personality:
   - Names: Alex, Sam, Jordan, Casey, Riley, Morgan, Avery, Quinn
   - Full personality with background, communication style, and debate approach

### Features

#### For Confederates
- **Position Visibility**: You can see the AI's position (for/against) in the sidebar
- **Real-time Chat**: Instant messaging with the AI opponent
- **Session Timer**: 15-minute debate sessions
- **Exit Survey**: Brief survey upon session completion

#### AI Behavior
- **Authentic Debate**: AI presents genuine arguments based on its assigned position
- **Character Consistency**: Maintains personality throughout the conversation
- **Natural Responses**: 1-3 second response delays for realistic interaction
- **Adaptive Length**: Response length matches your message complexity

## Example Session Flow

1. **Start**: Confederate accesses `/chat/llm-vs-confederate`
2. **Setup**: System creates room with random topic (e.g., "Climate Change Policy") and AI opponent "Sam" who disagrees
3. **Moderator**: Initial message explains the setup and AI's position
4. **Debate**: Confederate and AI engage in 15-minute structured debate
5. **End**: Session concludes with exit survey

## Technical Details

### Database Schema
- **Room Type**: `llm-vs-confederate`
- **Status**: Always `active` (no waiting period)
- **Participants**: 1 Confederate + 1 AI
- **Position Data**: AI position stored in `room_users.position_data`

### API Endpoints
- **Join Room**: `POST /api/rooms/llm-vs-confederate/join`
- **Chat Processing**: `POST /api/chat` (handles AI responses)
- **Members**: `GET /api/rooms/[roomId]/members`

## Use Cases

### Confederate Training
- Practice debate techniques against consistent AI opponents
- Test different argument strategies
- Experience various topic positions without human participants

### Research Applications
- Controlled baseline for confederate performance
- Training environment before human sessions
- Consistency testing for debate protocols

### Quality Assurance
- Verify chat system functionality
- Test AI response quality and timing
- Validate debate flow and user experience

## Differences from Human vs Confederate

| Feature | Human vs Confederate | LLM vs Confederate |
|---------|---------------------|-------------------|
| **Access** | Regular users + Confederate link | Confederate-only link |
| **Waiting** | May wait for human participant | Immediate start |
| **Topics** | Based on user's survey responses | Random selection |
| **Positions** | Based on user's actual opinions | Random AI assignment |
| **Predictability** | Variable human behavior | Consistent AI personality |
| **Training Value** | Real human interaction | Controlled practice environment |

## Getting Started

Simply navigate to:
```
/chat/llm-vs-confederate
```

The system handles everything else automatically! 