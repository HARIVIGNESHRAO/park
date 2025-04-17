import { useState, useEffect } from 'react';
import { Calendar, Clock, X, ChevronRight, Bell } from 'lucide-react';
import './notification.css';

export default function NotificationComponent() {
  const [showNotification, setShowNotification] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentApproved, setAppointmentApproved] = useState(false);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5001/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to view your profile');
          }
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        if (isMounted) {
          setShowNotification(data.followUpRequired === true);
          setPhoneNumber(data.phoneNumber || '');
          setAppointmentApproved(data.AppointmentApproved || false);
          setAppointments(data.appointments || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

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
      dates.push(formattedDate);
    }
    return dates;
  };

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  ];

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleConfirm = async () => {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number not available');
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

      const approveResponse = await fetch('http://localhost:5001/api/user/approve-appointment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          doctor: 'Dr. Prashik',
        }),
      });

      if (!approveResponse.ok) {
        throw new Error('Failed to approve appointment');
      }

      const approveData = await approveResponse.json();
      setSuccess(true);
      setAppointmentApproved(true);
      setAppointments(approveData.user.appointments);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!showNotification) return <div>No notifications</div>;

  return (
    <div className="notification-container">
      <div className="notification-header">
        <div className="header-content">
          <Bell size={18} className="header-icon" />
          <h3 className="header-title">Appointment Reminder</h3>
        </div>
        <button onClick={handleClose} className="close-button">
          <X size={18} />
        </button>
      </div>
      <div className="notification-body">
        {appointmentApproved && appointments.length > 0 ? (
          <div className="appointment-schedule">
            <h4 className="schedule-title">Your Scheduled Appointment</h4>
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
                </div>
                <p className="approved-message">Your appointment has been approved!</p>
              </div>
            ))}
          </div>
        ) : (
          <>
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
                  Doctor has sent you a notification: Follow-up Required based on your speech analysis
                </p>
                <p className="step-label">Please select a preferred date:</p>
                <div className="date-grid">
                  {getAvailableDates().map((date, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      className="date-button"
                    >
                      <div className="date-content">
                        <Calendar size={16} className="date-icon" />
                        <span style={{ color: 'black' }}>{date}</span>
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
                <p className="step-label">Please select a time slot:</p>
                <div className="time-grid">
                  {timeSlots.map((time, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSelect(time)}
                      className="time-button"
                    >
                      <Clock size={16} className="time-icon" />
                      <span style={{ color: 'black' }}>{time}</span>
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
      </div>
    </div>
  );
}