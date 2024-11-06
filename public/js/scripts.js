document.addEventListener('DOMContentLoaded', function() {
    // Generate room code and URL
    const roomCode = 'DJ' + Math.random().toString(36).substr(2, 6);
    const requestUrl = `${window.location.origin}/request/${roomCode}`;
    
    // Initialize QR Code
    new QRCode(document.getElementById('qrcode'), {
        text: requestUrl,
        width: 128,
        height: 128
    });
    
    document.getElementById('requestUrl').textContent = requestUrl;

    // Sample data for demonstration
    const sampleRequests = [
        { time: '20:45', song: 'Dance the Night', artist: 'Dua Lipa', status: 'pending' },
        { time: '20:42', song: 'Blinding Lights', artist: 'The Weeknd', status: 'playing' },
        { time: '20:38', song: 'Uptown Funk', artist: 'Mark Ronson', status: 'completed' },
    ];

    // Update stats
    document.getElementById('totalRequests').textContent = sampleRequests.length;
    document.getElementById('pendingRequests').textContent = 
        sampleRequests.filter(r => r.status === 'pending').length;
    document.getElementById('completedRequests').textContent = 
        sampleRequests.filter(r => r.status === 'completed').length;
    document.getElementById('activeUsers').textContent = '12';

    // Populate requests table
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = sampleRequests.map(request => `
        <tr>
            <td>${request.time}</td>
            <td>${request.song}</td>
            <td>${request.artist}</td>
            <td>
                <span class="status-badge status-${request.status}">
                    ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="action-btn btn-primary">Play</button>
                    <button class="action-btn btn-secondary">Skip</button>
                </div>
            </td>
        </tr>
    `).join('');

    // In a real application, you would:
    // 1. Connect to WebSocket for real-time updates
    // 2. Implement proper session management
    // 3. Add event handlers for all buttons
    // 4. Add proper error handling
    // 5. Implement proper state management
});