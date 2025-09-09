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

    // Close view popup
    document.querySelector('.close-view-popup').addEventListener('click', () => {
        viewVehiclePopup.classList.remove('active');
    });
    document.getElementById('generateVehicleIdBtn').addEventListener('click', generateNextVehicleId);


}

// Modified API Functions with JWT
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
        const vehicles = await response.json();
        renderVehicles(vehicles);
        updateStats(vehicles);
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
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
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
// UI Functions
function renderVehicles(vehicles) {
    vehicleTableBody.innerHTML = '';

    if (vehicles.length === 0) {
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

    vehicles.forEach(vehicle => {
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

// Auto-generate ID when opening the add form
function openAddForm() {
    editMode.value = 'false';
    popupTitle.textContent = 'Add New Vehicle';
    vehicleForm.reset();
    generateNextVehicleId(); // Auto-generate ID
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
    const rows = vehicleTableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function exportData() {
    // Get all vehicle data
    const table = document.querySelector('table');
    let csv = [];

    // Get headers
    const headers = [];
    document.querySelectorAll('th').forEach(header => {
        headers.push(header.textContent);
    });
    csv.push(headers.join(','));

    // Get rows
    document.querySelectorAll('tbody tr').forEach(row => {
        if (row.style.display !== 'none') {
            const rowData = [];
            row.querySelectorAll('td').forEach((cell, index) => {
                // Skip actions column
                if (index < 6) {
                    // Handle status badge
                    if (cell.querySelector('.status-badge')) {
                        rowData.push(cell.querySelector('.status-badge').textContent);
                    } else {
                        rowData.push(cell.textContent);
                    }
                }
            });
            csv.push(rowData.join(','));
        }
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
    // Get all visible rows (after filtering)
    const visibleRows = Array.from(vehicleTableBody.querySelectorAll('tr'))
        .filter(row => row.style.display !== 'none');

    if (visibleRows.length === 0) {
        showError('No data to print');
        return;
    }

    // Create table HTML for printing
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

    // Add rows
    visibleRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        tableHTML += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[0].textContent}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[1].textContent}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[2].textContent}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[3].textContent}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[4].textContent}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${cells[5].textContent}</td>
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
                <p>Total Records: ${visibleRows.length}</p>
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
    const rows = vehicleTableBody.getElementsByTagName('tr');

    for (let row of rows) {
        row.style.display = '';
    }

    searchInput.value = '';
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

function createChart(canvasId, type, labels, data, backgroundColors, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart if it exists
    if (window[canvasId + 'Chart']) {
        window[canvasId + 'Chart'].destroy();
    }

    // Create new chart
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
                        size: 16
                    }
                },
                legend: {
                    position: 'bottom'
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
        const image = canvas.toDataURL('image/png');
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
                // Export all charts
                html2canvas(document.getElementById('reportContent')).then(canvas => {
                    const image = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = 'vehicle_full_report.png';
                    link.click();
                });
            },
            preDeny: () => {
                // Export status chart
                const image = canvases[0].toDataURL('image/png');
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

    // Add title
    doc.setFontSize(20);
    doc.text('Vehicle Management System Report', 105, 15, { align: 'center' });

    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

    // Add summary if vehicles data is provided
    if (vehicles) {
        doc.setFontSize(12);
        doc.text(`Total Vehicles: ${vehicles.length}`, 20, 30);

        // Add status counts
        const statusCounts = countByProperty(vehicles, 'status');
        let yPosition = 40;

        doc.setFontSize(14);
        doc.text('Status Summary', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        Object.keys(statusCounts).forEach(status => {
            doc.text(`${status}: ${statusCounts[status]}`, 20, yPosition);
            yPosition += 7;
        });

        yPosition += 5;

        // Add category counts
        doc.setFontSize(14);
        doc.text('Category Summary', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        const categoryCounts = countByProperty(vehicles, 'vehicleCategory');
        Object.keys(categoryCounts).forEach(category => {
            doc.text(`${category}: ${categoryCounts[category]}`, 20, yPosition);
            yPosition += 7;
        });
    }

    // Add chart images if available
    const canvases = document.querySelectorAll('#reportContent canvas');
    let yPosition = vehicles ? 120 : 30;

    canvases.forEach((canvas, index) => {
        if (index > 0 && yPosition > 240) {
            doc.addPage();
            yPosition = 20;
        }

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, yPosition, 170, 100);
        yPosition += 110;
    });

    // Save the PDF
    doc.save('vehicle_management_report.pdf');
    showSuccess('PDF report downloaded successfully');
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
        customClass: {
            popup: 'custom-swal-popup'
        }
    });
}

function showError(message) {
    Swal.fire({
        title: 'Error!',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
            popup: 'custom-swal-popup'
        }
    });
}