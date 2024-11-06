# PlayMyJam 🎵

A real-time web application that revolutionizes the way DJs interact with their audience by enabling seamless song requests and queue management.

## Features ✨

- **Real-time Song Requests**: Attendees can submit song requests instantly through a user-friendly interface
- **DJ Dashboard**: 
  - Manage incoming song requests
  - Track request status (pending, playing, completed)
  - Monitor active users in real-time
  - Share QR code for easy access
- **WebSocket Integration**: Instant updates and real-time communication between DJs and attendees
- **Mobile Responsive**: Seamless experience across all devices

## Tech Stack 🛠️

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: WebSocket
- **Version Control**: Git & GitHub

## Getting Started 🚀

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/playmyjam.git
cd playmyjam
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
```

4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure 📁

```
playmyjam/
│
├── public/            # Static files
│   ├── css/          # Stylesheets
│   └── js/           # Client-side JavaScript
│
├── src/
│   ├── routes/       # Express route controllers
│   ├── models/       # MongoDB models
│   └── websocket/    # WebSocket handlers
│
├── views/            # HTML templates
├── server.js         # Main application file
└── package.json
```

## API Endpoints 🔌

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomCode` - Get room details
- `GET /api/rooms/:roomCode/requests` - Get room requests

### WebSocket Events
- `song_request` - New song request
- `request_status_update` - Update request status
- `active_users_update` - Active users count update

## Key Features Implementation 💡

### Real-time Communication
The application uses WebSocket for real-time bidirectional communication between the server and clients. This enables:
- Instant song request updates
- Real-time status changes
- Live active user count updates

### Room Management
- Unique room codes for each DJ session
- Automatic cleanup of inactive rooms
- Active user tracking

### Request Management
- Queue management system
- Status tracking (pending/playing/completed)
- Request history

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments 🙏

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ws (WebSocket client & server)](https://github.com/websockets/ws)


---
Made with ❤️ by Krishang Mittal
