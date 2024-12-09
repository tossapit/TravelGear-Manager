const API_URL = 'http://localhost:5000/api';
let chart;

async function initDashboard() {
    try {
        await Promise.all([
            loadStats(),
            initChart(),
            loadAlerts(),
            loadActivities()
        ]);
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) throw new Error('Failed to fetch equipment data');
        const data = await response.json();
        
        document.getElementById('totalResources').textContent = data.length;
        document.getElementById('inUseCount').textContent = data.filter(i => i.status === 'ซ่อมบำรุง').length;
        document.getElementById('availableCount').textContent = data.filter(i => i.status === 'พร้อมใช้').length;
        document.getElementById('lowStockCount').textContent = data.filter(i => i.totalQuantity <= i.minQuantity).length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function initChart() {
    const ctx = document.getElementById('usageChart')?.getContext('2d');
    if (!ctx) return;

    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Vehicles',
                data: [65, 75, 85, 80, 85, 80],
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f6',
                tension: 0.4
            },
            {
                label: 'Equipment',
                data: [85, 88, 90, 82, 85, 88],
                borderColor: '#10b981',
                backgroundColor: '#10b981',
                tension: 0.4
            }
        ]
    };

    chart = new Chart(ctx, {
        type: 'line',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9ca3af' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#1f2937' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { color: '#1f2937' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });

    return chart;
}

async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) throw new Error('Failed to fetch alerts data');
        const data = await response.json();
        
        const lowStock = data.filter(i => i.totalQuantity <= i.minQuantity);
        const container = document.getElementById('alertsContainer');
        
        if (container) {
            container.innerHTML = lowStock.length ? lowStock.map(item => `
                <div class="p-3 rounded bg-gray-800/40 border border-yellow-500/20">
                    <div class="flex justify-between items-center">
                        <span>${item.name}</span>
                        <span class="text-gray-400">${item.totalQuantity}/${item.minQuantity} remaining</span>
                    </div>
                </div>
            `).join('') : '<div class="text-gray-400">No low stock items</div>';
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

async function loadActivities() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch activities data');
        const data = await response.json();
        
        const tbody = document.getElementById('activitiesTable');
        
        if (tbody) {
            tbody.innerHTML = data.length ? data.slice(0, 4).map(activity => `
                <tr class="border-t border-gray-700">
                    <td class="px-4 py-3">${activity.resourceName}</td>
                    <td class="px-4 py-3">${activity.status === 'in-use' ? 'Checked out' : 'Checked in'}</td>
                    <td class="px-4 py-3">${activity.userId}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(activity.status)}">
                            ${getStatusText(activity.status)}
                        </span>
                    </td>
                    <td class="px-4 py-3">${formatTime(activity.createdAt)}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-400">No recent activities</td></tr>';
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function setupEventListeners() {
    const periodSelect = document.getElementById('periodSelect');
    const chartTypeSelect = document.getElementById('chartTypeSelect');

    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            if (!chart) return;
            const isSecondHalf = e.target.value.includes('Second');
            const labels = isSecondHalf ? 
                ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            
            const vehiclesData = isSecondHalf ? 
                [82, 79, 85, 88, 84, 82] :
                [65, 75, 85, 80, 85, 80];
            
            const equipmentData = isSecondHalf ? 
                [89, 87, 92, 85, 88, 90] :
                [85, 88, 90, 82, 85, 88];

            chart.data.labels = labels;
            chart.data.datasets[0].data = vehiclesData;
            chart.data.datasets[1].data = equipmentData;
            chart.update();
        });
    }

    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', (e) => {
            if (!chart) return;
            const newType = e.target.value.includes('Line') ? 'line' : 'bar';
            
            // Store current data
            const currentData = chart.data;
            
            // Destroy current chart
            chart.destroy();
            
            // Create new chart with updated type
            chart = new Chart(document.getElementById('usageChart').getContext('2d'), {
                type: newType,
                data: currentData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#9ca3af' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#1f2937' },
                            ticks: { color: '#9ca3af' }
                        },
                        x: {
                            grid: { color: '#1f2937' },
                            ticks: { color: '#9ca3af' }
                        }
                    }
                }
            });
        });
    }
}

function getStatusBadgeClass(status) {
    const classes = {
        'in-use': 'bg-blue-500/20 text-blue-300',
        'available': 'bg-green-500/20 text-green-300',
        'scheduled': 'bg-yellow-500/20 text-yellow-300',
        'completed': 'bg-gray-500/20 text-gray-300'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-300';
}

function getStatusText(status) {
    const texts = {
        'in-use': 'In Use',
        'available': 'Available',
        'scheduled': 'Scheduled',
        'completed': 'Completed'
    };
    return texts[status] || status;
}

function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} minutes ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString('th-TH', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);