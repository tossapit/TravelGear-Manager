const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    wtimeoutMS: 2500
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'กรุณากรอกชื่ออุปกรณ์']
    },
    type: {
        type: String,
        required: [true, 'กรุณาเลือกประเภทอุปกรณ์'],
        enum: {
            values: ['อุปกรณ์เดินป่า', 'อุปกรณ์แคมป์ปิ้ง', 'อุปกรณ์ทำอาหาร', 'อุปกรณ์นำทาง', 'อุปกรณ์ความปลอดภัย'],
            message: 'ประเภทอุปกรณ์ไม่ถูกต้อง'
        }
    },
    totalQuantity: {
        type: Number,
        required: [true, 'กรุณากรอกจำนวนทั้งหมด'],
        min: [0, 'จำนวนทั้งหมดต้องไม่ต่ำกว่า 0'],
        validate: {
            validator: Number.isInteger,
            message: 'จำนวนทั้งหมดต้องเป็นจำนวนเต็ม'
        }
    },
    minQuantity: {
        type: Number,
        required: [true, 'กรุณากรอกจำนวนขั้นต่ำ'],
        min: [0, 'จำนวนขั้นต่ำต้องไม่ต่ำกว่า 0'],
        validate: {
            validator: Number.isInteger,
            message: 'จำนวนขั้นต่ำต้องเป็นจำนวนเต็ม'
        }
    },
    status: {
        type: String,
        required: [true, 'กรุณาเลือกสถานะ'],
        enum: {
            values: ['พร้อมใช้', 'ซ่อมบำรุง', 'ไม่พร้อมใช้'],
            message: 'สถานะไม่ถูกต้อง'
        }
    },
    description: String
}, {
    collection: 'gear',
    timestamps: true
});

const Equipment = mongoose.model('Equipment', equipmentSchema, 'gear');


// GET all equipment
app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await Equipment.find();
        res.json(equipment);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET single equipment
app.get('/api/equipment/:id', async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'รูปแบบ ID ไม่ถูกต้อง'
            });
        }

        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบอุปกรณ์'
            });
        }
        res.json(equipment);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST new equipment
app.post('/api/equipment', async (req, res) => {
    try {
        const equipment = new Equipment(req.body);
        const validationError = equipment.validateSync();
        
        if (validationError) {
            const errors = Object.values(validationError.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors: errors
            });
        }

        if (req.body.minQuantity > req.body.totalQuantity) {
            return res.status(400).json({
                success: false,
                message: 'จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด'
            });
        }

        const newEquipment = await equipment.save();
        res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลสำเร็จ',
            data: newEquipment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// UPDATE equipment
app.put('/api/equipment/:id', async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'รูปแบบ ID ไม่ถูกต้อง'
            });
        }

        if (req.body.minQuantity > req.body.totalQuantity) {
            return res.status(400).json({
                success: false,
                message: 'จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด'
            });
        }

        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบอุปกรณ์'
            });
        }

        res.json({
            success: true,
            message: 'อัพเดทข้อมูลสำเร็จ',
            data: equipment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE equipment
app.delete('/api/equipment/:id', async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'รูปแบบ ID ไม่ถูกต้อง'
            });
        }

        const equipment = await Equipment.findByIdAndDelete(req.params.id);
        
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบอุปกรณ์'
            });
        }

        res.json({
            success: true,
            message: 'ลบข้อมูลสำเร็จ'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});