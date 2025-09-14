// Pagination Variables
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let allVehicles = [];
let filteredVehicles = [];
// API Base URL
const API_BASE = 'http://localhost:8080/api/v1/vehicle';


// JWT Token management
let jwtToken = localStorage.getItem('jwtToken');

// Function to set JWT token
function setJwtToken(token) {
    jwtToken = token;
    localStorage.setItem('jwtToken', token);
}

// Function to get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
    };
}
// Function to generate staff IDs
async function generateStaffIds() {
    try {
        // In a real application, you would fetch existing staff from an API
        // For this example, we'll generate sample staff IDs
        const staffIds = [];
        for (let i = 1; i <= 20; i++) {
            staffIds.push(`S${i.toString().padStart(3, '0')}`);
        }
        return staffIds;
    } catch (error) {
        console.error('Error generating staff IDs:', error);
        return [];
    }
}

// Function to populate staff dropdown
async function populateStaffDropdown() {
    const staffDropdown = document.getElementById('staffIdInput');
    const staffIds = await generateStaffIds();

    // Clear existing options except the first one
    while (staffDropdown.options.length > 1) {
        staffDropdown.remove(1);
    }

    // Add staff IDs to dropdown
    staffIds.forEach(staffId => {
        const option = document.createElement('option');
        option.value = staffId;
        option.textContent = staffId;
        staffDropdown.appendChild(option);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!jwtToken) {
        window.location.href = 'login.html';
        return;
    }
    loadVehicles();
    setupEventListeners();
    populateStaffDropdown(); // Add this line
});

// Check if token exists on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!jwtToken) {
        // Redirect to login if no token
        window.location.href = 'login.html';
        return;
    }
    loadVehicles();
    setupEventListeners();
});


// DOM Elements
const vehicleTableBody = document.getElementById('vehicleTableBody');
const vehicleForm = document.getElementById('vehicleForm');
const vehicleFormPopup = document.getElementById('vehicleFormPopup');
const viewVehiclePopup = document.getElementById('viewVehiclePopup');
const openFormBtn = document.getElementById('openFormBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const printBtn = document.getElementById('printBtn');
const filterBtn = document.getElementById('filterBtn');
const searchInput = document.getElementById('searchInput');
const generateReportBtn = document.getElementById('generateReportBtn');
const editMode = document.getElementById('editMode');
const editVehicleCode = document.getElementById('editVehicleCode');
const popupTitle = document.getElementById('popupTitle');

// Stats Elements
const totalVehiclesEl = document.getElementById('totalVehicles');
const activeVehiclesEl = document.getElementById('activeVehicles');
const maintenanceVehiclesEl = document.getElementById('maintenanceVehicles');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    setupEventListeners();
});

function setupEventListeners() {
    openFormBtn.addEventListener('click', openAddForm);
    closePopupBtn.addEventListener('click', closePopup);
    cancelBtn.addEventListener('click', closePopup);
    refreshBtn.addEventListener('click', loadVehicles);
    vehicleForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterVehicles);
    exportBtn.addEventListener('click', exportData);
    printBtn.addEventListener('click', printTable);
    filterBtn.addEventListener('click', toggleFilterOptions);
    generateReportBtn.addEventListener('click', generateFullReport);

    // Pagination event listeners
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click', () => goToPage(totalPages));
    document.getElementById('itemsPerPage').addEventListener('change', changeItemsPerPage);

    // Close view popup
    document.querySelector('.close-view-popup').addEventListener('click', () => {
        viewVehiclePopup.classList.remove('active');
    });
    document.getElementById('generateVehicleIdBtn').addEventListener('click', generateNextVehicleId);
}
function updatePagination() {
    // Calculate total pages
    totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    // Ensure current page is within valid range
    if (currentPage > totalPages) {
        currentPage = totalPages > 0 ? totalPages : 1;
    }

    // Update pagination controls
    updatePaginationControls();

    // Update displayed items info
    updatePaginationInfo();
}
function updatePaginationControls() {
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');

    // Enable/disable navigation buttons
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    // Generate page number buttons
    pageNumbers.innerHTML = '';

    // Show up to 5 page buttons with current page in the middle
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbers.appendChild(pageBtn);
    }
}

function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredVehicles.length);

    document.getElementById('currentItems').textContent =
        filteredVehicles.length > 0 ? `${startIndex + 1}-${endIndex}` : '0';
    document.getElementById('totalItems').textContent = filteredVehicles.length;
}
function goToPage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderVehicles();
    updatePaginationControls();
    updatePaginationInfo();
}

function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1; // Reset to first page
    updatePagination();
    renderVehicles();
}
async function loadVehicles() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/getAll`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            // Token expired or invalid
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allVehicles = await response.json();
        filteredVehicles = [...allVehicles];
        updateStats(allVehicles);
        updatePagination();
        renderVehicles();
    } catch (error) {
        showError('Failed to load vehicles. Please check if the server is running.');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}
// Function to generate the next vehicle ID
async function generateNextVehicleId() {
    try {
        const response = await fetch(`${API_BASE}/getAll`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const vehicles = await response.json();

        // Find the highest existing vehicle code
        let maxNumber = 0;
        vehicles.forEach(vehicle => {
            if (vehicle.vehicleCode && vehicle.vehicleCode.startsWith('V')) {
                const numberPart = parseInt(vehicle.vehicleCode.substring(1));
                if (!isNaN(numberPart) && numberPart > maxNumber) {
                    maxNumber = numberPart;
                }
            }
        });

        // Generate the next ID
        const nextNumber = maxNumber + 1;
        const nextId = 'V' + nextNumber.toString().padStart(3, '0');

        // Set the value in the input field
        document.getElementById('vehicleCodeInput').value = nextId;

    } catch (error) {
        console.error('Error generating vehicle ID:', error);
        showError('Failed to generate vehicle ID');
    }
}

async function saveVehicle(vehicleData) {
    try {
        const response = await fetch(`${API_BASE}/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(vehicleData)
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            showSuccess('Vehicle saved successfully');
            loadVehicles();
            closePopup();
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to save vehicle');
        }
    } catch (error) {
        showError(error.message || 'Failed to save vehicle');
        console.error('Error:', error);
    }
}

async function updateVehicle(vehicleCode, vehicleData) {
    try {
        const response = await fetch(`${API_BASE}/update/${vehicleCode}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(vehicleData)
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            showSuccess('Vehicle updated successfully');
            loadVehicles();
            closePopup();
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update vehicle');
        }
    } catch (error) {
        showError(error.message || 'Failed to update vehicle');
        console.error('Error:', error);
    }
}

async function deleteVehicle(vehicleCode) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2980b9',
        cancelButtonColor: '#2c3e50',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_BASE}/delete/${vehicleCode}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (response.ok) {
                showSuccess('Vehicle deleted successfully');
                loadVehicles();
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete vehicle');
            }
        } catch (error) {
            showError(error.message || 'Failed to delete vehicle');
            console.error('Error:', error);
        }
    }
}

async function getVehicleDetails(vehicleCode) {
    try {
        const response = await fetch(`${API_BASE}/${vehicleCode}`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const vehicle = await response.json();
        showVehicleDetails(vehicle);
    } catch (error) {
        showError('Failed to load vehicle details');
        console.error('Error:', error);
    }
}
// Handle unauthorized access
function handleUnauthorized() {
    showError('Your session has expired. Please login again.');
    localStorage.removeItem('jwtToken');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}
function renderVehicles() {
    vehicleTableBody.innerHTML = '';

    // Get vehicles for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredVehicles.length);
    const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

    if (currentVehicles.length === 0) {
        vehicleTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-car" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p>No vehicles found</p>
                </td>
            </tr>
        `;
        return;
    }

    currentVehicles.forEach(vehicle => {
        const row = document.createElement('tr');

        // Determine status class
        let statusClass = 'status-inactive';
        if (vehicle.status === 'Active') statusClass = 'status-active';
        if (vehicle.status === 'Maintenance') statusClass = 'status-maintenance';

        row.innerHTML = `
            <td>${vehicle.vehicleCode}</td>
            <td>${vehicle.licensePlateNumber}</td>
            <td>${vehicle.vehicleCategory}</td>
            <td>${vehicle.fuelType}</td>
            <td><span class="status-badge ${statusClass}">${vehicle.status}</span></td>
            <td>${vehicle.staffId}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-id="${vehicle.vehicleCode}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${vehicle.vehicleCode}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${vehicle.vehicleCode}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        vehicleTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
}

// Extract the button listener code to a separate function
function addActionButtonListeners() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleCode = e.currentTarget.getAttribute('data-id');
            getVehicleDetails(vehicleCode);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleCode = e.currentTarget.getAttribute('data-id');
            openEditForm(vehicleCode);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleCode = e.currentTarget.getAttribute('data-id');
            deleteVehicle(vehicleCode);
        });
    });
}

function updateStats(vehicles) {
    totalVehiclesEl.textContent = vehicles.length;

    const activeCount = vehicles.filter(v => v.status === 'Active').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;

    activeVehiclesEl.textContent = activeCount;
    maintenanceVehiclesEl.textContent = maintenanceCount;
}

// Also call when opening the add form to refresh staff list
function openAddForm() {
    editMode.value = 'false';
    popupTitle.textContent = 'Add New Vehicle';
    vehicleForm.reset();
    generateNextVehicleId();
    populateStaffDropdown(); // Add this line
    vehicleFormPopup.classList.add('active');
}

// Don't auto-generate when editing
async function openEditForm(vehicleCode) {
    try {
        const response = await fetch(`${API_BASE}/${vehicleCode}`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const vehicle = await response.json();

        editMode.value = 'true';
        editVehicleCode.value = vehicle.vehicleCode;
        popupTitle.textContent = 'Edit Vehicle';

        // Fill form with vehicle data
        document.getElementById('vehicleCodeInput').value = vehicle.vehicleCode;
        document.getElementById('licensePlateInput').value = vehicle.licensePlateNumber;
        document.getElementById('categoryInput').value = vehicle.vehicleCategory;
        document.getElementById('fuelTypeInput').value = vehicle.fuelType;
        document.getElementById('statusInput').value = vehicle.status;

        // Set the staff ID in the dropdown
        const staffDropdown = document.getElementById('staffIdInput');
        staffDropdown.value = vehicle.staffId;

        vehicleFormPopup.classList.add('active');
    } catch (error) {
        showError('Failed to load vehicle data');
        console.error('Error:', error);
    }
}

function closePopup() {
    vehicleFormPopup.classList.remove('active');
}

function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values directly from inputs instead of FormData
    const vehicleData = {
        vehicleCode: document.getElementById('vehicleCodeInput').value.trim(),
        licensePlateNumber: document.getElementById('licensePlateInput').value.trim(),
        vehicleCategory: document.getElementById('categoryInput').value,
        fuelType: document.getElementById('fuelTypeInput').value,
        status: document.getElementById('statusInput').value,
        staffId: document.getElementById('staffIdInput').value.trim()
    };

    console.log('Form data:', vehicleData); // Debug log

    // Basic validation - check if any field is empty
    let hasError = false;
    let errorMessage = 'Please fill in all fields: ';

    if (!vehicleData.vehicleCode) {
        errorMessage += 'Vehicle Code, ';
        document.getElementById('vehicleCodeInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('vehicleCodeInput').style.borderColor = '';
    }

    if (!vehicleData.licensePlateNumber) {
        errorMessage += 'License Plate, ';
        document.getElementById('licensePlateInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('licensePlateInput').style.borderColor = '';
    }

    if (!vehicleData.vehicleCategory) {
        errorMessage += 'Category, ';
        document.getElementById('categoryInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('categoryInput').style.borderColor = '';
    }

    if (!vehicleData.fuelType) {
        errorMessage += 'Fuel Type, ';
        document.getElementById('fuelTypeInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('fuelTypeInput').style.borderColor = '';
    }

    if (!vehicleData.status) {
        errorMessage += 'Status, ';
        document.getElementById('statusInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('statusInput').style.borderColor = '';
    }

    if (!vehicleData.staffId) {
        errorMessage += 'Staff ID, ';
        document.getElementById('staffIdInput').style.borderColor = 'red';
        hasError = true;
    } else {
        document.getElementById('staffIdInput').style.borderColor = '';
    }

    if (hasError) {
        // Remove trailing comma and space
        errorMessage = errorMessage.replace(/,\s*$/, '');
        showError(errorMessage);
        return;
    }

    if (editMode.value === 'true') {
        updateVehicle(editVehicleCode.value, vehicleData);
    } else {
        saveVehicle(vehicleData);
    }
}

function showVehicleDetails(vehicle) {
    // Determine status class
    let statusClass = 'status-inactive';
    if (vehicle.status === 'Active') statusClass = 'status-active';
    if (vehicle.status === 'Maintenance') statusClass = 'status-maintenance';

    // Update details
    document.getElementById('detail-code').textContent = vehicle.vehicleCode;
    document.getElementById('detail-license').textContent = vehicle.licensePlateNumber;
    document.getElementById('detail-category').textContent = vehicle.vehicleCategory;
    document.getElementById('detail-fuel').textContent = vehicle.fuelType;
    document.getElementById('detail-staff').textContent = vehicle.staffId;

    // Update status badge
    const statusBadge = document.getElementById('detail-status');
    statusBadge.textContent = vehicle.status;
    statusBadge.className = `status-badge ${statusClass}`;

    // Show popup
    viewVehiclePopup.classList.add('active');
}

function filterVehicles() {
    const searchTerm = searchInput.value.toLowerCase();

    if (searchTerm === '') {
        filteredVehicles = [...allVehicles];
    } else {
        filteredVehicles = allVehicles.filter(vehicle => {
            return Object.values(vehicle).some(value =>
                value && value.toString().toLowerCase().includes(searchTerm)
            );
        });
    }

    currentPage = 1; // Reset to first page when filtering
    updatePagination();
    renderVehicles();
}

function exportData() {
    // Use filteredVehicles instead of visible rows in the DOM
    let csv = [];

    // Get headers
    const headers = ['Vehicle Code', 'License Plate', 'Category', 'Fuel Type', 'Status', 'Staff ID'];
    csv.push(headers.join(','));

    // Get rows from filteredVehicles
    filteredVehicles.forEach(vehicle => {
        const rowData = [
            vehicle.vehicleCode,
            vehicle.licensePlateNumber,
            vehicle.vehicleCategory,
            vehicle.fuelType,
            vehicle.status,
            vehicle.staffId
        ];
        csv.push(rowData.join(','));
    });

    // Download CSV
    const csvContent = "data:text/csv;charset=utf-8," + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vehicles_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Data exported successfully');
}

function printTable() {
    if (filteredVehicles.length === 0) {
        showError('No data to print');
        return;
    }

    // Create table HTML for printing using filteredVehicles
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Vehicle Code</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">License Plate</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Category</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Fuel Type</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Status</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Staff ID</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows from filteredVehicles
    filteredVehicles.forEach(vehicle => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.vehicleCode}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.licensePlateNumber}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.vehicleCategory}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.fuelType}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.status}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${vehicle.staffId}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Vehicle Management System - Report</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                }
                h1 { 
                    color: #2c3e50; 
                    text-align: center;
                    margin-bottom: 10px;
                }
                .report-info {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #666;
                }
                .summary {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f9f9f9;
                    border-left: 4px solid #667eea;
                }
            </style>
        </head>
        <body>
            <h1>Vehicle Management System - Report</h1>
            <div class="report-info">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Records: ${filteredVehicles.length}</p>
            </div>
            ${tableHTML}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 100);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function toggleFilterOptions() {
    Swal.fire({
        title: 'Filter Options',
        html: `
                <div style="text-align: left;">
                    <div style="margin-bottom: 15px;">
                        <label for="filterStatus" style="display: block; margin-bottom: 5px;">Status:</label>
                        <select id="filterStatus" class="swal2-input">
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="filterCategory" style="display: block; margin-bottom: 5px;">Category:</label>
                        <select id="filterCategory" class="swal2-input">
                            <option value="">All Categories</option>
                            <option value="Truck">Truck</option>
                            <option value="Car">Car</option>
                            <option value="Van">Van</option>
                            <option value="Motorcycle">Motorcycle</option>
                            <option value="Tractor">Tractor</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label for="filterFuel" style="display: block; margin-bottom: 5px;">Fuel Type:</label>
                        <select id="filterFuel" class="swal2-input">
                            <option value="">All Fuel Types</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            `,
        showCancelButton: true,
        confirmButtonText: 'Apply Filters',
        cancelButtonText: 'Clear Filters',
        preConfirm: () => {
            return {
                status: document.getElementById('filterStatus').value,
                category: document.getElementById('filterCategory').value,
                fuel: document.getElementById('filterFuel').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            applyFilters(result.value);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            clearFilters();
        }
    });
}

function applyFilters(filters) {
    const rows = vehicleTableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const status = row.cells[4].textContent.trim();
        const category = row.cells[2].textContent.trim();
        const fuel = row.cells[3].textContent.trim();

        const statusMatch = !filters.status || status === filters.status;
        const categoryMatch = !filters.category || category === filters.category;
        const fuelMatch = !filters.fuel || fuel === filters.fuel;

        row.style.display = (statusMatch && categoryMatch && fuelMatch) ? '' : 'none';
    }

    showSuccess('Filters applied successfully');
}

function clearFilters() {
    filteredVehicles = [...allVehicles];
    searchInput.value = '';
    currentPage = 1; // Reset to first page
    updatePagination();
    renderVehicles();
    showSuccess('Filters cleared successfully');
}

function generateFullReport() {
    Swal.fire({
        title: 'Generating Report',
        html: 'Please wait while we generate your full report...',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        }
    }).then(() => {
        // In a real application, this would generate a PDF or detailed report
        showSuccess('Full report generated successfully');
    });
}

function generateStatusReport() {
    fetch(`${API_BASE}/getAll`, {
        headers: getAuthHeaders()
    })
        .then(response => {
            if (response.status === 401) {
                handleUnauthorized();
                return Promise.reject('Unauthorized');
            }
            return response.json();
        })
        .then(vehicles => {
            // Count vehicles by status
            const statusCounts = {
                'Active': 0,
                'Inactive': 0,
                'Maintenance': 0
            };

            vehicles.forEach(vehicle => {
                if (statusCounts.hasOwnProperty(vehicle.status)) {
                    statusCounts[vehicle.status]++;
                }
            });

            // Prepare data for chart
            const labels = Object.keys(statusCounts);
            const data = Object.values(statusCounts);
            const backgroundColors = [
                'rgba(39, 174, 96, 0.7)',     // Green for Active
                'rgba(231, 76, 60, 0.7)',     // Red for Inactive
                'rgba(243, 156, 18, 0.7)'     // Orange for Maintenance
            ];

            // Show report in modal
            showReportModal('Status Distribution Report', 'pie', labels, data, backgroundColors);
        })
        .catch(error => {
            if (error !== 'Unauthorized') {
                console.error('Error:', error);
                showError('Failed to generate status report');
            }
        });
}

function generateCategoryReport() {
    fetch(`${API_BASE}/getAll`, {
        headers: getAuthHeaders()
    })
        .then(response => {
            if (response.status === 401) {
                handleUnauthorized();
                return Promise.reject('Unauthorized');
            }
            return response.json();
        })
        .then(vehicles => {
            // Count vehicles by category
            const categoryCounts = {};

            vehicles.forEach(vehicle => {
                const category = vehicle.vehicleCategory;
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            // Prepare data for chart
            const labels = Object.keys(categoryCounts);
            const data = Object.values(categoryCounts);

            // Generate colors for each category
            const backgroundColors = generateColors(labels.length);

            // Show report in modal
            showReportModal('Category Analysis Report', 'bar', labels, data, backgroundColors);
        })
        .catch(error => {
            if (error !== 'Unauthorized') {
                console.error('Error:', error);
                showError('Failed to generate category report');
            }
        });
}

function generateFuelTypeReport() {
    fetch(`${API_BASE}/getAll`, {
        headers: getAuthHeaders()
    })
        .then(response => {
            if (response.status === 401) {
                handleUnauthorized();
                return Promise.reject('Unauthorized');
            }
            return response.json();
        })
        .then(vehicles => {
            // Count vehicles by fuel type
            const fuelTypeCounts = {};

            vehicles.forEach(vehicle => {
                const fuelType = vehicle.fuelType;
                fuelTypeCounts[fuelType] = (fuelTypeCounts[fuelType] || 0) + 1;
            });

            // Prepare data for chart
            const labels = Object.keys(fuelTypeCounts);
            const data = Object.values(fuelTypeCounts);

            // Generate colors for each fuel type
            const backgroundColors = generateColors(labels.length);

            // Show report in modal
            showReportModal('Fuel Type Analysis Report', 'doughnut', labels, data, backgroundColors);
        })
        .catch(error => {
            if (error !== 'Unauthorized') {
                console.error('Error:', error);
                showError('Failed to generate fuel type report');
            }
        });
}

function generateFullReport() {
    // Show loading
    Swal.fire({
        title: 'Generating Full Report',
        html: 'Please wait while we generate your comprehensive report...',
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
    });

    // Fetch data and generate report
    fetch(`${API_BASE}/getAll`, {
        headers: getAuthHeaders()
    })
        .then(response => {
            if (response.status === 401) {
                handleUnauthorized();
                return Promise.reject('Unauthorized');
            }
            return response.json();
        })
        .then(vehicles => {
            Swal.close();

            if (vehicles.length === 0) {
                showError('No vehicle data available to generate report');
                return;
            }

            // Create a comprehensive report with multiple charts
            const reportModal = document.getElementById('reportModal');
            const reportTitle = document.getElementById('reportTitle');
            const reportContent = document.getElementById('reportContent');

            reportTitle.textContent = 'Comprehensive Vehicle Report';

            // Create container for multiple charts
            reportContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="fuelChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <canvas id="staffChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="report-summary mt-4">
                <h4>Report Summary</h4>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Vehicles: ${vehicles.length}</p>
            </div>
        `;

            // Generate status chart
            const statusCounts = countByProperty(vehicles, 'status');
            createChart('statusChart', 'pie', Object.keys(statusCounts), Object.values(statusCounts),
                ['rgba(39, 174, 96, 0.7)', 'rgba(231, 76, 60, 0.7)', 'rgba(243, 156, 18, 0.7)'],
                'Status Distribution');

            // Generate category chart
            const categoryCounts = countByProperty(vehicles, 'vehicleCategory');
            createChart('categoryChart', 'bar', Object.keys(categoryCounts), Object.values(categoryCounts),
                generateColors(Object.keys(categoryCounts).length),
                'Vehicle Categories');

            // Generate fuel type chart
            const fuelCounts = countByProperty(vehicles, 'fuelType');
            createChart('fuelChart', 'doughnut', Object.keys(fuelCounts), Object.values(fuelCounts),
                generateColors(Object.keys(fuelCounts).length),
                'Fuel Types');

            // Generate staff assignment chart (top 10 staff with most vehicles)
            const staffCounts = countByProperty(vehicles, 'staffId');
            const staffLabels = Object.keys(staffCounts).slice(0, 10); // Top 10 staff
            const staffData = staffLabels.map(staff => staffCounts[staff]);
            createChart('staffChart', 'bar', staffLabels, staffData,
                generateColors(staffLabels.length),
                'Top 10 Staff by Vehicle Assignment');

            // Show the modal
            reportModal.classList.add('active');

            // Add event listeners for export buttons
            document.getElementById('exportChartBtn').onclick = () => exportChartAsImage();
            document.getElementById('exportPdfBtn').onclick = () => exportReportAsPdf(vehicles);
        })
        .catch(error => {
            if (error !== 'Unauthorized') {
                console.error('Error:', error);
                Swal.close();
                showError('Failed to generate full report');
            }
        });
}

function showReportModal(title, chartType, labels, data, backgroundColors) {
    const reportModal = document.getElementById('reportModal');
    const reportTitle = document.getElementById('reportTitle');
    const reportContent = document.getElementById('reportContent');

    reportTitle.textContent = title;
    reportContent.innerHTML = '<div class="chart-container"><canvas id="reportChart"></canvas></div>';

    // Show the modal
    reportModal.classList.add('active');

    // Create the chart after a short delay to ensure the canvas is rendered
    setTimeout(() => {
        createChart('reportChart', chartType, labels, data, backgroundColors, title);

        // Add event listeners for export buttons
        document.getElementById('exportChartBtn').onclick = () => exportChartAsImage();
        document.getElementById('exportPdfBtn').onclick = () => exportReportAsPdf();
    }, 100);
}

// In the generateFullReport function, update chart creation to include titles:
function createChart(canvasId, type, labels, data, backgroundColors, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart if it exists
    if (window[canvasId + 'Chart']) {
        window[canvasId + 'Chart'].destroy();
    }

    // Create new chart with proper title
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function countByProperty(array, property) {
    const counts = {};
    array.forEach(item => {
        const value = item[property];
        counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsla(${hue}, 70%, 65%, 0.7)`);
    }
    return colors;
}

function exportChartAsImage() {
    // Get all canvases in the report
    const canvases = document.querySelectorAll('#reportContent canvas');

    if (canvases.length === 0) return;

    // For single chart reports
    if (canvases.length === 1) {
        const canvas = canvases[0];
        // Create a temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the original chart on top
        ctx.drawImage(canvas, 0, 0);

        const image = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'vehicle_report_chart.png';
        link.click();
    } else {
        // For multiple charts (full report)
        Swal.fire({
            title: 'Export Charts',
            text: 'Which chart would you like to export?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'All Charts',
            showDenyButton: true,
            denyButtonText: 'Status Chart',
            showConfirmButton: canvases.length > 1,
            preConfirm: () => {
                // Export all charts with white background
                html2canvas(document.getElementById('reportContent'), {
                    backgroundColor: '#ffffff'
                }).then(canvas => {
                    const image = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = 'vehicle_full_report.png';
                    link.click();
                });
            },
            preDeny: () => {
                // Export status chart with white background
                const canvas = canvases[0];
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const ctx = tempCanvas.getContext('2d');

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(canvas, 0, 0);

                const image = tempCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = 'vehicle_status_chart.png';
                link.click();
            }
        });
    }
}

function exportReportAsPdf(vehicles) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set page margins and initial position
    const margin = 15;
    let yPosition = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Add title with styling
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Vehicle Management System Report', centerX, yPosition, { align: 'center' });
    yPosition += 12;

    // Add date
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, centerX, yPosition, { align: 'center' });
    yPosition += 20;

    // Add summary section with proper styling
    if (vehicles) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Summary', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        // Total vehicles
        doc.setTextColor(44, 62, 80);
        doc.setFont(undefined, 'bold');
        doc.text('Total Vehicles:', margin, yPosition);
        doc.setTextColor(0, 0, 0);
        doc.text(vehicles.length.toString(), pageWidth - margin - doc.getTextWidth(vehicles.length.toString()), yPosition);
        yPosition += 8;

        // Status counts
        const statusCounts = countByProperty(vehicles, 'status');
        Object.keys(statusCounts).forEach(status => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setTextColor(44, 62, 80);
            doc.setFont(undefined, 'bold');
            doc.text(`${status}:`, margin, yPosition);
            doc.setTextColor(0, 0, 0);
            const countText = `${statusCounts[status]} (${Math.round((statusCounts[status] / vehicles.length) * 100)}%)`;
            doc.text(countText, pageWidth - margin - doc.getTextWidth(countText), yPosition);
            yPosition += 8;
        });

        yPosition += 5;
    }

    // Add charts with proper sizing
    const canvases = document.querySelectorAll('#reportContent canvas');

    canvases.forEach((canvas, index) => {
        // Check if we need a new page
        if (yPosition > 150 && index > 0) {
            doc.addPage();
            yPosition = margin;
        }

        const imgData = canvas.toDataURL('image/png', 1.0); // Higher quality
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add chart title if available
        const chartTitle = getChartTitle(canvas);
        if (chartTitle) {
            if (yPosition > 220) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text(chartTitle, centerX, yPosition, { align: 'center' });
            yPosition += 8;
        }

        // Add the chart image
        doc.addImage(imgData, 'PNG', centerX - (imgWidth/2), yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);
    }

    // Save the PDF
    doc.save('vehicle_management_report.pdf');
    showSuccess('PDF report downloaded successfully');
}

// Helper function to extract chart title
function getChartTitle(canvas) {
    const chart = Chart.getChart(canvas);
    if (chart && chart.options && chart.options.plugins && chart.options.plugins.title) {
        return chart.options.plugins.title.text;
    }
    return null;
}

// Add event listeners for closing report modal
document.querySelector('.close-report-popup').addEventListener('click', () => {
    document.getElementById('reportModal').classList.remove('active');
});

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'block' : 'none';
}

function showSuccess(message) {
    Swal.fire({
        title: 'Success!',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3498db',
        customClass: {
            popup: 'custom-swal-popup',
            icon: 'custom-swal-icon'
        }
    });
}


function showError(message) {
    Swal.fire({
        title: 'Error!',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3498db',
        customClass: {
            popup: 'custom-swal-popup'
        }
    });
}
