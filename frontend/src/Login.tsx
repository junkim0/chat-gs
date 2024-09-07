// src/Login.tsx
import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setAuthToken }: { setAuthToken: (token: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isSignup ? '/signup' : '/login';
    try {
      const response = await axios.post(url, { username, password });
      if (!isSignup) {
        setAuthToken(response.data.token);
      } else {
        setIsSignup(false);
      }
    } catch (err) {
      alert('Error during authentication');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
      </form>
      <button onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? 'Go to Login' : 'Go to Sign Up'}
      </button>
    </div>
  );
};

export default Login;
