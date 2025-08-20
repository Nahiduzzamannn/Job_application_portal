// Login.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
   
  
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      setIsLoading(true);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
  
      localStorage.setItem('token', data.access);
      localStorage.setItem('', data.access);
      localStorage.setItem('token', data.access);
      const categoryId = searchParams.get('categoryId'); // ✅ Extract categoryId
      const redirectPath = categoryId ? `/subcategories/${categoryId}` : '/categories'; // ✅ Redirect based on categoryId
      navigate(redirectPath);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Log In</h2>
        {errorMsg && <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
