// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    axios.get('/api/notes')
      .then(response => setNotes(response.data))
      .catch(error => console.error(error));

    socket.on('noteUpdate', (updatedNotes) => {
      setNotes(updatedNotes);
    });
  }, []);

  const addNote = () => {
    axios.post('/api/notes', { content: currentNote })
      .then(response => {
        setNotes(response.data);
        setCurrentNote('');
      })
      .catch(error => console.error(error));
  };

  const handleChange = (e) => {
    setCurrentNote(e.target.value);
  };

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setCurrentNote(prevNote => prevNote + transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div>
      <h1>Notake</h1>
      <div>
        <textarea value={currentNote} onChange={handleChange} />
        <button onClick={addNote}>Add Note</button>
        <button onClick={handleListen}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
      <div className="notes">
        {notes.map((note, index) => (
          <div className="note" key={index}>
            <textarea defaultValue={note.content} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;