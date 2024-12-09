const API_URL = 'http://localhost:5000/api';
let inventory = [];
let editingId = null;

// Utility function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Better alert system with toast notifications
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    } transition-opacity duration-500`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Fade out and remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Function to get status color classes
function getStatusColor(status) {
    switch(status) {
        case 'พร้อมใช้':
            return 'bg-green-100 text-green-800';
        case 'ซ่อมบำรุง':
            return 'bg-yellow-100 text-yellow-800';
        case 'ไม่พร้อมใช้':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        inventory = await response.json();
        renderTable();
    } catch (error) {
        console.error('Error loading inventory:', error);
        showToast('ไม่สามารถโหลดข้อมูลได้');
    }
}

function renderTable(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr class="border-t">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">ไม่มีข้อมูล</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="border-t hover:bg-[#374151]">
            <td class="px-6 py-4">${escapeHtml(item.name || '')}</td>
            <td class="px-6 py-4">${escapeHtml(item.type || '')}</td>
            <td class="px-6 py-4">${escapeHtml(item.totalQuantity || 0)}</td>
            <td class="px-6 py-4">${escapeHtml(item.minQuantity || 0)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(item.status)}">
                    ${escapeHtml(item.status || '')}
                </span>
            </td>
            <td class="px-6 py-4">
                <button 
                    onclick="editItem('${escapeHtml(item._id)}')" 
                    class="text-blue-600 hover:text-blue-800 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                >
                    แก้ไข
                </button>
                <button 
                    onclick="deleteItem('${escapeHtml(item._id)}')" 
                    class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2"
                >
                    ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const filteredData = inventory.filter(item => {
        const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || item.type === typeFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    renderTable(filteredData);
}

// Improved modal handling
function openModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('resourceForm');
    
    if (modal && modalTitle && form) {
        modal.classList.remove('hidden');
        modalTitle.textContent = editingId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่';
        
        if (!editingId) {
            form.reset();
        }

        // Focus first input
        const firstInput = form.querySelector('input, select');
        if (firstInput) firstInput.focus();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    const form = document.getElementById('resourceForm');
    
    if (modal && form) {
        modal.classList.add('hidden');
        form.reset();
        editingId = null;
        
        // Clear any existing error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = 'กำลังบันทึก...';

        const formData = {
            name: document.getElementById('resourceName').value.trim(),
            type: document.getElementById('resourceType').value,
            totalQuantity: parseInt(document.getElementById('totalQuantity').value),
            minQuantity: parseInt(document.getElementById('minQuantity').value),
            status: document.getElementById('resourceStatus').value,
            description: document.getElementById('description').value.trim()
        };

        // Validation
        if (!formData.name || !formData.type || isNaN(formData.totalQuantity) || isNaN(formData.minQuantity) || !formData.status) {
            throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
        }

        if (formData.minQuantity > formData.totalQuantity) {
            throw new Error('จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด');
        }

        const url = editingId ? 
            `${API_URL}/equipment/${editingId}` : 
            `${API_URL}/equipment`;
            
        const response = await fetch(url, {
            method: editingId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

        await loadInventory();
        closeModal();
        showToast(data.message, 'success');
    } catch (error) {
        showToast(error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'บันทึก';
    }
}

async function editItem(id) {
    try {
        const response = await fetch(`${API_URL}/equipment/${id}`);
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลได้');
        }
        
        const item = await response.json();
        editingId = id;
        
        // Set form values
        const fields = ['name', 'type', 'totalQuantity', 'minQuantity', 'status', 'description'];
        fields.forEach(field => {
            const element = document.getElementById(`resource${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (element) {
                element.value = item[field] || '';
            }
        });
        
        openModal();
    } catch (error) {
        console.error('Error editing item:', error);
        showToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ' + error.message);
    }
}

async function deleteItem(id) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;
    
    try {
        const response = await fetch(`${API_URL}/equipment/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'ไม่สามารถลบข้อมูลได้');
        }

        await loadInventory();
        showToast('ลบข้อมูลสำเร็จ', 'success');
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    
    // Form submission
    const form = document.getElementById('resourceForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Search and filters
    ['searchInput', 'typeFilter', 'statusFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', filterTable);
        }
    });

    // Close modal when clicking outside
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});