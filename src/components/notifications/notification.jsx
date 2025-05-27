import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  X,
  ChevronRight,
  Bell,
  MessageSquare,
} from 'lucide-react';
import './notification.css';

export default function NotificationComponent() {
  const [showNotification, setShowNotification] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentApproved, setAppointmentApproved] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
  const [firstVisit, setFirstVisit] = useState(true);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [choice, setChoice] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({});
  const [userId, setUserId] = useState(null);
  // Added: New state to track "Wait for Doctor" message
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfileAndMessages = async () => {
      setLoading(true);
      try {
        const profileResponse = await fetch(
          'http://localhost:5001/api/user/profile',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            throw new Error('Please log in to view your profile');
          }
          throw new Error(`Failed to fetch profile data: ${profileResponse.statusText}`);
        }

        const profileData = await profileResponse.json();
        console.log('Fetched profile data:', profileData);

        const messagesResponse = await fetch(
          'http://localhost:5001/api/messages',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json();
          throw new Error(errorData.error || `Failed to fetch messages: ${messagesResponse.statusText}`);
        }

        const messagesData = await messagesResponse.json();
        console.log('Fetched messages from Message collection:', messagesData.messages);

        const slotsResponse = await fetch(
          'http://localhost:5001/api/booked-slots',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!slotsResponse.ok) {
          throw new Error('Failed to fetch booked slots');
        }

        const slotsData = await slotsResponse.json();

        if (isMounted) {
          setUserId(profileData._id);
          setFirstVisit(profileData.firstVisit);
          setFollowUpRequired(profileData.followUpRequired || false);
          setShowNotification(true);
          setPhoneNumber(profileData.phoneNumber || '');
          setAppointmentApproved(profileData.AppointmentApproved || false);
          setAppointments(profileData.appointments || []);
          setMessages(messagesData.messages || []);
          setBookedSlots(slotsData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchUserProfileAndMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      dates.push({
        date: formattedDate,
        sessions: getSessionsForDate(i),
      });
    }
    return dates;
  };

  const getSessionsForDate = (dayOffset) => {
    switch (dayOffset % 3) {
      case 0:
        return ['morning (9-11)', 'evening (2-4)'];
      case 1:
        return ['morning (9-11)'];
      case 2:
        return ['evening (2-4)'];
      default:
        return ['morning (9-11)', 'evening (2-4)'];
    }
  };

  const getTimeSlots = (session) => {
    if (session === 'morning (9-11)') {
      return ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'];
    }
    return ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];
  };

  const isSlotBooked = (date, time) => {
    return bookedSlots[date]?.includes(time);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(2);
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setStep(3);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleChoice = async (selectedChoice) => {
    setChoice(selectedChoice);
    if (selectedChoice === 'yes') {
      setStep(1);
      setSelectedDate('');
      setSelectedSession('');
      setSelectedTime('');
    } else if (selectedChoice === 'no') {
      // Modified: Do not update followUpRequired, just show message
      setWaitingForDoctor(true);
      setFirstVisit(false); // Update local state only
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  const handleConfirm = async () => {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number not available');
      }

      const bookResponse = await fetch(
        'http://localhost:5001/api/book-appointment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            date: selectedDate,
            time: selectedTime,
            doctor: 'Dr. Prashik',
          }),
        }
      );

      if (!bookResponse.ok) {
        const errorData = await bookResponse.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      const bookData = await bookResponse.json();

      // Update firstVisit to false after successful booking
      const updateStatusResponse = await fetch(
        'http://localhost:5001/api/user/update-status',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ firstVisit: false }),
        }
      );

      if (!updateStatusResponse.ok) {
        throw new Error('Failed to update firstVisit status');
      }

      const smsResponse = await fetch('http://localhost:5001/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: `+91${phoneNumber}`,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (!smsResponse.ok) {
        throw new Error('Failed to send SMS');
      }

      setSuccess(true);
      setAppointmentApproved(true);
      setAppointments(bookData.user.appointments);
      setFirstVisit(false); // Update local state
      setBookedSlots((prev) => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), selectedTime],
      }));
      setChoice(null);
      setWaitingForDoctor(false); // Reset waiting state
      setStep(1);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (e) {
      setError(e.message);
      setSuccess(false);
    }
  };

  const handleReschedule = async (appointmentIndex, newDate, newTime) => {
    try {
      const response = await fetch(
        'http://localhost:5001/api/reschedule-appointment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            appointmentIndex,
            newDate,
            newTime,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reschedule appointment');
      }

      const rescheduleData = await response.json();
      setAppointments((prev) => {
        const updatedAppointments = [...prev];
        updatedAppointments[appointmentIndex] = rescheduleData.appointment;
        return updatedAppointments;
      });
      setBookedSlots((prev) => ({
        ...prev,
        [newDate]: [...(prev[newDate] || []), newTime],
      }));
      setSuccess(true);
      setChoice(null);
      setWaitingForDoctor(false); // Reset waiting state
      setStep(1);
      setSelectedDate('');
      setSelectedSession('');
      setSelectedTime('');
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to reschedule appointment: ' + err.message);
    }
  };

  const handleDelete = async (appointmentIndex) => {
    try {
      const response = await fetch(
        'http://localhost:5001/api/cancel-appointment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            appointmentIndex,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }

      const cancelData = await response.json();
      setAppointments(cancelData.appointments);
      setAppointmentApproved(cancelData.AppointmentApproved);
      setSuccess(true);
      setChoice(null);
      setWaitingForDoctor(false); // Reset waiting state
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to cancel appointment: ' + err.message);
    }
  };

  const handleClose = () => {
    setShowNotification(true);
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/messages/${messageId}/read`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark message as read');
      }

      const { messages } = await response.json();
      setMessages(messages);
      console.log('Updated messages after marking as read:', messages);
    } catch (err) {
      console.error('Error marking message as read:', err);
      setError('Failed to mark message as read: ' + err.message);
    }
  };

  const formatMessageDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date';
    }
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  if (loading) return <div className="notification-loading">Loading...</div>;
  if (error) return <div className="notification-error">{error}</div>;
  if (!showNotification)
    return <div className="notification-empty">No notifications</div>;

  return (
    <div className="notification-container">
      <div className="notification-header">
        <div className="header-content">
          <Bell size={18} className="header-icon" />
          <h3 className="header-title">Notifications</h3>
        </div>
      </div>

      <div className="notification-tabs">
        <button
          className={`tab-button ${
            activeTab === 'appointments' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button
          className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
          {messages.some((msg) => !msg.read) && (
            <span className="unread-badge"></span>
          )}
        </button>
      </div>

      <div className="notification-body">
        {activeTab === 'appointments' && (
          <>
            {success && (
              <div className="success-message">Operation successful!</div>
            )}
            {appointmentApproved && appointments.length > 0 && (
              <div className="appointment-schedule">
                <h4 className="schedule-title">Your Scheduled Appointments</h4>
                {appointments.map((appointment, index) => (
                  <div key={index} className="appointment-details">
                    <div className="doctor-info">
                      <div className="doctor-avatar">
                        <span className="avatar-text">Dr</span>
                      </div>
                      <div>
                        <h4 className="doctor-name">{appointment.doctor}</h4>
                        <p className="doctor-specialty">Psychologist</p>
                      </div>
                    </div>
                    <div className="confirmation-details">
                      <Calendar size={16} className="detail-icon" />
                      <span className="detail-date">{appointment.date}</span>
                      <Clock size={16} className="detail-icon" />
                      <span>{appointment.time}</span>
                      <span className="status-text">
                        Status: {appointment.status}
                      </span>
                    </div>
                    {appointment.status !== 'Cancelled' && (
                      <div className="appointment-actions">
                        <button
                          onClick={() => {
                            setStep(1);
                            setSelectedDate('');
                            setSelectedSession('');
                            setSelectedTime('');
                            setChoice('yes');
                            setWaitingForDoctor(false); // Reset waiting state
                          }}
                          className="action-button reschedule"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="action-button delete"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    <p className="approved-message">
                      {appointment.status === 'Scheduled' ||
                      appointment.status === 'Rescheduled'
                        ? 'Your appointment has been approved!'
                        : 'This appointment has been cancelled.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {/* Modified: Show waiting message when waitingForDoctor is true */}
            {!firstVisit && !followUpRequired && choice === null && !waitingForDoctor && (
              <div className="choice-container">
                <p className="choice-label">
                  Would you like to book appointment or wait for doctor's follow-up?
                </p>
                <div className="choice-buttons">
                  <button
                    onClick={() => handleChoice('yes')}
                    className="choice-button"
                  >
                    Book Appointment
                  </button>
                  <button
                    onClick={() => handleChoice('no')}
                    className="choice-button"
                  >
                    Wait for Doctor
                  </button>
                </div>
              </div>
            )}
            {/* Added: Show waiting message */}
            {waitingForDoctor && (
              <div className="waiting-message">
                <p>We will contact you when the doctor says yes.</p>
              </div>
            )}
            {/* Modified: Show scheduling interface when firstVisit is true, choice is 'yes', or followUpRequired is true */}
            {(firstVisit || choice === 'yes' || followUpRequired) && (
              <>
                {step <= 4 && (
                  <div className="progress-indicator">
                    <div
                      className={`progress-dot ${step >= 1 ? 'active' : ''}`}
                    ></div>
                    <div
                      className={`progress-dot ${step >= 2 ? 'active' : ''}`}
                    ></div>
                    <div
                      className={`progress-dot ${step >= 3 ? 'active' : ''}`}
                    ></div>
                    <div
                      className={`progress-dot ${step >= 4 ? 'active' : ''}`}
                    ></div>
                  </div>
                )}
                <div className="doctor-info">
                  <div className="doctor-avatar">
                    <span className="avatar-text">Dr</span>
                  </div>
                  <div>
                    <h4 className="doctor-name">Dr. Prashik</h4>
                    <p className="doctor-specialty">Psychologist</p>
                  </div>
                </div>
                {step === 1 && (
                  <div>
                    <p className="step-label">
                      {firstVisit
                        ? 'Welcome! Please schedule your first appointment'
                        : followUpRequired
                        ? 'Doctor recommends scheduling a follow-up appointment'
                        : 'Please schedule your next appointment'}
                    </p>
                    <p className="step-label">Please select a preferred date:</p>
                    <div className="date-grid">
                      {getAvailableDates().map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(item.date)}
                          className="date-button"
                        >
                          <div className="date-content">
                            <Calendar size={16} className="date-icon" />
                            <span style={{ color: 'black' }}>{item.date}</span>
                          </div>
                          <ChevronRight size={16} className="chevron-icon" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <div className="step-header">
                      <button
                        onClick={() => setStep(1)}
                        className="back-button"
                      >
                        Back
                      </button>
                      <p className="selected-date">{selectedDate}</p>
                    </div>
                    <p className="step-label">Please select a session:</p>
                    <div className="session-grid">
                      {getAvailableDates()
                        .find((item) => item.date === selectedDate)
                        ?.sessions.map((session, index) => (
                          <button
                            key={index}
                            onClick={() => handleSessionSelect(session)}
                            className="session-button"
                          >
                            {session.charAt(0).toUpperCase() + session.slice(1)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <div className="step-header">
                      <button
                        onClick={() => setStep(2)}
                        className="back-button"
                      >
                        Back
                      </button>
                      <p className="selected-date">
                        {selectedDate} - {selectedSession}
                      </p>
                    </div>
                    <p className="step-label">Please select a time slot:</p>
                    <div className="time-grid">
                      {getTimeSlots(selectedSession).map((time, index) => (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(time)}
                          className={`time-button ${
                            isSlotBooked(selectedDate, time) ? 'booked' : ''
                          }`}
                          disabled={isSlotBooked(selectedDate, time)}
                        >
                          <Clock size={16} className="time-icon" />
                          <span
                            style={{
                              color: isSlotBooked(selectedDate, time)
                                ? 'gray'
                                : 'black',
                            }}
                          >
                            {time}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <div className="step-header">
                      <button
                        onClick={() => setStep(3)}
                        className="back-button"
                      >
                        Back
                      </button>
                    </div>
                    <p className="confirm-label">Confirm your appointment with:</p>
                    <div className="confirmation-box">
                      <p className="confirmation-doctor">Dr. Prashik</p>
                      <div className="confirmation-details">
                        <Calendar size={16} className="detail-icon" />
                        <span className="detail-date">{selectedDate}</span>
                        <Clock size={16} className="detail-icon" />
                        <span>{selectedTime}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirm}
                      className="confirm-button"
                    >
                      Confirm Appointment
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'messages' && (
          <div className="messages-container">
            {console.log('Rendering messages:', messages)}
            {messages.length > 0 ? (
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message-item ${!message.read ? 'unread' : ''}`}
                    onClick={() => markMessageAsRead(message._id)}
                  >
                    <div className="message-header">
                      <div className="message-sender">
                        <MessageSquare size={16} className="message-icon" />
                        <span>{message.senderName}</span>
                      </div>
                      <span className="message-date">
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                    <div className="message-recipient">
                      <span>To: {message.recipientUsername}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-messages">
                <MessageSquare size={40} className="no-messages-icon" />
                <p>No messages yet</p>
                <p className="no-messages-subtitle">
                  You'll see your messages here when you receive them.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
