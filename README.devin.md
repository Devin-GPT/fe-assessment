# IoT Device Monitor

A real-time IoT device monitoring dashboard using MQTT.

## Setup

Install all dependencies:
```bash
npm run install:all
```

## Running the Application

Start all services with a single command:
```bash
npm start
# or
npm run dev
```

This will start:
- Frontend (UI) on http://localhost:5173
- Backend (API) on http://localhost:3000
- MQTT Publisher service

## Testing

Run all tests:
```bash
npm test
```

Run specific tests:
```bash
npm run test:ui    # Run UI tests only
npm run test:api   # Run API tests only
```

## Project Structure

- `/ui` - React frontend application
- `/api` - Express backend server
  - `/api/src/mqtt` - MQTT publisher service 