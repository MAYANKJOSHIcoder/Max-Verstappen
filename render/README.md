# OpenF1 Backend (Render Deployment)

This is a self-hosted deployment of [br-g/openf1](https://github.com/br-g/openf1) on Render.com.

## Prerequisites

1. **MongoDB Atlas** (free tier): Create a cluster at https://cloud.mongodb.com
   - Create a database user
   - Get the connection string (Connect > Drivers > Python)
   - Whitelist all IPs (`0.0.0.0/0`) in Network Access

2. **Render account**: https://render.com

## Deploy on Render

### Option A: Docker (recommended)

1. Push this repo to GitHub
2. On Render, create a new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Environment**: Docker
   - **Dockerfile Path**: `render/Dockerfile`
   - **Docker Context**: `render`
   - **Port**: 8000
5. Add environment variables:
   - `MONGO_CONNECTION_STRING` = your MongoDB Atlas connection string
   - `OPENF1_DB_NAME` = `openf1-livetiming` (default)
   - `ROLE` = `render`
6. Deploy

### Option B: Python (if Docker not available)

1. Create a **Web Service** with Python environment
2. Build Command: `pip install -e render/.`
3. Start Command: `cd render && python -m openf1.services.ingestor_livetiming.real_time.app & uvicorn openf1.services.query_api.app:app --host 0.0.0.0 --port $PORT`
4. Add same environment variables as above

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_CONNECTION_STRING` | Yes | MongoDB Atlas connection string |
| `OPENF1_DB_NAME` | No | Database name (default: `openf1-livetiming`) |
| `ROLE` | Yes | Set to `render` for combined API + ingester |
| `PORT` | Auto | Set by Render automatically |

## How It Works

- The **live timing ingester** polls F1's live timing servers and stores data in MongoDB
- The **query API** serves the OpenF1-compatible REST API from MongoDB
- Both run in the same container on Render free tier

## API Endpoints

Once deployed, your API will be at `https://your-service.onrender.com/v1/`

Same endpoints as https://api.openf1.org:
- `/v1/sessions` - Session info
- `/v1/drivers` - Driver info
- `/v1/car_data` - Car telemetry
- `/v1/laps` - Lap times
- `/v1/position` - Race positions
- `/v1/intervals` - Gaps/intervals
- `/v1/weather` - Weather data
- `/v1/pit` - Pit stops
- `/v1/meetings` - Meeting/race info

## Limitations (Render Free Tier)

- 512MB RAM — may be tight with both processes
- Service spins down after 15 min of inactivity
- Cold start takes ~30 seconds
