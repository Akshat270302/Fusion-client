import { host } from "../globalRoutes";

export const getNotices = `${host}/hostelmanagement/notices/`;
export const getStudentNotices = `${host}/hostelmanagement/student/notices/`;
export const getCaretakers = `${host}/hostelmanagement/get_caretakers/`;
export const getWardens = `${host}/hostelmanagement/get_wardens/`;
export const getBatches = `${host}/hostelmanagement/get_batches/`;
export const createNotice = `${host}/hostelmanagement/notices/`;
export const deleteNotice = `${host}/hostelmanagement/delete_notice/`;
export const viewHostel = `${host}/hostelmanagement/admin-hostel-list`;
export const requestRoom = `${host}/hostelmanagement/book_guest_room/`;
export const requestLeave = `${host}/hostelmanagement/leave/apply/`;
export const addHostelRoute = `${host}/hostelmanagement/add-hostel/`;
export const manageHostelStatusRoute = `${host}/hostelmanagement/hostel-status/manage/`;
export const assignCaretakers = `${host}/hostelmanagement/assign_caretakers/`;
export const assignWarden = `${host}/hostelmanagement/assign_warden/`;
export const assignBatch = `${host}/hostelmanagement/assign_batch/`;
export const getStudentsInfo = `${host}/hostelmanagement/students_get_students_info/`;
export const request_guest_room = `${host}/hostelmanagement/book_guest_room/`;
export const getStudentsInfo2 = `${host}/hostelmanagement/caretaker_get_students_info/`;
export const searchStudents = `${host}/hostelmanagement/students/search/`;
export const getStudentById = (studentId) =>
  `${host}/hostelmanagement/students/${studentId}/`;
export const assignRoom = `${host}/hostelmanagement/rooms/assign/`;
export const myRoom = `${host}/hostelmanagement/rooms/my-room/`;
export const studentGroupCreate = `${host}/hostelmanagement/student/group/`;
export const roomChangeSubmit = `${host}/hostelmanagement/room-change/requests/submit/`;
export const roomChangeMyRequests = `${host}/hostelmanagement/room-change/requests/my/`;
export const roomChangeReviewRequests = `${host}/hostelmanagement/room-change/requests/review/`;
export const roomChangeCaretakerDecision = (requestId) =>
  `${host}/hostelmanagement/room-change/requests/${requestId}/caretaker-decision/`;
export const roomChangeWardenDecision = (requestId) =>
  `${host}/hostelmanagement/room-change/requests/${requestId}/warden-decision/`;
export const roomChangeAllocate = (requestId) =>
  `${host}/hostelmanagement/room-change/requests/${requestId}/allocate/`;
export const extendedStaySubmit = `${host}/hostelmanagement/extended-stay/requests/submit/`;
export const extendedStayMyRequests = `${host}/hostelmanagement/extended-stay/requests/my/`;
export const extendedStayModify = (requestId) =>
  `${host}/hostelmanagement/extended-stay/requests/${requestId}/modify/`;
export const extendedStayCancel = (requestId) =>
  `${host}/hostelmanagement/extended-stay/requests/${requestId}/cancel/`;
export const extendedStayReviewRequests = `${host}/hostelmanagement/extended-stay/requests/review/`;
export const extendedStayCaretakerDecision = (requestId) =>
  `${host}/hostelmanagement/extended-stay/requests/${requestId}/caretaker-decision/`;
export const extendedStayWardenDecision = (requestId) =>
  `${host}/hostelmanagement/extended-stay/requests/${requestId}/warden-decision/`;
export const roomVacationChecklistGenerate = `${host}/hostelmanagement/room-vacation/checklist/generate/`;
export const roomVacationSubmit = `${host}/hostelmanagement/room-vacation/requests/submit/`;
export const roomVacationMyRequests = `${host}/hostelmanagement/room-vacation/requests/my/`;
export const roomVacationClearanceRequests = `${host}/hostelmanagement/room-vacation/requests/clearance/`;
export const roomVacationCaretakerVerify = (requestId) =>
  `${host}/hostelmanagement/room-vacation/requests/${requestId}/clearance/verify/`;
export const roomVacationFinalizationRequests = `${host}/hostelmanagement/room-vacation/requests/finalization/`;
export const roomVacationFinalize = (requestId) =>
  `${host}/hostelmanagement/room-vacation/requests/${requestId}/finalize/`;
export const hostelReportGenerate = `${host}/hostelmanagement/reports/generate/`;
export const hostelReportMy = `${host}/hostelmanagement/reports/my/`;
export const hostelReportTemplates = `${host}/hostelmanagement/reports/templates/`;
export const hostelReportSubmit = (reportId) =>
  `${host}/hostelmanagement/reports/${reportId}/submit/`;
export const hostelReportSubmitted = `${host}/hostelmanagement/reports/submitted/`;
export const hostelReportDetail = (reportId) =>
  `${host}/hostelmanagement/reports/${reportId}/`;
export const hostelReportReview = (reportId) =>
  `${host}/hostelmanagement/reports/${reportId}/review/`;
export const hostelReportDownload = (reportId, format = "pdf") =>
  `${host}/hostelmanagement/reports/${reportId}/download/?format=${format}`;
export const inventoryDashboard = `${host}/hostelmanagement/inventory/dashboard/`;
export const inventoryInspectionSubmit = `${host}/hostelmanagement/inventory/inspections/submit/`;
export const inventoryInspections = `${host}/hostelmanagement/inventory/inspections/`;
export const inventoryResourceRequestSubmit = `${host}/hostelmanagement/inventory/resource-requests/submit/`;
export const inventoryResourceRequests = `${host}/hostelmanagement/inventory/resource-requests/`;
export const inventoryResourceRequestReview = (requestId) =>
  `${host}/hostelmanagement/inventory/resource-requests/${requestId}/review/`;
export const inventoryItemUpdate = (inventoryId) =>
  `${host}/hostelmanagement/inventory/items/${inventoryId}/update/`;
export const inventoryUpdateLogs = `${host}/hostelmanagement/inventory/update-logs/`;
export const imposeFineRoute = `${host}/hostelmanagement/fines/impose/`;
export const show_leave_request = `${host}/hostelmanagement/leave/pending/`;
export const update_leave_status = `${host}/hostelmanagement/leave/update-status/`;
export const fetch_fines_url = `${host}/hostelmanagement/fines/hostel/`;
export const update_fine_status_url = (fine_id) =>
  `${host}/hostelmanagement/update-fine-status/${fine_id}/`;
export const fetch_complaint = `${host}/hostelmanagement/hostel_complaints/`;
export const fine_show = `${host}/hostelmanagement/fines/my-fines/`;
export const my_leaves = `${host}/hostelmanagement/leave/my-requests/`;
export const show_guestroom_booking_request = `${host}/hostelmanagement/fetching_guest_room_request/`;
export const update_guest_room = `${host}/hostelmanagement/update_guest_room/`;
export const get_intender_id = `${host}/hostelmanagement/get_intender_id/`;
export const get_guestroom_bookings_for_students = `${host}/hostelmanagement/get_guest_room_request_students/`;
export const guestRoomAvailability = `${host}/hostelmanagement/guest-room/availability/`;
export const guestRoomBookingRequest = `${host}/hostelmanagement/guest-room/bookings/request/`;
export const guestRoomMyBookings = `${host}/hostelmanagement/guest-room/bookings/my/`;
export const guestRoomBookingDetail = (bookingId) =>
  `${host}/hostelmanagement/guest-room/bookings/${bookingId}/`;
export const guestRoomBookingModify = (bookingId) =>
  `${host}/hostelmanagement/guest-room/bookings/${bookingId}/modify/`;
export const guestRoomBookingCancel = (bookingId) =>
  `${host}/hostelmanagement/guest-room/bookings/${bookingId}/cancel/`;
export const guestRoomCaretakerPending = `${host}/hostelmanagement/guest-room/caretaker/pending/`;
export const guestRoomCaretakerDecision = (bookingId) =>
  `${host}/hostelmanagement/guest-room/caretaker/${bookingId}/decision/`;
export const guestRoomCaretakerCheckIn = (bookingId) =>
  `${host}/hostelmanagement/guest-room/caretaker/${bookingId}/check-in/`;
export const guestRoomCaretakerCheckOut = (bookingId) =>
  `${host}/hostelmanagement/guest-room/caretaker/${bookingId}/check-out/`;
export const guestRoomCaretakerSettings = `${host}/hostelmanagement/guest-room/caretaker/settings/`;
export const guestRoomCaretakerReport = `${host}/hostelmanagement/guest-room/caretaker/report/`;
export const upload_attendance = `${host}/hostelmanagement/upload_attendance/`;
export const view_attendance = `${host}/hostelmanagement/view_attendance/`;
export const attendance_students = `${host}/hostelmanagement/attendance/students/`;
export const attendance_submit = `${host}/hostelmanagement/attendance/submit/`;
export const attendance_my_attendance = `${host}/hostelmanagement/attendance/my-attendance/`;
export const assign_batch = `${host}/hostelmanagement/batch-assign/`;
export const hostelWorkflowDashboard = `${host}/hostelmanagement/workflow/dashboard/`;
export const hostelWorkflowEligibleStudents = (hallId, source = "batch") =>
  `${host}/hostelmanagement/workflow/${hallId}/eligible-students/?source=${source}`;
export const hostelWorkflowBulkAllot = (hallId) =>
  `${host}/hostelmanagement/workflow/${hallId}/bulk-allot/`;
export const download_hostel_allotment = `${host}/hostelmanagement/download_hostel_allotment/`;
export const assign_roomsbywarden = `${host}/hostelmanagement/assign-roomsbywarden/`;
export const update_student_allotment = `${host}/hostelmanagement/update-student-allotment/`;
export const submit_complaint = `${host}/hostelmanagement/complaints/submit/`;
export const get_student_complaints = `${host}/hostelmanagement/complaints/my/`;
export const get_hostel_complaints = `${host}/hostelmanagement/complaints/hostel/`;
export const update_complaint_status = `${host}/hostelmanagement/complaints/update-status/`;
export const escalate_complaint = `${host}/hostelmanagement/complaints/escalate/`;
// Warden complaint management routes
export const get_escalated_complaints = `${host}/hostelmanagement/complaints/warden/escalated/`;
export const get_all_complaints_for_warden = `${host}/hostelmanagement/complaints/warden/all/`;
export const resolve_complaint = `${host}/hostelmanagement/complaints/warden/resolve/`;
export const reassign_complaint = `${host}/hostelmanagement/complaints/warden/reassign/`;
