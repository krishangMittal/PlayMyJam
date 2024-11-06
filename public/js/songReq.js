document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('requestForm');
    const adModal = document.getElementById('adModal');
    const closeModal = document.getElementById('closeModal');
    const continueBtn = document.getElementById('continueBtn');
    const successMessage = document.getElementById('successMessage');
    const recentRequests = document.getElementById('recentRequests');

    // Get room code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');

    if (!roomCode) {
        alert('Invalid room code. Please use a valid link from the DJ.');
        return;
    }

    // Initialize WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws?room=${roomCode}`);
    
    // Connect to room
    ws.onopen = () => {
        console.log('Connected to room:', roomCode);
        // Notify DJ that a new user has connected
        ws.send(JSON.stringify({
            type: 'user_connected',
            roomCode: roomCode
        }));
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show ad first
        adModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        adModal.style.display = 'none';
    });

    continueBtn.addEventListener('click', async () => {
        const songName = document.getElementById('songName').value;
        const artistName = document.getElementById('artistName').value;

        // Send request through WebSocket
        ws.send(JSON.stringify({
            type: 'song_request',
            roomCode: roomCode,
            song: songName,
            artist: artistName,
            timestamp: new Date().toISOString()
        }));

        // Also save to database
        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomCode,
                    song: songName,
                    artist: artistName,
                    timestamp: new Date()
                })
            });

            if (response.ok) {
                form.reset();
                adModal.style.display = 'none';
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Error submitting request. Please try again.');
        }
    });

    // Handle incoming WebSocket messages
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'request_status_update') {
            updateRequestStatus(data);
        }
    };

    function updateRequestStatus(data) {
        const requestElement = document.createElement('div');
        requestElement.className = 'request-item';
        requestElement.innerHTML = `
            <div class="request-details">
                <div class="song-name">${data.song}</div>
                <div class="artist-name">${data.artist}</div>
            </div>
            <span class="request-status-badge status-${data.status}">
                ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
        `;

        // Add to recent requests
        recentRequests.insertBefore(requestElement, recentRequests.firstChild);

        // Keep only last 5 requests
        while (recentRequests.children.length > 5) {
            recentRequests.removeChild(recentRequests.lastChild);
        }
    }
});