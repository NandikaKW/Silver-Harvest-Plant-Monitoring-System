// Pagination variables
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let filteredStaffList = [];
// Add these constants at the top of your script
const STAFF_ID_PREFIX = 'S';
const LOG_CODE_PREFIX = 'LOG';

// Base API URL
const API_BASE_URL = 'http://localhost:8080/api/v1/staff';

// JWT Token management
let jwtToken = localStorage.getItem('jwtToken');

// DOM Elements
const staffForm = document.getElementById('staffForm');
const staffFormPopup = document.getElementById('staffFormPopup');
const viewStaffPopup = document.getElementById('viewStaffPopup');
const openFormBtn = document.getElementById('openFormBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const staffTableBody = document.getElementById('staffTableBody');
const editMode = document.getElementById('editMode');
const editStaffId = document.getElementById('editStaffId');
// Initialize pagination
function initPagination() {
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click', () => goToPage(totalPages));

    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        updatePagination();
    });
}

// Update pagination controls
function updatePagination() {
    const totalRecords = filteredStaffList.length;
    totalPages = Math.ceil(totalRecords / pageSize);

    // Ensure current page is within valid range
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Calculate start and end indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);

    // Update pagination info
    document.getElementById('currentPageStart').textContent = totalRecords > 0 ? startIndex + 1 : 0;
    document.getElementById('currentPageEnd').textContent = endIndex;
    document.getElementById('totalRecords').textContent = totalRecords;

    // Update pagination buttons state
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages;

    // Generate page numbers
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';

    // Show up to 5 page numbers with ellipsis if needed
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '0 0.5rem';
        pageNumbersContainer.appendChild(ellipsis);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbersContainer.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '0 0.5rem';
        pageNumbersContainer.appendChild(ellipsis);
    }

    // Get current page data and populate table
    const currentPageData = filteredStaffList.slice(startIndex, endIndex);
    populateStaffTable(currentPageData);
}

// Navigate to specific page
function goToPage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    updatePagination();
}


// Enhanced fetch function with JWT
async function fetchWithAuth(url, options = {}) {
    // Check if token exists and is valid
    if (!jwtToken || isTokenExpired(jwtToken)) {
        // If token is expired or missing, try to get a new one
        // You might want to redirect to login or show a modal
        console.error('JWT token is missing or expired');
        showError('Authentication required. Please login again.');
        return Promise.reject('Authentication required');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, mergedOptions);

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            jwtToken = null;
            showError('Session expired. Please login again.');
            throw new Error('Authentication failed');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Check if token is expired
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

// Event Listeners - Modified to check authentication
document.addEventListener('DOMContentLoaded', function() {
    // Check if we have a valid token
    if (!jwtToken || isTokenExpired(jwtToken)) {
        showError('Please login to access staff management');
        return;
    }
    // Add this with the other initialization code
    initPagination();
    populateLogCodeDropdown();
    loadStaffData();
    loadStats();

    // Form submission
    staffForm.addEventListener('submit', handleFormSubmit);

    // Popup controls
    openFormBtn.addEventListener('click', openAddForm);
    closePopupBtn.addEventListener('click', closePopup);
    cancelBtn.addEventListener('click', closePopup);
    refreshBtn.addEventListener('click', loadStaffData);

    // Search functionality
    searchInput.addEventListener('input', filterStaff);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Print button
    document.getElementById('printBtn').addEventListener('click', printTable);

    // Filter button
    document.getElementById('filterBtn').addEventListener('click', filterByRole);

    // Generate full report button
    document.getElementById('generateReportBtn').addEventListener('click', generateFullReport);

    // Close report modal
    document.querySelectorAll('.close-report-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('reportModal').classList.remove('active');
        });
    });

    document.querySelectorAll('.close-view-popup').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('viewStaffPopup').classList.remove('active');
        });
    });

    // Export report button
    document.getElementById('exportReportBtn').addEventListener('click', () => {
        const printContent = document.getElementById('reportModal').innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Staff Report - Print</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .report-summary { background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
                .report-summary-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #ddd; }
                .report-summary-item:last-child { border-bottom: none; }
                .no-print { display: none; }
                h1 { text-align: center; margin-bottom: 20px; }
                .print-date { text-align: right; margin-bottom: 20px; }
                canvas { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <h1>Staff Report</h1>
            <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
            ${printContent}
        </body>
        </html>
    `;

        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    });

    // Close view popup
    document.querySelectorAll('.close-view-popup').forEach(btn => {
        btn.addEventListener('click', () => {
            viewStaffPopup.classList.remove('active');
        });
    });
});

// Update the loadStaffData function
async function loadStaffData() {
    try {
        showLoading(true);
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const staffList = await response.json();

        // Store the full staff list and set filtered list
        filteredStaffList = staffList;

        // Initialize pagination
        updatePagination();
        showLoading(false);
    } catch (error) {
        console.error('Error loading staff data:', error);
        showError('Failed to load staff data');
        showLoading(false);
    }
}

// Load statistics - MODIFIED to use fetchWithAuth
async function loadStats() {
    try {
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const staffList = await response.json();
        updateStats(staffList);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Populate staff table
function populateStaffTable(staffList) {
    staffTableBody.innerHTML = '';

    staffList.forEach(staff => {
        const row = document.createElement('tr');

        // Format role and gender badges
        const roleClass = `role-${staff.role?.toLowerCase() || 'other'}`;
        const genderClass = `gender-${staff.gender?.toLowerCase() === 'female' ? 'female' : 'male'}`;

        row.innerHTML = `
        <td>${staff.staffId || '--'}</td>
        <td>${staff.firstName || ''} ${staff.lastName || ''}</td>
        <td>${staff.designation || '--'}</td>
        <td><span class="status-badge ${roleClass}">${staff.role || 'OTHER'}</span></td>
        <td><span class="status-badge ${genderClass}">${staff.gender || '--'}</span></td>
        <td>${staff.contactNo || '--'}</td>
        <td>${staff.email || '--'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view-btn" data-id="${staff.staffId}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit-btn" data-id="${staff.staffId}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${staff.staffId}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;

        staffTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
}

// Add event listeners to action buttons
function addActionButtonListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const staffId = btn.getAttribute('data-id');
            viewStaff(staffId);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const staffId = btn.getAttribute('data-id');
            openEditForm(staffId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const staffId = btn.getAttribute('data-id');
            deleteStaff(staffId);
        });
    });
}

// Handle form submission - MODIFIED to use fetchWithAuth
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(staffForm);
    const staffData = {
        staffId: document.getElementById('staffIdInput').value,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        designation: formData.get('designation'),
        gender: formData.get('gender'),
        joinedDate: formData.get('joinedDate'),
        dob: formData.get('dob'),
        address: formData.get('address'),
        contactNo: formData.get('contactNo'),
        email: formData.get('email'),
        role: formData.get('role'),
        logCode: formData.get('logCode'),
        vehicleDtos: [],
        equipmentDtos: [],
        fields: []
    };

    try {
        if (editMode.value === 'true') {
            const staffIdToUpdate = formData.get('staffId');
            staffData.staffId = staffIdToUpdate;

            const response = await fetchWithAuth(`${API_BASE_URL}/${staffIdToUpdate}`, {
                method: 'PUT',
                body: JSON.stringify(staffData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update staff: ${errorText}`);
            }

            showSuccess('Staff updated successfully');
        } else {
            const response = await fetchWithAuth(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(staffData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create staff: ${errorText}`);
            }

            showSuccess('Staff created successfully');
        }

        closePopup();
        loadStaffData();
        loadStats();
    } catch (error) {
        console.error('Error saving staff:', error);
        showError('Failed to save staff data: ' + error.message);
    }
}


// View staff details - MODIFIED to use fetchWithAuth
async function viewStaff(staffId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/${staffId}`);
        const staff = await response.json();

        document.getElementById('detail-id').textContent = staff.staffId || '--';
        document.getElementById('detail-name').textContent = `${staff.firstName || ''} ${staff.lastName || ''}`;
        document.getElementById('detail-designation').textContent = staff.designation || '--';
        document.getElementById('detail-gender').textContent = staff.gender || '--';
        document.getElementById('detail-gender').className = `status-badge gender-${staff.gender?.toLowerCase() === 'female' ? 'female' : 'male'}`;
        document.getElementById('detail-joinedDate').textContent = formatDate(staff.joinedDate) || '--';
        document.getElementById('detail-dob').textContent = formatDate(staff.dob) || '--';
        document.getElementById('detail-address').textContent = staff.address || '--';
        document.getElementById('detail-contactNo').textContent = staff.contactNo || '--';
        document.getElementById('detail-email').textContent = staff.email || '--';
        document.getElementById('detail-role').textContent = staff.role || '--';
        document.getElementById('detail-role').className = `status-badge role-${staff.role?.toLowerCase() || 'other'}`;
        document.getElementById('detail-logCode').textContent = staff.logCode || '--';

        viewStaffPopup.classList.add('active');
    } catch (error) {
        console.error('Error viewing staff:', error);
        showError('Failed to load staff details');
    }
}


// Open edit form - MODIFIED to use fetchWithAuth
async function openEditForm(staffId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/${staffId}`);
        const staff = await response.json();

        document.getElementById('popupTitle').textContent = 'Edit Staff';
        document.getElementById('editMode').value = 'true';
        document.getElementById('editStaffId').value = staff.staffId;
        document.getElementById('staffIdInput').value = staff.staffId || '';
        document.getElementById('firstNameInput').value = staff.firstName || '';
        document.getElementById('lastNameInput').value = staff.lastName || '';
        document.getElementById('designationInput').value = staff.designation || '';
        document.getElementById('genderInput').value = staff.gender || '';
        document.getElementById('joinedDateInput').value = formatDateForInput(staff.joinedDate) || '';
        document.getElementById('dobInput').value = formatDateForInput(staff.dob) || '';
        document.getElementById('addressInput').value = staff.address || '';
        document.getElementById('contactNoInput').value = staff.contactNo || '';
        document.getElementById('emailInput').value = staff.email || '';
        document.getElementById('roleInput').value = staff.role || '';

        await populateLogCodeDropdown();
        document.getElementById('logCodeSelect').value = staff.logCode || '';

        staffFormPopup.classList.add('active');
    } catch (error) {
        console.error('Error opening edit form:', error);
        showError('Failed to load staff data for editing');
    }
}

// Populate log code dropdown - MODIFIED to use fetchWithAuth
async function populateLogCodeDropdown() {
    try {
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const staffList = await response.json();
        const logCodeSelect = document.getElementById('logCodeSelect');

        while (logCodeSelect.options.length > 1) {
            logCodeSelect.remove(1);
        }

        const existingLogCodes = [...new Set(
            staffList
                .map(staff => staff.logCode)
                .filter(code => code && code.startsWith('LOG'))
        )].sort();

        let maxNumber = 0;
        existingLogCodes.forEach(code => {
            const numPart = parseInt(code.replace('LOG', ''));
            if (!isNaN(numPart) && numPart > maxNumber) {
                maxNumber = numPart;
            }
        });

        existingLogCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            logCodeSelect.appendChild(option);
        });

        if (document.getElementById('editMode').value === 'false') {
            const nextNumber = maxNumber + 1;
            const nextLogCode = `LOG${nextNumber.toString().padStart(3, '0')}`;

            const newOption = document.createElement('option');
            newOption.value = nextLogCode;
            newOption.textContent = nextLogCode;
            newOption.selected = true;
            logCodeSelect.appendChild(newOption);
        }

    } catch (error) {
        console.error('Error populating log codes:', error);
        const logCodeSelect = document.getElementById('logCodeSelect');
        for (let i = 1; i <= 10; i++) {
            const code = `LOG${i.toString().padStart(3, '0')}`;
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            logCodeSelect.appendChild(option);
        }
    }
}

// Modify the openAddForm function
function openAddForm() {
    document.getElementById('popupTitle').textContent = 'Add New Staff';
    document.getElementById('editMode').value = 'false';
    document.getElementById('staffForm').reset();
    staffFormPopup.classList.add('active');

    // Generate staff ID and populate log code dropdown
    generateStaffId();
    populateLogCodeDropdown();
}


// Generate staff ID - MODIFIED to use fetchWithAuth
async function generateStaffId() {
    try {
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const staffList = await response.json();

        const existingIds = staffList.map(staff => staff.staffId).filter(id => id && id.startsWith(STAFF_ID_PREFIX));
        let maxNumber = 0;

        existingIds.forEach(id => {
            const numPart = parseInt(id.replace(STAFF_ID_PREFIX, ''));
            if (!isNaN(numPart) && numPart > maxNumber) {
                maxNumber = numPart;
            }
        });

        const nextNumber = maxNumber + 1;
        const nextId = `${STAFF_ID_PREFIX}${nextNumber.toString().padStart(3, '0')}`;
        document.getElementById('staffIdInput').value = nextId;
    } catch (error) {
        console.error('Error generating staff ID:', error);
    }
}
// Add this function to generate log codes
async function populateLogCodes() {
    try {
        const response = await fetch(API_BASE_URL + '/all');
        if (!response.ok) throw new Error('Failed to fetch staff data');

        const staffList = await response.json();

        // Extract all existing log codes
        const existingLogCodes = staffList.map(staff => staff.logCode)
            .filter(code => code && code.startsWith(LOG_CODE_PREFIX));

        // Find the highest numeric part
        let maxNumber = 0;
        existingLogCodes.forEach(code => {
            const numPart = parseInt(code.replace(LOG_CODE_PREFIX, ''));
            if (!isNaN(numPart) && numPart > maxNumber) {
                maxNumber = numPart;
            }
        });

        // Generate the next log code
        const nextNumber = maxNumber + 1;
        const nextLogCode = `${LOG_CODE_PREFIX}${nextNumber.toString().padStart(3, '0')}`;

        // Set the value in the form
        document.getElementById('logCodeInput').value = nextLogCode;
    } catch (error) {
        console.error('Error generating log code:', error);
    }
}
// Delete staff - MODIFIED to use fetchWithAuth
async function deleteStaff(staffId) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            await fetchWithAuth(`${API_BASE_URL}/${staffId}`, {
                method: 'DELETE'
            });

            showSuccess('Staff deleted successfully');
            loadStaffData();
            loadStats();
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showError('Failed to delete staff');
    }
}

// Close popup
function closePopup() {
    staffFormPopup.classList.remove('active');
}

// Filter staff based on search input
async function filterStaff() {
    const searchTerm = searchInput.value.toLowerCase();

    try {
        showLoading(true);
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const allStaff = await response.json();

        if (searchTerm === '') {
            filteredStaffList = allStaff;
        } else {
            filteredStaffList = allStaff.filter(staff => {
                const searchableText = `
                    ${staff.staffId || ''} 
                    ${staff.firstName || ''} 
                    ${staff.lastName || ''} 
                    ${staff.designation || ''} 
                    ${staff.role || ''} 
                    ${staff.gender || ''} 
                    ${staff.contactNo || ''} 
                    ${staff.email || ''}
                `.toLowerCase();

                return searchableText.includes(searchTerm);
            });
        }

        currentPage = 1;
        updatePagination();
        showLoading(false);
    } catch (error) {
        console.error('Error filtering staff:', error);
        showError('Failed to filter staff data');
        showLoading(false);
    }
}

// Update statistics
function updateStats(staffList) {
    document.getElementById('totalStaff').textContent = staffList.length;

    const managerCount = staffList.filter(staff => staff.role === 'MANAGER').length;
    const administrativeCount = staffList.filter(staff => staff.role === 'ADMINISTRATIVE').length;
    const scientistCount = staffList.filter(staff => staff.role === 'SCIENTIST').length;

    document.getElementById('managerCount').textContent = managerCount;
    document.getElementById('administrativeCount').textContent = administrativeCount;
    document.getElementById('scientistCount').textContent = scientistCount;
}

// Show loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Show success message
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

// Show error message
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

// Generate Role Distribution Report
function generateRoleReport() {
    fetchWithAuth(API_BASE_URL + '/all')
        .then(response => response.json())
        .then(staffList => {
            // ... rest of the function remains the same
            const roleCounts = {};
            staffList.forEach(staff => {
                const role = staff.role || 'OTHER';
                roleCounts[role] = (roleCounts[role] || 0) + 1;
            });

            const roleLabels = Object.keys(roleCounts);
            const roleData = Object.values(roleCounts);

            // Create detailed report content
            document.getElementById('reportModalTitle').textContent = 'Role Distribution Report';

            const summaryHTML = `
                <h4><i class="fas fa-info-circle"></i> Role Distribution Summary</h4>
                <div class="report-summary-item">
                    <span>Total Staff:</span>
                    <strong>${staffList.length}</strong>
                </div>
                ${roleLabels.map((role, index) => `
                    <div class="report-summary-item">
                        <span>${role}:</span>
                        <strong>${roleData[index]} (${Math.round((roleData[index] / staffList.length) * 100)}%)</strong>
                    </div>
                `).join('')}
                <div class="report-summary-item">
                    <span>Report Generated:</span>
                    <strong>${new Date().toLocaleString()}</strong>
                </div>
            `;

            document.getElementById('reportSummary').innerHTML = summaryHTML;

            // Create chart container if it doesn't exist
            let chartContainer = document.querySelector('.report-chart-container');
            if (!chartContainer) {
                chartContainer = document.createElement('div');
                chartContainer.className = 'report-chart-container';
                document.querySelector('.report-modal-body').insertBefore(chartContainer, document.getElementById('reportSummary'));
            }

            chartContainer.innerHTML = '<canvas id="reportChart"></canvas>';

            // Destroy existing chart if it exists
            if (window.roleChartInstance) {
                window.roleChartInstance.destroy();
            }

            const ctx = document.getElementById('reportChart').getContext('2d');
            window.roleChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: roleLabels,
                    datasets: [{
                        data: roleData,
                        backgroundColor: [
                            '#3498db',
                            '#9b59b6',
                            '#2ecc71',
                            '#f39c12',
                            '#e74c3c',
                            '#1abc9c'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: '#ffffff',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: 'Staff Role Distribution'
                        }
                    }
                }
            });

            // Show the report modal
            document.getElementById('reportModal').classList.add('active');
        })
        .catch(error => {
            console.error('Error generating role report:', error);
            showError('Failed to generate role report');
        });
}

// Generate Gender Distribution Report
function generateGenderReport() {
    fetchWithAuth(API_BASE_URL + '/all')
        .then(response => response.json())
        .then(staffList => {
            // ... rest of the function remains the same
            const genderCounts = {
                MALE: 0,
                FEMALE: 0,
                OTHER: 0
            };

            staffList.forEach(staff => {
                const gender = staff.gender ? staff.gender.toUpperCase() : 'OTHER';
                if (genderCounts.hasOwnProperty(gender)) {
                    genderCounts[gender]++;
                } else {
                    genderCounts.OTHER++;
                }
            });


            // Create detailed report content
            document.getElementById('reportModalTitle').textContent = 'Gender Distribution Report';

            const summaryHTML = `
                <h4><i class="fas fa-info-circle"></i> Gender Distribution Summary</h4>
                <div class="report-summary-item">
                    <span>Total Staff:</span>
                    <strong>${staffList.length}</strong>
                </div>
                <div class="report-summary-item">
                    <span>Male:</span>
                    <strong>${genderCounts.MALE} (${Math.round((genderCounts.MALE / staffList.length) * 100)}%)</strong>
                </div>
                <div class="report-summary-item">
                    <span>Female:</span>
                    <strong>${genderCounts.FEMALE} (${Math.round((genderCounts.FEMALE / staffList.length) * 100)}%)</strong>
                </div>
                <div class="report-summary-item">
                    <span>Other/Unspecified:</span>
                    <strong>${genderCounts.OTHER} (${Math.round((genderCounts.OTHER / staffList.length) * 100)}%)</strong>
                </div>
                <div class="report-summary-item">
                    <span>Gender Diversity Score:</span>
                    <strong>${calculateDiversityScore(genderCounts, staffList.length)}/100</strong>
                </div>
                <div class="report-summary-item">
                    <span>Report Generated:</span>
                    <strong>${new Date().toLocaleString()}</strong>
                </div>
            `;

            document.getElementById('reportSummary').innerHTML = summaryHTML;

            // Create chart container if it doesn't exist
            let chartContainer = document.querySelector('.report-chart-container');
            if (!chartContainer) {
                chartContainer = document.createElement('div');
                chartContainer.className = 'report-chart-container';
                document.querySelector('.report-modal-body').insertBefore(chartContainer, document.getElementById('reportSummary'));
            }

            chartContainer.innerHTML = '<canvas id="reportChart"></canvas>';

            // Destroy existing chart if it exists
            if (window.genderChartInstance) {
                window.genderChartInstance.destroy();
            }

            const ctx = document.getElementById('reportChart').getContext('2d');
            window.genderChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Male', 'Female', 'Other/Unspecified'],
                    datasets: [{
                        data: [genderCounts.MALE, genderCounts.FEMALE, genderCounts.OTHER],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#95a5a6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: '#ffffff',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: 'Staff Role Distribution'
                        }
                    }
                }
            });

            // Show the report modal
            document.getElementById('reportModal').classList.add('active');
        })
        .catch(error => {
            console.error('Error generating gender report:', error);
            showError('Failed to generate gender report');
        });
}


// Generate Joining Trends Report
function generateJoiningReport() {
    fetchWithAuth(API_BASE_URL + '/all')
        .then(response => response.json())
        .then(staffList => {
            // ... rest of the function remains the same
            const yearCounts = {};
            staffList.forEach(staff => {
                if (staff.joinedDate) {
                    const year = new Date(staff.joinedDate).getFullYear();
                    yearCounts[year] = (yearCounts[year] || 0) + 1;
                }
            });

            // Sort years
            const sortedYears = Object.keys(yearCounts).sort();
            const yearData = sortedYears.map(year => yearCounts[year]);

            // Calculate growth percentages
            const growthRates = [];
            for (let i = 1; i < sortedYears.length; i++) {
                const prevYearCount = yearCounts[sortedYears[i-1]];
                const currentYearCount = yearCounts[sortedYears[i]];
                const growthRate = prevYearCount > 0 ? ((currentYearCount - prevYearCount) / prevYearCount) * 100 : 0;
                growthRates.push(growthRate.toFixed(1));
            }

            // Create detailed report content
            document.getElementById('reportModalTitle').textContent = 'Joining Trends Report';

            let summaryHTML = `
                <h4><i class="fas fa-info-circle"></i> Joining Trends Summary</h4>
                <div class="report-summary-item">
                    <span>Total Staff:</span>
                    <strong>${staffList.length}</strong>
                </div>
                <div class="report-summary-item">
                    <span>Time Period:</span>
                    <strong>${sortedYears.length > 0 ? `${sortedYears[0]} - ${sortedYears[sortedYears.length-1]}` : 'No data'}</strong>
                </div>
                <div class="report-summary-item">
                    <span>Average Annual Growth:</span>
                    <strong>${calculateAverageGrowth(growthRates)}%</strong>
                </div>
                <div class="report-summary-item">
                    <span>Peak Hiring Year:</span>
                    <strong>${findPeakYear(yearCounts)}</strong>
                </div>
            `;

            // Add yearly breakdown if we have data
            if (sortedYears.length > 0) {
                summaryHTML += `<h4 style="margin-top: 20px;"><i class="fas fa-calendar"></i> Yearly Breakdown</h4>`;
                sortedYears.forEach((year, index) => {
                    summaryHTML += `
                        <div class="report-summary-item">
                            <span>${year}:</span>
                            <strong>${yearCounts[year]} hires${index > 0 ? ` (${growthRates[index-1]}% growth)` : ''}</strong>
                        </div>
                    `;
                });
            }

            summaryHTML += `
                <div class="report-summary-item">
                    <span>Report Generated:</span>
                    <strong>${new Date().toLocaleString()}</strong>
                </div>
            `;

            document.getElementById('reportSummary').innerHTML = summaryHTML;

            // Create chart container if it doesn't exist
            let chartContainer = document.querySelector('.report-chart-container');
            if (!chartContainer) {
                chartContainer = document.createElement('div');
                chartContainer.className = 'report-chart-container';
                document.querySelector('.report-modal-body').insertBefore(chartContainer, document.getElementById('reportSummary'));
            }

            chartContainer.innerHTML = '<canvas id="reportChart"></canvas>';

            // Destroy existing chart if it exists
            if (window.joiningChartInstance) {
                window.joiningChartInstance.destroy();
            }

            // Only create chart if we have data
            if (sortedYears.length > 0) {
                const ctx = document.getElementById('reportChart').getContext('2d');
                window.joiningChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: sortedYears,
                        datasets: [{
                            label: 'Staff Joined',
                            data: yearData,
                            backgroundColor: '#3498db',
                            borderColor: '#2980b9',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        backgroundColor: '#ffffff',
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: 'Staff Joining Trends by Year'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Staff'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Year'
                                }
                            }
                        }
                    }
                });
            }

            // Show the report modal
            document.getElementById('reportModal').classList.add('active');
        })
        .catch(error => {
            console.error('Error generating joining report:', error);
            showError('Failed to generate joining report');
        });
}
// Helper functions for reports
function calculateDiversityScore(genderCounts, totalStaff) {
    if (totalStaff === 0) return 0;

    const malePercentage = (genderCounts.MALE / totalStaff) * 100;
    const femalePercentage = (genderCounts.FEMALE / totalStaff) * 100;

    // Calculate score based on how close we are to 50/50 distribution
    const idealPercentage = 50;
    const maleScore = 50 - Math.abs(malePercentage - idealPercentage);
    const femaleScore = 50 - Math.abs(femalePercentage - idealPercentage);

    return Math.round(maleScore + femaleScore);
}

function calculateAverageGrowth(growthRates) {
    if (growthRates.length === 0) return 0;

    const sum = growthRates.reduce((total, rate) => total + parseFloat(rate), 0);
    return (sum / growthRates.length).toFixed(1);
}

function findPeakYear(yearCounts) {
    let peakYear = null;
    let peakCount = 0;

    for (const year in yearCounts) {
        if (yearCounts[year] > peakCount) {
            peakCount = yearCounts[year];
            peakYear = year;
        }
    }

    return `${peakYear} (${peakCount} hires)`;
}
// Initialize the page
loadStaffData();
loadStats();

// Generate full comprehensive report (without export feature)
async function generateFullReport() {
    try {
        showLoading(true);
        const response = await fetchWithAuth(API_BASE_URL + '/all');
        const staffList = await response.json();

        // Create report modal content
        document.getElementById('reportModalTitle').textContent = 'Comprehensive Staff Report';

        // Create summary content
        const totalStaff = staffList.length;
        const managerCount = staffList.filter(staff => staff.role === 'MANAGER').length;
        const administrativeCount = staffList.filter(staff => staff.role === 'ADMINISTRATIVE').length;
        const scientistCount = staffList.filter(staff => staff.role === 'SCIENTIST').length;
        const otherCount = totalStaff - (managerCount + administrativeCount + scientistCount);

        const maleCount = staffList.filter(staff => staff.gender === 'MALE').length;
        const femaleCount = staffList.filter(staff => staff.gender === 'FEMALE').length;

        // Calculate average tenure
        const currentDate = new Date();
        let totalTenure = 0;
        let staffWithJoinDate = 0;

        staffList.forEach(staff => {
            if (staff.joinedDate) {
                const joinDate = new Date(staff.joinedDate);
                const tenure = (currentDate - joinDate) / (365.25 * 24 * 60 * 60 * 1000); // in years
                totalTenure += tenure;
                staffWithJoinDate++;
            }
        });

        const avgTenure = staffWithJoinDate > 0 ? (totalTenure / staffWithJoinDate).toFixed(1) : 0;

        // Create summary HTML
        const summaryHTML = `
            <h4><i class="fas fa-info-circle"></i> Report Summary</h4>
            <div class="report-summary-item">
                <span>Total Staff:</span>
                <strong>${totalStaff}</strong>
            </div>
            <div class="report-summary-item">
                <span>Managers:</span>
                <strong>${managerCount} (${Math.round((managerCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Administrative:</span>
                <strong>${administrativeCount} (${Math.round((administrativeCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Scientists:</span>
                <strong>${scientistCount} (${Math.round((scientistCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Other Roles:</span>
                <strong>${otherCount} (${Math.round((otherCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Male Staff:</span>
                <strong>${maleCount} (${Math.round((maleCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Female Staff:</span>
                <strong>${femaleCount} (${Math.round((femaleCount/totalStaff)*100)}%)</strong>
            </div>
            <div class="report-summary-item">
                <span>Average Tenure:</span>
                <strong>${avgTenure} years</strong>
            </div>
            <div class="report-summary-item">
                <span>Report Generated:</span>
                <strong>${new Date().toLocaleString()}</strong>
            </div>
        `;

        document.getElementById('reportSummary').innerHTML = summaryHTML;

        // Create charts
        const chartContainer = document.querySelector('.report-chart-container');
        chartContainer.innerHTML = '<canvas id="reportChart"></canvas>';

        const ctx = document.getElementById('reportChart').getContext('2d');

        // Create combined chart with role and gender distribution
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Role Distribution', 'Gender Distribution'],
                datasets: [
                    {
                        label: 'Managers',
                        data: [managerCount, 0],
                        backgroundColor: '#3498db',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Administrative',
                        data: [administrativeCount, 0],
                        backgroundColor: '#9b59b6',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Scientists',
                        data: [scientistCount, 0],
                        backgroundColor: '#2ecc71',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Other',
                        data: [otherCount, 0],
                        backgroundColor: '#f39c12',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Male',
                        data: [0, maleCount],
                        backgroundColor: '#3498db',
                        stack: 'Stack 1'
                    },
                    {
                        label: 'Female',
                        data: [0, femaleCount],
                        backgroundColor: '#e74c3c',
                        stack: 'Stack 1'
                    }
                ]
            },
            options: {
                responsive: true,
                backgroundColor: '#ffffff',
                plugins: {
                    title: {
                        display: true,
                        text: 'Staff Distribution Overview'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Staff'
                        }
                    }
                }
            }
        });

        // Show the report modal
        document.getElementById('reportModal').classList.add('active');
        showLoading(false);

    } catch (error) {
        console.error('Error generating full report:', error);
        showError('Failed to generate full report');
        showLoading(false);
    }
}

// Export data to CSV
function exportToCSV() {
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tr');
    let csvContent = "";

    // Get headers
    const headers = [];
    table.querySelectorAll('th').forEach(header => {
        headers.push(header.textContent);
    });
    csvContent += headers.join(',') + '\n';

    // Get data rows
    for (let i = 1; i < rows.length; i++) {
        const row = [];
        const cols = rows[i].querySelectorAll('td');

        for (let j = 0; j < cols.length - 1; j++) { // Skip actions column
            let text = cols[j].textContent;
            // Handle commas in content
            text = text.includes(',') ? `"${text}"` : text;
            row.push(text);
        }

        csvContent += row.join(',') + '\n';
    }

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.setAttribute("href", url);
    link.setAttribute("download", `staff_data_${date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print staff table
function printTable() {
    const printContent = document.querySelector('.table-card').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Staff List - Print</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .no-print { display: none; }
                h1 { text-align: center; margin-bottom: 20px; }
                .print-date { text-align: right; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Staff List</h1>
            <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
            ${printContent}
        </body>
        </html>
    `;

    window.print();
    document.body.innerHTML = originalContent;
    // Reload the page to restore functionality
    window.location.reload();
}

// Filter staff by role
function filterByRole() {
    Swal.fire({
        title: 'Filter by Role',
        input: 'select',
        inputOptions: {
            'ALL': 'All Roles',
            'MANAGER': 'Manager',
            'ADMINISTRATIVE': 'Administrative',
            'SCIENTIST': 'Scientist',
            'OTHER': 'Other'
        },
        inputPlaceholder: 'Select a role',
        showCancelButton: true,
        inputValidator: (value) => {
            return new Promise((resolve) => {
                if (value !== '') {
                    resolve();
                } else {
                    resolve('You need to select a role');
                }
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const role = result.value;
            const rows = staffTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                if (role === 'ALL') {
                    row.style.display = '';
                } else {
                    const roleCell = row.querySelector('td:nth-child(4)');
                    if (roleCell.textContent.includes(role)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });

            showSuccess(`Filtered by: ${role === 'ALL' ? 'All Roles' : role}`);
        }
    });
}

// Export chart as image with white background
function exportChartAsImage() {
    const canvas = document.getElementById('reportChart');
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Set dimensions
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original chart on top of white background
    tempCtx.drawImage(canvas, 0, 0);

    // Export the temporary canvas
    const image = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'staff_report_chart.png';
    link.click();
}

// Export report as PDF (improved layout)
function exportReportAsPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set margins and initial position
    const margin = 20;
    let yPosition = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Add title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Staff Management System Report', centerX, yPosition, { align: 'center' });
    yPosition += 15;

    // Add date
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, centerX, yPosition, { align: 'center' });
    yPosition += 20;

    // Get the chart as image
    const canvas = document.getElementById('reportChart');
    if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 160;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add chart to PDF
        doc.addImage(imgData, 'PNG', centerX - (imgWidth/2), yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
    }

    // Add summary if available
    const summary = document.getElementById('reportSummary');
    if (summary) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Report Summary', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const summaryItems = summary.querySelectorAll('.report-summary-item');

        summaryItems.forEach(item => {
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = margin;
            }

            const text = item.textContent;
            // Split text into label and value
            const parts = text.split(':');
            if (parts.length >= 2) {
                const label = parts[0] + ':';
                const value = parts.slice(1).join(':').trim();

                doc.setFont(undefined, 'bold');
                doc.text(label, margin, yPosition);

                doc.setFont(undefined, 'normal');
                const valueWidth = doc.getTextWidth(value);
                doc.text(value, pageWidth - margin - valueWidth, yPosition);
            } else {
                doc.text(text, margin, yPosition);
            }
            yPosition += 7;
        });
    }

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);
    }

    // Save the PDF
    doc.save('staff_management_report.pdf');
    showSuccess('PDF report downloaded successfully');
}

// Add event listeners for export buttons
document.getElementById('exportChartBtn').addEventListener('click', exportChartAsImage);
document.getElementById('exportPdfBtn').addEventListener('click', exportReportAsPdf);