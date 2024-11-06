const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to MongoDB
mongoose.connect('mongodb://localhost/dj-requests', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Room Schema
const RoomSchema = new mongoose.Schema({
    roomCode: String,
    djId: String,
    createdAt: Date,
    activeUsers: { type: Number, default: 0 }
});

// Request Schema
const RequestSchema = new mongoose.Schema({
    roomCode: String,
    song: String,
    artist: String,
    status: { type: String, default: 'pending' },
    timestamp: Date
});

const Room = mongoose.model('Room', RoomSchema);
const Request = mongoose.model('Request', RequestSchema);

// Store active connections
const rooms = new Map(); // roomCode -> Set of WebSocket connections

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create new room
app.post('/api/rooms', async (req, res) => {
    try {
        const roomCode = uuidv4().substring(0, 6).toUpperCase();
        const room = new Room({
            roomCode,
            djId: req.body.djId,
            createdAt: new Date()
        });
        await room.save();
        res.status(201).json({ roomCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get room details
app.get('/api/rooms/:roomCode', async (req, res) => {
    try {
        const room = await Room.findOne({ roomCode: req.params.roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get room requests
app.get('/api/rooms/:roomCode/requests', async (req, res) => {
    try {
        const requests = await Request.find({ 
            roomCode: req.params.roomCode 
        }).sort({ timestamp: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Utility function to broadcast to room
function broadcastToRoom(roomCode, message) {
    if (!rooms.has(roomCode)) return;
    
    const clients = rooms.get(roomCode);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Utility function to clean up room
async function cleanupRoom(roomCode) {
    if (!rooms.has(roomCode)) return;
    
    const clients = rooms.get(roomCode);
    if (clients.size === 0) {
        rooms.delete(roomCode);
        try {
            await Room.findOneAndUpdate(
                { roomCode },
                { activeUsers: 0 }
            );
        } catch (error) {
            console.error('Error cleaning up room:', error);
        }
    }
}

// Utility function to update room active users
async function updateRoomActiveUsers(roomCode) {
    try {
        const activeUsers = rooms.get(roomCode)?.size || 0;
        await Room.findOneAndUpdate(
            { roomCode },
            { activeUsers }
        );
    } catch (error) {
        console.error('Error updating active users:', error);
    }
}

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const roomCode = url.searchParams.get('room');
    
    if (!roomCode) {
        ws.close();
        return;
    }

    // Verify room exists
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            ws.close();
            return;
        }
    } catch (error) {
        console.error('Error verifying room:', error);
        ws.close();
        return;
    }

    // Add connection to room
    if (!rooms.has(roomCode)) {
        rooms.set(roomCode, new Set());
    }
    rooms.get(roomCode).add(ws);

    // Update active users
    await updateRoomActiveUsers(roomCode);
    broadcastToRoom(roomCode, {
        type: 'active_users_update',
        count: rooms.get(roomCode).size
    });

    // Handle incoming messages
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'song_request':
                    const request = new Request({
                        roomCode: data.roomCode,
                        song: data.song,
                        artist: data.artist,
                        timestamp: new Date()
                    });
                    await request.save();
                    
                    broadcastToRoom(roomCode, {
                        type: 'new_request',
                        request: request
                    });
                    break;

                case 'request_status_update':
                    const updatedRequest = await Request.findByIdAndUpdate(
                        data.requestId,
                        { status: data.status },
                        { new: true }
                    );
                    
                    if (updatedRequest) {
                        broadcastToRoom(roomCode, {
                            type: 'request_status_update',
                            requestId: data.requestId,
                            status: data.status
                        });
                    }
                    break;

                case 'heartbeat':
                    ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing request'
            }));
        }
    });

    // Handle disconnection
    ws.on('close', async () => {
        if (rooms.has(roomCode)) {
            rooms.get(roomCode).delete(ws);
            await updateRoomActiveUsers(roomCode);
            broadcastToRoom(roomCode, {
                type: 'active_users_update',
                count: rooms.get(roomCode).size
            });
            await cleanupRoom(roomCode);
        }
    });

    // Send initial room state
    try {
        const requests = await Request.find({ roomCode })
            .sort({ timestamp: -1 })
            .limit(10);
        
        ws.send(JSON.stringify({
            type: 'initial_state',
            requests,
            activeUsers: rooms.get(roomCode).size
        }));
    } catch (error) {
        console.error('Error sending initial state:', error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Periodic cleanup of inactive rooms
setInterval(async () => {
    try {
        const oldRooms = await Room.find({
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            activeUsers: 0
        });
        
        for (const room of oldRooms) {
            await Request.deleteMany({ roomCode: room.roomCode });
            await Room.deleteOne({ _id: room._id });
        }
    } catch (error) {
        console.error('Error cleaning up inactive rooms:', error);
    }
}, 60 * 60 * 1000); // Run every hour

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
});