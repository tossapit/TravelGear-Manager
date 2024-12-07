const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '.env.auth' });

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI_AUTH, {
    serverSelectionTimeoutMS: 30000,
    wtimeoutMS: 2500
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'กรุณากรอกชื่อ'],
        trim: true,
        minlength: [2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร']
    },
    lastName: {
        type: String,
        required: [true, 'กรุณากรอกนามสกุล'],
        trim: true,
        minlength: [2, 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร']
    },
    email: {
        type: String,
        required: [true, 'กรุณากรอกอีเมล'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            message: 'รูปแบบอีเมลไม่ถูกต้อง'
        }
    },
    password: {
        type: String,
        required: [true, 'กรุณากรอกรหัสผ่าน'],
        minlength: [8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร']
    },
    phone: {
        type: String,
        required: [true, 'กรุณากรอกเบอร์โทรศัพท์'],
        trim: true,
        validate: {
            validator: (phone) => /^[0-9]{10}$/.test(phone),
            message: 'เบอร์โทรศัพท์ต้องมี 10 หลัก'
        }
    },
    role: {
        type: String,
        required: [true, 'กรุณาเลือกประเภทผู้ใช้'],
        enum: {
            values: ['manager', 'staff'],
            message: 'ประเภทผู้ใช้ไม่ถูกต้อง'
        }
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Middleware for error handling
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            success: false,
            message: messages[0],
            errors: messages
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'อีเมลนี้ถูกใช้งานแล้ว'
        });
    }

    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
    });
};

// Routes
app.post('/api/register', async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'อีเมลนี้ถูกใช้งานแล้ว'
            });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            phone,
            role
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'ลงทะเบียนสำเร็จ'
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/users/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

app.put('/api/users/:id', async (req, res, next) => {
    try {
        const { firstName, lastName, phone, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, phone, role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้'
            });
        }

        res.json({
            success: true,
            message: 'อัพเดทข้อมูลสำเร็จ',
            data: user
        });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/users/:id', async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้'
            });
        }
        res.json({
            success: true,
            message: 'ลบข้อมูลผู้ใช้สำเร็จ'
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/users', async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

const PORT = process.env.AUTH_PORT || 5001;
app.listen(PORT, () => {
    console.log(`Auth server is running on port ${PORT}`);
});