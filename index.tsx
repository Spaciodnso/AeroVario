import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Attempting to mount app...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully.");
} catch (e) {
  console.error("Failed to mount React app:", e);
}