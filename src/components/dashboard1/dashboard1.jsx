import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Search, Filter, User, CheckCircle, X } from 'lucide-react';
import styles from './dashboard1.module.css';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('2025-04-10');
  const [endDate, setEndDate] = useState('2025-04-20');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState('patients');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:5001/users');
        const data = await response.json();
        const mappedPatients = data.users.map(user => ({
          id: user._id,
          name: user.username,
          email: user.email,
          age: null,
          lastVisit: user.analyses.length > 0 ? user.analyses[user.analyses.length - 1].createdAt.split('T')[0] : null,
          nextVisit: '',
          condition: user.analyses.length > 0 ? user.analyses[user.analyses.length - 1].analysis.Emotions.join(', ') : 'No Analysis',
          status: user.analyses.length > 0 ? 'Follow-up Required' : 'No Data'
        }));
        setPatients(mappedPatients);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  const closeModal = () => {
    setSelectedPatient(null);
  };

  const sendNotification = async () => {
    if (!selectedPatient) return;
    if (!startDate || !endDate) {
      setNotificationMessage('Please select both start and end dates');
      setShowNotification(true);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('http://localhost:5002/api/notifications/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedPatient.name,
          startDate,
          endDate
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const updatedPatients = patients.map(p =>
          p.id === selectedPatient.id ? { ...p, status: "Notification Sent" } : p
        );
        setPatients(updatedPatients);
        setSelectedPatient({ ...selectedPatient, status: "Notification Sent" });
        setNotificationMessage(`Appointment reminder sent to ${selectedPatient.name} for scheduling between ${startDate} and ${endDate}`);
      } else {
        setNotificationMessage(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      setNotificationMessage(`Error sending notification: ${error.message}`);
    } finally {
      setIsSending(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const scheduleAppointment = (date) => {
    if (!selectedPatient) return;

    const updatedPatients = patients.map(p =>
      p.id === selectedPatient.id ? { ...p, nextVisit: date, status: "Appointment Scheduled" } : p
    );

    setPatients(updatedPatients);
    setSelectedPatient({ ...selectedPatient, nextVisit: date, status: "Appointment Scheduled" });
    setNotificationMessage(`Appointment scheduled for ${selectedPatient.name} on ${date}`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const availableSlots = [
    { date: '2025-04-12', time: '09:00', available: true },
    { date: '2025-04-12', time: '11:30', available: true },
    { date: '2025-04-14', time: '14:00', available: true },
    { date: '2025-04-15', time: '10:15', available: true },
    { date: '2025-04-17', time: '16:30', available: true }
  ];

  if (loading) {
    return <div>Loading patients...</div>;
  }

  return (
    <div className={styles['dashboard-container']}>
      {/* Top Navigation */}
      <header className={styles['dashboard-header']}>
        <div className={styles['header-content']}>
          <div className={styles['header-title']}>
            <User size={24} />
            <h1>Dr. Smith's Patient Dashboard</h1>
          </div>
          <div className={styles['header-info']}>
            <div className={styles['notifications']}>
              <Bell size={18} />
              <span>{patients.filter(p => p.status === 'Follow-up Required').length}</span>
            </div>
            <div className={styles['date-display']}>
              <Clock size={18} />
              <span>April 10, 2025</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles['main-content']}>
        {/* Sidebar */}
        <aside className={styles['sidebar']}>
          <nav>
            <ul className={styles['nav-menu']}>
              <li className={`${styles['nav-item']} ${activeTab === 'dashboard' ? styles['active'] : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</li>
              <li className={`${styles['nav-item']} ${activeTab === 'patients' ? styles['active'] : ''}`} onClick={() => setActiveTab('patients')}>Patients</li>
              <li className={`${styles['nav-item']} ${activeTab === 'appointments' ? styles['active'] : ''}`} onClick={() => setActiveTab('appointments')}>Appointments</li>
              <li className={`${styles['nav-item']} ${activeTab === 'messages' ? styles['active'] : ''}`} onClick={() => setActiveTab('messages')}>Messages</li>
              <li className={`${styles['nav-item']} ${activeTab === 'reports' ? styles['active'] : ''}`} onClick={() => setActiveTab('reports')}>Reports</li>
            </ul>
          </nav>
        </aside>

        {/* Main Panel */}
        <main className={styles['main-panel']}>
          {/* Search and Filter */}
          <div className={styles['search-bar-container']}>
            <div className={styles['search-input-container']}>
              <Search className={styles['search-icon']} size={18} />
              <input
                type="text"
                className={styles['search-input']}
                placeholder="Search patients by name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles['filter-container']}>
              <Filter size={18} className={styles['filter-icon']} />
              <span>Filter</span>
            </div>
          </div>

          {/* Patient List */}
          <div className={styles['card patient-table-card']}>
            <div className={styles['card-header']}>
              <h2>Patients Overview</h2>
            </div>
            <div className={styles['table-container']}>
              <table className={styles['patient-table']}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Condition</th>
                    <th>Last Visit</th>
                    <th>Next Visit</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr
                      key={patient.id}
                      className={selectedPatient?.id === patient.id ? styles['selected-row'] : ''}
                    >
                      <td>{patient.name}</td>
                      <td>{patient.age || '-'}</td>
                      <td>{patient.condition}</td>
                      <td>{patient.lastVisit || '-'}</td>
                      <td>{patient.nextVisit || '-'}</td>
                      <td>
                        <span className={`${styles['status-badge']} ${styles[patient.status.toLowerCase().replace(/\s+/g, '-')]}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handlePatientSelect(patient)}
                          className={styles['select-btn']}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Selected Patient Details */}
          {selectedPatient && (
            <div className={styles['modal-overlay']}>
              <div className={styles['modal']}>
                <div className={styles['modal-header']}>
                  <h2>{selectedPatient.name}'s Details</h2>
                  <button onClick={closeModal} className={styles['close-modal-btn']}>
                    <X size={24} />
                  </button>
                </div>
                <div className={styles['modal-content']}>
                  {/* Patient Details */}
                  <div className={styles['card patient-info-card']}>
                    <h3>Patient Details</h3>
                    <div className={styles['patient-info']}>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Name:</span>
                        <span className={styles['info-value']}>{selectedPatient.name}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Email:</span>
                        <span className={styles['info-value']}>{selectedPatient.email}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Age:</span>
                        <span className={styles['info-value']}>{selectedPatient.age || 'Not Available'}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Condition:</span>
                        <span className={styles['info-value']}>{selectedPatient.condition}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Last Visit:</span>
                        <span className={styles['info-value']}>{selectedPatient.lastVisit || 'Not Available'}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Next Visit:</span>
                        <span className={styles['info-value']}>{selectedPatient.nextVisit || 'Not Scheduled'}</span>
                      </div>
                      <div className={styles['info-row']}>
                        <span className={styles['info-label']}>Status:</span>
                        <span className={styles['info-value']}>{selectedPatient.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notification Form */}
                  <div className={styles['card scheduling-card']}>
                    <h3>Schedule Appointment</h3>
                    <div className={styles['date-range-container']}>
                      <div className={styles['date-input-wrapper']}>
                        <label>Start Date</label>
                        <div className={styles['date-input-container']}>
                          <Calendar className={styles['calendar-icon']} size={18} />
                          <input
                            type="date"
                            className={styles['date-input']}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles['date-input-wrapper']}>
                        <label>End Date</label>
                        <div className={styles['date-input-container']}>
                          <Calendar className={styles['calendar-icon']} size={18} />
                          <input
                            type="date"
                            className={styles['date-input']}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={sendNotification}
                      className={styles['notification-btn']}
                      disabled={isSending}
                    >
                      {isSending ? 'Sending...' : 'Send Appointment Notification'}
                    </button>

                    <div className={styles['available-slots-container']}>
                      <h4>Available Appointment Slots</h4>
                      <div className={styles['slots-grid']}>
                        {availableSlots
                          .filter(slot => slot.date >= startDate && slot.date <= endDate)
                          .map((slot, index) => (
                            <div key={index} className={styles['slot-card']}>
                              <div className={styles['slot-info']}>
                                <div className={styles['slot-date']}>{slot.date}</div>
                                <div className={styles['slot-time']}>{slot.time}</div>
                              </div>
                              <button
                                onClick={() => scheduleAppointment(slot.date)}
                                className={styles['schedule-btn']}
                              >
                                Schedule
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showNotification && (
            <div className={styles['toast-notification']}>
              <div className={styles['toast-icon']}>
                <CheckCircle className={styles['success-icon']} size={20} />
              </div>
              <div className={styles['toast-message']}>
                <p>{notificationMessage}</p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className={styles['close-toast-btn']}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;