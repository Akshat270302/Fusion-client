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
  List,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import { myRoom, studentGroupCreate } from "../../../../routes/hostelManagementRoutes";

export default function GroupFormationRequest() {
  const [memberOne, setMemberOne] = useState("");
  const [memberTwo, setMemberTwo] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [groupStatus, setGroupStatus] = useState({
    group_id: null,
    roommates: [],
  });

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

  const fetchCurrentGroupStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await axios.get(myRoom, {
        headers: authHeaders(),
      });
      setGroupStatus({
        group_id: response.data?.group_id || null,
        roommates: Array.isArray(response.data?.roommates) ? response.data.roommates : [],
      });
    } catch {
      setGroupStatus({
        group_id: null,
        roommates: [],
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentGroupStatus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!memberOne.trim() || !memberTwo.trim()) {
      setError("Please provide both roll numbers to form a group.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        studentGroupCreate,
        {
          member_roll_numbers: [memberOne.trim(), memberTwo.trim()],
        },
        { headers: authHeaders() },
      );

      const payload = response.data || {};
      const groupId = payload.group?.group_id;
      setSuccessMessage(
        groupId
          ? `Group created successfully. Group ID: ${groupId}`
          : payload.message || "Group created successfully.",
      );
      setMemberOne("");
      setMemberTwo("");
      await fetchCurrentGroupStatus();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to create group.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="xs" p={24} radius="md" withBorder>
      <Stack spacing="md">
        <Text fw={600}>Group Formation Request</Text>
        <Text size="sm" c="dimmed">
          Enter exactly 2 roll numbers. You will form a group of 3 including yourself.
        </Text>

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
            Current Group Status
          </Text>
          {statusLoading ? (
            <Text size="sm">Loading group status...</Text>
          ) : groupStatus.group_id ? (
            <>
              <Text fw={500}>Group ID: {groupStatus.group_id}</Text>
              <Text size="sm" mt="xs" c="dimmed">
                Current roommates
              </Text>
              <List size="sm" spacing={4} mt={4}>
                {groupStatus.roommates.length === 0 && <List.Item>No roommates assigned yet.</List.Item>}
                {groupStatus.roommates.map((mate) => (
                  <List.Item key={mate.student_id || mate.full_name}>
                    {mate.student_id} {mate.full_name ? `(${mate.full_name})` : ""}
                  </List.Item>
                ))}
              </List>
            </>
          ) : (
            <Text size="sm">No group assigned yet.</Text>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing="sm">
            <Group grow>
              <TextInput
                label="Roll Number 1"
                placeholder="Enter roll number"
                value={memberOne}
                onChange={(event) => setMemberOne(event.currentTarget.value)}
                required
              />
              <TextInput
                label="Roll Number 2"
                placeholder="Enter roll number"
                value={memberTwo}
                onChange={(event) => setMemberTwo(event.currentTarget.value)}
                required
              />
            </Group>
            <Button type="submit" loading={loading}>
              Submit Group Request
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
