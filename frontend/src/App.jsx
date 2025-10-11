// frontend/src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We'll create this file for styling

// Define the backend API URL
const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [file, setFile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setIsReady(false);
    setMessages([]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setMessages([{ sender: 'ai', text: 'Processing your document...' }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsReady(true);
      setMessages([{ sender: 'ai', text: `Document "${file.name}" is ready. What sensitive data are you looking for?` }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to process document.';
      setMessages([{ sender: 'ai', text: `Error: ${errorMsg}` }]);
    }
    setIsLoading(false);
  };

  const handleQuerySubmit = async (event) => {
    event.preventDefault();
    if (!query || !isReady) return;

    const userMessage = { sender: 'human', text: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');

    try {
      const response = await axios.post(`${API_URL}/query`, { query });
      const aiMessage = { sender: 'ai', text: response.data.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      const errorMsg = error.response?.data?.detail || 'An error occurred.';
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${errorMsg}` }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Sensitive Data Detector 🕵️</h1>
        <p>Upload a PDF to scan for sensitive information.</p>
      </header>

      <div className="upload-section">
        <input type="file" onChange={handleFileChange} accept=".pdf" className="file-input" />
        <button onClick={handleUpload} disabled={!file || isLoading}>
          {isLoading && !isReady ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>

      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleQuerySubmit} className="chat-input-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isReady ? "e.g., 'Find all social security numbers'" : "Please upload a document first"}
            disabled={!isReady || isLoading}
            className="chat-input"
          />
          <button type="submit" disabled={!isReady || isLoading || !query}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;