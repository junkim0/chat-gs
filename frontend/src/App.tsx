// src/App.tsx
import React, { useState } from 'react';
import Login from './Login';
import ChatRoom from './ChatRoom';

const App = () => {
  const [authToken, setAuthToken] = useState('');

  return (
    <div>
      {authToken ? (
        <ChatRoom authToken={authToken} />
      ) : (
        <Login setAuthToken={setAuthToken} />
      )}
    </div>
  );
};

export default App;
