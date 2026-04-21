import React from "react";
import EnhancedSectionNavigation from "./EnhancedSectionNavigation";
import NoticeBoardWardenCaretaker from "./all-actors/NoticeBoardWardenCaretaker";
import StudentInfo from "./all-actors/StudentInfo";
import AssignRooms from "./warden/AssignRoom";
import RoomChangeRequests from "./warden/RoomChangeRequests";
import ManageExtendedStayRequests from "./warden/ManageExtendedStayRequests";
import WardenComplaintsView from "../../../components/warden/WardenComplaintsView";
import InventoryManagement from "./warden/InventoryManagement";
import FineManagement from "./warden/FineManagement";
import HostelReports from "./warden/HostelReports";
import GuardSecurityStatus from "./warden/GuardSecurityStatus";

const sections = [
  "Notice Board",
  "Students and Rooms Info",
  "Assign Room",
  "Extended Stay Requests",
  "Room Change Requests",
  "Fine Management",
  "Inventory Management",
  "Guard Security Status",
  "Reports",
  "Manage Complaints",
];

const components = {
  "Notice Board": NoticeBoardWardenCaretaker,
  "Students and Rooms Info": StudentInfo,
  "Assign Room": AssignRooms,
  "Extended Stay Requests": ManageExtendedStayRequests,
  "Room Change Requests": RoomChangeRequests,
  "Fine Management": FineManagement,
  "Inventory Management": InventoryManagement,
  "Guard Security Status": GuardSecurityStatus,
  Reports: HostelReports,
  "Manage Complaints": WardenComplaintsView,
};

export default function SectionNavigationWarden() {
  return (
    <EnhancedSectionNavigation
      sections={sections}
      components={components}
      defaultSection="Notice Board"
      userrole="warden"
    />
  );
}
