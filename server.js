const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    wtimeoutMS: 2500,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Equipment Schema
const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "กรุณากรอกชื่ออุปกรณ์"],
    },
    type: {
      type: String,
      required: [true, "กรุณาเลือกประเภทอุปกรณ์"],
      enum: {
        values: [
          "อุปกรณ์เดินป่า",
          "อุปกรณ์แคมป์ปิ้ง",
          "อุปกรณ์ทำอาหาร",
          "อุปกรณ์นำทาง",
          "อุปกรณ์ความปลอดภัย",
        ],
        message: "ประเภทอุปกรณ์ไม่ถูกต้อง",
      },
    },
    totalQuantity: {
      type: Number,
      required: [true, "กรุณากรอกจำนวนทั้งหมด"],
      min: [0, "จำนวนทั้งหมดต้องไม่ต่ำกว่า 0"],
      validate: {
        validator: Number.isInteger,
        message: "จำนวนทั้งหมดต้องเป็นจำนวนเต็ม",
      },
    },
    minQuantity: {
      type: Number,
      required: [true, "กรุณากรอกจำนวนขั้นต่ำ"],
      min: [0, "จำนวนขั้นต่ำต้องไม่ต่ำกว่า 0"],
      validate: {
        validator: Number.isInteger,
        message: "จำนวนขั้นต่ำต้องเป็นจำนวนเต็ม",
      },
    },
    status: {
      type: String,
      required: [true, "กรุณาเลือกสถานะ"],
      enum: {
        values: ["พร้อมใช้", "ซ่อมบำรุง", "ไม่พร้อมใช้"],
        message: "สถานะไม่ถูกต้อง",
      },
    },
    description: String,
  },
  {
    collection: "gear",
    timestamps: true,
  }
);

const Equipment = mongoose.model("Equipment", equipmentSchema, "gear");

// Booking Schema
const bookingSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: [true, "กรุณาระบุทรัพยากร"],
    },
    resourceName: {
      type: String,
      required: [true, "กรุณาระบุชื่อทรัพยากร"],
    },
    type: {
      type: String,
      required: [true, "กรุณาระบุประเภททรัพยากร"],
      enum: ["vehicle", "equipment", "staff"],
    },
    start: {
      type: Date,
      required: [true, "กรุณาระบุวันที่เริ่มต้น"],
    },
    end: {
      type: Date,
      required: [true, "กรุณาระบุวันที่สิ้นสุด"],
    },
    status: {
      type: String,
      required: [true, "กรุณาระบุสถานะ"],
      enum: ["scheduled", "in-use", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: String,
    userId: {
      type: String,
      required: [true, "กรุณาระบุผู้จอง"],
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

// Equipment Routes
app.get("/api/equipment", async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/equipment/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบ ID ไม่ถูกต้อง",
      });
    }
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบอุปกรณ์",
      });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/equipment", async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    const validationError = equipment.validateSync();

    if (validationError) {
      const errors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors: errors,
      });
    }

    if (req.body.minQuantity > req.body.totalQuantity) {
      return res.status(400).json({
        success: false,
        message: "จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด",
      });
    }

    const newEquipment = await equipment.save();
    res.status(201).json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
      data: newEquipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

app.put("/api/equipment/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบ ID ไม่ถูกต้อง",
      });
    }

    if (req.body.minQuantity > req.body.totalQuantity) {
      return res.status(400).json({
        success: false,
        message: "จำนวนขั้นต่ำต้องน้อยกว่าหรือเท่ากับจำนวนทั้งหมด",
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
        message: "ไม่พบอุปกรณ์",
      });
    }

    res.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      data: equipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/api/equipment/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบ ID ไม่ถูกต้อง",
      });
    }

    const result = await Equipment.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบอุปกรณ์",
      });
    }

    res.status(200).json({
      success: true,
      message: "ลบข้อมูลสำเร็จ",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Booking Routes
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const overlap = await Booking.findOne({
      resourceId: req.body.resourceId,
      status: { $in: ["scheduled", "in-use"] },
      $or: [
        {
          start: { $lte: new Date(req.body.end) },
          end: { $gte: new Date(req.body.start) },
        },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "ทรัพยากรถูกจองในช่วงเวลานี้แล้ว",
      });
    }

    const booking = new Booking(req.body);
    const newBooking = await booking.save();

    res.status(201).json({
      success: true,
      message: "บันทึกการจองสำเร็จ",
      data: newBooking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

app.put("/api/bookings/:id", async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลการจอง",
      });
    }

    res.json({
      success: true,
      message: "อัปเดตการจองสำเร็จ",
      data: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
      if (!isValidObjectId(req.params.id)) {
          return res.status(400).json({
              success: false,
              message: 'รูปแบบ ID ไม่ถูกต้อง'
          });
      }

      const booking = await Booking.findByIdAndDelete(req.params.id);

      if (!booking) {
          return res.status(404).json({
              success: false,
              message: 'ไม่พบข้อมูลการจอง'
          });
      }

      res.json({
          success: true,
          message: 'ลบการจองสำเร็จ'
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
