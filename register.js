const API_URL = 'http://localhost:5001/api';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const submitButton = document.getElementById('submitButton');
const alert = document.getElementById('alert');
const alertMessage = document.getElementById('alertMessage');

function resetErrors() {
    const errorElements = document.querySelectorAll('[id$="Error"]');
    errorElements.forEach(element => {
        element.classList.add('hidden');
        element.textContent = '';
    });
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function showAlert(message, type) {
    alert.className = type === 'success' 
        ? 'rounded-md bg-green-50 p-4 border border-green-400'
        : 'rounded-md bg-red-50 p-4 border border-red-400';
    alertMessage.className = type === 'success' ? 'text-sm text-green-800' : 'text-sm text-red-800';
    alertMessage.textContent = message;
    alert.classList.remove('hidden');
}

function validateForm(data) {
    let isValid = true;
    resetErrors();

    if (data.firstName.length < 2) {
        showError('firstName', 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
        isValid = false;
    }

    if (data.lastName.length < 2) {
        showError('lastName', 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร');
        isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showError('email', 'รูปแบบอีเมลไม่ถูกต้อง');
        isValid = false;
    }

    if (!/^[0-9]{10}$/.test(data.phone)) {
        showError('phone', 'เบอร์โทรศัพท์ต้องมี 10 หลัก');
        isValid = false;
    }

    if (data.password.length < 8) {
        showError('password', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
        isValid = false;
    }

    if (data.password !== data.confirmPassword) {
        showError('confirmPassword', 'รหัสผ่านไม่ตรงกัน');
        isValid = false;
    }

    if (!data.role) {
        showError('role', 'กรุณาเลือกประเภทผู้ใช้');
        isValid = false;
    }

    return isValid;
}

document.addEventListener('DOMContentLoaded', () => {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = 'กำลังดำเนินการ...';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            if (!validateForm(data)) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'ลงทะเบียน';
                return;
            }

            const result = await registerUser({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role
            });

            showAlert('ลงทะเบียนสำเร็จ', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            showAlert(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = 'ลงทะเบียน';
        }
    });

    document.getElementById('phone').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
});

// Get form element
const form = document.getElementById('registerForm');

// Add submit event listener
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Add your form validation logic here if needed
    
    // Redirect to login page
    window.location.href = 'login.html';
});