const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI + '/travelgear')
  .then(() => console.log('Connected to MongoDB Atlas - Database: travelgear'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
    name: String,
    type: String,
    totalQuantity: Number,
    minQuantity: Number,
    status: String,
    description: String
}, { collection: 'gear' }); // กำหนดชื่อ collection เป็น 'gear'

const Equipment = mongoose.model('Equipment', equipmentSchema);

// Routes
app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await Equipment.find();
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/equipment', async (req, res) => {
    const equipment = new Equipment(req.body);
    try {
        const newEquipment = await equipment.save();
        res.status(201).json(newEquipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/equipment/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(equipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        await Equipment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));