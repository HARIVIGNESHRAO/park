"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useNavigate } from "react-router-dom"
import { PitchDetector } from "pitchy"
import "./admin.css"

const Admin = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [analysisType, setAnalysisType] = useState(null) // 'latest' or 'historical'
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("")
  const [sortOrder, setSortOrder] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [minAnalyses, setMinAnalyses] = useState(0)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, userId: null })
  const [viewMode, setViewMode] = useState("users")
  const [conversationUser, setConversationUser] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState("")
  const [customQuestion, setCustomQuestion] = useState("")
  const [isRecordingQuestion, setIsRecordingQuestion] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptions, setTranscriptions] = useState([])
  const [individualAnalyses, setIndividualAnalyses] = useState([])
  const [combinedAnalysis, setCombinedAnalysis] = useState("")
  const [sessionError, setSessionError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState("en")
  const [responses, setResponses] = useState([])
  const [translatedText, setTranslatedText] = useState({})
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [realTimeTranscription, setRealTimeTranscription] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [appointmentDate, setAppointmentDate] = useState("")
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
const [messageContent, setMessageContent] = useState("");
const [messageRecipientUsername, setMessageRecipientUsername] = useState(null);
const [isTypingCustom, setIsTypingCustom] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    userId: null,
    appointmentIndex: null,
    newDate: "",
    newTime: "",
  })

  const itemsPerPage = 10
  const username = Cookies.get("username")
  const navigate = useNavigate()

  const criticalEmotions = ["Sadness", "Hopelessness", "Despair"]

  const questions = [
    "How are you feeling today?",
    "What has been the most challenging part of your week?",
    "Can you describe a recent positive experience?",
    "What are you most worried about right now?",
    "How do you usually cope with stress?",
  ]

  const supportedLanguages = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    hi: "Hindi",
    te: "Telugu",
    kn: "Kannada",
  }

  const languageCodeMap = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    zh: "zh-CN",
    hi: "hi-IN",
    te: "te-IN",
    kn: "kn-IN",
  }

  useEffect(() => {
    if (!username) {
      navigate("/login")
    } else {
      const fetchUsers = async () => {
        try {
          const response = await axios.get("http://localhost:5001/users", {
            withCredentials: true,
          })
          const usersWithFollowUp = response.data.users.map((user) => ({
            ...user,
            followUpRequired: user.followUpRequired || false,
          }))
          setUsers(usersWithFollowUp || [])
          setLoading(false)
        } catch (err) {
          setError("Failed to fetch users: " + err.message)
          setLoading(false)
        }
      }
      fetchUsers()
    }
  }, [username, navigate])
const sendMessage = async () => {
  if (!messageContent.trim()) {
    alert("Please enter a message.");
    return;
  }

  try {
    await axios.post(
      "http://localhost:5001/api/messages",
      {
        username: messageRecipientUsername,
        content: messageContent,
      },
      { withCredentials: true }
    );
    alert("Message sent successfully!");
    setMessageContent("");
    setIsMessageModalOpen(false);
    setMessageRecipientUsername(null);
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message;
    alert(`Failed to send message: ${errorMessage}`);
  }
};

// Add this function to open the message modal
const openMessageModal = (userId) => {
  const user = users.find((u) => u._id === userId);
  if (user) {
    setMessageRecipientUsername(user.username);
    setIsMessageModalOpen(true);
    setContextMenu({ visible: false, x: 0, y: 0, userId: null });
  }
};
  const startRecordingQuestion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        try {
          const formData = new FormData()
          formData.append("file", audioBlob, "question_recording.webm")
          const response = await axios.post("http://localhost:5000/transcribe_audio", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          setCustomQuestion(response.data.text || "")
          setSelectedQuestion(response.data.text || "")
        } catch (err) {
          alert("Failed to transcribe recorded question: " + err.message)
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecordingQuestion(true)
    } catch (err) {
      alert("Failed to access microphone: " + err.message)
    }
  }

  const stopRecordingQuestion = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecordingQuestion(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/logout", {}, { withCredentials: true })
      Cookies.remove("username")
      navigate("/login")
    } catch (error) {
      Cookies.remove("username")
      navigate("/login")
    }
  }

  const startConversation = (user) => {
    setConversationUser(user)
    setAnalysisResults(null)
    setSelectedQuestion("")
    setCustomQuestion("")
    setIsSessionActive(false)
    setResponses([])
    setTranscriptions([])
    setIndividualAnalyses([])
    setCombinedAnalysis("")
    setSessionError("")
    setUploadedFile(null)
    setTranslatedText({})
    setViewMode("session")
  }

  const startSession = () => {
    if (!conversationUser || (!selectedQuestion && !customQuestion)) {
      alert("Please select or enter a question.")
      return
    }
    setIsSessionActive(true)
    setSessionError("")
  }

  const endSession = async () => {
    if (!conversationUser) return
    if (responses.length === 0) {
      alert("No responses recorded for this session.")
      return
    }

    setIsLoading(true)
    setSessionError("")
    const formData = new FormData()
    responses.forEach((response, index) => {
      formData.append(`file_${index}`, response.audioBlob, `recording_${index}.webm`)
      formData.append(`question_${index}`, response.question)
      formData.append(`language_${index}`, response.language)
    })

    try {
      const response = await axios.post("http://localhost:5000/analyze_multiple_audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      })
      setAnalysisResults({
        transcriptions: response.data.transcriptions || [],
        individual_analyses: response.data.individual_analyses || [],
        combined_analysis: response.data.combined_analysis || "No analysis provided",
      })
      setTranscriptions(response.data.transcriptions || [])
      setIndividualAnalyses(response.data.individual_analyses || [])
      setCombinedAnalysis(response.data.combined_analysis || "No analysis provided")
      setResponses([])
      setUploadedFile(null)
      setTranslatedText({})
      setIsSessionActive(false)
      setCustomQuestion("")
      setSelectedQuestion("")

      await axios.post(
        "http://localhost:5001/api/session/save_analysis",
        {
          userId: conversationUser._id,
          questions: responses.map((r) => r.question),
          combinedAnalysis: response.data.combined_analysis || "No analysis provided",
        },
        { withCredentials: true }
      )

      alert("Session ended and analysis saved successfully.")
    } catch (err) {
      const errorMessage = err.response?.data?.error
        ? `Server error: ${err.response.data.error}`
        : err.message === "timeout of 600000ms exceeded"
          ? "Request timed out. Please try again with shorter audio clips."
          : "Failed to process audio. Please check your connection and try again."
      setSessionError(errorMessage)
      console.error("Analysis error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    if (!selectedQuestion && !customQuestion) {
      setSessionError("Please select or enter a question.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const pitchDetector = PitchDetector.forFloat32Array(analyserRef.current.fftSize)
      const inputBuffer = new Float32Array(analyserRef.current.fftSize)

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const question = customQuestion || selectedQuestion
        setResponses((prev) => [...prev, { question, audioBlob, language }])
        stream.getTracks().forEach((track) => track.stop())
        setCustomQuestion("")
        setSelectedQuestion("")
        setRealTimeTranscription("")
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop()
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setSessionError("")

      drawPitchWaveform(pitchDetector, inputBuffer)

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        speechRecognitionRef.current = new SpeechRecognition()
        speechRecognitionRef.current.lang = languageCodeMap[language] || "en-US"
        speechRecognitionRef.current.interimResults = true
        speechRecognitionRef.current.continuous = true

        speechRecognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("")
          setRealTimeTranscription(transcript)
        }

        speechRecognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setSessionError("Speech recognition failed: " + event.error)
        }

        speechRecognitionRef.current.start()
      } else {
        setSessionError("Speech recognition not supported in this browser.")
      }
    } catch (err) {
      setSessionError("Failed to access microphone. Please allow microphone permissions and try again.")
      console.error("Recording error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const drawPitchWaveform = (pitchDetector, inputBuffer) => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const analyser = analyserRef.current

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getFloatTimeDomainData(inputBuffer)
      const [pitch, clarity] = pitchDetector.findPitch(inputBuffer, audioContextRef.current.sampleRate)

      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#2563eb"
      ctx.beginPath()

      const normalizedPitch = pitch && clarity > 0.9 ? (pitch / 1000) * canvas.height : canvas.height / 2
      ctx.moveTo(0, canvas.height - normalizedPitch)
      ctx.lineTo(canvas.width, canvas.height - normalizedPitch)
      ctx.stroke()

      ctx.fillStyle = `rgba(0, 128, 0, ${clarity})`
      ctx.fillRect(0, 0, canvas.width, 10)
    }

    draw()
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith("audio/")) {
      setUploadedFile(file)
      const question = customQuestion || selectedQuestion
      if (question) {
        setResponses((prev) => [...prev, { question, audioBlob: file, language }])
        setCustomQuestion("")
        setSelectedQuestion("")
      } else {
        setSessionError("Please select or enter a question.")
      }
    } else {
      setSessionError("Please upload a valid audio file.")
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith("audio/")) {
      setUploadedFile(file)
      const question = customQuestion || selectedQuestion
      if (question) {
        setResponses((prev) => [...prev, { question, audioBlob: file, language }])
        setCustomQuestion("")
        setSelectedQuestion("")
      } else {
        setSessionError("Please drop a valid audio file.")
      }
    } else {
      setSessionError("Please drop a valid audio file.")
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const deleteResponse = (index) => {
    setResponses((prev) => prev.filter((_, i) => i !== index))
    if (index === responses.length - 1 && uploadedFile) {
      setUploadedFile(null)
    }
  }

  const downloadPDF = async () => {
    try {
      setIsLoading(true)
      setSessionError("")

      const response = await axios.post(
        "http://localhost:5000/generate_pdf",
        {
          individual_analyses: individualAnalyses,
          combined_analysis: combinedAnalysis,
          username: conversationUser.username,
        },
        { responseType: "blob" }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `mental_health_report_${conversationUser.username}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = err.response?.data?.error
        ? `Error: ${err.response.data.error}`
        : "Failed to save analysis or generate PDF. Please try again."
      setSessionError(errorMessage)
      console.error("Download/Save error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const translateTranscription = async (text, index) => {
    try {
      setIsLoading(true)
      setSessionError("")
      const response = await axios.post("http://localhost:5000/translate", {
        text,
        targetLanguage: language,
      })
      setTranslatedText((prev) => ({
        ...prev,
        [index]: response.data.translatedText,
      }))
    } catch (err) {
      setSessionError("Failed to translate text. Please try again.")
      console.error("Translation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setResponses([])
    setTranscriptions([])
    setIndividualAnalyses([])
    setCombinedAnalysis("")
    setSessionError("")
    setUploadedFile(null)
    setTranslatedText({})
    setRealTimeTranscription("")
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleFollowUp = async (userId, currentStatus) => {
    const newStatus = !currentStatus
    const confirmChange = window.confirm(`Change follow-up status to ${newStatus ? "Yes" : "No"} for this user?`)
    if (confirmChange) {
      try {
        await axios.patch(`http://localhost:5001/users/${userId}`, {
          followUpRequired: newStatus,
        })
        setUsers(users.map((user) => (user._id === userId ? { ...user, followUpRequired: newStatus } : user)))
      } catch (err) {
        alert("Failed to update follow-up status: " + (err.response?.data?.message || err.message))
      }
    }
  }

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      try {
        await Promise.all(selectedUsers.map((userId) => axios.delete(`http://localhost:5001/users/${userId}`)))
        setUsers(users.filter((user) => !selectedUsers.includes(user._id)))
        setSelectedUsers([])
        setSelectedUser(null)
        alert("Selected users deleted successfully!")
      } catch (err) {
        alert("Failed to delete users: " + (err.response?.data?.message || err.message))
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, userId: null })
  }

  const exportSelectedToCSV = () => {
    if (selectedUsers.length === 0) return
    const selectedData = users.filter((user) => selectedUsers.includes(user._id))
    const headers = [
      "Username",
      "Email",
      "Phone Number",
      "Age",
      "Total Analyses",
      "Last Analysis Date",
      "Follow Up Required",
      "Appointments",
      "Analyses",
    ].join(",")

    const rows = selectedData.map((user) => {
      const analysesDetails = (user.analyses || [])
        .map((analysis) => {
          return [
            `Transcription: ${analysis.transcription || "N/A"}`,
            `Emotions: ${(analysis.analysis?.Emotions || []).join(", ") || "N/A"}`,
            `Reasons: ${analysis.analysis?.Reasons || "N/A"}`,
            `Date: ${analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : "N/A"}`,
          ].join("; ")
        })
        .join(" | ")

      return [
        `"${user.username}"`,
        `"${user.email}"`,
        `"${user.phoneNumber ?? "Not specified"}"`,
        `"${user.age ?? "Not specified"}"`,
        (user.analyses || []).length,
        (user.analyses || []).length > 0
          ? `"${new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()}"`
          : '"No analyses yet"',
        user.followUpRequired ? "Yes" : "No",
        user.AppointmentApproved && user.appointments?.length > 0
          ? `"${user.appointments.map((appt) => `${appt.date} ${appt.time} with ${appt.doctor}`).join("; ")}"`
          : '"No approved appointments"',
        `"${analysesDetails.replace(/"/g, '""')}"`,
      ].join(",")
    })

    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "selected_users_data.csv"
    link.click()
    setContextMenu({ visible: false, x: 0, y: 0, userId: null })
  }

  const handleContextMenu = (e, userId) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      userId,
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, userId: null })
  }

  const viewUserDetails = (userId) => {
    const user = users.find((u) => u._id === userId)
    setSelectedUser(user)
    setContextMenu({ visible: false, x: 0, y: 0, userId: null })
  }

  const closeUserDetails = () => {
    setSelectedUser(null)
  }

const openModal = async (userId, type) => {
  try {
    const user = users.find((u) => u._id === userId);
    if (!user) {
      alert("User not found");
      return;
    }

    if (type === "latest") {
      if (!user.session?.latestAnalysis?.combined_analysis) {
        alert("No latest analysis available");
        return;
      }
      setSelectedAnalysis(user.session.latestAnalysis);
      setAnalysisType("latest");
    } else {
      if (!user.analyses?.length) {
        alert("No historical analyses available");
        return;
      }
      setSelectedAnalysis(user.analyses);
      setAnalysisType("historical");
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || "Unknown error";
    alert(`Failed to fetch analysis: ${errorMessage}`);
    console.error("View analysis error:", err);
  }
};

  const closeModal = () => {
    setSelectedAnalysis(null)
    setAnalysisType(null)
  }

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.delete(`http://localhost:5001/users/${userId}`)
        if (response.status === 200) {
          setUsers(users.filter((user) => user._id !== userId))
          if (selectedUser && selectedUser._id === userId) setSelectedUser(null)
          alert("User deleted successfully!")
        }
      } catch (err) {
        alert("Failed to delete user: " + (err.response?.data?.message || err.message))
      }
    }
  }

  const sortUsers = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortOrder(order)
    const sorted = [...users].sort((a, b) => {
      if (field === "username") {
        return order === "asc" ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username)
      }
      if (field === "totalAnalyses") {
        return order === "asc"
          ? (a.analyses?.length || 0) - (b.analyses?.length || 0)
          : (b.analyses?.length || 0) - (a.analyses?.length || 0)
      }
      if (field === "lastAnalysisDate") {
        const aDate =
          (a.analyses?.length || 0) > 0 ? new Date(a.analyses[a.analyses.length - 1].createdAt) : new Date(0)
        const bDate =
          (b.analyses?.length || 0) > 0 ? new Date(b.analyses[b.analyses.length - 1].createdAt) : new Date(0)
        return order === "asc" ? aDate - bDate : bDate - aDate
      }
      if (field === "phoneNumber") {
        const aPhone = a.phoneNumber || ""
        const bPhone = b.phoneNumber || ""
        return order === "asc" ? aPhone.localeCompare(bPhone) : bPhone.localeCompare(aPhone)
      }
      if (field === "followUpRequired") {
        return order === "asc"
          ? (a.followUpRequired ? 1 : 0) - (b.followUpRequired ? 1 : 0)
          : (b.followUpRequired ? 1 : 0) - (a.followUpRequired ? 1 : 0)
      }
      if (field === "appointments") {
        const aAppt =
          a.AppointmentApproved && a.appointments?.length > 0 ? new Date(a.appointments[0].date) : new Date(0)
        const bAppt =
          b.AppointmentApproved && b.appointments?.length > 0 ? new Date(b.appointments[0].date) : new Date(0)
        return order === "asc" ? aAppt - bAppt : bAppt - aAppt
      }
      return 0
    })
    setUsers(sorted)
  }

  const exportToCSV = () => {
    const headers = [
      "Username",
      "Email",
      "Phone Number",
      "Age",
      "Total Analyses",
      "Last Analysis Date",
      "Follow Up Required",
      "Appointments",
      "Analyses",
    ].join(",")

    const rows = filteredUsers.map((user) => {
      const analysesDetails = (user.analyses || [])
        .map((analysis) => {
          return [
            `Transcription: ${analysis.transcription || "N/A"}`,
            `Emotions: ${(analysis.analysis?.Emotions || []).join(", ") || "N/A"}`,
            `Reasons: ${analysis.analysis?.Reasons || "N/A"}`,
            `Date: ${analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : "N/A"}`,
          ].join("; ")
        })
        .join(" | ")

      return [
        `"${user.username}"`,
        `"${user.email}"`,
        `"${user.phoneNumber ?? "Not specified"}"`,
        `"${user.age ?? "Not specified"}"`,
        (user.analyses || []).length,
        (user.analyses || []).length > 0
          ? `"${new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()}"`
          : '"No analyses yet"',
        user.followUpRequired ? "Yes" : "No",
        user.AppointmentApproved && user.appointments?.length > 0
          ? `"${user.appointments.map((appt) => `${appt.date} ${appt.time} with ${appt.doctor}`).join("; ")}"`
          : '"No approved appointments"',
        `"${analysesDetails.replace(/"/g, '""')}"`,
      ].join(",")
    })

    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "users帶你去_data.csv"
    link.click()
  }

  const getEmotionDistribution = (analyses) => {
    const emotionCounts = analyses.reduce((acc, analysis) => {
      ;(analysis.analysis?.Emotions || []).forEach((emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1
      })
      return acc
    }, {})
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0)
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalEmotions > 0 ? ((count / totalEmotions) * 100).toFixed(1) : 0,
      isCritical: criticalEmotions.includes(emotion),
    }))
  }

  const getCriticalEmotionCount = (analyses) => {
    const uniqueCriticalEmotions = new Set()
    analyses.forEach((analysis) => {
      ;(analysis.analysis?.Emotions || []).forEach((emotion) => {
        if (criticalEmotions.includes(emotion)) {
          uniqueCriticalEmotions.add(emotion)
        }
      })
    })
    return uniqueCriticalEmotions.size
  }

  const handleDateFilter = (e) => {
    setAppointmentDate(e.target.value)
  }

  const handleStatusFilter = (status) => {
    setFilterStatus(status)
  }

  const rescheduleAppointment = async (userId, appointmentIndex, newDate, newTime) => {
    try {
      const user = users.find((u) => u._id === userId)
      if (!user || !user.appointments || user.appointments.length <= appointmentIndex) {
        alert("User or appointment not found")
        return false
      }

      const response = await axios.post(
        `http://localhost:5001/api/reschedule-appointment`,
        {
          userId,
          appointmentIndex,
          newDate,
          newTime,
        },
        { withCredentials: true }
      )

      if (response.status === 200) {
        const updatedUser = response.data.appointment
        setUsers(users.map((u) => {
          if (u._id === userId) {
            const updatedAppointments = [...u.appointments]
            updatedAppointments[appointmentIndex] = {
              ...updatedAppointments[appointmentIndex],
              date: newDate,
              time: newTime,
              status: "Rescheduled",
            }
            return { ...u, appointments: updatedAppointments }
          }
          return u
        }))
        alert("Appointment rescheduled successfully!")
        return true
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message
      alert(`Failed to reschedule appointment: ${errorMessage}`)
      return false
    }
  }

  const cancelAppointment = async (userId, appointmentIndex) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const user = users.find((u) => u._id === userId)
        if (!user || !user.appointments || user.appointments.length <= appointmentIndex) {
          alert("User or appointment not found")
          return false
        }

        const response = await axios.post(
          `http://localhost:5001/api/cancel-appointment`,
          {
            userId,
            appointmentIndex,
          },
          { withCredentials: true }
        )

        if (response.status === 200) {
          setUsers(users.map((u) => {
            if (u._id === userId) {
              const updatedAppointments = [...u.appointments]
              updatedAppointments[appointmentIndex] = {
                ...updatedAppointments[appointmentIndex],
                status: "Cancelled",
              }
              const hasActiveAppointments = updatedAppointments.some((appt) => appt.status !== "Cancelled")
              return {
                ...u,
                appointments: updatedAppointments,
                AppointmentApproved: hasActiveAppointments,
              }
            }
            return u
          }))
          alert("Appointment cancelled successfully!")
          return true
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message
        alert(`Failed to cancel appointment: ${errorMessage}`)
        return false
      }
    }
    return false
  }

  const openRescheduleModal = (userId, appointmentIndex, currentDate, currentTime) => {
    setRescheduleData({
      userId,
      appointmentIndex,
      newDate: currentDate,
      newTime: currentTime,
    })
    setIsRescheduleModalOpen(true)
  }

  const handleReschedule = async () => {
    const { userId, appointmentIndex, newDate, newTime } = rescheduleData
    if (!newDate || !newTime) {
      alert("Please select both date and time")
      return
    }

    const success = await rescheduleAppointment(userId, appointmentIndex, newDate, newTime)
    if (success) {
      setIsRescheduleModalOpen(false)
    }
  }

  const getFilteredAppointments = () => {
    let filtered = users.filter((user) => user.AppointmentApproved && user.appointments?.length > 0)

    if (appointmentDate) {
      filtered = filtered.filter((user) => user.appointments.some((appt) => appt.date === appointmentDate))
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => {
        if (filterStatus === "upcoming") {
          return user.appointments.some((appt) => new Date(appt.date) >= new Date())
        } else if (filterStatus === "completed") {
          return user.appointments.some((appt) => new Date(appt.date) < new Date())
        } else if (filterStatus === "cancelled") {
          return user.appointments.some((appt) => appt.status === "Cancelled")
        }
        return true
      })
    }

    return filtered
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) && (user.analyses || []).length >= minAnalyses,
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  if (!username) {
    return (
      <div className="admin-container">
        <h1>Access Denied</h1>
        <p>Only authorized users with restricted access can log in.</p>
      </div>
    )
  }

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading users...
      </div>
    )
  if (error) return <div className="error">{error}</div>

  return (
    <div className="admin-container" onClick={() => setContextMenu({ visible: false, x: 0, y: 0, userId: null })}>
      <div className="admin-header">
        <h1>Dr.Prashik Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
      <div className="nav-bar">
        <div className={`nav-item ${viewMode === "users" ? "active" : ""}`} onClick={() => setViewMode("users")}>
          User Details
        </div>
        <div
          className={`nav-item ${viewMode === "appointments" ? "active" : ""}`}
          onClick={() => setViewMode("appointments")}
        >
          Appointments
        </div>
      </div>

      {viewMode === "users" && (
        <>
          <div className="dashboard-controls">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <input
                type="number"
                placeholder="Min Analyses"
                value={minAnalyses}
                onChange={(e) => setMinAnalyses(Math.max(0, Number.parseInt(e.target.value) || 0))}
                className="min-analyses-input"
                min="0"
              />
            </div>
            <div>
              <button className="export-btn" onClick={exportToCSV}>
                Export All to CSV
              </button>
            </div>
          </div>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th onClick={() => sortUsers("appointments")}>
                    Appointments {sortField === "appointments" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => sortUsers("username")}>
                    Username {sortField === "username" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => sortUsers("phoneNumber")}>
                    Phone Number {sortField === "phoneNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => sortUsers("totalAnalyses")}>
                    Total Analyses {sortField === "totalAnalyses" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => sortUsers("lastAnalysisDate")}>
                    Last Analysis Date {sortField === "lastAnalysisDate" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => sortUsers("followUpRequired")}>
                    Follow Up Required {sortField === "followUpRequired" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => {
                  const criticalCount = getCriticalEmotionCount(user.analyses || [])
                  return (
                    <tr
                      key={user._id}
                      className={selectedUsers.includes(user._id) ? "selected-row" : ""}
                      onClick={() => toggleUserSelection(user._id)}
                      onContextMenu={(e) => handleContextMenu(e, user._id)}
                    >
                      <td>
                        {user.AppointmentApproved && user.appointments?.length > 0
                          ? user.appointments.map((appt, index) => (
                              <div key={index}>
                                {appt.date} {appt.time} with {appt.doctor}
                              </div>
                            ))
                          : "No approved appointments"}
                      </td>
                      <td>
                        {criticalCount > 0 && (
                          <span className={`critical-indicator ${criticalCount > 1 ? "red" : "yellow"}`}></span>
                        )}
                        {user.username}
                      </td>
                      <td>{user.phoneNumber ?? "Not specified"}</td>
                      <td>{(user.analyses || []).length}</td>
                      <td>
                        {(user.analyses || []).length > 0
                          ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
                          : "No analyses yet"}
                      </td>
                      <td>
                        <span
                          className={`follow-up-status ${user.followUpRequired ? "yes" : "No"}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFollowUp(user._id, user.followUpRequired)
                          }}
                        >
                          {user.followUpRequired ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="details-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal(user._id, "latest")
                          }}
                        >
                          View Latest Analysis
                        </button>
                        {(user.analyses || []).length > 0 ? (
                          <button
                            className="details-btn mt-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              openModal(user._id, "historical")
                            }}
                          >
                            View Historical Analyses
                          </button>
                        ) : (
                          <p>No historical analyses available</p>
                        )}
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteUser(user._id)
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>Next</button>
          </div>
        </>
      )}

      {viewMode === "appointments" && (
        <div className="appointments-table">
          <h2>Upcoming Appointments</h2>

          <div className="dashboard-controls">
            <div className="filter-group">
              <input type="date" value={appointmentDate} onChange={handleDateFilter} className="search-input" />
              <select
                className="search-input"
                value={filterStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="appointment-cards">
            {getFilteredAppointments().map((user) =>
              user.appointments.map((appt, index) => (
                <div key={`${user._id}-${index}`} className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-date">{appt.date}</div>
                    <div className="appointment-status status-upcoming">
                      {appt.status || "Upcoming"}
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="appointment-detail">
                      <div className="appointment-detail-label">Patient:</div>
                      <div className="appointment-detail-value">{user.username}</div>
                    </div>
                    <div className="appointment-detail">
                      <div className="appointment-detail-label">Time:</div>
                      <div className="appointment-detail-value">{appt.time}</div>
                    </div>
                    <div className="appointment-detail">
                      <div className="appointment-detail-label">Doctor:</div>
                      <div className="appointment-detail-value">{appt.doctor}</div>
                    </div>
                    <div className="appointment-detail">
                      <div className="appointment-detail-label">Phone:</div>
                      <div className="appointment-detail-value">{user.phoneNumber || "Not specified"}</div>
                    </div>
                  </div>

                  <div className="appointment-actions">
                    <button className="appointment-action-btn action-view" onClick={() => startConversation(user)}>
                      Start Session
                    </button>
                    <button
                      className="appointment-action-btn action-reschedule"
                      onClick={() => openRescheduleModal(user._id, index, appt.date, appt.time)}
                    >
                      Reschedule
                    </button>
                    <button
 className="appointment-action-btn action-cancel"
                      onClick={() => cancelAppointment(user._id, index)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )),
            )}

            {getFilteredAppointments().length === 0 && (
              <div className="text-center p-4 bg-white rounded-lg shadow w-full">
                <p className="text-gray-600">No appointments found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "session" && conversationUser && (
        <div className="session-screen flex flex-row gap-12 p-6 min-h-screen">
    <div className="w-1/2 flex flex-col">
      <button
        className="back-btn mb-4"
        onClick={() => {
          setConversationUser(null);
          setIsSessionActive(false);
          setViewMode("appointments");
        }}
      >
        Back to Appointments
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Session with {conversationUser.username}</h2>
      <div className="conversation-container bg-gray-50 p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
            Select Predefined Question
          </label>
          <select
            id="question"
            value={isTypingCustom ? "custom" : selectedQuestion}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setIsTypingCustom(true);
                setSelectedQuestion("");
                setCustomQuestion("");
              } else {
                setIsTypingCustom(false);
                setSelectedQuestion(e.target.value);
                setCustomQuestion(e.target.value);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isRecording || isLoading}
          >
            <option value="">Select a question</option>
            {questions.map((q, index) => (
              <option key={index} value={q}>
                {q}
              </option>
            ))}
            <option value="custom">Type a Custom Question</option>
          </select>
          {isTypingCustom && (
              <div className="mb-4">
                <input
              type="text"
              value={customQuestion}
              onChange={(e) => {
                setCustomQuestion(e.target.value);
                setSelectedQuestion(e.target.value);
              }}
              className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Type your custom question here"
              disabled={isRecording || isLoading}
            />
              </div>
          )}
        </div>
        <div className="flex gap-4 my-4">
          <button
            className="mic-btn"
            onClick={startSession}
            disabled={isSessionActive || (!selectedQuestion && !customQuestion)}
          >
            Start Session
          </button>
          <button
            className="end-btn"
            onClick={endSession}
            disabled={!isSessionActive || responses.length === 0}
          >
            End Session
          </button>
        </div>
      </div>
    </div>

          <div className="w-1/2 flex flex-col">
            {isSessionActive ? (
              <div className="bg-white rounded-lg shadow-lg p-6 flex-grow">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Audio Emotional Analysis</h1>
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
                  <p>Please answer: {customQuestion || selectedQuestion}</p>
                </div>

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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Audio File</label>
                  <div
                    className={`border-2 border-dashed rounded-md p-4 text-center ${
                      isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <p className="text-gray-500">Drag and drop an audio file here, or click to select a file</p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Select File
                    </button>
                    {uploadedFile && <p className="mt-2 text-gray-600">Uploaded: {uploadedFile.name}</p>}
                  </div>
                </div>

                <div className="mic-container">
                  <p className="mic-text">Hold to Record Response</p>
                  <canvas ref={canvasRef} width="400" height="100" className="waveform-canvas mb-4"></canvas>
                  <div className="relative">
                    <div className={`mic-tone-ring ${isRecording ? "active" : ""}`}></div>
                    <button
                      onClick={toggleRecording}
                      disabled={isLoading}
                      className={`bi bi-mic relative flex items-center justify-center w-20 h-20 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-300 ${
                        isRecording ? "bg-red-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          d={
                            isRecording
                              ? "M6 6h12v12H6z"
                              : "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5v3h-2v-3c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2z"
                          }
                        />
                      </svg>
                      {isRecording && (
                        <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-spin"></div>
                      )}
                    </button>
                  </div>
                  {isRecording && <div className="transcription-box">{realTimeTranscription}</div>}
                </div>

                {responses.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Recorded Responses</h2>
                    <ul className="space-y-2">
                      {responses.map((response, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>Question: {response.question}</span>
                          <button
                            onClick={() => deleteResponse(index)}
                            className="text-red-600 hover:text-red-800"
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-gray-600">Responses recorded: {responses.length}</p>
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

                {isLoading && (
                  <div className="text-center mb-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-600 mt-2">Processing audio...</p>
                  </div>
                )}

                {sessionError && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                    <p>{sessionError}</p>
                  </div>
                )}
              </div>
            ) : analysisResults ? (
              <div className="bg-white rounded-lg shadow-lg p-6 flex-grow">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Session Analysis Results</h1>
                <button
                  onClick={downloadPDF}
                  className="mb-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Generate PDF Report
                </button>

                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Transcription and Analysis Results</h2>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    {analysisResults.transcriptions.map((item, index) => (
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
                        {analysisResults.individual_analyses[index] && (
                          <div className="text-sm">
                            <p>
                              <span className="font-medium">Emotions:</span>{" "}
                              {analysisResults.individual_analyses[index].Emotions?.join(", ") || "None"}
                            </p>
                            <p>
                              <span className="font-medium">Tones:</span>{" "}
                              {analysisResults.individual_analyses[index].Tones?.join(", ") || "None"}
                            </p>
                            <p>
                              <span className="font-medium">Reasons:</span>{" "}
                              {analysisResults.individual_analyses[index].Reasons || "No reasons provided"}
                            </p>
                            <p>
                              <span className="font-medium">Suggestions:</span>{" "}
                              {analysisResults.individual_analyses[index].Suggestions?.join("; ") || "None"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2">Combined Analysis</h3>
                  <p>{analysisResults.combined_analysis}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600 flex-grow">
                <p>Session not started or no analysis available.</p>
              </div>
            )}
          </div>
        </div>
      )}

{contextMenu.visible && (
  <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
    <button onClick={() => viewUserDetails(contextMenu.userId)}>View Details</button>
    <button onClick={exportSelectedToCSV}>Export Selected ({selectedUsers.length})</button>
    <button onClick={bulkDeleteUsers}>Delete Selected ({selectedUsers.length})</button>
    <button onClick={() => openMessageModal(contextMenu.userId)}>Message</button>
  </div>
)}

      {selectedAnalysis && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} title="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2>Analysis Details</h2>
            {analysisType === "latest" ? (
              <div>
                <p>
                    <strong>Date:</strong>{" "}
                      {selectedAnalysis.createdAt ? new Date(selectedAnalysis.createdAt).toLocaleString() : "N/A"}
                    </p>
                    <h3>Questions Asked:</h3>
                    {selectedAnalysis.questions && selectedAnalysis.questions.length > 0 ? (
                      <ul>
                        {selectedAnalysis.questions.map((question, index) => (
                          <li key={index}>
                            {index + 1}. {question}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No questions available</p>
                    )}
                <h3>Combined Analysis:</h3>
                {analysisType === "latest" && selectedAnalysis?.combined_analysis ? (
                <p>{selectedAnalysis.combined_analysis}</p>
                ) : analysisType === "historical" && Array.isArray(selectedAnalysis) ? (
                <ul>
                  {selectedAnalysis.map((analysis, index) => (
                    <li key={index}>{analysis.combined_analysis || "No analysis data"}</li>
                  ))}
                </ul>
                ) : (
                <p>No analysis data available</p>
                )}
              </div>
            ) : (
              <>
                <div className="emotion-chart">
                  <h3>Emotion Distribution</h3>
                  <div className="chart-container">
                    {getEmotionDistribution(selectedAnalysis).map(({ emotion, percentage, isCritical }) => (
                      <div key={emotion} className={`emotion-bar ${isCritical ? "critical" : ""}`}>
                        <span className="emotion-label">{emotion}</span>
                        <div className="bar-wrapper">
                          <div className="bar" style={{ width: `${percentage}%` }}></div>
                          <span className="bar-value">({percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <ul>
                  {selectedAnalysis.map((analysis, index) => (
                    <li key={index}>
                      <strong>Transcription:</strong> {analysis.transcription || "N/A"}
                      <br />
                      <strong>Emotions:</strong> {(analysis.analysis?.Emotions || []).join(", ") || "N/A"}
                      <br />
                      <strong>Reasons:</strong> {analysis.analysis?.Reasons || "N/A"}
                      <br />
                      <strong>Suggestions:</strong> {(analysis.analysis?.Suggestions || []).join("; ") || "N/A"}
                      <br />
                      <strong>Date:</strong>{" "}
                      {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : "N/A"}
                      <br />
                      <hr />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal active" onClick={closeUserDetails}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeUserDetails} title="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2>User Profile Details</h2>
            {selectedUser ? (
              <div className="profile-details">
                <div className="avatar-section">
                  <img
                    src={selectedUser.avatar || "/api/placeholder/200/200"}
                    alt="User Avatar"
                    className="avatar-full"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/200/200"
                    }}
                  />
                </div>
                <div className="details-list">
                  <div className="detail-item">
                    <strong>Username:</strong> {selectedUser.username || "N/A"}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {selectedUser.email || "N/A"}
                  </div>
                  <div className="detail-item">
                    <strong>Phone Number:</strong> {selectedUser.phoneNumber ?? "Not specified"}
                  </div>
                  <div className="detail-item">
                    <strong>Age:</strong> {selectedUser.age ?? "Not specified"}
                  </div>
                  <div className="detail-item">
                    <strong>Follow Up Required:</strong> {selectedUser.followUpRequired ? "Yes" : "No"}
                  </div>
                  <div className="detail-item">
                    <strong>Google ID:</strong> {selectedUser.googleId ?? "N/A"}
                  </div>
                  <div className="detail-item">
                    <strong>GitHub ID:</strong> {selectedUser.githubId ?? "N/A"}
                  </div>
                  <div className="detail-item">
                    <strong>Total Analyses:</strong> {(selectedUser.analyses || []).length || 0}
                  </div>
                  <div className="detail-item">
                    <strong>Appointments:</strong>
                    {selectedUser.AppointmentApproved && selectedUser.appointments?.length > 0
                      ? selectedUser.appointments.map((appt, index) => (
                          <div key={index}>
                            {appt.date} {appt.time} with {appt.doctor}
                          </div>
                        ))
                      : "No approved appointments"}
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading user details...</p>
            )}
          </div>
        </div>
      )}

      {isRescheduleModalOpen && (
        <div className="modal active" onClick={() => setIsRescheduleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsRescheduleModalOpen(false)} title="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2>Reschedule Appointment</h2>
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="new-date" className="block text-sm font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  id="new-date"
                  type="date"
                  className="question-input"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="new-time" className="block text-sm font-medium text-gray-700 mb-1">
                  New Time
                </label>
                <input
                  id="new-time"
                  type="time"
                  className="question-input"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsRescheduleModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleReschedule}>
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        {isMessageModalOpen && (
  <div className="modal active" onClick={() => setIsMessageModalOpen(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button
        className="modal-close"
        onClick={() => setIsMessageModalOpen(false)}
        title="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h2>Send Message</h2>
      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="message-content" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message-content"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Type your message here..."
            rows="4"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => setIsMessageModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="bg-primary text-white px-4 py-2 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default Admin
