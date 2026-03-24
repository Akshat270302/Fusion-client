import React from "react";
import EnhancedSectionNavigation from "./EnhancedSectionNavigation";
import NoticeBoardWardenCaretaker from "./all-actors/NoticeBoardWardenCaretaker";
import StudentInfo from "./all-actors/StudentInfo";
import AssignRooms from "./warden/AssignRoom";
import WardenComplaintsView from "../../../components/warden/WardenComplaintsView";

const sections = [
  "Notice Board",
  "Students and Rooms Info",
  "Assign Room",
  "Manage Complaints",
];

const components = {
  "Notice Board": NoticeBoardWardenCaretaker,
  "Students and Rooms Info": StudentInfo,
  "Assign Room": AssignRooms,
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
