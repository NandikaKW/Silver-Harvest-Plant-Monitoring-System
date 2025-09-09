let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let filteredFieldsData = [];
let jwtToken = localStorage.getItem('jwtToken');

const API_BASE_URL = 'http://localhost:8080/api/v1/field';
let fieldsData = [];
let currentFieldCode = '';
let isEditMode = false;

// Charts object
let charts = {
    areaChart: null,
    locationChart: null,
    utilizationChart: null,
    comparisonChart: null
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!jwtToken) {
        // Redirect to login if no token
        window.location.href = 'login.html';
        return;
    }

    loadData();
    setupEventListeners();
});

// Function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
    if (!jwtToken) {
        // Try to get token from localStorage
        jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            showError('Authentication required. Please login again.');
            window.location.href = 'login.html';
            return null;
        }
    }

    // Set up default headers
    const defaultHeaders = {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
    };

    // Merge headers
    options.headers = {...defaultHeaders, ...options.headers};

    try {
        const response = await fetch(url, options);

        // Check for unauthorized response
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            jwtToken = null;
            showError('Session expired. Please login again.');
            window.location.href = 'login.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error);
        showError('Network error. Please check your connection.');
        return null;
    }
}

// Add event listeners for pagination controls
function setupPaginationListeners() {
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click', () => goToPage(totalPages));

    document.getElementById('pageSizeSelect').addEventListener('change', function() {
        pageSize = parseInt(this.value);
        currentPage = 1; // Reset to first page when changing page size
        setupPagination();
        renderFieldsTable();
    });
}

// Set up event listeners
function setupEventListeners() {
    setupPaginationListeners();
    // Add field button
    document.getElementById('openFormBtn').addEventListener('click', openAddModal);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // Search input
    document.getElementById('searchInput').addEventListener('input', filterFields);

    // Form submission
    document.getElementById('fieldForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveField();
    });

    // Close popup buttons
    document.getElementById('closePopupBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.querySelector('.close-view-popup').addEventListener('click', closeViewModal);

    // File input changes
    document.getElementById('fieldImageOneInput').addEventListener('change', function() {
        previewImage(this, 'imagePreviewOne');
        updateFileName(this, 'fileNameOne');
    });

    document.getElementById('fieldImageTwoInput').addEventListener('change', function() {
        previewImage(this, 'imagePreviewTwo');
        updateFileName(this, 'fileNameTwo');
    });
}

// Load all data
async function loadData() {
    try {
        showLoading(true);
        await loadFields();
        await loadStats();
        showSuccess('Data loaded successfully');
    } catch (error) {
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Update the loadFields function to initialize pagination
async function loadFields() {
    try {
        const response = await makeAuthenticatedRequest(API_BASE_URL);
        if (!response) return; // Authentication failed

        if (!response.ok) throw new Error('Failed to fetch fields');

        fieldsData = await response.json();
        filteredFieldsData = [...fieldsData];
        setupPagination();
        renderFieldsTable();
    } catch (error) {
        console.error('Error loading fields:', error);
        throw error;
    }
}

// Add this function to set up pagination
function setupPagination() {
    // Calculate total pages
    totalPages = Math.ceil(filteredFieldsData.length / pageSize);

    // Update pagination info
    updatePaginationInfo();

    // Render page numbers
    renderPageNumbers();

    // Update button states
    updatePaginationButtons();
}

// Add this function to update pagination info
function updatePaginationInfo() {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredFieldsData.length);
    const total = filteredFieldsData.length;

    document.getElementById('paginationInfo').textContent =
        `Showing ${start} to ${end} of ${total} entries`;
}

// Add this function to render page numbers
function renderPageNumbers() {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';

    // Always show first page
    addPageNumber(1);

    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Add ellipsis if needed
    if (startPage > 2) {
        pageNumbersContainer.innerHTML += '<span class="page-ellipsis">...</span>';
    }

    // Add page numbers in range
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
        pageNumbersContainer.innerHTML += '<span class="page-ellipsis">...</span>';
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
        addPageNumber(totalPages);
    }
}

// Helper function to add a page number button
function addPageNumber(page) {
    const pageNumber = document.createElement('button');
    pageNumber.className = `page-number ${page === currentPage ? 'active' : ''}`;
    pageNumber.textContent = page;
    pageNumber.addEventListener('click', () => goToPage(page));
    document.getElementById('pageNumbers').appendChild(pageNumber);
}

// Add this function to update pagination buttons state
function updatePaginationButtons() {
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
}

// Add this function to go to a specific page
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;
    renderFieldsTable();
    setupPagination();
}

// Load statistics
async function loadStats() {
    try {
        const response = await makeAuthenticatedRequest(API_BASE_URL);
        if (!response) return; // Authentication failed

        if (!response.ok) throw new Error('Failed to fetch stats');

        const fields = await response.json();
        const totalFields = fields.length;
        const totalArea = fields.reduce((sum, field) => sum + (field.extent_size || 0), 0);
        const activeStaff = Math.floor(Math.random() * 20) + 5; // Demo data

        document.getElementById('totalFields').textContent = totalFields;
        document.getElementById('totalArea').textContent = totalArea.toFixed(2);
        document.getElementById('activeStaff').textContent = activeStaff;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update the renderFieldsTable function to use pagination
function renderFieldsTable() {
    const tableBody = document.getElementById('fieldTableBody');

    if (filteredFieldsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No fields found. Add a new field to get started.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredFieldsData.length);
    const currentPageData = filteredFieldsData.slice(startIndex, endIndex);

    tableBody.innerHTML = currentPageData.map(field => `
        <tr>
            <td>${field.fieldCode}</td>
            <td>${field.fieldName}</td>
            <td>${field.fieldLocation}</td>
            <td>${field.extent_size ? field.extent_size.toFixed(2) : '0.00'}</td>
            <td>${field.logCode || 'N/A'}</td>
            <td>
                ${field.fieldImageOne ?
        `<img src="data:image/jpeg;base64,${field.fieldImageOne}" class="img-thumbnail" alt="Field Image">` :
        '<i class="fas fa-image text-muted"></i>'
    }
                ${field.fieldImageTwo ?
        `<img src="data:image/jpeg;base64,${field.fieldImageTwo}" class="img-thumbnail" alt="Field Image">` :
        ''
    }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewField('${field.fieldCode}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editField('${field.fieldCode}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteField('${field.fieldCode}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}


// Add this function to generate the next field ID
async function generateNextFieldId() {
    try {
        const response = await makeAuthenticatedRequest(API_BASE_URL);
        if (!response) return "F001"; // Fallback if authentication fails

        if (!response.ok) throw new Error('Failed to fetch fields');

        const fields = await response.json();

        if (fields.length === 0) {
            return "F001";
        }

        // Extract all field codes and find the highest number
        const fieldCodes = fields.map(field => field.fieldCode);
        const maxCode = fieldCodes.reduce((max, code) => {
            if (code && code.startsWith('F')) {
                const num = parseInt(code.substring(1));
                return num > max ? num : max;
            }
            return max;
        }, 0);

        // Generate next ID
        const nextNum = maxCode + 1;
        return `F${nextNum.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating field ID:', error);
        // Fallback to a random ID if there's an error
        return `F${Math.floor(100 + Math.random() * 900)}`;
    }
}

// Add this function to populate log codes
async function populateLogCodes() {
    try {
        // In a real application, you would fetch these from an API
        // For this example, we'll generate some sample log codes
        const logCodes = ['LOG001', 'LOG002', 'LOG003', 'LOG004', 'LOG005'];

        const logCodeSelect = document.getElementById('logCodeInput');

        // Clear existing options except the first one
        while (logCodeSelect.options.length > 1) {
            logCodeSelect.remove(1);
        }

        // Add log codes to dropdown
        logCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            logCodeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating log codes:', error);
    }
}

// Update the openAddModal function
async function openAddModal() {
    isEditMode = false;
    currentFieldCode = '';
    document.getElementById('popupTitle').textContent = 'Add New Field';
    document.getElementById('editMode').value = 'false';
    document.getElementById('fieldForm').reset();
    document.getElementById('imagePreviewOne').innerHTML = '<i class="fas fa-image text-muted"></i>';
    document.getElementById('imagePreviewTwo').innerHTML = '<i class="fas fa-image text-muted"></i>';
    document.getElementById('fileNameOne').textContent = 'No file chosen';
    document.getElementById('fileNameTwo').textContent = 'No file chosen';

    // Generate and set the next field ID
    const nextId = await generateNextFieldId();
    document.getElementById('fieldCodeInput').value = nextId;

    // Populate log codes
    await populateLogCodes();

    openModal('fieldFormPopup');
}

// View field details
async function viewField(fieldCode) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/${fieldCode}`);
        if (!response) return; // Authentication failed

        if (!response.ok) throw new Error('Failed to fetch field details');

        const field = await response.json();

        const detailsHtml = `
            <div class="field-details-grid">
              <div class="detail-item">
                <label><i class="fas fa-barcode"></i> Field Code</label>
                <span>${field.fieldCode}</span>
              </div>
              <div class="detail-item">
                <label><i class="fas fa-signature"></i> Field Name</label>
                <span>${field.fieldName}</span>
              </div>
              <div class="detail-item full-width">
                <label><i class="fas fa-map-marker-alt"></i> Location</label>
                <span>${field.fieldLocation}</span>
              </div>
              <div class="detail-item">
                <label><i class="fas fa-ruler-combined"></i> Extent Size</label>
                <span>${field.extent_size ? field.extent_size.toFixed(2) : '0.00'} Acres</span>
              </div>
              <div class="detail-item">
                <label><i class="fas fa-clipboard-list"></i> Log Code</label>
                <span>${field.logCode || 'N/A'}</span>
              </div>
              <div class="detail-item full-width">
                <label><i class="fas fa-images"></i> Field Images</label>
                <div class="image-preview-container">
                  <div class="image-preview">
                    ${field.fieldImageOne ?
            `<img src="data:image/jpeg;base64,${field.fieldImageOne}" alt="Field Image">` :
            `<div class="no-image"><i class="fas fa-image"></i><p>No image available</p></div>`
        }
                  </div>
                  <div class="image-preview">
                    ${field.fieldImageTwo ?
            `<img src="data:image/jpeg;base64,${field.fieldImageTwo}" alt="Field Image">` :
            `<div class="no-image"><i class="fas fa-image"></i><p>No image available</p></div>`
        }
                  </div>
                </div>
              </div>
            </div>
          `;

        document.getElementById('fieldDetails').innerHTML = detailsHtml;
        openModal('viewFieldPopup');
    } catch (error) {
        showError('Failed to load field details: ' + error.message);
    }
}

// Update the editField function
async function editField(fieldCode) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/${fieldCode}`);
        if (!response) return; // Authentication failed

        if (!response.ok) throw new Error('Failed to fetch field for edit');

        const field = await response.json();

        isEditMode = true;
        currentFieldCode = fieldCode;
        document.getElementById('popupTitle').textContent = 'Edit Field';
        document.getElementById('editMode').value = 'true';
        document.getElementById('editFieldCode').value = fieldCode;

        document.getElementById('fieldCodeInput').value = field.fieldCode;
        document.getElementById('fieldNameInput').value = field.fieldName;
        document.getElementById('fieldLocationInput').value = field.fieldLocation;
        document.getElementById('extentSizeInput').value = field.extent_size || '';

        // Populate log codes and set the selected value
        await populateLogCodes();
        document.getElementById('logCodeInput').value = field.logCode || '';

        // Handle image previews
        document.getElementById('imagePreviewOne').innerHTML = field.fieldImageOne ?
            `<img src="data:image/jpeg;base64,${field.fieldImageOne}">` :
            '<i class="fas fa-image text-muted"></i>';

        document.getElementById('imagePreviewTwo').innerHTML = field.fieldImageTwo ?
            `<img src="data:image/jpeg;base64,${field.fieldImageTwo}">` :
            '<i class="fas fa-image text-muted"></i>';

        document.getElementById('fileNameOne').textContent = field.fieldImageOne ? 'Image uploaded' : 'No file chosen';
        document.getElementById('fileNameTwo').textContent = field.fieldImageTwo ? 'Image uploaded' : 'No file chosen';

        openModal('fieldFormPopup');
    } catch (error) {
        showError('Failed to load field for editing: ' + error.message);
    }
}

// Save field (create or update)
async function saveField() {
    const formData = new FormData();

    // Get form values
    const fieldCode = document.getElementById('fieldCodeInput').value;
    const fieldName = document.getElementById('fieldNameInput').value;
    const fieldLocation = document.getElementById('fieldLocationInput').value;
    const extentSize = document.getElementById('extentSizeInput').value;
    const logCode = document.getElementById('logCodeInput').value;
    const imageOne = document.getElementById('fieldImageOneInput').files[0];
    const imageTwo = document.getElementById('fieldImageTwoInput').files[0];

    // Validate required fields
    if (!fieldCode || !fieldName || !fieldLocation || !extentSize || !logCode) {
        showError('Please fill in all required fields');
        return;
    }

    // Append data to FormData
    formData.append('fieldCode', fieldCode);
    formData.append('fieldName', fieldName);
    formData.append('fieldLocation', fieldLocation);
    formData.append('extent_size', extentSize);
    formData.append('logCode', logCode);

    if (imageOne) formData.append('fieldImageOne', imageOne);
    if (imageTwo) formData.append('fieldImageTwo', imageTwo);

    try {
        const url = isEditMode ? `${API_BASE_URL}/${currentFieldCode}` : API_BASE_URL;
        const method = isEditMode ? 'PUT' : 'POST';

        // For FormData, we need to let the browser set the Content-Type header
        const options = {
            method: method,
            body: formData,
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        };

        const response = await fetch(url, options);

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            jwtToken = null;
            showError('Session expired. Please login again.');
            window.location.href = 'login.html';
            return;
        }

        if (response.status === 201 || response.status === 204) {
            showSuccess(`Field ${isEditMode ? 'updated' : 'added'} successfully!`);
            closeModal();
            loadData();
        } else {
            throw new Error(`Server returned status: ${response.status}`);
        }
    } catch (error) {
        showError('Failed to save field: ' + error.message);
    }
}

// Delete field
async function deleteField(fieldCode) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/${fieldCode}`, {
            method: 'DELETE'
        });

        if (!response) return; // Authentication failed

        if (response.ok) {
            showSuccess('Field deleted successfully!');
            loadData();
        } else {
            throw new Error('Failed to delete field');
        }
    } catch (error) {
        showError('Failed to delete field: ' + error.message);
    }
}

// Update the filterFields function to work with pagination
function filterFields() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        filteredFieldsData = [...fieldsData];
    } else {
        filteredFieldsData = fieldsData.filter(field =>
            field.fieldCode.toLowerCase().includes(searchTerm) ||
            field.fieldName.toLowerCase().includes(searchTerm) ||
            field.fieldLocation.toLowerCase().includes(searchTerm) ||
            (field.logCode && field.logCode.toLowerCase().includes(searchTerm))
        );
    }

    // Reset to first page when filtering
    currentPage = 1;
    setupPagination();
    renderFieldsTable();
}

// Image preview
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<i class="fas fa-image text-muted"></i>';
    }
}

// Update file name display
function updateFileName(input, fileNameId) {
    const fileNameDisplay = document.getElementById(fileNameId);
    if (input.files.length > 0) {
        fileNameDisplay.textContent = input.files[0].name;
    } else {
        fileNameDisplay.textContent = 'No file chosen';
    }
}

// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('fieldFormPopup').classList.remove('active');
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewFieldPopup').classList.remove('active');
}

// Show/hide loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

// Utility functions
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#e74c3c'
    });
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        confirmButtonColor: '#27ae60',
        timer: 2000
    });
}

// Add this function to set up report event listeners
function setupReportListeners() {
    // Report tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });

            // Show the corresponding tab pane
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}Report`).classList.add('active');

            // Generate the report for this tab if it hasn't been generated yet
            generateReport(tabName);
        });
    });

    // Report range change
    document.getElementById('reportRange').addEventListener('change', function() {
        generateAllReports();
    });

    // Location filter change
    document.getElementById('locationFilter').addEventListener('change', function() {
        generateAllReports();
    });

    // Generate all reports button
    document.getElementById('generateAllReportsBtn').addEventListener('click', function() {
        generateAllReports();
    });
}

// Add this function to initialize reports
function initializeReports() {
    // Populate location filter
    populateLocationFilter();

    // Set up report listeners
    setupReportListeners();

    // Generate initial reports
    generateAllReports();
}

// Add this function to populate location filter
function populateLocationFilter() {
    const locationFilter = document.getElementById('locationFilter');
    const locations = [...new Set(fieldsData.map(field => field.fieldLocation))];

    // Clear existing options except "All Locations"
    while (locationFilter.options.length > 1) {
        locationFilter.remove(1);
    }

    // Add locations to filter
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Add this function to generate all reports
function generateAllReports() {
    generateReport('area');
    generateReport('location');
    generateReport('utilization');
    generateReport('comparison');
    updateSummaryStats();
}

// Add this function to generate specific report
function generateReport(reportType) {
    switch (reportType) {
        case 'area':
            generateAreaReport();
            break;
        case 'location':
            generateLocationReport();
            break;
        case 'utilization':
            generateUtilizationReport();
            break;
        case 'comparison':
            generateComparisonReport();
            break;
    }
}

// Add this function to update summary stats
function updateSummaryStats() {
    const filteredFields = getFilteredFields();
    const totalFields = filteredFields.length;
    const totalArea = filteredFields.reduce((sum, field) => sum + (field.extent_size || 0), 0);
    const uniqueLocations = new Set(filteredFields.map(field => field.fieldLocation)).size;
    const avgSize = totalFields > 0 ? totalArea / totalFields : 0;

    document.getElementById('summaryTotalFields').textContent = totalFields;
    document.getElementById('summaryTotalArea').textContent = totalArea.toFixed(2);
    document.getElementById('summaryLocations').textContent = uniqueLocations;
    document.getElementById('summaryAvgSize').textContent = avgSize.toFixed(2);
}

// Add this function to get filtered fields based on report filters
function getFilteredFields() {
    const locationFilter = document.getElementById('locationFilter').value;
    const dateRange = document.getElementById('reportRange').value;

    let filteredFields = [...fieldsData];

    // Filter by location
    if (locationFilter !== 'all') {
        filteredFields = filteredFields.filter(field => field.fieldLocation === locationFilter);
    }

    // Note: Since we don't have date fields in the sample data,
    // this would need to be implemented with actual date fields
    // For now, we'll just return the location-filtered data

    return filteredFields;
}

// Add this function to generate area report
function generateAreaReport() {
    const filteredFields = getFilteredFields();

    // Categorize fields by size
    const sizeCategories = {
        'Small (<5 acres)': 0,
        'Medium (5-20 acres)': 0,
        'Large (20-50 acres)': 0,
        'Very Large (>50 acres)': 0
    };

    filteredFields.forEach(field => {
        const size = field.extent_size || 0;
        if (size < 5) {
            sizeCategories['Small (<5 acres)']++;
        } else if (size >= 5 && size < 20) {
            sizeCategories['Medium (5-20 acres)']++;
        } else if (size >= 20 && size < 50) {
            sizeCategories['Large (20-50 acres)']++;
        } else {
            sizeCategories['Very Large (>50 acres)']++;
        }
    });

    // Prepare chart data
    const labels = Object.keys(sizeCategories);
    const data = Object.values(sizeCategories);
    const colors = ['#4caf50', '#8bc34a', '#ff9800', '#f44336'];

    // Destroy previous chart if it exists
    if (charts.areaChart) {
        charts.areaChart.destroy();
    }

    // Create chart
    const ctx = document.getElementById('areaChart').getContext('2d');
    charts.areaChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Field Size Distribution'
                }
            }
        }
    });

    // Generate insights
    const totalFields = filteredFields.length;
    const largestCategory = Object.keys(sizeCategories).reduce((a, b) =>
        sizeCategories[a] > sizeCategories[b] ? a : b
    );

    const insightsHtml = `
        <li>Your fields are distributed across ${Object.keys(sizeCategories).filter(cat => sizeCategories[cat] > 0).length} size categories</li>
        <li>The majority of your fields (${largestCategory}) account for ${sizeCategories[largestCategory]} fields</li>
        <li>${sizeCategories['Small (<5 acres)'] > 0 ? `You have ${sizeCategories['Small (<5 acres)']} small fields ideal for specialty crops` : 'Consider adding small fields for specialty crops'}</li>
        <li>${sizeCategories['Very Large (>50 acres)'] > 0 ? `Your ${sizeCategories['Very Large (>50 acres)']} very large fields are perfect for commodity crops` : 'Consider consolidating fields for larger-scale operations'}</li>
    `;

    document.getElementById('areaInsights').innerHTML = insightsHtml;
}

// Add this function to generate location report
function generateLocationReport() {
    const filteredFields = getFilteredFields();

    // Group fields by location
    const locationCounts = {};
    filteredFields.forEach(field => {
        const location = field.fieldLocation;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    // Prepare chart data
    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    const colors = generateColors(labels.length);

    // Destroy previous chart if it exists
    if (charts.locationChart) {
        charts.locationChart.destroy();
    }

    // Create chart
    const ctx = document.getElementById('locationChart').getContext('2d');
    charts.locationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Fields',
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Fields by Location'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });

    // Generate insights
    const totalLocations = labels.length;
    const mostFieldsLocation = labels.reduce((a, b) =>
        locationCounts[a] > locationCounts[b] ? a : b
    );

    const insightsHtml = `
        <li>Your fields are distributed across ${totalLocations} different locations</li>
        <li>${mostFieldsLocation} has the most fields with ${locationCounts[mostFieldsLocation]} fields</li>
        <li>${totalLocations > 3 ? 'Your fields are well distributed across multiple locations' : 'Consider diversifying your field locations to spread risk'}</li>
        <li>${Object.keys(locationCounts).length === 1 ? 'All fields are in one location - consider geographic diversification' : 'Geographic distribution helps mitigate regional weather risks'}</li>
    `;

    document.getElementById('locationInsights').innerHTML = insightsHtml;
}

// Add this function to generate utilization report
function generateUtilizationReport() {
    const filteredFields = getFilteredFields();

    // For demonstration, we'll create some mock utilization data
    // In a real application, this would come from your actual utilization data
    const utilizationData = {
        'High Utilization': Math.floor(filteredFields.length * 0.4),
        'Medium Utilization': Math.floor(filteredFields.length * 0.35),
        'Low Utilization': Math.floor(filteredFields.length * 0.2),
        'Idle': Math.floor(filteredFields.length * 0.05)
    };

    // Prepare chart data
    const labels = Object.keys(utilizationData);
    const data = Object.values(utilizationData);
    const colors = ['#4caf50', '#8bc34a', '#ff9800', '#f44336'];

    // Destroy previous chart if it exists
    if (charts.utilizationChart) {
        charts.utilizationChart.destroy();
    }

    // Create chart
    const ctx = document.getElementById('utilizationChart').getContext('2d');
    charts.utilizationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Field Utilization Rates'
                }
            }
        }
    });

    // Generate insights
    const totalFields = filteredFields.length;
    const utilizedFields = totalFields - utilizationData['Idle'];
    const utilizationRate = (utilizedFields / totalFields * 100).toFixed(1);

    const insightsHtml = `
        <li>Your overall field utilization rate is ${utilizationRate}%</li>
        <li>${utilizationData['High Utilization']} fields are highly utilized (excellent)</li>
        <li>${utilizationData['Idle']} fields are currently idle - consider putting them to use</li>
        <li>${utilizationRate > 80 ? 'Excellent utilization rate!' : 'There is room for improvement in field utilization'}</li>
    `;

    document.getElementById('utilizationInsights').innerHTML = insightsHtml;
}

// Add this function to generate comparison report
function generateComparisonReport() {
    const filteredFields = getFilteredFields();

    // For this demo, we'll compare the top 5 largest fields
    const sortedFields = [...filteredFields]
        .sort((a, b) => (b.extent_size || 0) - (a.extent_size || 0))
        .slice(0, 5);

    // Prepare chart data
    const labels = sortedFields.map(field => field.fieldName);
    const sizes = sortedFields.map(field => field.extent_size || 0);
    const colors = generateColors(sortedFields.length);

    // Destroy previous chart if it exists
    if (charts.comparisonChart) {
        charts.comparisonChart.destroy();
    }

    // Create chart
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    charts.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Size (Acres)',
                data: sizes,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Largest Fields Comparison'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Acres'
                    }
                }
            }
        }
    });

    // Generate insights
    const largestField = sortedFields[0];
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;

    const insightsHtml = `
        <li>Your largest field is "${largestField.fieldName}" at ${largestField.extent_size} acres</li>
        <li>The average size of your top fields is ${avgSize.toFixed(1)} acres</li>
        <li>${sizes.length >= 5 ? 'You have good field size diversity' : 'Consider adding more fields for better comparison'}</li>
        <li>${largestField.extent_size > avgSize * 2 ? 'Your largest field is significantly bigger than others' : 'Your field sizes are relatively consistent'}</li>
    `;

    document.getElementById('comparisonInsights').innerHTML = insightsHtml;
}

// Add this utility function to generate colors
function generateColors(count) {
    const baseColors = [
        '#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0',
        '#673ab7', '#3f51b5', '#00bcd4', '#009688', '#cddc39'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
}

// Update the loadData function to initialize reports
async function loadData() {
    try {
        showLoading(true);
        await loadFields();
        await loadStats();
        initializeReports(); // Add this line
        showSuccess('Data loaded successfully');
    } catch (error) {
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Logout function (add this if you need a logout button)
function logout() {
    localStorage.removeItem('jwtToken');
    jwtToken = null;
    window.location.href = 'login.html';
}
