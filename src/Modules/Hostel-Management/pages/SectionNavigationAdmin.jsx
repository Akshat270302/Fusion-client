import React from "react";
import EnhancedSectionNavigation from "./EnhancedSectionNavigation";
import NoticeBoard from "./all-actors/NoticeBoard";
import ViewHostel from "./hostel-admin/ViewHostel";
import AssignBatch from "./hostel-admin/AssignBatch";
import AssignCaretaker from "./hostel-admin/AssignCaretaker";
import InventoryManagement from "./hostel-admin/InventoryManagement";
import AddHostel from "./hostel-admin/AddHostel";
import ManageHostelStatus from "./hostel-admin/ManageHostelStatus";
import HostelLifecycleWorkflow from "./hostel-admin/HostelLifecycleWorkflow";
import FinalizeRoomVacation from "./hostel-admin/FinalizeRoomVacation";
import SubmittedReportsReview from "./hostel-admin/SubmittedReportsReview";
import GuardDutyManagement from "./hostel-admin/GuardDutyManagement";

const sections = [
  "Room Allotment",
  "Notice Board",
  "Add New Hostel",
  "View Hostel",
  "Manage Hostel Status",
  "Vacation Finalization",
  "Submitted Reports",
  "Inventory Management",
  "Guard Duty Management",
  "Manage Hostel",
  "Manage Batch",
];

const components = {
  "Room Allotment": HostelLifecycleWorkflow,
  "Notice Board": NoticeBoard,
  "Add New Hostel": AddHostel,
  "View Hostel": ViewHostel,
  "Manage Hostel Status": ManageHostelStatus,
  "Vacation Finalization": FinalizeRoomVacation,
  "Submitted Reports": SubmittedReportsReview,
  "Inventory Management": InventoryManagement,
  "Guard Duty Management": GuardDutyManagement,
  "Manage Batch": AssignBatch,
  "Manage Hostel": AssignCaretaker,
};

export default function SectionNavigationAdmin() {
  return (
    <EnhancedSectionNavigation
      sections={sections}
      components={components}
      defaultSection="Room Allotment"
      userrole="admin"
    />
  );
}
