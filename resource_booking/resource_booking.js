const API_URL = "http://localhost:5000/api";
let bookings = [];
let editingId = null;
let calendar;

// ฟังก์ชันดึงข้อมูลการจองทั้งหมด
async function fetchBookings() {
  try {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลการจองได้");
    }
    bookings = await response.json();
    renderBookingTable();
    updateResourceStatus();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    showAlert("ไม่สามารถดึงข้อมูลการจองได้", "error");
  }
}

// ฟังก์ชันแสดงตารางการจอง
function renderBookingTable(data = bookings) {
  const tableBody = document.getElementById("bookingTable");
  if (!tableBody) return;

  tableBody.innerHTML = data
    .map(
      (booking) => `
        <tr data-id="${
          booking._id
        }" class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-150">
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="font-medium text-white">${
                      booking.resourceName
                    }</span>
                    <span class="text-sm text-gray-400">${getResourceTypeText(
                      booking.type
                    )}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="px-2 py-1 rounded text-sm inline-flex items-center w-fit ${getStatusColor(
                      booking.status
                    )}">
                        ${getStatusText(booking.status)}
                    </span>
                    <span class="text-sm text-gray-400 mt-1">${formatDateTime(
                      booking.start
                    )} - ${formatDateTime(booking.end)}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-3">
                    <button onclick="editBooking('${booking._id}')"
                            class="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                        แก้ไข
                    </button>
                    <button onclick="deleteBooking('${booking._id}')"
                            class="text-red-400 hover:text-red-300 transition-colors duration-200">
                        ยกเลิก
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

// ฟังก์ชันอัพเดทสถานะทรัพยากร
function updateResourceStatus() {
  const counts = {
    available: bookings.filter((b) => b.status === "available").length,
    scheduled: bookings.filter((b) => b.status === "scheduled").length,
    inUse: bookings.filter((b) => b.status === "in-use").length,
  };

  document.getElementById(
    "availableCount"
  ).textContent = `${counts.available} รายการ`;
  document.getElementById(
    "scheduledCount"
  ).textContent = `${counts.scheduled} รายการ`;
  document.getElementById("inUseCount").textContent = `${counts.inUse} รายการ`;
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
    scheduled: "มีการจองแล้ว",
    "in-use": "กำลังใช้งาน",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };
  return statuses[status] || status;
}

function getStatusColor(status) {
  const colors = {
    available: "bg-green-900/50 text-green-300 border border-green-500/30",
    scheduled: "bg-yellow-900/50 text-yellow-300 border border-yellow-500/30",
    "in-use": "bg-blue-900/50 text-blue-300 border border-blue-500/30",
    completed:
      "bg-emerald-900/50 text-emerald-300 border border-emerald-500/30",
    cancelled: "bg-red-900/50 text-red-300 border border-red-500/30",
  };
  return (
    colors[status] || "bg-gray-900/50 text-gray-300 border border-gray-500/30"
  );
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
async function handleSubmit(event) {
  event.preventDefault();

  if (!validateBookingForm()) {
    return;
  }

  try {
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
      notes: document.getElementById("notes").value,
      userId: localStorage.getItem("userId") || "anonymous",
    };

    const url = editingId
      ? `${API_URL}/bookings/${editingId}`
      : `${API_URL}/bookings`;

    const response = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถบันทึกการจองได้");
    }

    // รีเฟรชข้อมูลและอัปเดต UI
    await fetchBookings();
    renderBookingTable();
    updateResourceStatus();
    updateCalendar();

    closeModal();
    showAlert(
      editingId ? "อัปเดตการจองสำเร็จ" : "บันทึกการจองสำเร็จ",
      "success"
    );
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function editBooking(id) {
  try {
    const booking = bookings.find((b) => b._id === id);
    if (!booking) throw new Error("ไม่พบข้อมูลการจอง");

    editingId = id;

    document.getElementById("resourceSelect").value = booking.resourceId;
    document.getElementById("startDate").value = formatDateTimeForInput(
      booking.start
    );
    document.getElementById("endDate").value = formatDateTimeForInput(
      booking.end
    );
    document.getElementById("notes").value = booking.notes || "";

    openModal();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function formatDateTimeForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

async function deleteBooking(id) {
  if (confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?")) {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถยกเลิกการจองได้");
      }

      // ลบรายการนั้นออกจาก bookings array
      bookings = bookings.filter((booking) => booking._id !== id);

      // อัปเดตการแสดงผล
      renderBookingTable();
      updateResourceStatus();
      updateCalendar();

      showAlert("ยกเลิกการจองสำเร็จ", "success");
    } catch (error) {
      showAlert(error.message, "error");
    }
  }
}

// ฟังก์ชันอัปเดตปฏิทิน
function updateCalendar(data = bookings) {
  if (typeof FullCalendar === "undefined") {
    console.warn("FullCalendar is not loaded");
    return;
  }

  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(
      data.map((booking) => ({
        id: booking._id,
        title: `${booking.resourceName} (${getStatusText(booking.status)})`,
        start: booking.start,
        end: booking.end,
        backgroundColor: getEventColor(booking.status),
        borderColor: getBorderColor(booking.status),
        textColor: "white",
      }))
    );
  }
}

// ฟังก์ชันแสดง Alert
function showAlert(message, type) {
  const alertBox = document.createElement("div");
  alertBox.className = `fixed top-4 right-4 p-4 rounded-lg ${
    type === "success"
      ? "bg-green-900 text-green-300 border border-green-500"
      : "bg-red-900 text-red-300 border border-red-500"
  } z-50`;
  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.remove();
  }, 3000);
}

// ฟังก์ชันตรวจสอบการซ้อนทับของการจอง
function checkBookingOverlap(startDate, endDate, resourceId, excludeId = null) {
  return bookings.some((booking) => {
    if (booking._id == excludeId || booking.resourceId !== resourceId) {
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
    showAlert("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return false;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    showAlert("วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น", "error");
    return false;
  }

  const hasOverlap = checkBookingOverlap(
    startDate,
    endDate,
    resourceId,
    editingId
  );
  if (hasOverlap) {
    showAlert("มีการจองที่ซ้อนทับกับช่วงเวลานี้", "error");
    return false;
  }

  return true;
}

// ฟังก์ชันสีสำหรับปฏิทิน
function getEventColor(status) {
  const colors = {
    available: "#059669", // Green
    scheduled: "#9333EA", // Purple
    "in-use": "#2563EB", // Blue
    completed: "#16A34A", // Emerald
    cancelled: "#DC2626", // Red
  };
  return colors[status] || "#9333EA";
}

function getBorderColor(status) {
  const colors = {
    available: "#10B981",
    scheduled: "#A855F7",
    "in-use": "#3B82F6",
    completed: "#22C55E",
    cancelled: "#EF4444",
  };
  return colors[status] || "#A855F7";
}

// ฟังก์ชันรีเซ็ตฟิลเตอร์
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("typeFilter").value = "";
  document.getElementById("statusFilter").value = "";
  filterBookings();
  showAlert("รีเซ็ตตัวกรองแล้ว", "success");
}

async function handleEventDrop(info) {
  try {
    const response = await fetch(`${API_URL}/bookings/${info.event.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: info.event.startStr,
        end: info.event.endStr,
      }),
    });

    if (!response.ok) {
      info.revert();
      const error = await response.json();
      throw new Error(error.message || "ไม่สามารถอัพเดทการจองได้");
    }

    await fetchBookings();
    showAlert("อัพเดทการจองสำเร็จ", "success");
  } catch (error) {
    info.revert();
    showAlert(error.message, "error");
  }
}

// การตั้งค่าเริ่มต้น
document.addEventListener("DOMContentLoaded", async function () {
  await fetchBookings();

  // ตั้งค่าปฏิทิน
  const calendarEl = document.getElementById("calendar");
  if (calendarEl && typeof FullCalendar !== "undefined") {
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
        id: booking._id,
        title: `${booking.resourceName} (${getStatusText(booking.status)})`,
        start: booking.start,
        end: booking.end,
        backgroundColor: getEventColor(booking.status),
        borderColor: getBorderColor(booking.status),
        textColor: "white",
      })),
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
      select: function (info) {
        document.getElementById("startDate").value = info.startStr;
        document.getElementById("endDate").value = info.endStr;
        openModal();
      },
      eventClick: function (info) {
        editBooking(info.event.id);
      },
      eventDrop: async function (info) {
        try {
          const booking = bookings.find((b) => b._id == info.event.id);
          if (!booking) {
            info.revert();
            throw new Error("ไม่พบข้อมูลการจอง");
          }

          const updatedBooking = {
            ...booking,
            start: info.event.startStr,
            end: info.event.endStr,
          };

          // ตรวจสอบการซ้อนทับ
          const hasOverlap = checkBookingOverlap(
            updatedBooking.start,
            updatedBooking.end,
            updatedBooking.resourceId,
            updatedBooking._id
          );

          if (hasOverlap) {
            info.revert();
            showAlert("มีการจองที่ซ้อนทับกับช่วงเวลานี้", "error");
            return;
          }

          // อัพเดทข้อมูล
          bookings = bookings.map((b) =>
            b._id == updatedBooking._id ? updatedBooking : b
          );

          renderBookingTable();
          updateCalendar();
          updateResourceStatus();
          showAlert("อัพเดทการจองสำเร็จ", "success");
        } catch (error) {
          info.revert();
          showAlert(error.message, "error");
        }
      },
      // ตั้งค่าสีและสไตล์
      eventDidMount: function (info) {
        info.el.style.borderWidth = "2px";
        info.el.style.borderRadius = "6px";

        // เพิ่ม tooltip
        const tooltip = document.createElement("div");
        tooltip.className =
          "calendar-tooltip bg-gray-900 text-white p-2 rounded shadow-lg border border-gray-700 text-sm";
        tooltip.innerHTML = `
                  <p class="font-medium">${info.event.title}</p>
                  <p class="text-gray-300">เริ่ม: ${formatDateTime(
                    info.event.start
                  )}</p>
                  <p class="text-gray-300">สิ้นสุด: ${formatDateTime(
                    info.event.end
                  )}</p>
              `;

        info.el.addEventListener("mouseover", function () {
          document.body.appendChild(tooltip);
          const rect = info.el.getBoundingClientRect();
          tooltip.style.position = "fixed";
          tooltip.style.top = rect.bottom + 5 + "px";
          tooltip.style.left = rect.left + "px";
          tooltip.style.zIndex = 1000;
        });

        info.el.addEventListener("mouseout", function () {
          if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
          }
        });
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
