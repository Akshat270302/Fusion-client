import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  roomVacationCaretakerVerify,
  roomVacationClearanceRequests,
} from "../../../../routes/hostelManagementRoutes";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("approved")) return "green";
  if (normalized.includes("action required")) return "orange";
  if (normalized.includes("completed")) return "teal";
  return "yellow";
};

export default function ManageRoomVacationClearance() {
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [form, setForm] = useState({
    decision: "request_corrections",
    caretaker_review_comments: "",
    room_inspection_notes: "",
    room_damages_found: false,
    room_damage_description: "",
    room_damage_fine_amount: 0,
    borrowed_items_notes: "",
    behavior_notes: "",
    checklist_updates: {},
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    return {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    };
  };

  const resetStatus = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchRequests = async () => {
    setLoading(true);
    resetStatus();
    try {
      const response = await axios.get(roomVacationClearanceRequests, {
        headers: getAuthHeaders(),
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setRequests(rows);
      if (!selectedRequestId && rows.length > 0) {
        setSelectedRequestId(rows[0].id);
      }
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load room vacation requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const selectedRequest = useMemo(
    () => requests.find((row) => row.id === selectedRequestId) || null,
    [requests, selectedRequestId],
  );

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    const updates = {};
    (selectedRequest.checklist || []).forEach((item) => {
      updates[item.code] = {
        code: item.code,
        status: item.status,
        caretaker_comment: item.caretaker_comment || "",
        is_blocking: item.is_blocking,
      };
    });

    setForm({
      decision: "request_corrections",
      caretaker_review_comments: selectedRequest.caretaker_review_comments || "",
      room_inspection_notes: selectedRequest.room_inspection_notes || "",
      room_damages_found: Boolean(selectedRequest.room_damages_found),
      room_damage_description: selectedRequest.room_damage_description || "",
      room_damage_fine_amount: Number(selectedRequest.room_damage_fine_amount || 0),
      borrowed_items_notes: selectedRequest.borrowed_items_notes || "",
      behavior_notes: selectedRequest.behavior_notes || "",
      checklist_updates: updates,
    });
  }, [selectedRequest]);

  const updateChecklistField = (code, key, value) => {
    setForm((prev) => ({
      ...prev,
      checklist_updates: {
        ...prev.checklist_updates,
        [code]: {
          ...(prev.checklist_updates[code] || {
            code,
            status: "Pending Action",
            caretaker_comment: "",
            is_blocking: false,
          }),
          [key]: value,
        },
      },
    }));
  };

  const submitDecision = async () => {
    if (!selectedRequest) {
      return;
    }

    resetStatus();
    setSaving(true);

    try {
      const response = await axios.post(
        roomVacationCaretakerVerify(selectedRequest.id),
        {
          decision: form.decision,
          caretaker_review_comments: form.caretaker_review_comments,
          room_inspection_notes: form.room_inspection_notes,
          room_damages_found: form.room_damages_found,
          room_damage_description: form.room_damage_description,
          room_damage_fine_amount: form.room_damage_fine_amount,
          borrowed_items_notes: form.borrowed_items_notes,
          behavior_notes: form.behavior_notes,
          checklist_updates: Object.values(form.checklist_updates),
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccessMessage(response.data?.message || "Clearance decision submitted.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit clearance decision.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Vacation Clearance Verification</Text>
          <Button variant="subtle" loading={loading} onClick={fetchRequests}>
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

        <Group grow>
          <Select
            label="Select Request"
            placeholder="Choose request"
            data={requests.map((row) => ({
              value: String(row.id),
              label: `#${row.id} - ${row.student_username} (${row.status})`,
            }))}
            value={selectedRequestId ? String(selectedRequestId) : null}
            onChange={(value) => setSelectedRequestId(value ? Number(value) : null)}
          />
        </Group>

        {!selectedRequest && (
          <Text size="sm" c="dimmed">
            No vacation request selected.
          </Text>
        )}

        {selectedRequest && (
          <>
            <Card withBorder radius="md" p="md">
              <Stack spacing={4}>
                <Group justify="space-between">
                  <Text fw={500}>Request Details</Text>
                  <Badge color={statusColor(selectedRequest.status)} variant="light">
                    {selectedRequest.status}
                  </Badge>
                </Group>
                <Text size="sm">Student: {selectedRequest.student_username}</Text>
                <Text size="sm">Room: {selectedRequest.room_label || "-"}</Text>
                <Text size="sm">Vacation Date: {selectedRequest.intended_vacation_date || "-"}</Text>
                <Text size="sm">Reason: {selectedRequest.reason}</Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md">
              <Stack spacing="sm">
                <Text fw={500}>Clearance Checklist Verification</Text>
                <ScrollArea>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Item</Table.Th>
                        <Table.Th>Blocking</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Caretaker Comment</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(selectedRequest.checklist || []).map((item) => {
                        const update = form.checklist_updates[item.code] || {
                          status: item.status,
                          caretaker_comment: item.caretaker_comment || "",
                        };

                        return (
                          <Table.Tr key={item.code}>
                            <Table.Td>
                              <Text size="sm" fw={500}>
                                {item.title}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {item.details}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={item.is_blocking ? "red" : "green"} variant="light">
                                {item.is_blocking ? "Yes" : "No"}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Select
                                data={[
                                  { value: "Pending", label: "Pending" },
                                  { value: "Pending Action", label: "Pending Action" },
                                  { value: "Verified", label: "Verified" },
                                ]}
                                value={update.status}
                                onChange={(value) =>
                                  updateChecklistField(
                                    item.code,
                                    "status",
                                    value || "Pending",
                                  )
                                }
                                allowDeselect={false}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Textarea
                                minRows={1}
                                value={update.caretaker_comment || ""}
                                onChange={(event) =>
                                  updateChecklistField(
                                    item.code,
                                    "caretaker_comment",
                                    event.currentTarget.value,
                                  )
                                }
                              />
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md">
              <Stack spacing="sm">
                <Text fw={500}>Inspection and Decision</Text>
                <Textarea
                  label="Room Inspection Notes"
                  minRows={2}
                  value={form.room_inspection_notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      room_inspection_notes: event.currentTarget.value,
                    }))
                  }
                />
                <Select
                  label="Damages Found"
                  data={[
                    { value: "false", label: "No" },
                    { value: "true", label: "Yes" },
                  ]}
                  value={form.room_damages_found ? "true" : "false"}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      room_damages_found: value === "true",
                    }))
                  }
                  allowDeselect={false}
                />
                <Textarea
                  label="Damage Description"
                  minRows={2}
                  value={form.room_damage_description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      room_damage_description: event.currentTarget.value,
                    }))
                  }
                />
                <NumberInput
                  label="Damage Fine Amount"
                  min={0}
                  value={form.room_damage_fine_amount}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      room_damage_fine_amount: Number(value || 0),
                    }))
                  }
                />
                <Textarea
                  label="Borrowed Items Notes"
                  minRows={2}
                  value={form.borrowed_items_notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      borrowed_items_notes: event.currentTarget.value,
                    }))
                  }
                />
                <Textarea
                  label="Attendance / Behavior Notes"
                  minRows={2}
                  value={form.behavior_notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      behavior_notes: event.currentTarget.value,
                    }))
                  }
                />
                <Textarea
                  label="Overall Caretaker Review Comments"
                  minRows={2}
                  value={form.caretaker_review_comments}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      caretaker_review_comments: event.currentTarget.value,
                    }))
                  }
                />
                <Select
                  label="Decision"
                  data={[
                    {
                      value: "request_corrections",
                      label: "Request Corrections",
                    },
                    { value: "approve", label: "Approve Clearance" },
                  ]}
                  value={form.decision}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      decision: value || "request_corrections",
                    }))
                  }
                  allowDeselect={false}
                />
                <Button onClick={submitDecision} loading={saving}>
                  Submit Clearance Decision
                </Button>
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </Paper>
  );
}
