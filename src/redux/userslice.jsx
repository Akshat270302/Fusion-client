import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    username: "User",
    roll_no: "",
    roles: ["Guest-User"],
    role: "Guest-User",
    accessibleModules: {}, // Format---> {role: {module: true}}
    currentAccessibleModules: {}, // Format---> {module: true}
  },
  reducers: {
    setUserName: (state, action) => {
      state.username = action.payload;
    },
    setRollNo: (state, action) => {
      state.roll_no = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setAccessibleModules: (state, action) => {
      state.accessibleModules = action.payload;
    },
    setCurrentAccessibleModules: (state) => {
      const exactModules = state.accessibleModules[state.role];
      if (exactModules) {
        state.currentAccessibleModules = exactModules;
        return;
      }

      const normalizedRole = (state.role || "").toLowerCase();
      if (normalizedRole.includes("admin")) {
        const adminKey = Object.keys(state.accessibleModules).find(
          (key) => key.toLowerCase() === "admin",
        );
        state.currentAccessibleModules =
          (adminKey && state.accessibleModules[adminKey]) || {};
        return;
      }

      state.currentAccessibleModules = {};
    },
    clearUserName: (state) => {
      state.username = "User";
    },
    clearRoles: (state) => {
      state.roles = null;
    },
  },
});

export const {
  setUserName,
  setRollNo,
  setRoles,
  setRole,
  setAccessibleModules,
  setCurrentAccessibleModules,
  clearUserName,
  clearRoles,
} = userSlice.actions;
export default userSlice.reducer;
