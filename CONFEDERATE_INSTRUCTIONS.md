# Confederate Access Instructions

## Overview

The HABIT platform now supports external confederates who can join 1v1 Human Debate Sessions without going through the full signup process.

## How It Works

### For Confederates:

1. **Access the Confederate Link**: Navigate to `/chat/1v1-human/confederate`
2. **Automatic Assignment**: You will automatically be assigned the name "Ben"
3. **No Signup Required**: Skip all demographic questionnaires and surveys
4. **Instant Join**: If there's a waiting participant, you'll join immediately
5. **Wait Mode**: If no participants are waiting, you'll see a waiting screen that polls for available rooms

### For Researchers:

1. **Share the Link**: Provide confederates with the direct URL: `https://your-domain.com/chat/1v1-human/confederate`
2. **No Setup Required**: Confederates don't need any prior registration or authentication
3. **Automatic Matching**: The system will automatically match confederates with waiting participants

## Technical Details

### API Endpoint
- **URL**: `/api/rooms/1v1-human/join`
- **Method**: POST
- **Payload**: 
  ```json
  {
    "user_id": "confederate_timestamp",
    "user_name": "Ben",
    "is_confederate": true
  }
  ```

### Behavior
- Confederates are automatically assigned the name "Ben"
- They bypass all authentication and survey requirements
- They join waiting rooms with exactly 1 participant
- If no waiting rooms exist, they wait and poll every 3 seconds
- They have full chat functionality with moderation
- Session timer starts immediately upon joining

### Security
- Confederates are still subject to the same moderation system
- All messages are logged and monitored
- No access to participant data or demographics
- Limited to 1v1 Human Debate Sessions only

## Usage Examples

### Direct Link
```
https://your-domain.com/chat/1v1-human/confederate
```

### QR Code
Generate a QR code pointing to the confederate URL for easy mobile access.

### Email Template
```
Subject: Join as Confederate - HABIT Research Study

Hello,

You've been invited to participate as a confederate in our research study. 

Please click the link below to join:
[Confederate Link]

You will automatically be assigned the name "Ben" and matched with a waiting participant.

No signup or surveys required - just click and start debating!

Best regards,
Research Team
```

## Troubleshooting

### "No waiting room available"
- This means no participants are currently waiting for a confederate
- The system will automatically poll and connect you when someone joins
- You can refresh the page to try again

### Connection Issues
- Ensure you have a stable internet connection
- Try refreshing the page
- Check if the main site is accessible

### Session Ended Early
- Sessions automatically end after 15 minutes
- If a participant leaves, the session may end early
- You can exit and try joining again

## Notes

- Confederate name is always "Ben" (hardcoded)
- No demographic data is collected from confederates
- Full moderation system applies to confederate messages
- Session length is 15 minutes (same as regular participants)
- Confederates can exit at any time without penalties 