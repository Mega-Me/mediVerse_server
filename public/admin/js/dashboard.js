// MediVerse Admin Dashboard JavaScript

// Global variables
let currentAppointment = null;
let appointmentsData = [];
let doctorsData = [];
let patientsData = [];

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

// Initialize dashboard
function initializeDashboard() {
    // Set default date filter to today
    document.getElementById('dateFilter').value = new Date().toISOString().split('T')[0];
    
    // Load initial data
    loadStats();
    loadAppointments();
    loadDoctors();
    loadPatients();
    loadEarnings();
    loadSettings();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Form submissions
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentUpdate);
    document.getElementById('addDoctorForm').addEventListener('submit', handleAddDoctor);
    document.getElementById('pricingForm').addEventListener('submit', handlePricingUpdate);
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked nav link
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'earnings':
            loadEarnings();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadRecentAppointments()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const stats = await response.json();
        
        if (response.ok) {
            updateStatsDisplay(stats);
        } else {
            throw new Error(stats.message || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Use mock data for demonstration
        updateStatsDisplay({
            totalAppointments: 156,
            totalDoctors: 24,
            totalPatients: 89,
            totalEarnings: 15420.50
        });
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    document.getElementById('totalAppointments').textContent = stats.totalAppointments || 0;
    document.getElementById('totalDoctors').textContent = stats.totalDoctors || 0;
    document.getElementById('totalPatients').textContent = stats.totalPatients || 0;
    document.getElementById('totalEarnings').textContent = `$${(stats.totalEarnings || 0).toFixed(2)}`;
}

// Load recent appointments
async function loadRecentAppointments() {
    try {
        const response = await fetch('/api/admin/appointments/recent');
        const appointments = await response.json();
        
        if (response.ok) {
            displayRecentAppointments(appointments);
        } else {
            throw new Error(appointments.message || 'Failed to load recent appointments');
        }
    } catch (error) {
        console.error('Error loading recent appointments:', error);
        // Use mock data for demonstration
        displayRecentAppointments([
            {
                id: '1',
                patientName: 'John Doe',
                doctorName: 'Dr. Smith',
                date: '2024-01-15T10:00:00Z',
                duration: 60,
                status: 'Approved',
                payment: 'Paid'
            }
        ]);
    }
}

// Display recent appointments
function displayRecentAppointments(appointments) {
    const tbody = document.getElementById('recentAppointmentsBody');
    tbody.innerHTML = '';
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.patientName}</td>
            <td>${appointment.doctorName}</td>
            <td>${formatDateTime(appointment.date)}</td>
            <td>${appointment.duration} min</td>
            <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
            <td><span class="status-badge status-${appointment.payment.toLowerCase()}">${appointment.payment}</span></td>
            <td>
                <button class="btn btn-outline" onclick="viewAppointment('${appointment.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load all appointments
async function loadAppointments() {
    try {
        const response = await fetch('/api/admin/appointments');
        const appointments = await response.json();
        
        if (response.ok) {
            appointmentsData = appointments;
            displayAppointments(appointments);
        } else {
            throw new Error(appointments.message || 'Failed to load appointments');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        // Use mock data for demonstration
        const mockAppointments = generateMockAppointments();
        appointmentsData = mockAppointments;
        displayAppointments(mockAppointments);
    }
}

// Display appointments
function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsBody');
    tbody.innerHTML = '';
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.patientName}</td>
            <td>${appointment.doctorName}</td>
            <td>${formatDateTime(appointment.date)}</td>
            <td>${appointment.duration} min</td>
            <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
            <td><span class="status-badge status-${appointment.payment.toLowerCase()}">${appointment.payment}</span></td>
            <td>$${appointment.amount}</td>
            <td>
                <button class="btn btn-outline" onclick="viewAppointment('${appointment.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-success" onclick="approveAppointment('${appointment.id}')" ${appointment.status === 'Approved' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectAppointment('${appointment.id}')" ${appointment.status === 'Rejected' ? 'disabled' : ''}>
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load doctors
async function loadDoctors() {
    try {
        const response = await fetch('/api/admin/doctors');
        const doctors = await response.json();
        
        if (response.ok) {
            doctorsData = doctors;
            displayDoctors(doctors);
            updateDoctorStats(doctors);
        } else {
            throw new Error(doctors.message || 'Failed to load doctors');
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
        // Use mock data for demonstration
        const mockDoctors = generateMockDoctors();
        doctorsData = mockDoctors;
        displayDoctors(mockDoctors);
        updateDoctorStats(mockDoctors);
    }
}

// Display doctors
function displayDoctors(doctors) {
    const tbody = document.getElementById('doctorsBody');
    tbody.innerHTML = '';
    
    doctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.fullName}</td>
            <td>${doctor.email}</td>
            <td>${doctor.specialization}</td>
            <td>${doctor.sessions}</td>
            <td>${doctor.hours}h</td>
            <td>$${doctor.earnings.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline" onclick="editDoctor('${doctor.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteDoctor('${doctor.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update doctor stats
function updateDoctorStats(doctors) {
    const totalSessions = doctors.reduce((sum, doctor) => sum + doctor.sessions, 0);
    const totalHours = doctors.reduce((sum, doctor) => sum + doctor.hours, 0);
    const totalEarnings = doctors.reduce((sum, doctor) => sum + doctor.earnings, 0);
    
    document.getElementById('totalDoctorSessions').textContent = totalSessions;
    document.getElementById('totalDoctorHours').textContent = `${totalHours}h`;
    document.getElementById('totalDoctorEarnings').textContent = `$${totalEarnings.toFixed(2)}`;
}

// Load patients
async function loadPatients() {
    try {
        const response = await fetch('/api/admin/patients');
        const patients = await response.json();
        
        if (response.ok) {
            patientsData = patients;
            displayPatients(patients);
            updatePatientStats(patients);
        } else {
            throw new Error(patients.message || 'Failed to load patients');
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        // Use mock data for demonstration
        const mockPatients = generateMockPatients();
        patientsData = mockPatients;
        displayPatients(mockPatients);
        updatePatientStats(mockPatients);
    }
}

// Display patients
function displayPatients(patients) {
    const tbody = document.getElementById('patientsBody');
    tbody.innerHTML = '';
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.fullName}</td>
            <td>${patient.email}</td>
            <td>${patient.phoneNumber || 'N/A'}</td>
            <td>${patient.sessions}</td>
            <td>${patient.hours}h</td>
            <td>$${patient.totalSpent.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline" onclick="viewPatient('${patient.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update patient stats
function updatePatientStats(patients) {
    const totalSessions = patients.reduce((sum, patient) => sum + patient.sessions, 0);
    const totalHours = patients.reduce((sum, patient) => sum + patient.hours, 0);
    const totalSpent = patients.reduce((sum, patient) => sum + patient.totalSpent, 0);
    
    document.getElementById('totalPatientSessions').textContent = totalSessions;
    document.getElementById('totalPatientHours').textContent = `${totalHours}h`;
    document.getElementById('totalPatientSpent').textContent = `$${totalSpent.toFixed(2)}`;
}

// Load earnings
async function loadEarnings() {
    try {
        const response = await fetch('/api/admin/earnings');
        const earnings = await response.json();
        
        if (response.ok) {
            updateEarningsDisplay(earnings);
        } else {
            throw new Error(earnings.message || 'Failed to load earnings');
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
        // Use mock data for demonstration
        updateEarningsDisplay({
            monthly: 5420.75,
            weekly: 1280.50,
            daily: 180.25,
            average: 95.50
        });
    }
}

// Update earnings display
function updateEarningsDisplay(earnings) {
    document.getElementById('monthlyEarnings').textContent = `$${earnings.monthly.toFixed(2)}`;
    document.getElementById('weeklyEarnings').textContent = `$${earnings.weekly.toFixed(2)}`;
    document.getElementById('dailyEarnings').textContent = `$${earnings.daily.toFixed(2)}`;
    document.getElementById('avgSessionValue').textContent = `$${earnings.average.toFixed(2)}`;
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        const settings = await response.json();
        
        if (response.ok) {
            updateSettingsDisplay(settings);
        } else {
            throw new Error(settings.message || 'Failed to load settings');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Use default settings
        updateSettingsDisplay({
            defaultHourlyRate: 100.00,
            platformCommission: 15.00,
            minSessionDuration: 30
        });
    }
}

// Update settings display
function updateSettingsDisplay(settings) {
    document.getElementById('defaultHourlyRate').value = settings.defaultHourlyRate || 100.00;
    document.getElementById('platformCommission').value = settings.platformCommission || 15.00;
    document.getElementById('minSessionDuration').value = settings.minSessionDuration || 30;
}

// Appointment Management
function viewAppointment(appointmentId) {
    const appointment = appointmentsData.find(a => a.id === appointmentId);
    if (appointment) {
        currentAppointment = appointment;
        document.getElementById('appointmentStatus').value = appointment.status;
        document.getElementById('paymentStatus').value = appointment.payment;
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        showModal('appointmentModal');
    }
}

function approveAppointment(appointmentId) {
    updateAppointmentStatus(appointmentId, 'Approved');
}

function rejectAppointment(appointmentId) {
    updateAppointmentStatus(appointmentId, 'Rejected');
}

async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showNotification(`Appointment ${status.toLowerCase()} successfully`, 'success');
            loadAppointments();
        } else {
            throw new Error('Failed to update appointment status');
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        showNotification('Error updating appointment status', 'error');
    }
}

// Handle appointment form submission
async function handleAppointmentUpdate(e) {
    e.preventDefault();
    
    if (!currentAppointment) return;
    
    const formData = {
        status: document.getElementById('appointmentStatus').value,
        payment: document.getElementById('paymentStatus').value,
        notes: document.getElementById('appointmentNotes').value
    };
    
    try {
        const response = await fetch(`/api/admin/appointments/${currentAppointment.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Appointment updated successfully', 'success');
            closeModal('appointmentModal');
            loadAppointments();
        } else {
            throw new Error('Failed to update appointment');
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        showNotification('Error updating appointment', 'error');
    }
}

// Doctor Management
function showAddDoctorModal() {
    showModal('addDoctorModal');
}

async function handleAddDoctor(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('doctorName').value,
        email: document.getElementById('doctorEmail').value,
        specialization: document.getElementById('doctorSpecialization').value,
        hourlyRate: parseFloat(document.getElementById('doctorHourlyRate').value)
    };
    
    try {
        const response = await fetch('/api/admin/doctors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Doctor added successfully', 'success');
            closeModal('addDoctorModal');
            document.getElementById('addDoctorForm').reset();
            loadDoctors();
        } else {
            throw new Error('Failed to add doctor');
        }
    } catch (error) {
        console.error('Error adding doctor:', error);
        showNotification('Error adding doctor', 'error');
    }
}

// Settings Management
async function handlePricingUpdate(e) {
    e.preventDefault();
    
    const formData = {
        defaultHourlyRate: parseFloat(document.getElementById('defaultHourlyRate').value),
        platformCommission: parseFloat(document.getElementById('platformCommission').value),
        minSessionDuration: parseInt(document.getElementById('minSessionDuration').value)
    };
    
    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Settings updated successfully', 'success');
        } else {
            throw new Error('Failed to update settings');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showNotification('Error updating settings', 'error');
    }
}

// Utility Functions
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function refreshStats() {
    loadDashboardData();
    showNotification('Stats refreshed', 'success');
}

function filterAppointments() {
    const statusFilter = document.getElementById('statusFilter').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filtered = appointmentsData;
    
    if (statusFilter) {
        filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    if (paymentFilter) {
        filtered = filtered.filter(a => a.payment === paymentFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(a => a.date.startsWith(dateFilter));
    }
    
    displayAppointments(filtered);
}

// Export functions
function exportAppointments() {
    // Implementation for exporting appointments to CSV/Excel
    showNotification('Export feature coming soon', 'info');
}

function exportEarnings() {
    // Implementation for exporting earnings report
    showNotification('Export feature coming soon', 'info');
}

// Mock Data Generation (for demonstration)
function generateMockAppointments() {
    return [
        {
            id: '1',
            patientName: 'John Doe',
            doctorName: 'Dr. Smith',
            date: '2024-01-15T10:00:00Z',
            duration: 60,
            status: 'Approved',
            payment: 'Paid',
            amount: 100.00,
            notes: 'Regular checkup'
        },
        {
            id: '2',
            patientName: 'Jane Smith',
            doctorName: 'Dr. Johnson',
            date: '2024-01-15T14:00:00Z',
            duration: 45,
            status: 'Pending',
            payment: 'Pending',
            amount: 75.00,
            notes: 'Follow-up consultation'
        }
    ];
}

function generateMockDoctors() {
    return [
        {
            id: '1',
            fullName: 'Dr. John Smith',
            email: 'john.smith@mediverse.com',
            specialization: 'Cardiology',
            sessions: 45,
            hours: 67.5,
            earnings: 6750.00
        },
        {
            id: '2',
            fullName: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@mediverse.com',
            specialization: 'Pediatrics',
            sessions: 38,
            hours: 57.0,
            earnings: 5700.00
        }
    ];
}

function generateMockPatients() {
    return [
        {
            id: '1',
            fullName: 'John Doe',
            email: 'john.doe@email.com',
            phoneNumber: '+1-555-0123',
            sessions: 5,
            hours: 7.5,
            totalSpent: 750.00
        },
        {
            id: '2',
            fullName: 'Jane Smith',
            email: 'jane.smith@email.com',
            phoneNumber: '+1-555-0456',
            sessions: 3,
            hours: 4.5,
            totalSpent: 450.00
        }
    ];
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}
