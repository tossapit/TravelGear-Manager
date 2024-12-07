// กำหนดข้อมูลผู้ใช้แบบตายตัว
const USERS = [
    {
        email: 'manager@example.com',
        password: 'manager123',
        role: 'manager',
        firstName: 'Manager',
        lastName: 'User'
    },
    {
        email: 'staff@example.com',
        password: 'staff123',
        role: 'staff',
        firstName: 'Staff',
        lastName: 'User'
    }
];

// DOM Elements
const loginForm = document.getElementById('loginForm');
const submitButton = document.getElementById('submitButton');
const alert = document.getElementById('alert');
const alertMessage = document.getElementById('alertMessage');

function showAlert(message, type) {
    alert.className = type === 'success' 
        ? 'rounded-md bg-green-50 p-4 border border-green-400'
        : 'rounded-md bg-red-50 p-4 border border-red-400';
    alertMessage.className = type === 'success' ? 'text-sm text-green-800' : 'text-sm text-red-800';
    alertMessage.textContent = message;
    alert.classList.remove('hidden');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLoginForm(email, password) {
    if (!validateEmail(email)) {
        showAlert('รูปแบบอีเมลไม่ถูกต้อง', 'error');
        return false;
    }

    if (password.length < 6) {
        showAlert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
        return false;
    }

    return true;
}

function attemptLogin(email, password) {
    const user = USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
        return {
            success: true,
            user: {
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
    }
    
    return { success: false };
}

document.addEventListener('DOMContentLoaded', () => {
    // Check for remembered login
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';

        if (!validateLoginForm(email, password)) {
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = 'กำลังดำเนินการ...';
            
            const result = attemptLogin(email, password);

            if (result.success) {
                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Store user info
                localStorage.setItem('user', JSON.stringify(result.user));

                showAlert('เข้าสู่ระบบสำเร็จ', 'success');
                
                // Redirect to Inventory Dashboard
                setTimeout(() => {
                    window.location.href = 'Inventory_Dashboard/Inventory_Dashboard.html';
                }, 1000);
            } else {
                showAlert('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
            }
        } catch (error) {
            showAlert('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'เข้าสู่ระบบ';
        }
    });
});