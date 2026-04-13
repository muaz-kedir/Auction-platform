# MongoDB Setup Guide

The backend requires MongoDB to be running. Here are the setup options:

## Option 1: Install MongoDB Locally (Recommended for Development)

### Windows
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. MongoDB will start automatically

To verify MongoDB is running:
```bash
mongosh
```

### macOS
Using Homebrew:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier M0)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string

Update `backend/.env`:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/online_auction_platform?retryWrites=true&w=majority
```

## Option 3: Use Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Verify Connection

After starting MongoDB, restart the backend server:
```bash
cd backend
npm start
```

You should see: "MongoDB Connected" in the console.

## Troubleshooting

If you see "MongooseError: Operation buffering timed out":
- MongoDB is not running
- Check if MongoDB service is active
- Verify the MONGO_URI in backend/.env is correct
- For Windows, check Services app for "MongoDB" service

To check if MongoDB is running on Windows:
```bash
net start | findstr MongoDB
```

To start MongoDB service on Windows:
```bash
net start MongoDB
```
