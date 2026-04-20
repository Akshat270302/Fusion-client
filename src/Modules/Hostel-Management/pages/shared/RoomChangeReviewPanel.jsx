import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  roomChangeAllocate,
  roomChangeCaretakerDecision,
  roomChangeReviewRequests,
  roomChangeWardenDecision,
} from "../../../../routes/hostelManagementRoutes";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (["approved", "allocated"].includes(normalized)) return "green";
  if (normalized === "rejected") return "red";
  return "yellow";
};

export default function RoomChangeReviewPanel({ role }) {
  const [requests, setRequests] = useState([]);
  const [forms, setForms] = useState({});
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

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(roomChangeReviewRequests, {
        headers: authHeaders(),
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setRequests(rows);
      setForms((prev) => {
        const next = { ...prev };
        rows.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = {
              decision: "Approved",
              remarks: "",
              room_id: "",
              room_no: "",
              allocation_notes: "",
            };
          }
        });
        return next;
      });
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load room change requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateForm = (id, key, value) => {
    setForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  };

  const submitDecision = async (id) => {
    setError("");
    setSuccessMessage("");
    const form = forms[id] || {};

    try {
      const endpoint =
        role === "warden" ? roomChangeWardenDecision(id) : roomChangeCaretakerDecision(id);
      const response = await axios.post(
        endpoint,
        {
          decision: form.decision,
          remarks: form.remarks,
        },
        { headers: authHeaders() },
      );
      setSuccessMessage(response.data?.message || "Decision submitted.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to submit decision.",
      );
    }
  };

  const allocateRoom = async (id) => {
    setError("");
    setSuccessMessage("");
    const form = forms[id] || {};

    try {
      const response = await axios.post(
        roomChangeAllocate(id),
        {
          room_id: form.room_id,
          room_no: form.room_no,
          allocation_notes: form.allocation_notes,
        },
        { headers: authHeaders() },
      );
      setSuccessMessage(response.data?.message || "Room allocated successfully.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to allocate room.",
      );
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Room Change Requests</Text>
          <Button variant="subtle" onClick={fetchRequests} loading={loading}>
            Refresh
          </Button>
        </Group>

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

        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Request</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Current Room</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && requests.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text align="center" c="dimmed" py="md">
                      No room change requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {requests.map((item) => {
                const form = forms[item.id] || {};
                const canAllocate = role === "caretaker" && (item.status || "").toLowerCase() === "approved";

                return (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.request_id || item.id}</Table.Td>
                    <Table.Td>{item.student_username}</Table.Td>
                    <Table.Td>{item.current_room_no || "-"}</Table.Td>
                    <Table.Td>{item.reason}</Table.Td>
                    <Table.Td>
                      <Badge color={statusColor(item.status)} variant="light">
                        {item.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack spacing={6}>
                        <Group grow>
                          <Select
                            label="Decision"
                            value={form.decision || "Approved"}
                            data={[
                              { value: "Approved", label: "Approved" },
                              { value: "Rejected", label: "Rejected" },
                            ]}
                            onChange={(event) =>
                              updateForm(item.id, "decision", event || "Approved")
                            }
                            placeholder="Select decision"
                            allowDeselect={false}
                          />
                          <Textarea
                            label="Remarks"
                            value={form.remarks || ""}
                            onChange={(event) =>
                              updateForm(item.id, "remarks", event.currentTarget.value)
                            }
                            minRows={1}
                          />
                        </Group>
                        <Button size="xs" onClick={() => submitDecision(item.id)}>
                          Submit Decision
                        </Button>

                        {canAllocate && (
                          <>
                            <Group grow>
                              <TextInput
                                label="New Room ID"
                                placeholder="Numeric Room ID"
                                value={form.room_id || ""}
                                onChange={(event) =>
                                  updateForm(item.id, "room_id", event.currentTarget.value)
                                }
                              />
                              <TextInput
                                label="OR Room Label"
                                placeholder="A-203"
                                value={form.room_no || ""}
                                onChange={(event) =>
                                  updateForm(item.id, "room_no", event.currentTarget.value)
                                }
                              />
                            </Group>
                            <Textarea
                              label="Allocation Notes"
                              value={form.allocation_notes || ""}
                              onChange={(event) =>
                                updateForm(item.id, "allocation_notes", event.currentTarget.value)
                              }
                              minRows={1}
                            />
                            <Button size="xs" color="teal" onClick={() => allocateRoom(item.id)}>
                              Allocate New Room
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

RoomChangeReviewPanel.propTypes = {
  role: PropTypes.oneOf(["caretaker", "warden"]).isRequired,
};
