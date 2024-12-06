// ข้อมูลจำลอง
let bookings = [
  {
    id: 1,
    resourceId: "vehicle1",
    resourceName: "รถตู้ 1",
    type: "vehicle",
    start: "2024-12-08T09:00:00",
    end: "2024-12-09T17:00:00",
    status: "scheduled",
    notes: "ทริปเดินทางภูเก็ต",
  },
  {
    id: 2,
    resourceId: "equipment1",
    resourceName: "อุปกรณ์ A",
    type: "equipment",
    start: "2024-12-10T10:00:00",
    end: "2024-12-11T16:00:00",
    status: "in-use",
    notes: "ใช้สำหรับกิจกรรมดำน้ำ",
  },
];

let editingId = null;

// ฟังก์ชันแสดงตารางการจอง
function renderBookingTable(data = bookings) {
  const tableBody = document.getElementById("bookingTable");
  tableBody.innerHTML = data
    .map(
      (booking) => `
        <tr>
            <td class="px-6 py-4">${booking.resourceName}</td>
            <td class="px-6 py-4">${getResourceTypeText(booking.type)}</td>
            <td class="px-6 py-4">${formatDateTime(booking.start)}</td>
            <td class="px-6 py-4">${formatDateTime(booking.end)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(
                  booking.status
                )}">
                    ${getStatusText(booking.status)}
                </span>
            </td>
            <td class="px-6 py-4">
                <button onclick="editBooking(${
                  booking.id
                })" class="text-blue-600 hover:text-blue-800 mr-2">
                    แก้ไข
                </button>
                <button onclick="deleteBooking(${
                  booking.id
                })" class="text-red-600 hover:text-red-800">
                    ยกเลิก
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

// ฟังก์ชันกรองข้อมูล
function filterBookings() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const typeFilter = document.getElementById("typeFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const filteredData = bookings.filter((booking) => {
    const matchesSearch = booking.resourceName
      .toLowerCase()
      .includes(searchTerm);
    const matchesType = !typeFilter || booking.type === typeFilter;
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  renderBookingTable(filteredData);
  updateCalendar(filteredData);
}

// ฟังก์ชันช่วยจัดการการแสดงผล
function getResourceTypeText(type) {
  const types = {
    vehicle: "ยานพาหนะ",
    equipment: "อุปกรณ์",
    staff: "พนักงาน",
  };
  return types[type] || type;
}

function getStatusText(status) {
  const statuses = {
    available: "พร้อมใช้งาน",
    "in-use": "กำลังใช้งาน",
    scheduled: "มีการจองแล้ว",
  };
  return statuses[status] || status;
}

function getStatusColor(status) {
  const colors = {
    available: "bg-green-100 text-green-800",
    "in-use": "bg-red-100 text-red-800",
    scheduled: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "";
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ฟังก์ชันจัดการ Modal
function openModal() {
  document.getElementById("bookingModal").classList.remove("hidden");
  document.getElementById("modalTitle").textContent = editingId
    ? "แก้ไขการจอง"
    : "จองทรัพยากร";
}

function closeModal() {
  document.getElementById("bookingModal").classList.add("hidden");
  document.getElementById("bookingForm").reset();
  editingId = null;
}

// ฟังก์ชัน CRUD
function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    resourceId: document.getElementById("resourceSelect").value,
    resourceName:
      document.getElementById("resourceSelect").options[
        document.getElementById("resourceSelect").selectedIndex
      ].text,
    type: document.getElementById("resourceSelect").value.includes("vehicle")
      ? "vehicle"
      : document.getElementById("resourceSelect").value.includes("equipment")
      ? "equipment"
      : "staff",
    start: document.getElementById("startDate").value,
    end: document.getElementById("endDate").value,
    status: "scheduled",
    notes: document.getElementById("notes").value,
  };

  if (editingId) {
    // อัปเดตการจองที่มีอยู่
    bookings = bookings.map((booking) =>
      booking.id === editingId ? { ...booking, ...formData } : booking
    );
  } else {
    // เพิ่มการจองใหม่
    formData.id = bookings.length + 1;
    bookings.push(formData);
  }

  renderBookingTable();
  updateCalendar();
  closeModal();
}

function editBooking(id) {
  const booking = bookings.find((booking) => booking.id === id);
  if (booking) {
    editingId = id;
    document.getElementById("resourceSelect").value = booking.resourceId;
    document.getElementById("startDate").value = booking.start.slice(0, 16);
    document.getElementById("endDate").value = booking.end.slice(0, 16);
    document.getElementById("notes").value = booking.notes;
    openModal();
  }
}

function deleteBooking(id) {
  if (confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?")) {
    bookings = bookings.filter((booking) => booking.id !== id);
    renderBookingTable();
    updateCalendar();
  }
}

// ฟังก์ชันอัปเดตปฏิทิน
function updateCalendar(data = bookings) {
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(data);
  }
}

// การตั้งค่าเริ่มต้น
let calendar;
document.addEventListener("DOMContentLoaded", function () {
  renderBookingTable();

  // ตั้งค่าปฏิทิน
  const calendarEl = document.getElementById("calendar");
  if (calendarEl) {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "th",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      buttonText: {
        today: "วันนี้",
        month: "เดือน",
        week: "สัปดาห์",
        day: "วัน",
      },
      events: bookings.map((booking) => ({
        id: booking.id.toString(),
        title: booking.resourceName,
        start: booking.start,
        end: booking.end,
        backgroundColor:
          booking.status === "scheduled"
            ? "#FCD34D"
            : booking.status === "in-use"
            ? "#F87171"
            : "#34D399",
      })),
      editable: true,
      selectable: true,
      select: function (info) {
        // เมื่อผู้ใช้เลือกวันในปฏิทิน
        document.getElementById("startDate").value = info.startStr;
        document.getElementById("endDate").value = info.endStr;
        openModal();
      },
      eventClick: function (info) {
        // เมื่อผู้ใช้คลิกที่การจองในปฏิทิน
        const bookingId = parseInt(info.event.id);
        editBooking(bookingId);
      },
      eventDrop: function (info) {
        // เมื่อผู้ใช้ลากและวางการจอง
        const bookingId = parseInt(info.event.id);
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          booking.start = info.event.startStr;
          booking.end = info.event.endStr;
          renderBookingTable();
        }
      },
    });
    calendar.render();
  }

  // จัดการการส่งฟอร์ม
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", handleSubmit);
  }

  // จัดการตัวกรอง
  const filters = ["searchInput", "typeFilter", "statusFilter"];
  filters.forEach((filterId) => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener("change", filterBookings);
      if (filterId === "searchInput") {
        element.addEventListener("keyup", filterBookings);
      }
    }
  });
});

// ฟังก์ชันตรวจสอบการซ้อนทับของการจอง
function checkBookingOverlap(startDate, endDate, resourceId, excludeId = null) {
  return bookings.some((booking) => {
    if (booking.id === excludeId || booking.resourceId !== resourceId) {
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);

    return start < bookingEnd && end > bookingStart;
  });
}

// ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
function validateBookingForm() {
  const resourceId = document.getElementById("resourceSelect").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!resourceId || !startDate || !endDate) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return false;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    alert("วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น");
    return false;
  }

  if (checkBookingOverlap(startDate, endDate, resourceId, editingId)) {
    alert("มีการจองที่ซ้อนทับกับช่วงเวลานี้");
    return false;
  }

  return true;
}

// เพิ่มการตรวจสอบฟอร์มก่อนการบันทึก
const originalHandleSubmit = handleSubmit;
handleSubmit = function (event) {
  event.preventDefault();
  if (validateBookingForm()) {
    originalHandleSubmit(event);
  }
};

// ฟังก์ชันรีเซ็ตฟิลเตอร์
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("typeFilter").value = "";
  document.getElementById("statusFilter").value = "";
  filterBookings();
}
