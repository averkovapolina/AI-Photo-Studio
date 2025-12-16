import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, Mic, MicOff } from 'lucide-react';
import logoImage from './assets/Logo.png';

export default function PhotoUploadInterface() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event) => {
          console.log('Speech recognition result received');
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log('Transcript:', transcript, 'isFinal:', event.results[i].isFinal);
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update interim results for live feedback
          setInterimText(interimTranscript);

          // Add final results to the thoughts field
          if (finalTranscript) {
            setThoughts(prev => {
              const newText = prev + finalTranscript;
              console.log('Updated thoughts:', newText);
              return newText;
            });
            setInterimText(''); // Clear interim text after adding final
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            console.log('No speech detected, try speaking louder');
          }
          setIsListening(false);
          setInterimText('');
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setInterimText('');
        };
      }
    } else {
      console.error('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-200 via-cyan-200 to-blue-200 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="absolute top-6 left-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
          <img src={logoImage} alt="Logo" className='w-full h-full object-cover'/>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Upload the product
        </h1>

        {/* Upload Area */}
        <div
          className={`bg-white rounded-lg border-4 border-dashed transition-all duration-200 ${
            isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
          } p-16 mb-6`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-16 h-16 mb-6 text-gray-700" strokeWidth={2} />
              <p className="text-2xl font-medium text-gray-800 mb-4">
                Drag and Drop here
              </p>
              <p className="text-xl text-gray-600 mb-6">or</p>
              <button
                onClick={handleSelectClick}
                className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white px-12 py-4 rounded-lg text-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Select file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-96 rounded-lg shadow-lg mb-4"
              />
              <p className="text-lg text-gray-700 mb-2">{uploadedFile?.name}</p>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadedFile(null);
                }}
                className="text-teal-500 hover:text-teal-600 font-medium"
              >
                Remove & upload another
              </button>
            </div>
          )}
        </div>

        {/* Thoughts Input */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={thoughts + (interimText ? ' ' + interimText : '')}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Describe your thoughts..."
              className="w-full bg-white rounded-lg px-6 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              rows={3}
            />
            {interimText && (
              <span className="absolute bottom-6 right-6 text-xs text-gray-400 italic">
                (speaking...)
              </span>
            )}
          </div>
          <button 
            onClick={toggleListening}
            className={`rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 self-end ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500'
            }`}
            title={isListening ? 'Stop recording' : 'Start recording'}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>
        
        {isListening && (
          <p className="text-center mt-2 text-gray-700 text-sm">
            🎤 Listening... Speak clearly into your microphone
          </p>
        )}
      </div>
    </div>
  );
}