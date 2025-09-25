// Add these variables at the top of your JS file
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
// Base API URL
const API_BASE_URL = 'http://localhost:8080/api/v1/logs';

// Get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

// Check if user is authenticated
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        // Redirect to login if no token found
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Generic API request function with JWT
async function apiRequest(url, options = {}) {
    if (!checkAuth()) {
        throw new Error('Not authenticated');
    }

    const token = getAuthToken();
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, mergedOptions);

        // Check for unauthorized response
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'index.html';
            throw new Error('Authentication failed. Please login again.');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// DOM Elements
const logForm = document.getElementById('logForm');
const logIdInput = document.getElementById('logId');
const logCodeInput = document.getElementById('logCode');
const logDateInput = document.getElementById('logDate');
const logDetailsInput = document.getElementById('logDetails');
const observedImageInput = document.getElementById('observedImage');
const imagePreview = document.getElementById('imagePreview');
const cancelBtn = document.getElementById('cancelBtn');
const logsTableBody = document.getElementById('logsTableBody');
const logsCards = document.getElementById('logsCards');
const openFormBtn = document.getElementById('openFormBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const logFormPopup = document.getElementById('logFormPopup');
const popupTitle = document.getElementById('popupTitle');
const refreshBtn = document.getElementById('refreshBtn');
const fileInputLabel = document.getElementById('fileInputLabel');
const fileName = document.getElementById('fileName');
const totalLogsElement = document.getElementById('totalLogs');
const todayLogsElement = document.getElementById('todayLogs');
const logsWithImagesElement = document.getElementById('logsWithImages');

// DOM Elements for new features
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const logDetailsPopup = document.getElementById('logDetailsPopup');
const reportPopup = document.getElementById('reportPopup');
const reportDropdownBtn = document.getElementById('reportDropdownBtn');
const reportDropdown = document.getElementById('reportDropdown');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    if (!checkAuth()) {
        return;
    }

    loadLogs();
    updateStats();
});

// Add these event listeners
document.getElementById('pageSizeSelect').addEventListener('change', function() {
    pageSize = parseInt(this.value);
    currentPage = 1;
    displayLogs(currentLogs);
    updatePagination();
});

document.getElementById('firstPageBtn').addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage = 1;
        displayLogs(currentLogs);
        updatePagination();
    }
});

document.getElementById('prevPageBtn').addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        displayLogs(currentLogs);
        updatePagination();
    }
});

document.getElementById('nextPageBtn').addEventListener('click', function() {
    if (currentPage < totalPages) {
        currentPage++;
        displayLogs(currentLogs);
        updatePagination();
    }
});

document.getElementById('lastPageBtn').addEventListener('click', function() {
    if (currentPage < totalPages) {
        currentPage = totalPages;
        displayLogs(currentLogs);
        updatePagination();
    }
});
// Store current filtered logs
let currentLogs = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadLogs();
    updateStats();
});
// Initialize logout button on page load
// document.addEventListener('DOMContentLoaded', function() {
//     setupLogout();
// });
logForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', resetForm);
observedImageInput.addEventListener('change', previewImage);
// Modify the openFormBtn event listener to auto-generate code
openFormBtn.addEventListener('click', async function() {
    resetForm();

    // Auto-generate the next log code
    try {
        const nextCode = await generateNextLogCode();
        logCodeInput.value = nextCode;
    } catch (error) {
        console.error('Error generating log code:', error);
        // If there's an error, leave the field empty for manual entry
    }

    logFormPopup.classList.add('active');
});
closePopupBtn.addEventListener('click', function() {
    logFormPopup.classList.remove('active');
    resetForm();
});
refreshBtn.addEventListener('click', function() {
    loadLogs();
    updateStats();
});

// Event listeners for new features
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

document.querySelectorAll('.close-details-popup').forEach(btn => {
    btn.addEventListener('click', () => {
        logDetailsPopup.classList.remove('active');
    });
});

document.querySelectorAll('.close-report-popup').forEach(btn => {
    btn.addEventListener('click', () => {
        reportPopup.classList.remove('active');
    });
});

reportDropdownBtn.addEventListener('click', function() {
    reportDropdown.style.display = reportDropdown.style.display === 'none' ? 'block' : 'none';
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!reportDropdownBtn.contains(e.target) && !reportDropdown.contains(e.target)) {
        reportDropdown.style.display = 'none';
    }
});

// Preview selected image
function previewImage() {
    const file = observedImageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);

        // Update file input label
        fileInputLabel.classList.add('has-file');
        fileName.textContent = file.name;
    }
}
// Add this function to generate the next log code
async function generateNextLogCode() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/all`);
        const logs = await response.json();

        if (logs.length === 0) {
            return "LOG001";
        }

        // Extract all log codes and find the highest number
        const logCodes = logs.map(log => log.logCode);
        const maxCode = logCodes.reduce((max, code) => {
            if (code.startsWith("LOG")) {
                const num = parseInt(code.substring(3));
                return num > max ? num : max;
            }
            return max;
        }, 0);

        // Generate next code
        const nextNum = maxCode + 1;
        return `LOG${nextNum.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating log code:', error);
        // Fallback to current time-based code if there's an error
        return `LOG${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
}

// Update the loadLogs function to reset to page 1
async function loadLogs() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/all`);
        const logs = await response.json();
        currentLogs = logs;
        currentPage = 1;
        displayLogs(logs);
        updateStats();
    } catch (error) {
        console.error('Error loading logs:', error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to Load Logs',
            text: error.message,
            confirmButtonColor: '#d33'
        });
    }
}

// Update the displayLogs function to include pagination
function displayLogs(logs) {
    logsTableBody.innerHTML = '';
    logsCards.innerHTML = '';

    totalRecords = logs.length;
    totalPages = Math.ceil(totalRecords / pageSize);

    if (logs.length === 0) {
        logsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No logs found.</td></tr>';
        logsCards.innerHTML = '<p class="text-center">No logs found.</p>';
        updatePagination();
        return;
    }

    // Calculate the start and end index for the current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedLogs = logs.slice(startIndex, endIndex);

    // Update the pagination info
    document.getElementById('currentPageStart').textContent = startIndex + 1;
    document.getElementById('currentPageEnd').textContent = endIndex;
    document.getElementById('totalRecords').textContent = totalRecords;

    // Update table view with paginated logs
    paginatedLogs.forEach(log => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td>${log.logCode}</td>
            <td>${log.logDate}</td>
            <td>${truncateText(log.logDetails, 50)}</td>
            <td>${log.observedImage ? `<img src="data:image/jpeg;base64,${log.observedImage}" class="img-thumbnail" alt="Observed Image">` : 'No Image'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewLogDetails('${log.logCode}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" onclick="editLog('${log.logCode}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteLog('${log.logCode}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        logsTableBody.appendChild(tableRow);
    });

    // Update mobile card view with paginated logs
    paginatedLogs.forEach(log => {
        const logCard = document.createElement('div');
        logCard.className = 'log-card';
        logCard.innerHTML = `
            <div class="log-card-header">
                <span><strong>${log.logCode}</strong></span>
                <span class="badge bg-secondary">${log.logDate}</span>
            </div>
            <div class="log-card-body">
                <p>${truncateText(log.logDetails, 100)}</p>
                ${log.observedImage ? `<img src="data:image/jpeg;base64,${log.observedImage}" class="log-card-image" alt="Observed Image">` : ''}
            </div>
            <div class="log-card-actions">
                <button class="action-btn view-btn" onclick="viewLogDetails('${log.logCode}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit-btn" onclick="editLog('${log.logCode}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteLog('${log.logCode}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        logsCards.appendChild(logCard);
    });

    updatePagination();
}

// Add this function to update pagination controls
function updatePagination() {
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');

    // Update button states
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    // Generate page numbers
    pageNumbers.innerHTML = '';

    // Show up to 5 page numbers around the current page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage);
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayLogs(currentLogs);
            updatePagination();
        });
        pageNumbers.appendChild(pageBtn);
    }

    // Update pagination info
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalRecords);
    document.getElementById('currentPageStart').textContent = startIndex;
    document.getElementById('currentPageEnd').textContent = endIndex;
    document.getElementById('totalRecords').textContent = totalRecords;
}

async function updateStats() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/all`);
        const logs = await response.json();
        const today = new Date().toISOString().split('T')[0];

        totalLogsElement.textContent = logs.length;
        todayLogsElement.textContent = logs.filter(log => log.logDate === today).length;
        logsWithImagesElement.textContent = logs.filter(log => log.observedImage).length;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}


// Handle form submission with JWT
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!checkAuth()) {
        return;
    }

    const formData = new FormData();
    formData.append('logCode', logCodeInput.value);
    formData.append('logDate', logDateInput.value);
    formData.append('logDetails', logDetailsInput.value);

    // Only append the image if a new one is selected
    if (observedImageInput.files[0]) {
        formData.append('observedImage', observedImageInput.files[0]);
    }

    const logId = logIdInput.value;
    const isEdit = !!logId;

    try {
        let response;
        if (isEdit) {
            response = await apiRequest(`${API_BASE_URL}/${logId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            if (!observedImageInput.files[0]) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Image Required',
                    text: 'Please select an image for the new log entry.'
                });
                return;
            }
            formData.append('observedImage', observedImageInput.files[0]);

            response = await apiRequest(API_BASE_URL, {
                method: 'POST',
                body: formData
            });
        }

        if (response.status === 201) {
            Swal.fire({
                icon: 'success',
                title: `Log ${isEdit ? 'Updated' : 'Created'} Successfully!`,
                showConfirmButton: false,
                timer: 1500
            });
            resetForm();
            logFormPopup.classList.remove('active');
            loadLogs();
            updateStats();
        } else if (response.status === 400) {
            throw new Error('Bad request. Please check your input.');
        } else {
            throw new Error(`Server returned status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error saving log:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Saving Log',
            text: error.message
        });
    }
}

// Reset form to initial state - MODIFIED to restore required attribute
function resetForm() {
    logForm.reset();
    logIdInput.value = '';
    popupTitle.textContent = 'Add New Log';
    logCodeInput.disabled = false;
    imagePreview.style.display = 'none';
    fileInputLabel.classList.remove('has-file');
    fileName.textContent = 'No file chosen';

    // Restore required attribute for new entries
    observedImageInput.setAttribute('required', 'required');
}

async function editLog(logCode) {
    try {
        const response = await apiRequest(`${API_BASE_URL}/${logCode}`);
        const log = await response.json();

        // Fill form with log data
        logIdInput.value = log.logCode;
        logCodeInput.value = log.logCode;
        logDateInput.value = log.logDate;
        logDetailsInput.value = log.logDetails;

        // Show the existing image
        if (log.observedImage) {
            imagePreview.src = `data:image/jpeg;base64,${log.observedImage}`;
            imagePreview.style.display = 'block';
            fileInputLabel.classList.add('has-file');
            fileName.textContent = 'Existing image (optional to change)';
            observedImageInput.removeAttribute('required');
        }

        // Change form to edit mode
        popupTitle.textContent = 'Edit Log';
        logCodeInput.disabled = true; // Disable editing of log code

        // Show the popup
        logFormPopup.classList.add('active');
    } catch (error) {
        console.error('Error fetching log:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Fetching Log',
            text: error.message
        });
    }
}


// Delete log with JWT - Use the "/delete" endpoint
async function deleteLog(logCode) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Use the "/delete" endpoint to match the controller
                const response = await apiRequest(`${API_BASE_URL}/delete/${logCode}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Log Deleted Successfully!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    resetForm();
                    logFormPopup.classList.remove('active');
                    loadLogs();
                    updateStats();
                } else {
                    throw new Error('Failed to delete log');
                }
            } catch (error) {
                console.error('Error deleting log:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error Deleting Log',
                    text: error.message
                });
            }
        }
    });
}
// Update the resetForm function to clear the generated code
function resetForm() {
    logForm.reset();
    logIdInput.value = '';
    popupTitle.textContent = 'Add New Log';
    logCodeInput.disabled = false;
    imagePreview.style.display = 'none';
    fileInputLabel.classList.remove('has-file');
    fileName.textContent = 'No file chosen';

    // Restore required attribute for new entries
    observedImageInput.setAttribute('required', 'required');

    // Clear the log code input when resetting the form
    logCodeInput.value = '';
}

// Update the performSearch function to reset to page 1
async function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        currentPage = 1;
        loadLogs();
        return;
    }

    try {
        const response = await apiRequest(`${API_BASE_URL}/all`);
        const allLogs = await response.json();
        currentLogs = allLogs.filter(log =>
            log.logCode.toLowerCase().includes(searchTerm) ||
            log.logDate.toLowerCase().includes(searchTerm) ||
            log.logDetails.toLowerCase().includes(searchTerm)
        );

        currentPage = 1;
        displayLogs(currentLogs);
        updatePagination();
    } catch (error) {
        console.error('Error searching logs:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Searching Logs',
            text: error.message
        });
    }
}

// View log details with JWT
async function viewLogDetails(logCode) {
    try {
        const response = await apiRequest(`${API_BASE_URL}/${logCode}`);
        const log = await response.json();

        // Populate details popup
        document.getElementById('detailLogCode').textContent = log.logCode;
        document.getElementById('detailLogDate').textContent = log.logDate;
        document.getElementById('detailLogDetails').textContent = log.logDetails;

        if (log.observedImage) {
            document.getElementById('detailLogImage').src = `data:image/jpeg;base64,${log.observedImage}`;
            document.getElementById('detailLogImage').style.display = 'block';
        } else {
            document.getElementById('detailLogImage').style.display = 'none';
        }

        // Add report button to details popup
        const detailActions = document.querySelector('.log-details-container');
        let reportBtn = detailActions.querySelector('.report-btn');

        if (!reportBtn) {
            reportBtn = document.createElement('button');
            reportBtn.className = 'btn-primary report-btn';
            reportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate Report';
            detailActions.appendChild(reportBtn);
        }

        reportBtn.onclick = () => generateSingleLogReport(log);

        // Show the popup
        logDetailsPopup.classList.add('active');
    } catch (error) {
        console.error('Error fetching log details:', error);
        alert('Error fetching log details: ' + error.message);
    }
}

function setupLogout() {
    if (!document.getElementById('logoutBtn')) {
        const headerActions = document.querySelector('.header-actions');
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-secondary';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.onclick = function() {
            localStorage.removeItem('jwtToken');
            // Force redirect to index.html in the whole browser
            window.top.location.href = 'index.html';
        };
        headerActions.appendChild(logoutBtn);
    }
}


// Generate report
function generateReport(type) {
    const logsToReport = type === 'all' ? currentLogs : currentLogs;

    if (logsToReport.length === 0) {
        alert('No logs to generate report');
        return;
    }

    let reportHTML = '';

    if (type === 'all') {
        // FULL REPORT - Enhanced with better image display
        reportHTML = `
        <div class="report-header">
          <h2><i class="fas fa-file-alt"></i> Comprehensive Monitoring Logs Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <p>Report Period: All available data</p>
          <p>Total logs: ${logsToReport.length}</p>
        </div>

        <div class="report-summary">
          <div class="report-summary-item" style="background: linear-gradient(135deg, #4caf50, #8bc34a); color: white;">
            <h3>Total Logs</h3>
            <p style="font-size: 2rem;">${logsToReport.length}</p>
          </div>
          <div class="report-summary-item" style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white;">
            <h3>Logs with Images</h3>
            <p style="font-size: 2rem;">${logsToReport.filter(log => log.observedImage).length}</p>
          </div>
          <div class="report-summary-item" style="background: linear-gradient(135deg, #fd79a8, #fab1a0); color: white;">
            <h3>Date Range</h3>
            <p>${getDateRange(logsToReport)}</p>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <h3><i class="fas fa-list"></i> Detailed Log Entries</h3>
      `;

        // Create individual report cards for each log with images
        logsToReport.forEach(log => {
            reportHTML += `
          <div class="individual-report" style="margin-bottom: 2rem; padding: 1.5rem; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.8rem; border-bottom: 1px solid #eaeff2;">
              <h4 style="margin: 0;">${log.logCode}</h4>
              <span style="color: #7f8c8d;">${log.logDate}</span>
            </div>

            <div style="display: grid; grid-template-columns: ${log.observedImage ? '2fr 1fr' : '1fr'}; gap: 1.5rem;">
              <div>
                <p style="margin: 0 0 1rem; color: #2c3e50;"><strong>Details:</strong> ${log.logDetails}</p>
              </div>
        `;

            if (log.observedImage) {
                reportHTML += `
              <div style="text-align: center;">
                <p style="margin: 0 0 0.5rem; font-weight: 500;">Observed Image</p>
                <img src="data:image/jpeg;base64,${log.observedImage}"
                     style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              </div>
          `;
            }

            reportHTML += `
            </div>
          </div>
        `;
        });

        reportHTML += `
        </div>

        <div style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 12px;">
          <h3><i class="fas fa-chart-bar"></i> Summary Statistics</h3>
          <p>This comprehensive report includes all ${logsToReport.length} log entries in the system.</p>
          <p>Date range: ${getDateRange(logsToReport)}</p>
          <p>Percentage with images: ${Math.round((logsToReport.filter(log => log.observedImage).length / logsToReport.length) * 100)}%</p>
        </div>
      `;
    } else {
        // CURRENT VIEW REPORT - Enhanced with image thumbnails
        const logsWithImages = logsToReport.filter(log => log.observedImage).length;
        const percentageWithImages = Math.round((logsWithImages / logsToReport.length) * 100);
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logsToReport.filter(log => log.logDate === today).length;

        // Get logs with images for the gallery
        const logsWithImagesList = logsToReport.filter(log => log.observedImage).slice(0, 6);

        reportHTML = `
        <div class="report-header">
          <h2><i class="fas fa-tachometer-alt"></i> Monitoring Dashboard</h2>
          <p>Snapshot generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <p>Current filtered view: ${logsToReport.length} log entries</p>
        </div>

        <div class="stats-container" style="margin: 2rem 0;">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4caf50, #8bc34a);">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="stat-info">
              <h4>Total in View</h4>
              <p>${logsToReport.length}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #2196F3, #03A9F4);">
              <i class="fas fa-image"></i>
            </div>
            <div class="stat-info">
              <h4>With Images</h4>
              <p>${logsWithImages}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FF9800, #FFC107);">
              <i class="fas fa-calendar-day"></i>
            </div>
            <div class="stat-info">
              <h4>Today's Logs</h4>
              <p>${todayLogs}</p>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
          <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h4><i class="fas fa-chart-pie"></i> Content Distribution</h4>
            <div style="height: 20px; background: #f1f1f1; border-radius: 10px; margin: 1rem 0; overflow: hidden;">
              <div style="height: 100%; width: ${percentageWithImages}%; background: linear-gradient(135deg, #2196F3, #03A9F4);"></div>
            </div>
            <p>${percentageWithImages}% of logs include images</p>
          </div>

          <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h4><i class="fas fa-calendar"></i> Date Range</h4>
            <p style="margin: 1rem 0; font-size: 1.2rem;">${getDateRange(logsToReport)}</p>
            <p>Earliest: ${getEarliestDate(logsToReport)}</p>
            <p>Latest: ${getLatestDate(logsToReport)}</p>
          </div>
        </div>

        ${logsWithImages.length > 0 ? `
        <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 2rem;">
          <h4><i class="fas fa-images"></i> Recent Images (${logsWithImages} total)</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
        ` : ''}
      `;

        // Add image thumbnails to the gallery
        if (logsWithImages.length > 0) {
            logsWithImagesList.forEach(log => {
                reportHTML += `
            <div style="text-align: center;">
              <img src="data:image/jpeg;base64,${log.observedImage}"
                   style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <p style="margin: 0.5rem 0 0; font-size: 0.8rem; color: #7f8c8d;">${log.logCode}</p>
            </div>
          `;
            });

            reportHTML += `
          </div>
          ${logsWithImages > 6 ? `<p style="text-align: center; margin: 1rem 0 0; color: #7f8c8d;">+ ${logsWithImages - 6} more images</p>` : ''}
        </div>
        `;
        }

        reportHTML += `
        <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 2rem;">
          <h4><i class="fas fa-list"></i> Recent Log Entries</h4>
          <div style="max-height: 300px; overflow-y: auto; margin-top: 1rem;">
      `;

        // Show most recent 5 logs with image thumbnails if available
        const recentLogs = [...logsToReport].sort((a, b) => new Date(b.logDate) - new Date(a.logDate)).slice(0, 5);
        recentLogs.forEach(log => {
            reportHTML += `
          <div style="padding: 1rem; border-bottom: 1px solid #f1f1f1; display: flex; align-items: flex-start;">
            <div style="min-width: 60px; margin-right: 1rem;">
        `;

            if (log.observedImage) {
                reportHTML += `
              <img src="data:image/jpeg;base64,${log.observedImage}"
                   style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          `;
            } else {
                reportHTML += `
              <div style="width: 50px; height: 50px; background: #f1f1f1; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-image" style="color: #ccc;"></i>
              </div>
          `;
            }

            reportHTML += `
            </div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${log.logCode}</strong>
                <span style="color: #7f8c8d;">${log.logDate}</span>
              </div>
              <p style="margin: 0.5rem 0 0; color: #666; font-size: 0.9rem;">${truncateText(log.logDetails, 80)}</p>
            </div>
          </div>
        `;
        });

        reportHTML += `
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px;">
          <h4><i class="fas fa-info-circle"></i> About This View</h4>
          <p>This dashboard provides a real-time summary of your currently filtered log data.</p>
          <p>Use the Full Report option for a comprehensive analysis of all logs in the system.</p>
        </div>
      `;
    }

    // Display report
    document.getElementById('reportContent').innerHTML = reportHTML;
    reportPopup.classList.add('active');
    reportDropdown.style.display = 'none';
}

// Helper function to get earliest date
function getEarliestDate(logs) {
    if (logs.length === 0) return 'N/A';
    const dates = logs.map(log => new Date(log.logDate));
    return new Date(Math.min(...dates)).toLocaleDateString();
}

// Helper function to get latest date
function getLatestDate(logs) {
    if (logs.length === 0) return 'N/A';
    const dates = logs.map(log => new Date(log.logDate));
    return new Date(Math.max(...dates)).toLocaleDateString();
}

// Generate individual log report
function generateIndividualLogReport(log) {
    const reportDate = new Date().toLocaleDateString();

    return `
<div class="individual-report">
  <div class="report-log-header">
    <h3>Log: ${log.logCode}</h3>
    <span>Date: ${log.logDate}</span>
  </div>

  <div class="report-details-grid">
    <div class="report-detail-item">
      <div class="report-detail-label">Log Code</div>
      <div class="report-detail-value">${log.logCode}</div>
    </div>

    <div class="report-detail-item">
      <div class="report-detail-label">Log Date</div>
      <div class="report-detail-value">${log.logDate}</div>
    </div>

    <div class="report-detail-item" style="grid-column: span 2;">
      <div class="report-detail-label">Details</div>
      <div class="report-detail-value">${log.logDetails}</div>
    </div>
  </div>

  ${log.observedImage ? `
  <div class="report-image-container">
    <div class="report-detail-label">Observed Image</div>
    <img src="data:image/jpeg;base64,${log.observedImage}" class="report-image" alt="Observed Image">
  </div>
  ` : '<p>No image available for this log entry.</p>'}

  <div class="report-footer">
    Report generated on ${reportDate}
  </div>
</div>
`;
}

// Generate single log report
async function generateSingleLogReport(log) {
    try {
        const response = await apiRequest(`${API_BASE_URL}/${log.logCode}`);
        const freshLogData = await response.json();

        // Create report HTML for a single log
        let reportHTML = `
  <div class="report-header">
    <h2>Individual Log Report</h2>
    <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
  </div>
  `;

        // Add the individual log report with fresh data
        reportHTML += generateIndividualLogReport(freshLogData);

        // Display report
        document.getElementById('reportContent').innerHTML = reportHTML;
        reportPopup.classList.add('active');
    } catch (error) {
        console.error('Error generating single log report:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Generating Report',
            text: error.message
        });
    }
}

// Helper function to get date range
function getDateRange(logs) {
    if (logs.length === 0) return 'N/A';

    const dates = logs.map(log => new Date(log.logDate));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}