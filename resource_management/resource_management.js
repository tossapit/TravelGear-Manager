// API configuration
const API_URL = 'http://localhost:5000/api';
let inventory = [];
let editingId = null;

// API functions
async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        inventory = await response.json();
        renderTable();
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// Render table
function renderTable(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr class="border-t">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">ไม่มีข้อมูล</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="border-t">
            <td class="px-6 py-4">${item.name}</td>
            <td class="px-6 py-4">${item.type}</td>
            <td class="px-6 py-4">${item.totalQuantity}</td>
            <td class="px-6 py-4">${item.minQuantity}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(item.status)}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4">
                <button onclick="editItem('${item._id}')" class="text-blue-600 hover:text-blue-800 mr-2">แก้ไข</button>
                <button onclick="deleteItem('${item._id}')" class="text-red-600 hover:text-red-800">ลบ</button>
            </td>
        </tr>
    `).join('');
}

// Filter table
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filteredData = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || item.type === typeFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    renderTable(filteredData);
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'พร้อมใช้':
            return 'bg-green-100 text-green-800';
        case 'ซ่อมบำรุง':
            return 'bg-yellow-100 text-yellow-800';
        case 'ไม่พร้อมใช้':
            return 'bg-red-100 text-red-800';
        default:
            return '';
    }
}

// Modal functions
function openModal() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = editingId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่';
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('resourceForm').reset();
    editingId = null;
}

// CRUD Operations
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('resourceName').value,
        type: document.getElementById('resourceType').value,
        totalQuantity: parseInt(document.getElementById('totalQuantity').value),
        minQuantity: parseInt(document.getElementById('minQuantity').value),
        status: document.getElementById('resourceStatus').value,
        description: document.getElementById('description').value
    };

    try {
        if (editingId) {
            await fetch(`${API_URL}/equipment/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        } else {
            await fetch(`${API_URL}/equipment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        }
        
        await loadInventory();
        closeModal();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
}

async function editItem(id) {
    const item = inventory.find(item => item._id === id);
    if (item) {
        editingId = id;
        document.getElementById('resourceName').value = item.name;
        document.getElementById('resourceType').value = item.type;
        document.getElementById('totalQuantity').value = item.totalQuantity;
        document.getElementById('minQuantity').value = item.minQuantity;
        document.getElementById('resourceStatus').value = item.status;
        document.getElementById('description').value = item.description;
        openModal();
    }
}

async function deleteItem(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
        try {
            await fetch(`${API_URL}/equipment/${id}`, {
                method: 'DELETE'
            });
            await loadInventory();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    }
}

// Load inventory when page loads
document.addEventListener('DOMContentLoaded', loadInventory);