import React, { useState, useEffect } from "react";
import { Box, Group, Loader, Text } from "@mantine/core";
import axios from "axios";
import StudentInfoCard from "../../components/students/StudentInfoCard";
import { myRoom } from "../../../../routes/hostelManagementRoutes";

export default function StudentDashboard() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllottedRoomInfo = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(myRoom, {
        headers: { Authorization: `Token ${token}` },
      });

      const payload = response.data || {};
      const studentData = {
        id__user__username:
          payload.student_id || payload.id__user__username || "N/A",
        programme: payload.programme || "N/A",
        batch: payload.batch || "N/A",
        cpi: Number(payload.cpi ?? 0),
        category: payload.category || "N/A",
        hall_id: payload.hostel_id || payload.hall_id || "N/A",
        room_no: payload.room_number || payload.room_no || "Not Assigned",
      };
      setCurrentStudent(studentData);
      setError(null);
    } catch (err) {
      console.error("Error fetching room allocation info:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to fetch room allocation information. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAllottedRoomInfo();
  }, []);

  return (
    <Box style={{ overflow: "hidden" }}>
      <Group align="flex-start" style={{ height: "78vh" }}>
        <Box style={{ height: "100%" }}>
          {loading ? (
            <Loader size="md" />
          ) : error ? (
            <Text color="red">{error}</Text>
          ) : currentStudent ? (
            <StudentInfoCard
              name={currentStudent.id__user__username}
              programme={currentStudent.programme}
              batch={currentStudent.batch}
              cpi={currentStudent.cpi}
              category={currentStudent.category}
              hall_id={currentStudent.hall_id}
              room_no={currentStudent.room_no}
            />
          ) : (
            <Text>No room allocation available</Text>
          )}
        </Box>
        <Box style={{ height: "100%", flex: 1, padding: "2rem" }}>
          <Text size="lg" fw={600} c="blue.7">
            Room Allocation Details
          </Text>
          <Text mt="sm" c="dimmed">
            This page shows your currently allotted hall and room.
          </Text>
        </Box>
      </Group>
    </Box>
  );
}
