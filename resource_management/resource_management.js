const API_URL = 'http://localhost:5000/api';
let inventory = [];
let editingId = null;

async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        inventory = await response.json();
        renderTable();
        console.log('Loaded inventory:', inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
    }
}

function renderTable(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr class="border-t">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">ไม่มีข้อมูล</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="border-t">
            <td class="px-6 py-4">${item.name || ''}</td>
            <td class="px-6 py-4">${item.type || ''}</td>
            <td class="px-6 py-4">${item.totalQuantity || 0}</td>
            <td class="px-6 py-4">${item.minQuantity || 0}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(item.status)}">
                    ${item.status || ''}
                </span>
            </td>
            <td class="px-6 py-4">
                <button onclick="editItem('${item._id}')" class="text-blue-600 hover:text-blue-800 mr-2">แก้ไข</button>
                <button onclick="deleteItem('${item._id}')" class="text-red-600 hover:text-red-800">ลบ</button>
            </td>
        </tr>
    `).join('');
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
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

function openModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    if (modal && modalTitle) {
        modal.classList.remove('hidden');
        modalTitle.textContent = editingId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่';
        if (!editingId) {
            document.getElementById('resourceForm').reset();
        }
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    const form = document.getElementById('resourceForm');
    if (modal && form) {
        modal.classList.add('hidden');
        form.reset();
        editingId = null;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = {
            name: document.getElementById('resourceName').value,
            type: document.getElementById('resourceType').value,
            totalQuantity: parseInt(document.getElementById('totalQuantity').value),
            minQuantity: parseInt(document.getElementById('minQuantity').value),
            status: document.getElementById('resourceStatus').value,
            description: document.getElementById('description').value
        };

        // Client-side validation
        if (!formData.name || !formData.type || !formData.totalQuantity || !formData.minQuantity || !formData.status) {
            throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
        }

        if (formData.minQuantity > formData.totalQuantity) {
            throw new Error('จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด');
        }

        const url = editingId ? 
            `${API_URL}/equipment/${editingId}` : 
            `${API_URL}/equipment`;
            
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
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
        alert(data.message);
    } catch (error) {
        alert(error.message);
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
        document.getElementById('resourceName').value = item.name || '';
        document.getElementById('resourceType').value = item.type || '';
        document.getElementById('totalQuantity').value = item.totalQuantity || 0;
        document.getElementById('minQuantity').value = item.minQuantity || 0;
        document.getElementById('resourceStatus').value = item.status || '';
        document.getElementById('description').value = item.description || '';
        openModal();
    } catch (error) {
        console.error('Error editing item:', error);
        alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ' + error.message);
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
        alert('ลบข้อมูลสำเร็จ');
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    
    const form = document.getElementById('resourceForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmit(e);
        });
    }

    const addButton = document.querySelector('button[onclick="openModal()"]');
    if (addButton) {
        addButton.addEventListener('click', () => {
            editingId = null;
            openModal();
        });
    }

    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (typeFilter) typeFilter.addEventListener('change', filterTable);
    if (statusFilter) statusFilter.addEventListener('change', filterTable);
});