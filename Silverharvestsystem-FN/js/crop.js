// Add these variables at the top of the script
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let allCrops = [];
let allFieldCodes = [];
let allLogCodes = [];

// Add JWT token handling at the top
const API_BASE = 'http://localhost:8080/api/v1/crop';

// Function to get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

// Function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();

    if (!token) {
        // Redirect to login if no token found
        window.location.href = 'signin.html';
        throw new Error('No authentication token found');
    }

    // Default headers - only include Authorization by default
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    // Only add Content-Type if it's not FormData and not already specified
    if (!(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    // For FormData, let the browser set the Content-Type automatically
    if (options.body instanceof FormData) {
        delete mergedOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, mergedOptions);

        // Handle unauthorized responses
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'signin.html';
            throw new Error('Authentication failed');
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// SweetAlert configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

$(document).ready(function() {
    // Check if user is authenticated on page load
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    // DOM Elements
    const $openFormBtn = $('#openFormBtn');
    const $refreshBtn = $('#refreshBtn');
    const $generateReportBtn = $('#generateReportBtn');
    const $cropFormPopup = $('#cropFormPopup');
    const $viewCropPopup = $('#viewCropPopup');
    const $closePopupBtn = $('#closePopupBtn');
    const $cancelBtn = $('#cancelBtn');
    const $closeViewPopupBtn = $('.close-view-popup');
    const $cropForm = $('#cropForm');
    const $popupTitle = $('#popupTitle');
    const $editMode = $('#editMode');
    const $cropImageInput = $('#cropImageInput');
    const $imageHelpText = $('#imageHelpText');
    const $cropTableBody = $('#cropTableBody');
    const $loadingSpinner = $('#loadingSpinner');
    const $totalCropsEl = $('#totalCrops');
    const $activeFieldsEl = $('#activeFields');
    const $currentSeasonEl = $('#currentSeason');
    const $searchInput = $('#searchInput');

    // Add logout functionality
    $('#logoutBtn').on('click', function() {
        localStorage.removeItem('jwtToken');
        window.location.href = 'signin.html';
    });

    // Load all crops on page load
    loadAllCrops();

    // File input styling functionality
    $('#cropImageInput').on('change', function() {
        const fileName = $(this).val().split('\\').pop();
        const $fileInputLabel = $('#fileInputLabel');
        const $fileName = $('#fileName');

        if (fileName) {
            $fileName.text(fileName);
            $fileInputLabel.addClass('has-file');
            $fileInputLabel.html('<i class="fas fa-check"></i> Image Selected');
        } else {
            $fileName.text('No file chosen');
            $fileInputLabel.removeClass('has-file');
            $fileInputLabel.html('<i class="fas fa-upload"></i> Choose Image');
        }
    });

    // Event listeners for pagination
    $('#pageSizeSelect').on('change', function() {
        itemsPerPage = parseInt($(this).val());
        currentPage = 1;
        renderTableWithPagination();
    });

    $('#firstPageBtn').on('click', function() {
        if (currentPage > 1) {
            currentPage = 1;
            renderTableWithPagination();
        }
    });

    $('#prevPageBtn').on('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderTableWithPagination();
        }
    });

    $('#nextPageBtn').on('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderTableWithPagination();
        }
    });

    $('#lastPageBtn').on('click', function() {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            renderTableWithPagination();
        }
    });

    // Event listener for generate crop code button
    $('#generateCropCodeBtn').on('click', function() {
        const nextCode = generateNextCropCode();
        $('#cropCodeInput').val(nextCode);
    });

    // Update the function that opens the form to auto-generate a code
    $openFormBtn.on('click', () => {
        resetForm();

        // Auto-generate crop code when opening the form
        const nextCode = generateNextCropCode();
        $('#cropCodeInput').val(nextCode);

        $popupTitle.text('Add New Crop');
        $editMode.val('false');
        $cropImageInput.prop('required', true);
        $imageHelpText.text('Please select an image for the crop');
        $cropFormPopup.addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Refresh crops list
    $refreshBtn.on('click', loadAllCrops);

    // Generate full report
    $generateReportBtn.on('click', generateFullReport);

    // Close popups
    const closePopups = () => {
        $cropFormPopup.removeClass('active');
        $viewCropPopup.removeClass('active');
        $('body').css('overflow', 'auto');
    };

    $closePopupBtn.on('click', closePopups);
    $cancelBtn.on('click', closePopups);
    $closeViewPopupBtn.on('click', closePopups);

    // Close when clicking outside the popup
    $cropFormPopup.on('click', (e) => {
        if (e.target === $cropFormPopup[0]) closePopups();
    });

    $viewCropPopup.on('click', (e) => {
        if (e.target === $viewCropPopup[0]) closePopups();
    });

    // Form submission
    $cropForm.on('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData();
        const isEditMode = $editMode.val() === 'true';
        const cropCode = $('#cropCodeInput').val();

        // Add all form fields to FormData
        formData.append('cropCode', cropCode);
        formData.append('commonName', $('#commonNameInput').val());
        formData.append('scientificName', $('#scientificNameInput').val());
        formData.append('category', $('#categoryInput').val());
        formData.append('cropSeason', $('#seasonInput').val());
        formData.append('fieldCode', $('#fieldCodeInput').val());
        formData.append('logCode', $('#logCodeInput').val());

        // Only append image if it's a new file or in add mode
        if ($cropImageInput[0].files[0]) {
            formData.append('cropImage', $cropImageInput[0].files[0]);
        } else if (!isEditMode) {
            showAlert('warning', 'Image Required', 'Please select an image for the crop');
            return;
        }

        const url = isEditMode ? `${API_BASE}/${cropCode}` : API_BASE;
        const method = isEditMode ? 'PUT' : 'POST';

        // Show loading state
        const $submitBtn = $cropForm.find('button[type="submit"]');
        const originalText = $submitBtn.html();
        $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Saving...');
        $submitBtn.prop('disabled', true);

        try {
            const response = await makeAuthenticatedRequest(url, {
                method: method,
                body: formData
                // Don't set Content-Type header here - let browser handle it for FormData
            });

            if (response.status === 201 || response.status === 204) {
                const message = isEditMode ? 'Crop updated successfully!' : 'Crop added successfully!';
                showAlert('success', 'Success', message);
                resetForm();
                loadAllCrops();
                closePopups();
            } else {
                const error = await response.text();
                showAlert('error', 'Error', error || 'Error saving crop');
            }
        } catch (error) {
            showAlert('error', 'Error', 'Error saving crop: ' + error.message);
        } finally {
            // Restore button state
            $submitBtn.html(originalText);
            $submitBtn.prop('disabled', false);
        }
    });

    // Add this function to generate the next crop code
    function generateNextCropCode() {
        if (allCrops.length === 0) {
            return "C001";
        }

        // Extract all crop codes and find the highest number
        const cropCodes = allCrops.map(crop => crop.cropCode);
        const maxCode = cropCodes.reduce((max, code) => {
            if (code && code.startsWith('C')) {
                const num = parseInt(code.substring(1));
                return num > max ? num : max;
            }
            return max;
        }, 0);

        // Generate next code
        const nextNum = maxCode + 1;
        return `C${nextNum.toString().padStart(3, '0')}`;
    }

// Add this function to generate field codes
    function generateFieldCodes() {
        const fieldCodes = [];
        for (let i = 1; i <= 20; i++) {
            fieldCodes.push(`F${i.toString().padStart(3, '0')}`);
        }
        return fieldCodes;
    }

// Add this function to generate log codes
    function generateLogCodes() {
        const logCodes = [];
        for (let i = 1; i <= 20; i++) {
            logCodes.push(`LOG${i.toString().padStart(3, '0')}`);
        }
        return logCodes;
    }

// Add this function to populate dropdowns
    function populateDropdowns() {
        // Populate field code dropdown
        const $fieldCodeInput = $('#fieldCodeInput');
        $fieldCodeInput.empty();
        $fieldCodeInput.append('<option value="">Select Field Code</option>');

        allFieldCodes.forEach(code => {
            $fieldCodeInput.append(`<option value="${code}">${code}</option>`);
        });

        // Populate log code dropdown
        const $logCodeInput = $('#logCodeInput');
        $logCodeInput.empty();
        $logCodeInput.append('<option value="">Select Log Code</option>');

        allLogCodes.forEach(code => {
            $logCodeInput.append(`<option value="${code}">${code}</option>`);
        });
    }

// Load all crops function with JWT authentication
    async function loadAllCrops() {
        $loadingSpinner.show();
        $cropTableBody.empty();

        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/all`);

            if (response.ok) {
                const data = await response.json();
                allCrops = data;

                // Generate field and log codes if not already done
                if (allFieldCodes.length === 0) {
                    allFieldCodes = generateFieldCodes();
                }
                if (allLogCodes.length === 0) {
                    allLogCodes = generateLogCodes();
                }

                // Populate dropdowns
                populateDropdowns();
                updateStats(data);
                renderTableWithPagination();
            } else {
                throw new Error('Failed to load crops');
            }
        } catch (error) {
            console.error('Error:', error);
            $cropTableBody.html(`
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: var(--light-text);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <p>Failed to load crops. Please check your connection and try again.</p>
                        <button class="btn-secondary" onclick="loadAllCrops()">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </td>
                </tr>
            `);
        } finally {
            $loadingSpinner.hide();
        }
    }

// New function to render table with pagination
    function renderTableWithPagination() {
        if (allCrops.length === 0) {
            $cropTableBody.html(`
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--light-text);">
                    <i class="fas fa-seedling" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No crops found. Add your first crop to get started.</p>
                </td>
            </tr>
        `);
            updatePaginationInfo(0, 0);
            renderPaginationControls(0);
            return;
        }

        // Calculate pagination values
        const totalItems = allCrops.length;
        totalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure current page is within valid range
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Get crops for current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const currentCrops = allCrops.slice(startIndex, endIndex);

        // Populate table with current page crops
        populateCropTable(currentCrops);

        // Update pagination info and controls
        updatePaginationInfo(startIndex + 1, endIndex, totalItems);
        renderPaginationControls(totalPages);
    }

// Function to update pagination information
    function updatePaginationInfo(start, end, total) {
        $('#currentItems').text(`${start}-${end}`);
        $('#totalItems').text(total);
    }

// Function to render pagination controls
    function renderPaginationControls(totalPages) {
        const $paginationPages = $('#paginationPages');
        $paginationPages.empty();

        // Determine which page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // Add page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $(`<div class="page-number">${i}</div>`);
            if (i === currentPage) {
                pageBtn.addClass('active');
            }
            pageBtn.on('click', () => {
                currentPage = i;
                renderTableWithPagination();
            });
            $paginationPages.append(pageBtn);
        }

        // Enable/disable navigation buttons
        $('#firstPageBtn, #prevPageBtn').prop('disabled', currentPage === 1);
        $('#nextPageBtn, #lastPageBtn').prop('disabled', currentPage === totalPages);
    }
    // Update statistics cards
    function updateStats(crops) {
        $totalCropsEl.text(crops.length);

        // Count unique field codes for active fields
        const fieldSet = new Set();
        $.each(crops, function(index, crop) {
            if (crop.fieldCode) fieldSet.add(crop.fieldCode);
        });
        $activeFieldsEl.text(fieldSet.size);

        // Find the most common season
        if (crops.length > 0) {
            const seasonCount = {};
            $.each(crops, function(index, crop) {
                if (crop.cropSeason) {
                    seasonCount[crop.cropSeason] = (seasonCount[crop.cropSeason] || 0) + 1;
                }
            });

            let mostCommonSeason = '';
            let maxCount = 0;
            for (const season in seasonCount) {
                if (seasonCount[season] > maxCount) {
                    mostCommonSeason = season;
                    maxCount = seasonCount[season];
                }
            }
            $currentSeasonEl.text(mostCommonSeason || 'N/A');
        } else {
            $currentSeasonEl.text('N/A');
        }
    }

    // Update the populateCropTable function to not reset allCrops
    function populateCropTable(crops) {
        $cropTableBody.empty();

        if (crops.length === 0) {
            $cropTableBody.html(`
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--light-text);">
                    <i class="fas fa-seedling" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No crops found matching your search.</p>
                </td>
            </tr>
        `);
            return;
        }

        $.each(crops, function(index, crop) {
            const row = `
            <tr>
                <td>${crop.cropCode}</td>
                <td>${crop.commonName}</td>
                <td>${crop.scientificName}</td>
                <td>${crop.category}</td>
                <td>${crop.cropSeason}</td>
                <td>${crop.fieldCode}</td>
                <td>${crop.logCode}</td>
                <td>
                    ${crop.cropImage ?
                `<img src="data:image/png;base64,${crop.cropImage}" class="img-thumbnail" alt="${crop.commonName}">` :
                'No Image'}
                </td>
                <td class="action-buttons">
                    <button class="action-btn view-btn" data-id="${crop.cropCode}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${crop.cropCode}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${crop.cropCode}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn report-btn" data-id="${crop.cropCode}">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                </td>
            </tr>
        `;

            $cropTableBody.append(row);
        });

        // Update the event listener in populateCropTable function
        $('.view-btn').on('click', function() {
            const cropCode = $(this).data('id');
            viewCrop(cropCode);
        });

        $('.edit-btn').on('click', function() {
            const cropCode = $(this).data('id');
            editCrop(cropCode);
        });

        $('.delete-btn').on('click', function() {
            const cropCode = $(this).data('id');
            deleteCrop(cropCode);
        });

        $('.report-btn').on('click', function() {
            const cropCode = $(this).data('id');
            generateCropReport(cropCode);
        });
    }

    // View crop details
    async function viewCrop(cropCode) {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/${cropCode}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crop = await response.json();
            const cropDetails = $('#cropDetails');

            cropDetails.html(`
            <div style="display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    ${crop.cropImage ?
                `<img src="data:image/png;base64,${crop.cropImage}" alt="${crop.commonName}" style="width: 100%; max-width: 300px; height: auto; object-fit: cover; border-radius: 12px; box-shadow: var(--shadow);">` :
                '<div style="width: 100%; height: 200px; background: #f8f9fa; border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i></div>'}
                </div>
                <div style="flex: 2; min-width: 300px;">
                    <h2 style="margin-bottom: 0.5rem; color: var(--primary-color);">${crop.commonName}</h2>
                    <p style="color: var(--light-text); margin-bottom: 1.5rem; font-style: italic;">${crop.scientificName}</p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Crop Code</p>
                            <p>${crop.cropCode}</p>
                        </div>
                        <div>
                            <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Category</p>
                            <p>${crop.category}</p>
                        </div>
                        <div>
                            <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Season</p>
                            <p>${crop.cropSeason}</p>
                        </div>
                        <div>
                            <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Field Code</p>
                            <p>${crop.fieldCode || 'N/A'}</p>
                        </div>
                        <div>
                            <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Log Code</p>
                            <p>${crop.logCode || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `);

            $viewCropPopup.addClass('active');
            $('body').css('overflow', 'hidden');

        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                // Authentication error - already handled by makeAuthenticatedRequest
                return;
            }

            showAlert('error', 'Error', 'Error loading crop details: ' + error.message);
        }
    }

    // Edit crop
    async function editCrop(cropCode) {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/${cropCode}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crop = await response.json();

            // Populate form with crop data
            $('#cropCodeInput').val(crop.cropCode);
            $('#commonNameInput').val(crop.commonName);
            $('#scientificNameInput').val(crop.scientificName);
            $('#categoryInput').val(crop.category);
            $('#seasonInput').val(crop.cropSeason);
            $('#fieldCodeInput').val(crop.fieldCode || '');
            $('#logCodeInput').val(crop.logCode || '');

            // Set edit mode
            $('#editCropCode').val(crop.cropCode);
            $editMode.val('true');
            $popupTitle.text('Edit Crop');
            $cropImageInput.prop('required', false);
            $imageHelpText.text('Optional: Select a new image to replace the current one');

            // Show form popup
            $cropFormPopup.addClass('active');
            $('body').css('overflow', 'hidden');

        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                // Authentication error - already handled by makeAuthenticatedRequest
                return;
            }

            showAlert('error', 'Error', 'Error loading crop details: ' + error.message);
        }
    }

// Delete crop
    async function deleteCrop(cropCode) {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete crop ${cropCode}. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await makeAuthenticatedRequest(`${API_BASE}/${cropCode}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        loadAllCrops();
                        showAlert('success', 'Deleted!', 'Crop has been deleted successfully.');
                    } else {
                        const errorText = await response.text();
                        throw new Error(errorText || 'Failed to delete crop');
                    }
                } catch (error) {
                    console.error('Error:', error);

                    if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                        // Authentication error - already handled by makeAuthenticatedRequest
                        return;
                    }

                    showAlert('error', 'Error', 'Error deleting crop: ' + error.message);
                }
            }
        });
    }

    // Make report functions globally available
    window.generateSeasonReport = generateSeasonReport;
    window.generateCategoryReport = generateCategoryReport;
    window.generateFieldReport = generateFieldReport;
    window.generateCropReport = generateCropReport;

    // Generate detailed crop-specific report
    async function generateCropReport(cropCode) {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/${cropCode}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crop = await response.json();

            // Generate detailed recommendations based on crop type and season
            const detailedRecommendations = getDetailedCropRecommendations(crop.category, crop.cropSeason);

            // Generate growth timeline
            const growthTimeline = generateGrowthTimeline(crop.category);

            const imageHtml = crop.cropImage
                ? `<img src="data:image/png;base64,${crop.cropImage}" alt="${crop.commonName}" style="max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 1rem;">`
                : '<div style="height: 150px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;"><i class="fas fa-seedling" style="font-size: 3rem; color: #ccc;"></i></div>';

            Swal.fire({
                title: `${crop.commonName} - Detailed Report`,
                html: `
        <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                ${imageHtml}
                <h3 style="margin: 0.5rem 0; color: var(--primary-color);">${crop.commonName}</h3>
                <p style="color: var(--light-text); font-style: italic; margin: 0;">${crop.scientificName}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                        <i class="fas fa-info-circle"></i> Basic Information
                    </h4>
                    <p><strong>Crop Code:</strong> ${crop.cropCode}</p>
                    <p><strong>Category:</strong> ${crop.category}</p>
                    <p><strong>Season:</strong> ${crop.cropSeason}</p>
                    <p><strong>Field Code:</strong> ${crop.fieldCode || 'N/A'}</p>
                    <p><strong>Log Code:</strong> ${crop.logCode || 'N/A'}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                        <i class="fas fa-seedling"></i> Growth Characteristics
                    </h4>
                    <p><strong>Growth Rate:</strong> ${detailedRecommendations.growthRate}</p>
                    <p><strong>Time to Harvest:</strong> ${detailedRecommendations.timeToHarvest}</p>
                    <p><strong>Yield Potential:</strong> ${detailedRecommendations.yieldPotential}</p>
                    <p><strong>Difficulty Level:</strong> ${detailedRecommendations.difficulty}</p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-cloud-sun"></i> Environmental Requirements
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p><strong>Sunlight:</strong> ${detailedRecommendations.sunlight}</p>
                        <p><strong>Temperature:</strong> ${detailedRecommendations.temperature}</p>
                        <p><strong>Humidity:</strong> ${detailedRecommendations.humidity}</p>
                    </div>
                    <div>
                        <p><strong>Water Needs:</strong> ${detailedRecommendations.water}</p>
                        <p><strong>Soil Type:</strong> ${detailedRecommendations.soilType}</p>
                        <p><strong>Soil pH:</strong> ${detailedRecommendations.soilPH}</p>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-flask"></i> Fertilization & Nutrition
                </h4>
                <p><strong>Fertilizer Type:</strong> ${detailedRecommendations.fertilizerType}</p>
                <p><strong>Fertilization Schedule:</strong> ${detailedRecommendations.fertilizationSchedule}</p>
                <p><strong>Key Nutrients:</strong> ${detailedRecommendations.keyNutrients}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-bug"></i> Pest & Disease Management
                </h4>
                <p><strong>Common Pests:</strong> ${detailedRecommendations.commonPests}</p>
                <p><strong>Common Diseases:</strong> ${detailedRecommendations.commonDiseases}</p>
                <p><strong>Prevention Methods:</strong> ${detailedRecommendations.preventionMethods}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-calendar-alt"></i> Growth Timeline
                </h4>
                ${growthTimeline}
            </div>
        </div>
    `,
                icon: null,
                showConfirmButton: false,
                showCloseButton: true,
                width: '900px',
                customClass: {
                    popup: 'custom-report-popup'
                }
            });
        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                return;
            }

            showAlert('error', 'Error', 'Error generating report: ' + error.message);
        }
    }
// Get detailed crop recommendations based on category and season
    function getDetailedCropRecommendations(category, season) {
        const recommendations = {
            Cereal: {
                growthRate: "Moderate to Fast",
                timeToHarvest: "3-6 months depending on variety",
                yieldPotential: "High with proper management",
                difficulty: "Moderate",
                sunlight: "Full sun (6-8 hours daily)",
                temperature: "60-75°F (15-24°C) optimal",
                humidity: "Moderate (40-60%)",
                water: "Regular, consistent watering (1-1.5 inches weekly)",
                soilType: "Well-drained loamy soil",
                soilPH: "6.0-7.5 (slightly acidic to neutral)",
                fertilizerType: "Balanced NPK (10-10-10 or 14-14-14)",
                fertilizationSchedule: "Apply at planting, then side-dress 4-6 weeks later",
                keyNutrients: "Nitrogen, Phosphorus, Potassium",
                commonPests: "Aphids, armyworms, cutworms, cereal leaf beetles",
                commonDiseases: "Rust, smut, powdery mildew, fusarium head blight",
                preventionMethods: "Crop rotation, resistant varieties, proper spacing"
            },
            Vegetable: {
                growthRate: "Fast",
                timeToHarvest: "30-90 days depending on variety",
                yieldPotential: "Moderate to High",
                difficulty: "Easy to Moderate",
                sunlight: "Full sun (6+ hours daily)",
                temperature: "65-85°F (18-29°C) optimal",
                humidity: "Moderate (50-70%)",
                water: "Consistent moisture (1-2 inches weekly)",
                soilType: "Well-drained, rich in organic matter",
                soilPH: "6.0-6.8 (slightly acidic)",
                fertilizerType: "Balanced or higher in phosphorus (10-10-10 or 5-10-5)",
                fertilizationSchedule: "At planting and every 3-4 weeks during growth",
                keyNutrients: "Nitrogen, Phosphorus, Calcium",
                commonPests: "Aphids, caterpillars, beetles, mites",
                commonDiseases: "Blight, mildew, rot, wilt",
                preventionMethods: "Crop rotation, proper spacing, mulch, companion planting"
            },
            Fruit: {
                growthRate: "Slow to Moderate",
                timeToHarvest: "1-3 years for trees, 60-90 days for annuals",
                yieldPotential: "High once established",
                difficulty: "Moderate to Difficult",
                sunlight: "Full sun (6-8 hours daily)",
                temperature: "Varies by type (60-85°F typical)",
                humidity: "Varies by type",
                water: "Deep, infrequent watering once established",
                soilType: "Well-drained, rich in organic matter",
                soilPH: "Varies (6.0-7.0 typical)",
                fertilizerType: "Specialized fruit tree fertilizer or balanced NPK",
                fertilizationSchedule: "Early spring before growth begins",
                keyNutrients: "Potassium, Phosphorus, Calcium",
                commonPests: "Fruit flies, codling moths, aphids, scale insects",
                commonDiseases: "Brown rot, powdery mildew, fire blight, citrus canker",
                preventionMethods: "Proper pruning, sanitation, dormant sprays"
            },
            Legume: {
                growthRate: "Fast",
                timeToHarvest: "60-90 days",
                yieldPotential: "Moderate",
                difficulty: "Easy",
                sunlight: "Full sun (6+ hours daily)",
                temperature: "60-75°F (15-24°C) optimal",
                humidity: "Moderate (40-60%)",
                water: "Regular but not excessive (1 inch weekly)",
                soilType: "Well-drained, moderate fertility",
                soilPH: "6.0-7.0 (slightly acidic to neutral)",
                fertilizerType: "Low nitrogen (legumes fix their own nitrogen)",
                fertilizationSchedule: "Light application of phosphorus at planting",
                keyNutrients: "Phosphorus, Potassium, Molybdenum",
                commonPests: "Aphids, bean beetles, leafhoppers",
                commonDiseases: "Root rot, rust, anthracnose, mosaic viruses",
                preventionMethods: "Crop rotation, proper spacing, resistant varieties"
            },
            Other: {
                growthRate: "Varies by crop type",
                timeToHarvest: "Varies by crop type",
                yieldPotential: "Varies by crop type",
                difficulty: "Varies by crop type",
                sunlight: "Varies by crop type",
                temperature: "Varies by crop type",
                humidity: "Varies by crop type",
                water: "Varies by crop type",
                soilType: "Varies by crop type",
                soilPH: "Varies by crop type",
                fertilizerType: "Varies by crop type",
                fertilizationSchedule: "Varies by crop type",
                keyNutrients: "Varies by crop type",
                commonPests: "Varies by crop type",
                commonDiseases: "Varies by crop type",
                preventionMethods: "Research specific requirements for this crop type"
            }
        };

        // Adjust recommendations based on season
        const baseRecommendations = recommendations[category] || recommendations.Other;

        if (season === "Winter") {
            return {
                ...baseRecommendations,
                temperature: "Cool conditions (varies by crop hardiness)",
                water: "Reduced watering (dormant period for many crops)",
                fertilizationSchedule: "Generally not recommended in winter"
            };
        } else if (season === "Summer") {
            return {
                ...baseRecommendations,
                water: "Increased watering (watch for evaporation)",
                preventionMethods: baseRecommendations.preventionMethods + ", provide shade during extreme heat"
            };
        }

        return baseRecommendations;
    }
    // Generate growth timeline based on crop category
    function generateGrowthTimeline(category) {
        const timelines = {
            Cereal: `
            <div style="display: flex; justify-content: space-between; position: relative; margin: 1rem 0; padding: 0.5rem 0;">
                <div style="text-align: center; width: 20%;">
                    <div style="background: #88B44E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">1</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Planting<br>(Week 0)</p>
                </div>
                <div style="text-align: center; width: 20%;">
                    <div style="background: #88B44E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">2</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Germination<br>(Weeks 1-2)</p>
                </div>
                <div style="text-align: center; width: 20%;">
                    <div style="background: #88B44E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">3</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Tillering<br>(Weeks 3-6)</p>
                </div>
                <div style="text-align: center; width: 20%;">
                    <div style="background: #88B44E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">4</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Heading<br>(Weeks 7-10)</p>
                </div>
                <div style="text-align: center; width: 20%;">
                    <div style="background: #88B44E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">5</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Harvest<br>(Weeks 12-16)</p>
                </div>
                <div style="position: absolute; top: 15px; left: 15%; right: 15%; height: 2px; background: #88B44E; z-index: -1;"></div>
            </div>
        `,
            Vegetable: `
            <div style="display: flex; justify-content: space-between; position: relative; margin: 1rem 0; padding: 0.5rem 0;">
                <div style="text-align: center; width: 25%;">
                    <div style="background: #4E88B4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">1</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Seed Starting<br>(Week 0)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #4E88B4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">2</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Transplanting<br>(Weeks 3-4)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #4E88B4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">3</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Vegetative Growth<br>(Weeks 5-8)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #4E88B4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">4</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Harvest<br>(Weeks 8-12)</p>
                </div>
                <div style="position: absolute; top: 15px; left: 12.5%; right: 12.5%; height: 2px; background: #4E88B4; z-index: -1;"></div>
            </div>
        `,
            Fruit: `
            <div style="display: flex; justify-content: space-between; position: relative; margin: 1rem 0; padding: 0.5rem 0;">
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">1</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Planting<br>(Year 0)</p>
                </div>
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">2</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Establishment<br>(Year 1)</p>
                </div>
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">3</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">First Flowers<br>(Year 2)</p>
                </div>
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">4</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">First Fruit<br>(Year 3)</p>
                </div>
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">5</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Full Production<br>(Year 4-5)</p>
                </div>
                <div style="text-align: center; width: 16.6%;">
                    <div style="background: #B44E88; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">6</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Mature Harvest<br>(Year 6+)</p>
                </div>
                <div style="position: absolute; top: 15px; left: 8%; right: 8%; height: 2px; background: #B44E88; z-index: -1;"></div>
            </div>
        `,
            Legume: `
            <div style="display: flex; justify-content: space-between; position: relative; margin: 1rem 0; padding: 0.5rem 0;">
                <div style="text-align: center; width: 25%;">
                    <div style="background: #B4884E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">1</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Direct Sow<br>(Week 0)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #B4884E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">2</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Germination<br>(Week 1)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #B4884E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">3</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Flowering<br>(Weeks 4-6)</p>
                </div>
                <div style="text-align: center; width: 25%;">
                    <div style="background: #B4884E; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">4</div>
                    <p style="margin: 0.5rem 0 0; font-size: 0.8rem;">Pod Harvest<br>(Weeks 8-12)</p>
                </div>
                <div style="position: absolute; top: 15px; left: 12.5%; right: 12.5%; height: 2px; background: #B4884E; z-index: -1;"></div>
            </div>
        `,
            Other: `
            <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                <i class="fas fa-info-circle" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem;"></i>
                <p style="margin: 0;">Growth timeline varies significantly for this crop category. Please consult specific growing guides for accurate timing information.</p>
            </div>
        `
        };

        return timelines[category] || timelines.Other;
    }
    // Generate seasonal report with enhanced visuals
    async function generateSeasonReport() {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/all`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crops = await response.json();
            const seasonCount = {};
            const seasonImage = {};

            crops.forEach(crop => {
                if (crop.cropSeason) {
                    seasonCount[crop.cropSeason] = (seasonCount[crop.cropSeason] || 0) + 1;
                    if (crop.cropImage && !seasonImage[crop.cropSeason]) {
                        seasonImage[crop.cropSeason] = crop.cropImage;
                    }
                }
            });

            // Create a pie chart for seasonal distribution
            const pieChart = generatePieChart(seasonCount);

            let seasonTable = `
        <div style="display: flex; gap: 2rem; margin: 1rem 0; align-items: flex-start;">
            <div style="flex: 1;">
                ${pieChart}
            </div>
            <div style="flex: 1;">
                <table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem; border-collapse: collapse;">
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Season</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Image</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Number of Crops</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Percentage</th>
                    </tr>`;

            const totalCrops = crops.length;
            for (const season in seasonCount) {
                const percentage = ((seasonCount[season] / totalCrops) * 100).toFixed(1);
                const imageCell = seasonImage[season]
                    ? `<td><img src="data:image/png;base64,${seasonImage[season]}" alt="${season}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                    : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                seasonTable += `<tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-cloud-sun" style="color: #6c757d;"></i> ${season}
                    </div>
                </td>
                ${imageCell}
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${seasonCount[season]}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="background: #e9ecef; height: 8px; border-radius: 4px; flex: 1; overflow: hidden;">
                            <div style="background: #88B44E; height: 100%; width: ${percentage}%;"></div>
                        </div>
                        <span>${percentage}%</span>
                    </div>
                </td>
            </tr>`;
            }
            seasonTable += `</table></div></div>`;

            Swal.fire({
                title: '<div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;"><i class="fas fa-cloud-sun" style="color: #88B44E;"></i> Seasonal Distribution Report</div>',
                html: seasonTable,
                icon: null,
                showConfirmButton: false,
                showCloseButton: true,
                width: '900px'
            });

        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                return;
            }

            showAlert('error', 'Error', 'Error generating seasonal report: ' + error.message);
        }
    }

// Generate pie chart for seasonal distribution
    function generatePieChart(seasonCount) {
        const colors = ['#88B44E', '#4E88B4', '#B44E88', '#B4884E', '#4EB488'];
        const total = Object.values(seasonCount).reduce((a, b) => a + b, 0);
        let cumulativePercent = 0;

        // Create SVG pie chart
        const svgPieces = Object.entries(seasonCount).map(([season, count], i) => {
            const percentage = count / total;
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += percentage;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percentage > 0.5 ? 1 : 0;

            const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`
            ].join(' ');

            return `<path d="${pathData}" fill="${colors[i % colors.length]}" />`;
        }).join('');

        // Add legend
        const legend = Object.entries(seasonCount).map(([season, count], i) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <div style="width: 12px; height: 12px; background: ${colors[i % colors.length]}; margin-right: 0.5rem; border-radius: 2px;"></div>
            <div style="font-size: 0.8rem;">${season}: ${percentage}%</div>
        </div>
    `;
        }).join('');

        return `
    <div style="text-align: center;">
        <div style="position: relative; display: inline-block; margin-bottom: 1rem;">
            <svg width="150" height="150" viewBox="-1 -1 2 2" style="transform: rotate(-90deg);">
                ${svgPieces}
            </svg>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; font-weight: 600; text-align: center;">
                ${total} Crops
            </div>
        </div>
        <div style="margin-top: 1rem;">
            ${legend}
        </div>
    </div>
`;
    }

// Helper function for pie chart coordinates
    function getCoordinatesForPercent(percent) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

// Generate category report with enhanced visuals
    async function generateCategoryReport() {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/all`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crops = await response.json();
            const categoryCount = {};
            const categoryImage = {};

            crops.forEach(crop => {
                if (crop.category) {
                    categoryCount[crop.category] = (categoryCount[crop.category] || 0) + 1;
                    if (crop.cropImage && !categoryImage[crop.category]) {
                        categoryImage[crop.category] = crop.cropImage;
                    }
                }
            });

            // Create a bar chart for category distribution
            const barChart = generateBarChart(categoryCount);

            let categoryTable = `
        <div style="display: flex; gap: 2rem; margin: 1rem 0; align-items: flex-start;">
            <div style="flex: 1;">
                ${barChart}
            </div>
            <div style="flex: 1;">
                <table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem; border-collapse: collapse;">
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Category</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Image</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Number of Crops</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Percentage</th>
                    </tr>`;

            const totalCrops = crops.length;
            for (const category in categoryCount) {
                const percentage = ((categoryCount[category] / totalCrops) * 100).toFixed(1);
                const imageCell = categoryImage[category]
                    ? `<td><img src="data:image/png;base64,${categoryImage[category]}" alt="${category}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                    : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                categoryTable += `<tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-tag" style="color: #6c757d;"></i> ${category}
                    </div>
                </td>
                ${imageCell}
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${categoryCount[category]}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="background: #e9ecef; height: 8px; border-radius: 4px; flex: 1; overflow: hidden;">
                            <div style="background: #4E88B4; height: 100%; width: ${percentage}%;"></div>
                        </div>
                        <span>${percentage}%</span>
                    </div>
                </td>
            </tr>`;
            }
            categoryTable += `</table></div></div>`;

            Swal.fire({
                title: '<div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;"><i class="fas fa-tags" style="color: #4E88B4;"></i> Category Analysis Report</div>',
                html: categoryTable,
                icon: null,
                showConfirmButton: false,
                showCloseButton: true,
                width: '900px'
            });

        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                return;
            }

            showAlert('error', 'Error', 'Error generating category report: ' + error.message);
        }
    }

// Generate bar chart for category distribution
    function generateBarChart(categoryCount) {
        const colors = ['#88B44E', '#4E88B4', '#B44E88', '#B4884E', '#4EB488'];
        const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
        const maxValue = Math.max(...Object.values(categoryCount));

        const bars = Object.entries(categoryCount).map(([category, count], i) => {
            const percentage = ((count / maxValue) * 100).toFixed(1);
            const displayPercentage = ((count / total) * 100).toFixed(1);

            return `
        <div style="display: flex; align-items: center; margin-bottom: 0.8rem;">
            <div style="width: 80px; font-size: 0.8rem; font-weight: 500;">${category}</div>
            <div style="flex: 1; background: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; margin: 0 0.5rem; position: relative;">
                <div style="background: ${colors[i % colors.length]}; height: 100%; width: ${percentage}%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; color: #333;">
                    ${count} (${displayPercentage}%)
                </div>
            </div>
        </div>
    `;
        }).join('');

        return `
    <div style="text-align: center;">
        <h4 style="margin-bottom: 1rem; color: #4E88B4;">Category Distribution</h4>
        <div style="margin-bottom: 1rem;">
            ${bars}
        </div>
        <div style="font-size: 0.8rem; color: #6c757d;">
            Total Crops: ${total}
        </div>
    </div>
`;
    }

// Generate field report with enhanced visuals
    async function generateFieldReport() {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE}/all`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crops = await response.json();
            const fieldCount = {};
            const fieldImage = {};

            crops.forEach(crop => {
                if (crop.fieldCode) {
                    fieldCount[crop.fieldCode] = (fieldCount[crop.fieldCode] || 0) + 1;
                    if (crop.cropImage && !fieldImage[crop.fieldCode]) {
                        fieldImage[crop.fieldCode] = crop.cropImage;
                    }
                }
            });

            // Create a horizontal bar chart for field distribution
            const fieldChart = generateFieldChart(fieldCount);

            let fieldTable = `
        <div style="display: flex; gap: 2rem; margin: 1rem 0; align-items: flex-start;">
            <div style="flex: 1;">
                ${fieldChart}
            </div>
            <div style="flex: 1;">
                <table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem; border-collapse: collapse;">
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Field Code</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Image</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Number of Crops</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6;">Percentage</th>
                    </tr>`;

            const totalCrops = crops.length;
            for (const field in fieldCount) {
                const percentage = ((fieldCount[field] / totalCrops) * 100).toFixed(1);
                const imageCell = fieldImage[field]
                    ? `<td><img src="data:image/png;base64,${fieldImage[field]}" alt="${field}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                    : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                fieldTable += `<tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-tractor" style="color: #6c757d;"></i> ${field}
                    </div>
                </td>
                ${imageCell}
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${fieldCount[field]}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="background: #e9ecef; height: 8px; border-radius: 4px; flex: 1; overflow: hidden;">
                            <div style="background: #B44E88; height: 100%; width: ${percentage}%;"></div>
                        </div>
                        <span>${percentage}%</span>
                    </div>
                </td>
            </tr>`;
            }
            fieldTable += `</table></div></div>`;

            Swal.fire({
                title: '<div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;"><i class="fas fa-map-marked-alt" style="color: #B44E88;"></i> Field Performance Report</div>',
                html: fieldTable,
                icon: null,
                showConfirmButton: false,
                showCloseButton: true,
                width: '900px'
            });

        } catch (error) {
            console.error('Error:', error);

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                return;
            }

            showAlert('error', 'Error', 'Error generating field report: ' + error.message);
        }
    }

// Generate horizontal bar chart for field distribution
    function generateFieldChart(fieldCount) {
        const colors = ['#88B44E', '#4E88B4', '#B44E88', '#B4884E', '#4EB488'];
        const total = Object.values(fieldCount).reduce((a, b) => a + b, 0);
        const maxValue = Math.max(...Object.values(fieldCount));

        // Sort fields by count (descending)
        const sortedFields = Object.entries(fieldCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Show top 10 fields

        const bars = sortedFields.map(([field, count], i) => {
            const percentage = ((count / maxValue) * 100).toFixed(1);
            const displayPercentage = ((count / total) * 100).toFixed(1);

            return `
        <div style="display: flex; align-items: center; margin-bottom: 0.8rem;">
            <div style="width: 60px; font-size: 0.8rem; font-weight: 500;">${field}</div>
            <div style="flex: 1; background: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; margin: 0 0.5rem; position: relative;">
                <div style="background: ${colors[i % colors.length]}; height: 100%; width: ${percentage}%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding-left: 0.5rem; font-size: 0.7rem; font-weight: 600; color: #333;">
                    ${count} crops
                </div>
            </div>
            <div style="width: 50px; font-size: 0.8rem; text-align: right;">
                ${displayPercentage}%
            </div>
        </div>
    `;
        }).join('');

        return `
    <div style="text-align: center;">
        <h4 style="margin-bottom: 1rem; color: #B44E88;">Top Fields by Crop Count</h4>
        <div style="margin-bottom: 1rem;">
            ${bars}
        </div>
        <div style="font-size: 0.8rem; color: #6c757d;">
            Total Crops: ${total} | Total Fields: ${Object.keys(fieldCount).length}
        </div>
    </div>
`;
    }

// Generate full report
    // Generate comprehensive full report
    async function generateFullReport() {
        try {
            Swal.fire({
                title: 'Generating Comprehensive Report',
                text: 'Compiling detailed farm analytics and insights...',
                icon: null,
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await makeAuthenticatedRequest(`${API_BASE}/all`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const crops = await response.json();

            Swal.close();

            // Calculate various statistics
            const totalCrops = crops.length;
            const seasonCount = {};
            const categoryCount = {};
            const fieldCount = {};
            const seasonCrops = {};
            const categoryCrops = {};

            // Get sample images for each category and season
            const categoryImages = {};
            const seasonImages = {};

            crops.forEach(crop => {
                // Count seasons
                if (crop.cropSeason) {
                    seasonCount[crop.cropSeason] = (seasonCount[crop.cropSeason] || 0) + 1;
                    if (crop.cropImage && !seasonImages[crop.cropSeason]) {
                        seasonImages[crop.cropSeason] = crop.cropImage;
                    }
                    if (!seasonCrops[crop.cropSeason]) {
                        seasonCrops[crop.cropSeason] = [];
                    }
                    seasonCrops[crop.cropSeason].push(crop);
                }

                // Count categories
                if (crop.category) {
                    categoryCount[crop.category] = (categoryCount[crop.category] || 0) + 1;
                    if (crop.cropImage && !categoryImages[crop.category]) {
                        categoryImages[crop.category] = crop.cropImage;
                    }
                    if (!categoryCrops[crop.category]) {
                        categoryCrops[crop.category] = [];
                    }
                    categoryCrops[crop.category].push(crop);
                }

                // Count fields
                if (crop.fieldCode) {
                    fieldCount[crop.fieldCode] = (fieldCount[crop.fieldCode] || 0) + 1;
                }
            });

            // Get a sample image for the report
            const sampleCrop = crops.find(crop => crop.cropImage) || crops[0];
            const imageHtml = sampleCrop && sampleCrop.cropImage
                ? `<img src="data:image/png;base64,${sampleCrop.cropImage}" alt="Sample Crop" style="max-width: 180px; height: auto; border-radius: 12px; margin: 0.5rem auto; display: block; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`
                : '';

            // Get current date and time
            const now = new Date();
            const reportDate = now.toLocaleDateString();
            const reportTime = now.toLocaleTimeString();

            // Create a comprehensive report with enhanced design
            let reportHTML = `
        <div style="text-align: left; max-height: 70vh; overflow-y: auto; font-size: 0.9rem; padding: 0.5rem;">
            <div style="text-align: center; margin-bottom: 1.5rem; background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 1.5rem; border-radius: 12px;">
                <h2 style="margin: 0 0 0.5rem; color: var(--primary-color);">
                    <i class="fas fa-seedling" style="margin-right: 0.5rem;"></i>Farm Management Comprehensive Report
                </h2>
                <p style="margin: 0; color: var(--light-text);">Generated on ${reportDate} at ${reportTime}</p>
                ${imageHtml}
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${totalCrops}</div>
                    <div style="color: var(--light-text);">Total Crops</div>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #4E88B4;">${Object.keys(fieldCount).length}</div>
                    <div style="color: var(--light-text);">Active Fields</div>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #B44E88;">${Object.keys(categoryCount).length}</div>
                    <div style="color: var(--light-text);">Categories</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                        <i class="fas fa-cloud-sun"></i> Seasonal Distribution
                    </h4>
                    ${generateSeasonDistributionHTML(seasonCount, seasonImages, totalCrops)}
                </div>
                
                <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                        <i class="fas fa-tags"></i> Category Analysis
                    </h4>
                    ${generateCategoryDistributionHTML(categoryCount, categoryImages, totalCrops)}
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-tractor"></i> Field Utilization
                </h4>
                ${generateFieldUtilizationHTML(fieldCount, totalCrops)}
            </div>
            
            <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-chart-line"></i> Crop Recommendations by Season
                </h4>
                ${generateSeasonalRecommendationsHTML(seasonCrops)}
            </div>
            
            <div style="background: #f8f9fa; padding: 1.2rem; border-radius: 8px;">
                <h4 style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">
                    <i class="fas fa-lightbulb"></i> Farm Management Insights
                </h4>
                ${generateFarmInsightsHTML(crops, seasonCount, categoryCount, fieldCount)}
            </div>
        </div>
    `;

            Swal.fire({
                title: 'Comprehensive Farm Report',
                html: reportHTML,
                width: '1000px',
                icon: null,
                showConfirmButton: false,
                showCloseButton: true,
                customClass: {
                    popup: 'custom-report-popup'
                }
            });

        } catch (error) {
            console.error('Error:', error);
            Swal.close();

            if (error.message.includes('Authentication failed') || error.message.includes('401') || error.message.includes('403')) {
                return;
            }

            showAlert('error', 'Error', 'Failed to generate report: ' + error.message);
        }
    }

// Helper function to generate season distribution HTML
    function generateSeasonDistributionHTML(seasonCount, seasonImages, totalCrops) {
        let html = '<div style="max-height: 200px; overflow-y: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">';
        html += '<tr style="background: #e9ecef;">';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Season</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Image</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Count</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Percentage</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Progress</th>';
        html += '</tr>';

        for (const season in seasonCount) {
            const count = seasonCount[season];
            const percentage = ((count / totalCrops) * 100).toFixed(1);
            const imageCell = seasonImages[season]
                ? `<td><img src="data:image/png;base64,${seasonImages[season]}" alt="${season}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

            html += `<tr>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-cloud-sun" style="color: #6c757d;"></i> ${season}
                </div>
            </td>
            ${imageCell}
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${count}</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${percentage}%</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                <div style="background: #e9ecef; height: 8px; border-radius: 4px; width: 100px; overflow: hidden;">
                    <div style="background: #88B44E; height: 100%; width: ${percentage}%;"></div>
                </div>
            </td>
        </tr>`;
        }
        html += '</table></div>';
        return html;
    }

// Helper function to generate category distribution HTML
    function generateCategoryDistributionHTML(categoryCount, categoryImages, totalCrops) {
        let html = '<div style="max-height: 200px; overflow-y: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">';
        html += '<tr style="background: #e9ecef;">';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Category</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Image</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Count</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Percentage</th>';
        html += '<th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Progress</th>';
        html += '</tr>';

        for (const category in categoryCount) {
            const count = categoryCount[category];
            const percentage = ((count / totalCrops) * 100).toFixed(1);
            const imageCell = categoryImages[category]
                ? `<td><img src="data:image/png;base64,${categoryImages[category]}" alt="${category}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

            html += `<tr>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-tag" style="color: #6c757d;"></i> ${category}
                </div>
            </td>
            ${imageCell}
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${count}</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${percentage}%</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                <div style="background: #e9ecef; height: 8px; border-radius: 4px; width: 100px; overflow: hidden;">
                    <div style="background: #4E88B4; height: 100%; width: ${percentage}%;"></div>
                </div>
            </td>
        </tr>`;
        }
        html += '</table></div>';
        return html;
    }

// Helper function to generate field utilization HTML
    function generateFieldUtilizationHTML(fieldCount, totalCrops) {
        // Sort fields by utilization (descending)
        const sortedFields = Object.entries(fieldCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Show top 10 fields

        let html = '<p style="margin-top: 0;">Field utilization based on crop distribution:</p>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';

        for (const [field, count] of sortedFields) {
            const percentage = ((count / totalCrops) * 100).toFixed(1);
            html += `
        <div style="display: flex; align-items: center; margin-bottom: 0.8rem;">
            <div style="width: 80px; font-size: 0.85rem; font-weight: 500;">
                <i class="fas fa-tractor" style="color: #6c757d; margin-right: 0.3rem;"></i> ${field}
            </div>
            <div style="flex: 1; background: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; margin: 0 0.5rem; position: relative;">
                <div style="background: #B44E88; height: 100%; width: ${percentage}%;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding-left: 0.5rem; font-size: 0.7rem; font-weight: 600; color: #333;">
                    ${count} crops
                </div>
            </div>
            <div style="width: 50px; font-size: 0.85rem; text-align: right;">
                ${percentage}%
            </div>
        </div>`;
        }
        html += '</div>';
        return html;
    }

// Helper function to generate seasonal recommendations HTML
    function generateSeasonalRecommendationsHTML(seasonCrops) {
        let html = '';

        for (const season in seasonCrops) {
            const crops = seasonCrops[season];
            const categories = {};

            // Count categories in this season
            crops.forEach(crop => {
                if (crop.category) {
                    categories[crop.category] = (categories[crop.category] || 0) + 1;
                }
            });

            // Get the most common category for this season
            let mostCommonCategory = '';
            let maxCount = 0;
            for (const category in categories) {
                if (categories[category] > maxCount) {
                    mostCommonCategory = category;
                    maxCount = categories[category];
                }
            }

            const recommendation = getSeasonalRecommendation(season, mostCommonCategory);

            html += `
        <div style="margin-bottom: 1rem; padding: 0.8rem; background: white; border-radius: 6px; border-left: 4px solid #88B44E;">
            <h5 style="margin: 0 0 0.5rem; color: var(--primary-color);">
                <i class="fas fa-cloud-sun" style="margin-right: 0.5rem;"></i>${season}
            </h5>
            <p style="margin: 0; font-size: 0.85rem;">
                <strong>${crops.length} crops</strong> | Top category: <strong>${mostCommonCategory}</strong><br>
                ${recommendation}
            </p>
        </div>`;
        }

        return html;
    }

// Helper function to generate farm insights HTML
    function generateFarmInsightsHTML(crops, seasonCount, categoryCount, fieldCount) {
        const totalCrops = crops.length;
        const totalFields = Object.keys(fieldCount).length;

        // Calculate diversity index (simple version)
        const categoryDiversity = Object.keys(categoryCount).length;
        const seasonDiversity = Object.keys(seasonCount).length;

        // Find most productive season
        let mostProductiveSeason = '';
        let maxSeasonCount = 0;
        for (const season in seasonCount) {
            if (seasonCount[season] > maxSeasonCount) {
                mostProductiveSeason = season;
                maxSeasonCount = seasonCount[season];
            }
        }

        // Find most common category
        let mostCommonCategory = '';
        let maxCategoryCount = 0;
        for (const category in categoryCount) {
            if (categoryCount[category] > maxCategoryCount) {
                mostCommonCategory = category;
                maxCategoryCount = categoryCount[category];
            }
        }

        // Find most utilized field
        let mostUtilizedField = '';
        let maxFieldCount = 0;
        for (const field in fieldCount) {
            if (fieldCount[field] > maxFieldCount) {
                mostUtilizedField = field;
                maxFieldCount = fieldCount[field];
            }
        }

        let html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
            <h5 style="margin: 0 0 0.5rem; color: var(--primary-color);">Productivity Insights</h5>
            <ul style="font-size: 0.85rem; margin: 0; padding-left: 1.2rem;">
                <li>Most productive season: <strong>${mostProductiveSeason}</strong> (${maxSeasonCount} crops)</li>
                <li>Most common category: <strong>${mostCommonCategory}</strong> (${maxCategoryCount} crops)</li>
                <li>Most utilized field: <strong>${mostUtilizedField}</strong> (${maxFieldCount} crops)</li>
            </ul>
        </div>
        <div>
            <h5 style="margin: 0 0 0.5rem; color: var(--primary-color);">Diversity Metrics</h5>
            <ul style="font-size: 0.85rem; margin: 0; padding-left: 1.2rem;">
                <li>Category diversity: <strong>${categoryDiversity}</strong> different types</li>
                <li>Seasonal distribution: <strong>${seasonDiversity}</strong> seasons covered</li>
                <li>Field utilization: <strong>${totalFields}</strong> active fields</li>
            </ul>
        </div>
    </div>
    <div style="margin-top: 1rem; padding: 0.8rem; background: #e8f5e9; border-radius: 6px;">
        <h5 style="margin: 0 0 0.5rem; color: var(--primary-color);">Recommendations</h5>
        <p style="margin: 0; font-size: 0.85rem;">
            ${getOverallRecommendations(mostProductiveSeason, mostCommonCategory, categoryDiversity, seasonDiversity)}
        </p>
    </div>`;

        return html;
    }

// Helper function to get seasonal recommendations
    function getSeasonalRecommendation(season, category) {
        const recommendations = {
            Spring: {
                Cereal: "Ideal time for planting cereals. Ensure proper soil preparation and timely sowing.",
                Vegetable: "Perfect season for most vegetables. Start seedlings indoors for early harvest.",
                Fruit: "Prune fruit trees before buds open. Plant new fruit trees early in the season.",
                Legume: "Excellent time for legume planting. They'll fix nitrogen for subsequent crops.",
                Other: "Spring is generally good for planting. Follow specific crop requirements."
            },
            Summer: {
                Cereal: "Monitor cereals for water stress. Harvest early varieties if ready.",
                Vegetable: "Provide shade for heat-sensitive vegetables. Water deeply and regularly.",
                Fruit: "Ensure adequate water for fruit development. Protect from sunscald.",
                Legume: "Harvest legumes regularly to encourage continued production.",
                Other: "Watch for heat stress. Water early in the morning or late in the evening."
            },
            Fall: {
                Cereal: "Plant winter varieties. Prepare fields for overwintering crops.",
                Vegetable: "Plant cool-season vegetables. Protect from early frosts.",
                Fruit: "Harvest mature fruits. Prepare trees for winter dormancy.",
                Legume: "Plant cover crops to improve soil health over winter.",
                Other: "Prepare for winter. Harvest remaining crops before frost."
            },
            Winter: {
                Cereal: "Most cereals dormant. Plan for spring planting.",
                Vegetable: "Grow cold-hardy varieties in protected environments.",
                Fruit: "Dormant season. Prune trees and plan for spring.",
                Legume: "Limited legume growth. Focus on soil preparation.",
                Other: "Plan next season's crops. Maintain equipment and infrastructure."
            },
            "All Season": {
                Cereal: "Year-round production possible with proper management and rotation.",
                Vegetable: "Succession planting recommended for continuous harvest.",
                Fruit: "Evergreen varieties can produce year-round in suitable climates.",
                Legume: "Can be grown in rotation throughout the year.",
                Other: "Follow specific crop requirements for continuous production."
            }
        };

        return recommendations[season]?.[category] || "Manage according to general seasonal practices and specific crop needs.";
    }

// Helper function to get overall recommendations
    function getOverallRecommendations(productiveSeason, commonCategory, categoryDiversity, seasonDiversity) {
        let recommendations = [];

        // Recommendations based on productive season
        if (productiveSeason === "Winter") {
            recommendations.push("Consider expanding winter production with protected cultivation or cold-hardy varieties.");
        } else if (productiveSeason === "Summer") {
            recommendations.push("Implement water conservation strategies and heat protection measures for summer crops.");
        }

        // Recommendations based on category diversity
        if (categoryDiversity < 3) {
            recommendations.push("Increase crop diversity to improve soil health and reduce pest pressure.");
        } else {
            recommendations.push("Good crop diversity detected. Maintain rotation practices.");
        }

        // Recommendations based on seasonal distribution
        if (seasonDiversity < 3) {
            recommendations.push("Consider expanding production into more seasons to utilize resources year-round.");
        }

        // Default recommendation if none apply
        if (recommendations.length === 0) {
            recommendations.push("Continue current practices. Monitor crop health and yields regularly.");
        }

        return recommendations.join(" ");
    }

    // Get crop recommendations based on category and season
    function getCropRecommendations(category, season) {
        const recommendations = {
            Cereal: {
                Spring: 'Plant in well-drained soil with full sun. Requires regular watering during growth period.',
                Summer: 'Ensure adequate irrigation during hot months. Monitor for pests.',
                Fall: 'Harvest before first frost. Store in dry conditions.',
                Winter: 'Most cereals are not grown in winter. Consider winter wheat varieties.',
                'All Season': 'Can be grown year-round in controlled environments with proper care.'
            },
            Vegetable: {
                Spring: 'Ideal planting time for most vegetables. Ensure soil is warm enough.',
                Summer: 'Provide shade during hottest parts of day. Water regularly.',
                Fall: 'Plant cool-season vegetables. Protect from early frosts.',
                Winter: 'Grow cold-hardy varieties or use greenhouses for protection.',
                'All Season': 'Succession planting recommended for continuous harvest.'
            },
            Fruit: {
                Spring: 'Prune before new growth appears. Monitor for flowering and pollination.',
                Summer: 'Ensure consistent watering for fruit development. Protect from extreme heat.',
                Fall: 'Harvest mature fruits. Prepare plants for winter dormancy.',
                Winter: 'Most fruits are dormant. Prune during this period.',
                'All Season': 'Evergreen varieties can produce year-round in suitable climates.'
            },
            Legume: {
                Spring: 'Plant after last frost. Legumes fix nitrogen in soil.',
                Summer: 'Provide support for climbing varieties. Harvest regularly.',
                Fall: 'Plant for late harvest. Some varieties tolerate light frost.',
                Winter: 'Not typically grown in winter unless in mild climates.',
                'All Season': 'Can be grown in succession for continuous harvest.'
            },
            Other: {
                Spring: 'Follow specific growing instructions for this crop type.',
                Summer: 'Monitor for heat stress. Provide adequate water.',
                Fall: 'Prepare for harvest or overwintering as appropriate.',
                Winter: 'Most special crops require protection or indoor growing.',
                'All Season': 'Consult specific growing guides for year-round cultivation.'
            }
        };

        return recommendations[category]?.[season] || 'General care: Ensure proper soil conditions, adequate water, and appropriate sunlight for this crop type.';
    }

    // Show SweetAlert notification
    function showAlert(icon, title, text) {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            toast: icon !== 'error',
            position: icon === 'error' ? 'center' : 'top-end',
            showConfirmButton: icon === 'error',
            timer: icon === 'error' ? null : 3000
        });
    }

    // Update the resetForm function to clear dropdowns
    function resetForm() {
        $cropForm[0].reset();
        $('#editCropCode').val('');
        $editMode.val('false');

        // Reset dropdowns to first option
        $('#fieldCodeInput').prop('selectedIndex', 0);
        $('#logCodeInput').prop('selectedIndex', 0);
    }

    // Update the search functionality to work with pagination
    $searchInput.on('input', function() {
        const searchTerm = $(this).val().toLowerCase();

        if (searchTerm) {
            // Filter crops based on search term
            const filteredCrops = allCrops.filter(crop =>
                crop.cropCode.toLowerCase().includes(searchTerm) ||
                crop.commonName.toLowerCase().includes(searchTerm) ||
                crop.scientificName.toLowerCase().includes(searchTerm) ||
                crop.category.toLowerCase().includes(searchTerm) ||
                crop.cropSeason.toLowerCase().includes(searchTerm) ||
                crop.fieldCode.toLowerCase().includes(searchTerm) ||
                crop.logCode.toLowerCase().includes(searchTerm)
            );

            // Update the table with filtered results
            populateCropTable(filteredCrops);
            updatePaginationInfo(1, filteredCrops.length, filteredCrops.length);
            renderPaginationControls(Math.ceil(filteredCrops.length / itemsPerPage));
        } else {
            // If search is cleared, show all crops with pagination
            renderTableWithPagination();
        }
    });
});