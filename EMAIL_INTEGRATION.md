# 🏨 HotelFlow - Email Integration Guide

## How It Works

HotelFlow automatically converts incoming emails into tickets using the `/api/ingest-email` endpoint.

**Pipeline:**
1. Email received → `/api/ingest-email`
2. AI categorizes (complaint/booking/inquiry/other)
3. AI assigns priority (high/medium/low)
4. Router assigns to team (general-support/complaint-team/booking-team)
5. Ticket created in MongoDB
6. Dashboard updates in real-time

---

## Test Email Ingest

### Using cURL:

```bash
curl -X POST https://hotelflow-production-738f.up.railway.app/api/ingest-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "test-email-123",
    "from": "guest@example.com",
    "subject": "Room is too cold - need heater",
    "body": "Hi, I checked into room 402 and the temperature is freezing. Can you please send someone to fix the heater? I need this fixed urgently. Thanks!"
  }'
```

### Response:
```json
{
  "success": true,
  "ticket": {
    "_id": "507f1f77bcf86cd799439011",
    "guestName": "guest",
    "guestEmail": "guest@example.com",
    "subject": "Room is too cold - need heater",
    "category": "complaint",
    "priority": "high",
    "status": "open",
    "assignedTo": "complaint-team",
    "createdAt": "2026-07-23T21:30:00Z"
  },
  "pipeline": {
    "step1": "Categorized by AI",
    "step2": "Routed to team",
    "step3": "Guest extracted",
    "step4": "Ticket created"
  }
}
```

---

## Integration Options

### 1. **Gmail Forwarding** (Simple)
- Set up Gmail filter to forward emails to webhook
- Webhook parses email and sends to `/api/ingest-email`

### 2. **Zapier/Make.com** (No-Code)
- Trigger: New Email in Gmail inbox
- Action: POST to `/api/ingest-email`
- Setup takes 5 minutes

### 3. **Email Service Webhook** (Advanced)
- Configure your hotel's email provider (Microsoft 365, etc.)
- Send webhooks to `/api/ingest-email`
- Custom routing per email domain

### 4. **Manual Testing** (For Now)
- Use cURL/Postman to test
- Verify pipeline works
- Then integrate email provider

---

## Required Fields

```javascript
{
  "emailId": "unique-identifier",    // Must be unique
  "from": "guest@email.com",         // Guest email
  "subject": "Guest message",        // Email subject
  "body": "Full email content..."    // Email body (plain text or HTML)
}
```

---

## What Happens Next

1. **AI Categorization** (OpenAI GPT-3.5-turbo)
   - Complaint: Issue with room/service
   - Booking: Reservation request
   - Inquiry: Question about hotel
   - Other: Miscellaneous

2. **Routing** (Rule-based)
   - Complaint → complaint-team
   - Booking → booking-team
   - Inquiry → general-support

3. **Dashboard Update**
   - Ticket appears in hotelflow.vercel.app
   - Staff can update status
   - Add notes/responses

---

## Next Steps

1. ✅ Test with cURL (see example above)
2. ✅ Set up Gmail forwarding
3. ✅ Configure Zapier automation
4. ✅ Go live with email → ticket conversion

---

**Questions?** Check the backend logs for troubleshooting!
