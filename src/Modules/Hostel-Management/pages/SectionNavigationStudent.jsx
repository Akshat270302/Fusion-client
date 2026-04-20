import React from "react";
import EnhancedSectionNavigation from "./EnhancedSectionNavigation";
import NoticeBoard from "./all-actors/NoticeBoard";
import LeaveForm from "./students/LeaveForm";
import LeaveStatus from "./students/LeaveStatus";
import Fine from "./students/Fine";
import AllotedRooms from "./students/AllotedRooms";
import GroupFormationRequest from "./students/GroupFormationRequest";
import RoomChangeRequestForm from "./students/RoomChangeRequestForm";
import RoomChangeRequestHistory from "./students/RoomChangeRequestHistory";
import ViewAttendance from "./students/ViewAttendance";
import GuestRoomBookingForm from "./students/GuestRoomBookingForm";
import GuestRoomBookingStatus from "./students/GuestRoomBookingStatus";
import ExtendedStayRequest from "./students/ExtendedStayRequest";
import RoomVacationRequest from "./students/RoomVacationRequest";
import SubmitComplaint from "../components/students/SubmitComplaint";
import ViewMyComplaints from "../components/students/ViewMyComplaints";

const sections = [
  "Notice Board",
  "My Fine",
  "Leave",
  "Guest Room",
  "Extended Stay",
  "Room Vacation",
  "Room Allotment",
  "My Attendance",
  "Complaints",
];

const subSections = {
  Leave: ["Leave Form", "Leave Status"],
  "Guest Room": ["Book Guest Room", "Booking Status"],
  "Extended Stay": ["Apply / Track Request"],
  "Room Vacation": ["Request Vacation"],
  "Room Allotment": [
    "Group Formation",
    "Current Allocation",
    "Room Change Request",
    "Room Change History",
  ],
  Complaints: ["Submit Complaint", "My Complaints"],
};

const components = {
  "Notice Board": NoticeBoard,
  "Leave_Leave Form": LeaveForm,
  "Leave_Leave Status": LeaveStatus,
  "Guest Room_Book Guest Room": GuestRoomBookingForm,
  "Guest Room_Booking Status": GuestRoomBookingStatus,
  "Extended Stay_Apply / Track Request": ExtendedStayRequest,
  "Room Vacation_Request Vacation": RoomVacationRequest,
  "Room Allotment_Group Formation": GroupFormationRequest,
  "Room Allotment_Current Allocation": AllotedRooms,
  "Room Allotment_Room Change Request": RoomChangeRequestForm,
  "Room Allotment_Room Change History": RoomChangeRequestHistory,
  "Room Allotment": AllotedRooms,
  "My Fine": Fine,
  "Extended Stay": ExtendedStayRequest,
  "My Attendance": ViewAttendance,
  "Complaints_Submit Complaint": SubmitComplaint,
  "Complaints_My Complaints": ViewMyComplaints,
};

export default function SectionNavigationStudent() {
  return (
    <EnhancedSectionNavigation
      sections={sections}
      subSections={subSections}
      components={components}
      defaultSection="Notice Board"
      userrole="student"
    />
  );
}
