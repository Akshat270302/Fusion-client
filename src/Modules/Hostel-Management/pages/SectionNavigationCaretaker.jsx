import React from "react";
import EnhancedSectionNavigation from "./EnhancedSectionNavigation";
import ManageLeaveRequest from "./caretaker/ManageLeaverequest";
import NoticeBoardWardenCaretaker from "./all-actors/NoticeBoardWardenCaretaker";
import ImposeFine from "./caretaker/ImposeFine";
import ManageFine from "./caretaker/ManageFine";
import StudentInfo from "./caretaker/StudentInfo";
import UploadAttendance from "./caretaker/UploadAttendance";
import ManageGuestRoomBookings from "./caretaker/ManageGuestRoomBookings";
import RoomChangeRequests from "./caretaker/RoomChangeRequests";
import ManageComplaints from "../components/caretaker/ManageComplaints";
import InventoryManagement from "./caretaker/InventoryManagement";

const sections = [
  "Notice Board",
  "Manage Leave Request",
  "Fine",
  "Student Allotment",
  "Upload Attendance",
  "Guest Room Management",
  "Room Change Requests",
  "Inventory Management",
  "Manage Complaints",
];

const subSections = {
  Fine: ["Impose Fines", "Manage Imposed Fines"],
};

const components = {
  "Notice Board": NoticeBoardWardenCaretaker,
  "Manage Leave Request": ManageLeaveRequest,
  "Fine_Impose Fines": ImposeFine,
  "Fine_Manage Imposed Fines": ManageFine,
  "Student Allotment": StudentInfo,
  "Upload Attendance": UploadAttendance,
  "Guest Room Management": ManageGuestRoomBookings,
  "Room Change Requests": RoomChangeRequests,
  "Inventory Management": InventoryManagement,
  "Manage Complaints": ManageComplaints,
};

export default function SectionNavigationCaretaker() {
  return (
    <EnhancedSectionNavigation
      sections={sections}
      subSections={subSections}
      components={components}
      defaultSection="Notice Board"
      userrole="caretaker"
    />
  );
}
