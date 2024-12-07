const API_URL = 'http://localhost:5000/api';

// DOM Elements
const registerForm = document.getElementById('registerForm'); 
const submitButton = document.getElementById('submitButton');
const alert = document.getElementById('alert');
const alertMessage = document.getElementById('alertMessage');

async function registerUser(userData) {
   try {
       const response = await fetch(`${API_URL}/register`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(userData)
       });

       if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Registration failed');
       }

       const data = await response.json();
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
   const errors = {};

   if (data.firstName.length < 2) {
       errors.firstName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
       isValid = false;
   }

   if (data.lastName.length < 2) {
       errors.lastName = 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร'; 
       isValid = false;
   }

   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
       errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
       isValid = false;
   }

   if (!/^[0-9]{10}$/.test(data.phone)) {
       errors.phone = 'เบอร์โทรศัพท์ต้องมี 10 หลัก';
       isValid = false;
   }

   if (data.password.length < 8) {
       errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
       isValid = false;
   }

   if (data.password !== data.confirmPassword) {
       errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
       isValid = false;
   }

   if (!data.role) {
       errors.role = 'กรุณาเลือกประเภทผู้ใช้';
       isValid = false;
   }

   return { isValid, errors };
}

document.addEventListener('DOMContentLoaded', () => {
   registerForm.addEventListener('submit', async (e) => {
       e.preventDefault();

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
               Object.keys(errors).forEach(field => {
                   const errorElement = document.getElementById(`${field}Error`);
                   if (errorElement) {
                       errorElement.textContent = errors[field];
                       errorElement.classList.remove('hidden');
                   }
               });
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

   // Phone number formatting
   document.getElementById('phone').addEventListener('input', function(e) {
       e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
   });
});