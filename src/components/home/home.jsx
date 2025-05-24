import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './home.css';

const Home = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [individualAnalyses, setIndividualAnalyses] = useState([]);
  const [combinedAnalysis, setCombinedAnalysis] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [responses, setResponses] = useState([]);
  const [translatedText, setTranslatedText] = useState({});
  const [visits, setVisits] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sessionQuestion, setSessionQuestion] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Predefined questions
  const questions = [
    'How are you feeling today?',
    'What has been the most challenging part of your week?',
    'Can you describe a recent positive experience?',
    'What are you most worried about right now?',
    'How do you usually cope with stress?'
  ];

  // Supported languages for translation
  const supportedLanguages = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese'
  };

  // Fetch user profile and session question
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/user/profile', {
          withCredentials: true
        });
        setVisits(response.data.visits || 0);
        setSessionQuestion(response.data.sessionQuestion || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch user profile.');
      }
    };
    fetchProfile();
  }, []);

  const startRecording = async () => {
    if (visits === 0 && !selectedQuestion) {
      setError('Please select a question before recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const question = visits > 0 ? sessionQuestion : selectedQuestion;
        const newResponse = { question, audioBlob, language };
        setResponses((prev) => {
          const updatedResponses = [...prev, newResponse];
          if (visits === 0 && updatedResponses.length === 5) {
            submitResponses(updatedResponses);
          }
          return updatedResponses;
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to access microphone. Please allow microphone permissions and try again.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      const question = visits > 0 ? sessionQuestion : selectedQuestion;
      if (question || visits > 0) {
        setResponses((prev) => [...prev, { question, audioBlob: file, language }]);
      } else {
        setError('Please select a question before uploading a file.');
      }
    } else {
      setError('Please upload a valid audio file.');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      const question = visits > 0 ? sessionQuestion : selectedQuestion;
      if (question || visits > 0) {
        setResponses((prev) => [...prev, { question, audioBlob: file, language }]);
      } else {
        setError('Please select a question before uploading a file.');
      }
    } else {
      setError('Please drop a valid audio file.');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const deleteResponse = (index) => {
    setResponses((prev) => prev.filter((_, i) => i !== index));
    if (index === responses.length - 1 && uploadedFile) {
      setUploadedFile(null);
    }
  };

  const submitResponses = async (responses) => {
    setIsLoading(true);
    setError('');
    const formData = new FormData();
    responses.forEach((response, index) => {
      formData.append(`file_${index}`, response.audioBlob, `recording_${index}.webm`);
      formData.append(`question_${index}`, response.question);
      formData.append(`language_${index}`, response.language);
    });

    try {
      const response = await axios.post('http://localhost:5000/analyze_multiple_audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000
      });
      setTranscriptions(response.data.transcriptions || []);
      setIndividualAnalyses(response.data.individual_analyses || []);
      setCombinedAnalysis(response.data.combined_analysis || 'No analysis provided');
      setResponses([]);
      setSelectedQuestion('');
      setUploadedFile(null);
      setTranslatedText({});
    } catch (err) {
      const errorMessage = err.response?.data?.error
        ? `Server error: ${err.response.data.error}`
        : err.message === 'timeout of 60000ms exceeded'
        ? 'Request timed out. Please try again with shorter audio clips.'
        : 'Failed to process audio. Please check your connection and try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setIsLoading(true);
      setError('');

      const transcriptionsToSave = transcriptions.map(item => item.text);
      const analysesToSave = individualAnalyses;

      const saveResponse = await axios.post(
        'http://localhost:5001/save_analysis',
        { transcriptions: transcriptionsToSave, analyses: analysesToSave },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      setVisits(saveResponse.data.visits || visits + 1);

      const primaryAnalysis = individualAnalyses[0] || {};
      const response = await axios.post(
        'http://localhost:5000/generate_pdf',
        { analysis: primaryAnalysis },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mental_health_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err.response?.data?.error
        ? `Error: ${err.response.data.error}`
        : 'Failed to save analyses or generate PDF. Please try again.';
      setError(errorMessage);
      console.error('Download/Save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const translateTranscription = async (text, index) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.post('http://localhost:5000/translate', {
        text,
        targetLanguage: language
      });
      setTranslatedText((prev) => ({
        ...prev,
        [index]: response.data.translatedText
      }));
    } catch (err) {
      setError('Failed to translate text. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResponses([]);
    setTranscriptions([]);
    setIndividualAnalyses([]);
    setCombinedAnalysis('');
    setSelectedQuestion('');
    setError('');
    setUploadedFile(null);
    setTranslatedText({});
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Audio Emotional Analysis
        </h1>

        {visits > 0 ? (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
            <p>{sessionQuestion ? `Please answer: ${sessionQuestion}` : 'Waiting for admin to start session...'}</p>
          </div>
        ) : (
          <>
            {/* Question Selection */}
            <div className="mb-4">
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                Select Question ({responses.length}/5)
              </label>
              <select
                id="question"
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                disabled={isRecording || isLoading || responses.length >= 5}
                aria-required="true"
              >
                <option value="">Select a question</option>
                {questions.map((q, index) => (
                  <option key={index} value={q} disabled={responses.some((r) => r.question === q)}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Language Selection */}
        <div className="mb-4">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Select Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
            disabled={isRecording || isLoading}
          >
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* File Upload / Drag and Drop */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Audio File
          </label>
          <div
            className={`border-2 border-dashed rounded-md p-4 text-center ${
              isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <p className="text-gray-500">
              Drag and drop an audio file here, or click to select a file
            </p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Select File
            </button>
            {uploadedFile && (
              <p className="mt-2 text-gray-600">Uploaded: {uploadedFile.name}</p>
            )}
          </div>
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleRecording}
            disabled={isLoading || (!selectedQuestion && visits === 0) || (!sessionQuestion && visits > 0) || responses.length >= 5}
            className={`bi bi-mic relative flex items-center justify-center w-20 h-20 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } ${isLoading || (!selectedQuestion && visits === 0) || (!sessionQuestion && visits > 0) || responses.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d={
                  isRecording
                    ? 'M6 6h12v12H6z'
                    : 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5v3h-2v-3c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2z'
                }
              />
            </svg>
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-spin"></div>
            )}
          </button>
        </div>

        {/* Responses List with Delete Option */}
        {responses.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Recorded Responses</h2>
            <ul className="space-y-2">
              {responses.map((response, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{response.question}</span>
                  <button
                    onClick={() => deleteResponse(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="text-center mb-4">
          <p className="text-gray-600">
            Responses recorded: {responses.length}/{visits === 0 ? 5 : 'unlimited'}
          </p>
          {responses.length > 0 && (
            <button
              onClick={reset}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              disabled={isLoading}
            >
              Reset Responses
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-2">Processing audio...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Transcription and Analysis Results */}
        <div
          className={`transition-opacity duration-500 ${
            transcriptions.length > 0 ? 'opacity-100' : 'opacity-0 h-0'
          }`}
        >
          {transcriptions.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Transcription and Analysis Results
              </h2>
              <button
                onClick={downloadPDF}
                className="mb-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Download PDF Report
              </button>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                {transcriptions.map((item, index) => (
                  <div
                    key={index}
                    className="mb-3 p-3 bg-white rounded shadow-sm border-l-4 border-indigo-500 animate-fade-in"
                  >
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Question: {item.question}</span>
                    </p>
                    <p className="text-gray-800 mb-2">
                      Transcription: {item.text}
                      <button
                        onClick={() => translateTranscription(item.text, index)}
                        className="ml-2 text-sm text-indigo-600 hover:text-indigo-800"
                        disabled={isLoading}
                      >
                        Translate
                      </button>
                    </p>
                    {translatedText[index] && (
                      <p className="text-gray-600 mb-2">
                        Translated ({supportedLanguages[language]}): {translatedText[index]}
                      </p>
                    )}
                    {individualAnalyses[index] && (
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">Emotions:</span>{' '}
                          {individualAnalyses[index].Emotions?.join(', ') || 'None'}
                        </p>
                        <p>
                          <span className="font-medium">Tones:</span>{' '}
                          {individualAnalyses[index].Tones?.join(', ') || 'None'}
                        </p>
                        <p>
                          <span className="font-medium">Reasons:</span>{' '}
                          {individualAnalyses[index].Reasons || 'No reasons provided'}
                        </p>
                        <p>
                          <span className="font-medium">Suggestions:</span>{' '}
                          {individualAnalyses[index].Suggestions?.join('; ') || 'None'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Combined Analysis */}
        <div
          className={`transition-opacity duration-500 ${
            combinedAnalysis && !isLoading ? 'opacity-100' : 'opacity-0 h-0'
          }`}
        >
          {combinedAnalysis && !isLoading && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Combined Analysis</h3>
              <p>{combinedAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;