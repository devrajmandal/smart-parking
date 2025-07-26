import io from 'socket.io-client';
import moment from 'moment';

// Configuration
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Connect to socket.io server
const socket = io(SOCKET_URL);
let selectedDate = null;

// DOM elements
const entryLogsContainer = document.getElementById('entry-logs');
const exitLogsContainer = document.getElementById('exit-logs');
const activityLogContainer = document.getElementById('activity-log');
const dateFilter = document.getElementById('date-filter');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const statusIndicator = connectionStatus.querySelector('.status-indicator');

// Socket.io event listeners
socket.on('connect', () => {
  statusIndicator.classList.remove('status-disconnected');
  statusIndicator.classList.add('status-connected');
  statusText.innerText = 'Connected';
  
  console.log('Connected to server');
  // Load initial data
  loadLogs();
});

socket.on('disconnect', () => {
  statusIndicator.classList.remove('status-connected');
  statusIndicator.classList.add('status-disconnected');
  statusText.innerText = 'Disconnected';
  
  console.log('Disconnected from server');
});

socket.on('entry-update', (data) => {
  console.log('Entry update:', data);
  
  // Only update UI if no date filter is applied or the entry date matches the filter
  const entryDate = moment(data.timestamp).format('YYYY-MM-DD');
  const filterDate = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null;
  
  if (!filterDate || entryDate === filterDate) {
    // Add to entry logs
    const logElement = createLogElement(data, 'entry');
    entryLogsContainer.prepend(logElement);
  }
  
  // Always update activity log
  updateActivityLog(`${data.name} (${data.regNo}) entered at ${moment(data.timestamp).format('HH:mm:ss')}`);
});

socket.on('exit-update', (data) => {
  console.log('Exit update:', data);
  
  // Only update UI if no date filter is applied or the exit date matches the filter
  const exitDate = moment(data.timestamp).format('YYYY-MM-DD');
  const filterDate = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null;
  
  if (!filterDate || exitDate === filterDate) {
    // Add to exit logs
    const logElement = createLogElement(data, 'exit');
    exitLogsContainer.prepend(logElement);
  }
  
  // Always update activity log
  updateActivityLog(`${data.name} (${data.regNo}) exited at ${moment(data.timestamp).format('HH:mm:ss')}`);
});

socket.on('unauthorized', (data) => {
  console.log('Unauthorized access attempt:', data);
  updateActivityLog(`Unauthorized access attempt with RFID: ${data.rfidUID}`, true);
});

// Helper functions
function createLogElement(data, type) {
  const div = document.createElement('div');
  div.className = `user-log ${type}-log new-log`;
  
  div.innerHTML = `
    <div class="d-flex justify-content-between">
      <h5>${data.name}</h5>
      <span class="badge ${type === 'entry' ? 'bg-success' : 'bg-danger'}">${type.toUpperCase()}</span>
    </div>
    <div class="text-muted mb-1">Reg No: ${data.regNo}</div>
    <div class="text-muted mb-1">RFID: ${data.rfidUID}</div>
    <div class="small text-end">${moment(data.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
  `;
  
  // Remove new-log class after animation
  setTimeout(() => {
    div.classList.remove('new-log');
  }, 2000);
  
  return div;
}

function updateActivityLog(message, isError = false) {
  // Create activity element
  const div = document.createElement('div');
  div.className = `alert ${isError ? 'alert-danger' : 'alert-info'} mb-2`;
  div.innerHTML = `
    <div class="d-flex justify-content-between">
      <span>${message}</span>
      <small>${moment().format('HH:mm:ss')}</small>
    </div>
  `;
  
  // Clear "No recent activity" message if present
  if (activityLogContainer.innerHTML.includes('No recent activity')) {
    activityLogContainer.innerHTML = '';
  }
  
  // Prepend to activity log
  activityLogContainer.prepend(div);
  
  // Limit to 10 activities
  const activities = activityLogContainer.querySelectorAll('.alert');
  if (activities.length > 10) {
    activities[activities.length - 1].remove();
  }
}

async function loadLogs() {
  try {
    // Fetch entry logs
    const entryUrl = `${API_URL}/logs/entry${selectedDate ? `?date=${selectedDate}` : ''}`;
    const entryResponse = await fetch(entryUrl);
    const entryData = await entryResponse.json();
    
    // Fetch exit logs
    const exitUrl = `${API_URL}/logs/exit${selectedDate ? `?date=${selectedDate}` : ''}`;
    const exitResponse = await fetch(exitUrl);
    const exitData = await exitResponse.json();
    
    // Update UI
    updateLogsUI(entryData, exitData);
  } catch (error) {
    console.error('Error loading logs:', error);
    entryLogsContainer.innerHTML = '<div class="alert alert-danger">Error loading entry logs</div>';
    exitLogsContainer.innerHTML = '<div class="alert alert-danger">Error loading exit logs</div>';
  }
}

function updateLogsUI(entryLogs, exitLogs) {
  // Update entry logs
  if (entryLogs.length === 0) {
    entryLogsContainer.innerHTML = '<p class="text-center text-muted py-5">No entry logs found</p>';
  } else {
    entryLogsContainer.innerHTML = '';
    entryLogs.forEach(log => {
      const logElement = createLogElement({
        name: log.name,
        regNo: log.regNo,
        rfidUID: log.rfidUID,
        timestamp: log.timestamp
      }, 'entry');
      
      entryLogsContainer.appendChild(logElement);
    });
  }
  
  // Update exit logs
  if (exitLogs.length === 0) {
    exitLogsContainer.innerHTML = '<p class="text-center text-muted py-5">No exit logs found</p>';
  } else {
    exitLogsContainer.innerHTML = '';
    exitLogs.forEach(log => {
      const logElement = createLogElement({
        name: log.name,
        regNo: log.regNo,
        rfidUID: log.rfidUID,
        timestamp: log.timestamp
      }, 'exit');
      
      exitLogsContainer.appendChild(logElement);
    });
  }
}

// Event handlers
window.filterByDate = function() {
  selectedDate = dateFilter.value;
  loadLogs();
}

window.clearFilter = function() {
  selectedDate = null;
  dateFilter.value = '';
  loadLogs();
}

window.downloadLogs = function(type) {
  const url = `${API_URL}/logs/download/${type}${selectedDate ? `?date=${selectedDate}` : ''}`;
  window.open(url, '_blank');
}

// Initialize date filter with today's date
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
dateFilter.value = formattedDate;
selectedDate = formattedDate;

// Initial load
if (socket.connected) {
  loadLogs();
}