import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, FileText, Shield, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [file, setFile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setIsReady(false);
        setMessages([]);
      }
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setIsReady(false);
      setMessages([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setMessages([{ sender: 'ai', text: '🔄 Processing your document...', type: 'loading' }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      setIsReady(true);
      setMessages([{ 
        sender: 'ai', 
        text: `✅ Document "${file.name}" processed successfully! I'm ready to scan for sensitive data.`,
        type: 'success'
      }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages([{ 
        sender: 'ai', 
        text: '❌ Failed to process document. Please try again.',
        type: 'error'
      }]);
    }
    setIsLoading(false);
  };

  const handleQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || !isReady) return;

    const userMessage = { sender: 'human', text: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) throw new Error('Query failed');
      
      const data = await response.json();
      const aiMessage = { sender: 'ai', text: data.answer, type: 'result' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: '❌ An error occurred while processing your query.',
        type: 'error'
      }]);
    }
    setIsLoading(false);
  };

  const formatMessage = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('🧩') || line.startsWith('🤖')) {
        return <div key={i} className="font-semibold text-lg mb-2 mt-3">{line}</div>;
      }
      if (line.startsWith('- ')) {
        return <div key={i} className="ml-4 my-1 flex items-start gap-2">
          <span className="text-blue-500 mt-1">•</span>
          <span>{line.substring(2)}</span>
        </div>;
      }
      return line ? <div key={i} className="my-1">{line}</div> : <div key={i} className="h-2" />;
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">DocSentry</h1>
          </div>
          <p className="text-blue-100 text-sm">AI-Powered Sensitive Data Detection & Compliance Scanner</p>
        </div>

        {/* Upload Section */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 font-medium"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5" />
                Choose PDF
              </button>
              
              <div className="flex-1">
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Drop your PDF here or click to browse</p>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                {isLoading && !isReady ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {isReady && (
            <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Document ready for analysis</span>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload a document to begin</h3>
                  <p className="text-gray-500 text-sm">DocSentry will scan for sensitive information including PII, PHI, financial data, and more.</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'human' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                      msg.sender === 'human'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : msg.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : msg.type === 'success'
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {msg.text}
  </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.sender === 'human' && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t border-gray-200 px-8 py-4 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuerySubmit();
                  }
                }}
                placeholder={isReady ? "e.g., 'Find all social security numbers'" : "Upload a document first..."}
                disabled={!isReady || isLoading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              />
              <button
                onClick={handleQuerySubmit}
                disabled={!isReady || isLoading || !query.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;