// src/App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Join room
  const joinRoom = () => {
    if (room && username) {
      socket.emit('joinRoom', { room, username });
    }
  };

  // Handle incoming messages
  useEffect(() => {
    socket.on('message', (data) => {
      setChat((prevChat) => [...prevChat, data]);
      setTyping(false);
    });

    // Load online users
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      setTyping(true);
    });

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('onlineUsers');
      socket.off('typing');
    };
  }, []);

  // Send a message
  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      let chatMessage;
      
      // Check for specific commands
      if (message.startsWith('/help')) {
        chatMessage = {
          room,
          username: 'System',
          message: 'Available commands: /help - Show this help message, /joke - Get a random joke.',
        };
      } else if (message.startsWith('/joke')) {
        chatMessage = {
          room,
          username: 'System',
          message: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
        };
      } else {
        chatMessage = {
          room,
          username,
          message,
        };
      }
      
      socket.emit('sendMessage', chatMessage);
      setChat((prevChat) => [...prevChat, chatMessage]); // Update local chat state
      setMessage('');
    }
  };

  // Handle typing
  const handleTyping = () => {
    socket.emit('typing', { username });
  };

  return (
    <div className="chat-container">
      <div className="join-room">
        <input
          className="input-field"
          type="text"
          placeholder="Room..."
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="join-button" onClick={joinRoom}>Join</button>
      </div>
      <div className="chat-box">
        <div className="online-users">
          <h3>Online Users</h3>
          {onlineUsers.map((user, index) => (
            <div key={index}>{user}</div>
          ))}
        </div>
        <div className="messages">
          {chat.map((chatMessage, index) => (
            <div key={index} className={`chat-message ${chatMessage.username === username ? 'self' : 'other'}`}>
              <strong>{chatMessage.username}:</strong> {chatMessage.message}
            </div>
          ))}
          {typing && <div className="typing-indicator">Someone is typing...</div>}
        </div>
        <form className="message-form" onSubmit={sendMessage} onFocus={handleTyping}>
          <input
            className="message-input"
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleTyping}
          />
          <button className="send-button" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
