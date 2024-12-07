// register.js

// DOM Elements
const registerForm = document.getElementById('registerForm');
const submitButton = document.getElementById('submitButton');
const alert = document.getElementById('alert');
const alertMessage = document.getElementById('alertMessage');

// Error Elements Map
const errorElements = {
    firstName: document.getElementById('firstNameError'),
    lastName: document.getElementById('lastNameError'),
    email: document.getElementById('emailError'),
    phone: document.getElementById('phoneError'),
    password: document.getElementById('passwordError'),
    confirmPassword: document.getElementById('confirmPasswordError'),
    role: document.getElementById('roleError')
};

// Validation Functions
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function validateForm(data) {
    let isValid = true;
    const errors = {};

    // ตรวจสอบชื่อ
    if (data.firstName.length < 2) {
        errors.firstName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
        isValid = false;
    }

    // ตรวจสอบนามสกุล
    if (data.lastName.length < 2) {
        errors.lastName = 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
        isValid = false;
    }

    // ตรวจสอบอีเมล
    if (!validateEmail(data.email)) {
        errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        isValid = false;
    }

    // ตรวจสอบเบอร์โทร
    if (!validatePhone(data.phone)) {
        errors.phone = 'เบอร์โทรศัพท์ต้องมี 10 หลัก';
        isValid = false;
    }

    // ตรวจสอบรหัสผ่าน
    if (data.password.length < 8) {
        errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
        isValid = false;
    }

    // ตรวจสอบการยืนยันรหัสผ่าน
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
        isValid = false;
    }

    // ตรวจสอบประเภทผู้ใช้
    if (!data.role) {
        errors.role = 'กรุณาเลือกประเภทผู้ใช้';
        isValid = false;
    }

    return { isValid, errors };
}

// UI Functions
function showAlert(message, type) {
    alert.className = type === 'success' 
        ? 'rounded-md bg-green-50 p-4 border border-green-400'
        : 'rounded-md bg-red-50 p-4 border border-red-400';
    alertMessage.className = type === 'success' ? 'text-sm text-green-800' : 'text-sm text-red-800';
    alertMessage.textContent = message;
    alert.classList.remove('hidden');
}

function hideAlert() {
    alert.classList.add('hidden');
}

function showErrors(errors) {
    // ซ่อน error เดิมทั้งหมด
    Object.values(errorElements).forEach(element => {
        if (element) element.classList.add('hidden');
    });

    // แสดง error ใหม่
    Object.entries(errors).forEach(([field, message]) => {
        const errorElement = errorElements[field];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    });
}

function clearErrors() {
    Object.values(errorElements).forEach(element => {
        if (element) element.classList.add('hidden');
    });
}

// API Function
async function registerUser(userData) {
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Form Submit Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    try {
        // แสดง loading state
        submitButton.disabled = true;
        submitButton.innerHTML = 'กำลังดำเนินการ...';

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        console.log('Form data:', data);

        // Validate
        const { isValid, errors } = validateForm(data);
        if (!isValid) {
            console.log('Validation errors:', errors);
            showErrors(errors);
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

        console.log('Registration successful:', result);
        showAlert('ลงทะเบียนสำเร็จ', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Form submission error:', error);
        showAlert(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'ลงทะเบียน';
    }
});

// Real-time validations
document.getElementById('password').addEventListener('input', function() {
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword.value && this.value !== confirmPassword.value) {
        errorElements.confirmPassword.textContent = 'รหัสผ่านไม่ตรงกัน';
        errorElements.confirmPassword.classList.remove('hidden');
    } else {
        errorElements.confirmPassword.classList.add('hidden');
    }
});

document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password');
    if (this.value && this.value !== password.value) {
        errorElements.confirmPassword.textContent = 'รหัสผ่านไม่ตรงกัน';
        errorElements.confirmPassword.classList.remove('hidden');
    } else {
        errorElements.confirmPassword.classList.add('hidden');
    }
});

// Phone number formatting
document.getElementById('phone').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
});
