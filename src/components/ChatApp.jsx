import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatApp = () => {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    if (idInstance && apiTokenInstance) {
      setIsAuthenticated(true);
    }
  };

  const sendMessage = async () => {
    if (!message || !phoneNumber) return;

    try {
      const url = `https://api.green-api.com/waInstance${idInstance}/SendMessage/${apiTokenInstance}`;
      const payload = {
        chatId: `${phoneNumber}@c.us`,
        message,
      };

      await axios.post(url, payload);

      setChatHistory((prev) => [
        ...prev,
        { recipient: phoneNumber, sender: 'You', text: message },
      ]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchRecipientMessages = async () => {
    try {
      const urlReceive = `https://api.green-api.com/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`;
      const response = await axios.get(urlReceive);

      if (response.data) {
        const { receiptId, body } = response.data;

        if (body && body.messageData) {
          const textMessage = body.messageData.textMessageData?.textMessage;
          const chatId = body.senderData?.chatId;

          if (chatId === `${phoneNumber}@c.us` && textMessage) {
            setChatHistory((prev) => [
              ...prev,
              { recipient: phoneNumber, sender: 'Receiver', text: textMessage },
            ]);
          }
        }

        const urlDelete = `https://api.green-api.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${response.data.receiptId}`;
        await axios.delete(urlDelete);
      }
    } catch (error) {
      console.error('Error fetching recipient messages:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchRecipientMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, phoneNumber]);

  return (
    <div className="container mt-5">
      {!isAuthenticated ? (
        <div className="card p-4">
          <h1 className="mb-3">Login</h1>
          <input
            type="text"
            placeholder="idInstance"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            className="form-control mb-2"
          />
          <input
            type="text"
            placeholder="apiTokenInstance"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            className="form-control mb-3"
          />
          <button onClick={handleLogin} className="btn btn-outline-success">
            Login
          </button>
        </div>
      ) : (
        <div className="card p-4">
          <h1 className="mb-3">WhatsApp Chat</h1>
          <input
            type="text"
            placeholder="Recipient's phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="form-control mb-2"
          />
          <div className="chat-history border p-3 mb-3" style={{ maxHeight: '300px', overflowY: 'scroll' }}>
            {chatHistory
              .filter((msg) => msg.recipient === phoneNumber)
              .map((msg, index) => (
                <div
                  key={index}
                  className={`message border p-2 mb-2 ${msg.sender === 'You' ? 'text-end bg-secondary-subtle text-secondary-emphasis' : 'text-start bg-success-subtle'}`}
                >
                  <p className="sender-name mb-1"><strong>{msg.sender}</strong></p>
                  <p className="message-text mb-0">{msg.text}</p>
                </div>
              ))}
          </div>
          <input
            type="text"
            placeholder="Type your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-control mb-2"
          />
          <button onClick={sendMessage} className="btn btn-outline-success">
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
