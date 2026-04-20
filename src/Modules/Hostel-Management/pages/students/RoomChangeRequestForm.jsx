import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  myRoom,
  roomChangeSubmit,
} from "../../../../routes/hostelManagementRoutes";

export default function RoomChangeRequestForm() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [reason, setReason] = useState("");
  const [preferredRoom, setPreferredRoom] = useState("");
  const [preferredHall, setPreferredHall] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }
    return {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchCurrentRoom = async () => {
    setError("");
    try {
      const response = await axios.get(myRoom, {
        headers: authHeaders(),
      });
      setCurrentRoom(response.data || null);
    } catch (requestError) {
      setCurrentRoom(null);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch current room allocation.",
      );
    }
  };

  useEffect(() => {
    fetchCurrentRoom();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        roomChangeSubmit,
        {
          reason: reason.trim(),
          preferred_room: preferredRoom.trim(),
          preferred_hall: preferredHall.trim(),
        },
        { headers: authHeaders() },
      );

      const requestId = response.data?.request?.request_id || "";
      setSuccessMessage(
        requestId
          ? `Room change request submitted. Request ID: ${requestId}`
          : response.data?.message || "Room change request submitted successfully.",
      );
      setReason("");
      setPreferredRoom("");
      setPreferredHall("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to submit room change request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="xs" p={24} radius="md" withBorder>
      <Stack spacing="md">
        <Text fw={600}>Submit Room Change Request</Text>

        {successMessage && (
          <Alert icon={<IconCheck size={16} />} color="teal" variant="light">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Box>
          <Text size="sm" c="dimmed">
            Current Allocation
          </Text>
          <Text fw={500}>
            Hostel: {currentRoom?.hostel_id || "-"} ({currentRoom?.hostel_name || "-"}) | Room: {currentRoom?.room_number || "-"}
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing="sm">
            <Textarea
              label="Reason"
              placeholder="Mention why you need room change"
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
              minRows={3}
              required
            />
            <Group grow>
              <TextInput
                label="Preferred Room (optional)"
                placeholder="Example: A-203"
                value={preferredRoom}
                onChange={(event) => setPreferredRoom(event.currentTarget.value)}
              />
              <TextInput
                label="Preferred Hostel (optional)"
                placeholder="Example: hall4"
                value={preferredHall}
                onChange={(event) => setPreferredHall(event.currentTarget.value)}
              />
            </Group>
            <Button type="submit" loading={loading}>
              Submit Request
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
