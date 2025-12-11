
document.addEventListener('DOMContentLoaded', () => {
    let districtsData = [];
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('suggestions');
    const resultsSection = document.getElementById('results-section');
    const districtNameHeading = document.getElementById('district-name');
    const ctx = document.getElementById('absenteeismChart').getContext('2d');
    
    let chartInstance = null;
    
    // CSV Columns: clean_name,20242025,20232024,20222023,20212022,20202021,20192020
    // We want to map these to friendly years:
    const yearMapping = {
        '20242025': '2024-25',
        '20232024': '2023-24',
        '20222023': '2022-23',
        '20212022': '2021-22',
        '20202021': '2020-21',
        '20192020': '2019-20'
    };
    
    // We want the chart to display oldest to newest (Left to Right)
    // The CSV has newest to oldest (Left to Right columns)
    // So we'll reverse the order for the chart.
    const yearKeys = ['20192020', '20202021', '20212022', '20222023', '20232024', '20242025'];
    
    // Load and Parse CSV
    Papa.parse('district_data.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            districtsData = results.data;
            setupSearch();
        },
        error: function(err) {
            console.error('Error parsing CSV:', err);
        }
    });

    function setupSearch() {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }
            
            const matches = districtsData.filter(d => 
                d.clean_name && d.clean_name.toLowerCase().includes(query)
            );
            
            showSuggestions(matches);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                suggestionsBox.classList.add('hidden');
            }
        });
    }

    function showSuggestions(matches) {
        suggestionsBox.innerHTML = '';
        if (matches.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        
        matches.slice(0, 10).forEach(district => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = district.clean_name;
            div.addEventListener('click', () => {
                selectDistrict(district);
            });
            suggestionsBox.appendChild(div);
        });
        
        suggestionsBox.classList.remove('hidden');
    }

    function selectDistrict(district) {
        searchInput.value = district.clean_name;
        suggestionsBox.classList.add('hidden');
        renderDistrict(district);
    }

    function renderDistrict(district) {
        districtNameHeading.textContent = district.clean_name;
        resultsSection.classList.remove('hidden');

        // Prepare data for chart
        // Extract values for the sorted year keys
        const dataValues = yearKeys.map(key => {
            const val = district[key];
            return val === 'NA' || val === '' ? null : parseFloat(val);
        });
        
        const labels = yearKeys.map(key => yearMapping[key]);

        updateChart(labels, dataValues);
    }

    function updateChart(labels, data) {
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Chart.js global defaults for this premium look
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chronic Absenteeism Rate (%)',
                    data: data,
                    borderColor: '#6366f1', // Primary color
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ec4899', // Secondary color
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.4, // Smooth curve
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Percent Absent',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${context.parsed.y}%`;
                            }
                        }
                    }
                }
            }
        });
    }
});
