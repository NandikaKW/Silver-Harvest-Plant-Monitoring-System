// Add these variables at the top of the script
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let allCrops = [];
let allFieldCodes = [];
let allLogCodes = [];

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
    // API Base URL
    const API_BASE = 'http://localhost:8080/api/v1/crop';

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
    // Add these event listeners in the $(document).ready() function
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

    // Add event listener for the generate crop code button
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
    $cropForm.on('submit', function(e) {
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

        $.ajax({
            url: url,
            type: method,
            data: formData,
            processData: false,
            contentType: false,
            success: function(response, status, xhr) {
                if (xhr.status === 201 || xhr.status === 204) {
                    const message = isEditMode ? 'Crop updated successfully!' : 'Crop added successfully!';
                    showAlert('success', 'Success', message);
                    resetForm();
                    loadAllCrops();
                    closePopups();
                } else {
                    showAlert('error', 'Error', 'Error saving crop');
                }
            },
            error: function(xhr) {
                if (xhr.status === 400) {
                    showAlert('error', 'Error', 'Bad request. Please check your inputs.');
                } else {
                    showAlert('error', 'Error', 'Error saving crop');
                }
            },
            complete: function() {
                // Restore button state
                $submitBtn.html(originalText);
                $submitBtn.prop('disabled', false);
            }
        });
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

// Update the loadAllCrops function to also generate field and log codes
    function loadAllCrops() {
        $loadingSpinner.show();
        $cropTableBody.empty();

        $.ajax({
            url: `${API_BASE}/all`,
            method: 'GET',
            success: function(data) {
                allCrops = data; // Store all crops for pagination

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
                renderTableWithPagination(); // Render with pagination
            },
            error: function(xhr, status, error) {
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
            },
            complete: function() {
                $loadingSpinner.hide();
            }
        });
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

        // Add event listeners to action buttons
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
    function viewCrop(cropCode) {
        $.ajax({
            url: `${API_BASE}/${cropCode}`,
            method: 'GET',
            success: function(crop) {
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
                                    <p>${crop.fieldCode}</p>
                                </div>
                                <div>
                                    <p style="font-weight: 500; margin-bottom: 0.2rem; color: var(--light-text);">Log Code</p>
                                    <p>${crop.logCode}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                $viewCropPopup.addClass('active');
                $('body').css('overflow', 'hidden');
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                showAlert('error', 'Error', 'Error loading crop details');
            }
        });
    }

    // Edit crop
    function editCrop(cropCode) {
        $.ajax({
            url: `${API_BASE}/${cropCode}`,
            method: 'GET',
            success: function(crop) {
                // Populate form with crop data
                $('#cropCodeInput').val(crop.cropCode);
                $('#commonNameInput').val(crop.commonName);
                $('#scientificNameInput').val(crop.scientificName);
                $('#categoryInput').val(crop.category);
                $('#seasonInput').val(crop.cropSeason);
                $('#fieldCodeInput').val(crop.fieldCode);
                $('#logCodeInput').val(crop.logCode);

                // Set edit mode
                $('#editCropCode').val(crop.cropCode);
                $editMode.val('true');
                $popupTitle.text('Edit Crop');
                $cropImageInput.prop('required', false);
                $imageHelpText.text('Optional: Select a new image to replace the current one');

                // Show form popup
                $cropFormPopup.addClass('active');
                $('body').css('overflow', 'hidden');
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                showAlert('error', 'Error', 'Error loading crop details');
            }
        });
    }

    // Delete crop
    function deleteCrop(cropCode) {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete crop ${cropCode}. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${API_BASE}/${cropCode}`,
                    method: 'DELETE',
                    success: function() {
                        loadAllCrops();
                        showAlert('success', 'Deleted!', 'Crop has been deleted successfully.');
                    },
                    error: function(xhr, status, error) {
                        console.error('Error:', error);
                        showAlert('error', 'Error', 'Error deleting crop');
                    }
                });
            }
        });
    }

    // Make report functions globally available
    window.generateSeasonReport = generateSeasonReport;
    window.generateCategoryReport = generateCategoryReport;
    window.generateFieldReport = generateFieldReport;
    window.generateCropReport = generateCropReport;

    // Generate crop-specific report
    function generateCropReport(cropCode) {
        $.ajax({
            url: `${API_BASE}/${cropCode}`,
            method: 'GET',
            success: function(crop) {
                const imageHtml = crop.cropImage
                    ? `<img src="data:image/png;base64,${crop.cropImage}" alt="${crop.commonName}" style="max-width: 150px; height: auto; border-radius: 8px; margin-bottom: 1rem;">`
                    : '<div style="height: 120px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;"><i class="fas fa-seedling" style="font-size: 2rem; color: #ccc;"></i></div>';

                Swal.fire({
                    title: `${crop.commonName} Report`,
                    html: `
                    <div style="text-align: center;">
                        ${imageHtml}
                        <div style="text-align: left; font-size: 0.9rem;">
                            <p><strong>Scientific Name:</strong> ${crop.scientificName}</p>
                            <p><strong>Category:</strong> ${crop.category}</p>
                            <p><strong>Season:</strong> ${crop.cropSeason}</p>
                            <p><strong>Field Code:</strong> ${crop.fieldCode}</p>
                            <p><strong>Log Code:</strong> ${crop.logCode}</p>
                            <hr>
                            <h4>Growing Recommendations:</h4>
                            <p>${getCropRecommendations(crop.category, crop.cropSeason)}</p>
                        </div>
                    </div>
                `,
                    icon: null,
                    showConfirmButton: false,
                    showCloseButton: true,
                    customClass: {
                        closeButton: 'swal2-close-custom'
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                showAlert('error', 'Error', 'Error generating report');
            }
        });
    }

    // Generate seasonal report
    function generateSeasonReport() {
        $.ajax({
            url: `${API_BASE}/all`,
            method: 'GET',
            success: function(crops) {
                const seasonCount = {};
                const seasonImage = {};

                $.each(crops, function(index, crop) {
                    if (crop.cropSeason) {
                        seasonCount[crop.cropSeason] = (seasonCount[crop.cropSeason] || 0) + 1;
                        if (crop.cropImage && !seasonImage[crop.cropSeason]) {
                            seasonImage[crop.cropSeason] = crop.cropImage;
                        }
                    }
                });

                let seasonTable = '<table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem;"><tr><th>Season</th><th>Image</th><th>Number of Crops</th></tr>';
                for (const season in seasonCount) {
                    const imageCell = seasonImage[season]
                        ? `<td><img src="data:image/png;base64,${seasonImage[season]}" alt="${season}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                        : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                    seasonTable += `<tr><td>${season}</td>${imageCell}<td>${seasonCount[season]}</td></tr>`;
                }
                seasonTable += '</table>';

                Swal.fire({
                    title: 'Seasonal Distribution Report',
                    html: seasonTable,
                    icon: null,
                    showConfirmButton: false,
                    showCloseButton: true,
                    width: '600px'
                });
            }
        });
    }

    // Generate category report
    function generateCategoryReport() {
        $.ajax({
            url: `${API_BASE}/all`,
            method: 'GET',
            success: function(crops) {
                const categoryCount = {};
                const categoryImage = {};

                $.each(crops, function(index, crop) {
                    if (crop.category) {
                        categoryCount[crop.category] = (categoryCount[crop.category] || 0) + 1;
                        if (crop.cropImage && !categoryImage[crop.category]) {
                            categoryImage[crop.category] = crop.cropImage;
                        }
                    }
                });

                let categoryTable = '<table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem;"><tr><th>Category</th><th>Image</th><th>Number of Crops</th></tr>';
                for (const category in categoryCount) {
                    const imageCell = categoryImage[category]
                        ? `<td><img src="data:image/png;base64,${categoryImage[category]}" alt="${category}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                        : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                    categoryTable += `<tr><td>${category}</td>${imageCell}<td>${categoryCount[category]}</td></tr>`;
                }
                categoryTable += '</table>';

                Swal.fire({
                    title: 'Category Analysis Report',
                    html: categoryTable,
                    icon: null,
                    showConfirmButton: false,
                    showCloseButton: true,
                    width: '600px'
                });
            }
        });
    }

   // Generate field report
    function generateFieldReport() {
        $.ajax({
            url: `${API_BASE}/all`,
            method: 'GET',
            success: function(crops) {
                const fieldCount = {};
                const fieldImage = {};

                $.each(crops, function(index, crop) {
                    if (crop.fieldCode) {
                        fieldCount[crop.fieldCode] = (fieldCount[crop.fieldCode] || 0) + 1;
                        if (crop.cropImage && !fieldImage[crop.fieldCode]) {
                            fieldImage[crop.fieldCode] = crop.cropImage;
                        }
                    }
                });

                let fieldTable = '<table style="width: 100%; margin: 0.5rem 0; font-size: 0.9rem;"><tr><th>Field Code</th><th>Image</th><th>Number of Crops</th></tr>';
                for (const field in fieldCount) {
                    const imageCell = fieldImage[field]
                        ? `<td><img src="data:image/png;base64,${fieldImage[field]}" alt="${field}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>`
                        : '<td><i class="fas fa-seedling" style="font-size: 1.2rem; color: #ccc;"></i></td>';

                    fieldTable += `<tr><td>${field}</td>${imageCell}<td>${fieldCount[field]}</td></tr>`;
                }
                fieldTable += '</table>';

                Swal.fire({
                    title: 'Field Performance Report',
                    html: fieldTable,
                    icon: null,
                    showConfirmButton: false,
                    showCloseButton: true,
                    width: '600px'
                });
            }
        });
    }

// Generate full report
    function generateFullReport() {
        Swal.fire({
            title: 'Generating Report',
            text: 'Please wait while we generate your comprehensive crop report...',
            icon: null,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: `${API_BASE}/all`,
            method: 'GET',
            success: function(crops) {
                Swal.close();

                // Get a sample image for the report
                const sampleCrop = crops.find(crop => crop.cropImage) || crops[0];
                const imageHtml = sampleCrop && sampleCrop.cropImage
                    ? `<img src="data:image/png;base64,${sampleCrop.cropImage}" alt="Sample Crop" style="max-width: 150px; height: auto; border-radius: 8px; margin: 0.5rem auto; display: block;">`
                    : '';

                // Create a comprehensive report
                let reportHTML = `
                <div style="text-align: left; max-height: 50vh; overflow-y: auto; font-size: 0.9rem;">
                    <h3 style="text-align: center; margin-bottom: 1rem;">Farm Management Report</h3>
                    ${imageHtml}
                    <p><strong>Total Crops:</strong> ${crops.length}</p>
                    <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <hr>
            `;

                // Add seasonal distribution
                const seasonCount = {};
                $.each(crops, function(index, crop) {
                    if (crop.cropSeason) {
                        seasonCount[crop.cropSeason] = (seasonCount[crop.cropSeason] || 0) + 1;
                    }
                });

                reportHTML += `<h4>Seasonal Distribution</h4><ul>`;
                for (const season in seasonCount) {
                    reportHTML += `<li>${season}: ${seasonCount[season]} crops</li>`;
                }
                reportHTML += `</ul>`;

                // Add category distribution
                const categoryCount = {};
                $.each(crops, function(index, crop) {
                    if (crop.category) {
                        categoryCount[crop.category] = (categoryCount[crop.category] || 0) + 1;
                    }
                });

                reportHTML += `<h4>Category Distribution</h4><ul>`;
                for (const category in categoryCount) {
                    reportHTML += `<li>${category}: ${categoryCount[category]} crops</li>`;
                }
                reportHTML += `</ul>`;

                reportHTML += `</div>`;

                Swal.fire({
                    title: 'Comprehensive Crop Report',
                    html: reportHTML,
                    width: '650px',
                    icon: null,
                    showConfirmButton: false,
                    showCloseButton: true
                });
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                Swal.close();
                showAlert('error', 'Error', 'Failed to generate report');
            }
        });
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