// src/ChatRoom.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatRoom = ({ authToken }: { authToken: string }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await axios.get('/messages', {
        headers: { Authorization: authToken },
      });
      setMessages(response.data);
    };

    fetchMessages();
  }, [authToken]);

  const sendMessage = async () => {
    await axios.post(
      '/messages',
      { message: newMessage },
      { headers: { Authorization: authToken } }
    );
    setNewMessage('');
  };

  return (
    <div>
      <div>
        {messages.map((msg: any) => (
          <div key={msg.timestamp}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatRoom;
