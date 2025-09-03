$(document).ready(function() {
    // Initialize charts
    initProductionChart();

    // Simulate loading data
    setTimeout(() => {
        updateStats();
    }, 1000);

    // Set up refresh button functionality
    $('.btn-icon').on('click', function() {
        const $this = $(this);
        $this.addClass('fa-spin');

        setTimeout(() => {
            $this.removeClass('fa-spin');
            updateStats();
            showNotification('Data refreshed successfully', 'success');
        }, 800);
    });
});

// Initialize production chart
function initProductionChart() {
    const ctx = document.getElementById('productionChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Crop Yield (tons)',
                    data: [12, 19, 8, 15, 24, 18, 22, 30, 25, 20, 15, 10],
                    backgroundColor: 'rgba(4, 72, 44, 0.7)',
                    borderColor: 'rgba(4, 72, 44, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Field Utilization (%)',
                    data: [65, 70, 75, 80, 85, 90, 95, 92, 88, 82, 75, 68],
                    backgroundColor: 'rgba(58, 140, 110, 0.7)',
                    borderColor: 'rgba(58, 140, 110, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yield (tons)'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Utilization (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// Update statistics (simulated)
function updateStats() {
    // Simulate API call to get updated stats
    const newStats = {
        totalCrops: Math.floor(Math.random() * 10) + 20, // 20-30
        activeFields: Math.floor(Math.random() * 3) + 7, // 7-10
        totalLogs: Math.floor(Math.random() * 10) + 40, // 40-50
        currentSeason: 'Spring'
    };

    // Update the DOM with new values
    $('#totalCrops').text(newStats.totalCrops);
    $('#activeFields').text(newStats.activeFields);
    $('#totalLogs').text(newStats.totalLogs);
    $('#currentSeason').text(newStats.currentSeason);
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = $(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert"
             style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `);

    // Add to page
    $('body').append(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.alert('close');
    }, 3000);
}