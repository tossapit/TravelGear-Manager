// Sample data
let inventory = [
    {
        id: 1,
        name: 'เต็นท์ 2 คน',
        type: 'อุปกรณ์แคมป์ปิ้ง',
        totalQuantity: 10,
        minQuantity: 2,
        status: 'พร้อมใช้',
        description: 'เต็นท์สำหรับ 2 คน กันน้ำได้'
    },
    // Add more sample data as needed
];

let editingId = null;

// Render table
function renderTable(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
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
                <button onclick="editItem(${item.id})" class="text-blue-600 hover:text-blue-800 mr-2">แก้ไข</button>
                <button onclick="deleteItem(${item.id})" class="text-red-600 hover:text-red-800">ลบ</button>
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
    document.getElementById('modalTitle').textContent = editingId ? 'แก้ไขทรัพยากร' : 'เพิ่มทรัพยากรใหม่';
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('resourceForm').reset();
    editingId = null;
}

// CRUD Operations
function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('resourceName').value,
        type: document.getElementById('resourceType').value,
        totalQuantity: parseInt(document.getElementById('totalQuantity').value),
        minQuantity: parseInt(document.getElementById('minQuantity').value),
        status: document.getElementById('resourceStatus').value,
        description: document.getElementById('description').value
    };

    if (editingId) {
        // Update existing item
        inventory = inventory.map(item => 
            item.id === editingId ? { ...item, ...formData } : item
        );
    } else {
        // Add new item
        formData.id = inventory.length + 1;
        inventory.push(formData);
    }

    renderTable();
    closeModal();
}

function editItem(id) {
    const item = inventory.find(item => item.id === id);
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

function deleteItem(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
        inventory = inventory.filter(item => item.id !== id);
        renderTable();
    }
}

// Initial render
renderTable();