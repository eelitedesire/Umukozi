#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p ~/mongodb-data

# Start MongoDB with custom data directory
echo "Starting MongoDB..."
mongod --dbpath ~/mongodb-data --port 27017 --bind_ip 127.0.0.1 --logpath ~/mongodb-data/mongod.log --fork

# Check if MongoDB started successfully
sleep 2
if lsof -i :27017 > /dev/null; then
    echo "MongoDB started successfully on port 27017"
else
    echo "Failed to start MongoDB"
    echo "Trying without fork option..."
    mongod --dbpath ~/mongodb-data --port 27017 --bind_ip 127.0.0.1 &
fi