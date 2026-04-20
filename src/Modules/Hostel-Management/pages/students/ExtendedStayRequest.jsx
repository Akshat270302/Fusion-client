import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  extendedStayCancel,
  extendedStayModify,
  extendedStayMyRequests,
  extendedStaySubmit,
} from "../../../../routes/hostelManagementRoutes";

const initialForm = {
  start_date: "",
  end_date: "",
  reason: "",
  faculty_authorization: "",
};

const initialEditState = {
  id: null,
  start_date: "",
  end_date: "",
  reason: "",
  faculty_authorization: "",
};

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "green";
  if (["rejected", "cancelled"].includes(normalized)) return "red";
  return "yellow";
};

export default function ExtendedStayRequest() {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editState, setEditState] = useState(initialEditState);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
    try {
      const response = await axios.get(extendedStayMyRequests, {
        headers: getAuthHeaders(),
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load extended stay requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [requests],
  );

  const handleSubmit = async () => {
    resetStatus();
    setSaving(true);

    try {
      const response = await axios.post(extendedStaySubmit, form, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Extended stay request submitted.");
      setForm(initialForm);
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (requestItem) => {
    setEditState({
      id: requestItem.id,
      start_date: requestItem.start_date || "",
      end_date: requestItem.end_date || "",
      reason: requestItem.reason || "",
      faculty_authorization: requestItem.faculty_authorization || "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    resetStatus();
    setSaving(true);
    try {
      const response = await axios.post(
        extendedStayModify(editState.id),
        {
          start_date: editState.start_date,
          end_date: editState.end_date,
          reason: editState.reason,
          faculty_authorization: editState.faculty_authorization,
        },
        { headers: getAuthHeaders() },
      );
      setSuccessMessage(response.data?.message || "Request updated.");
      setIsEditOpen(false);
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to update request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (requestId) => {
    resetStatus();
    const reason = window.prompt("Enter cancellation reason (optional):", "") || "";

    try {
      const response = await axios.post(
        extendedStayCancel(requestId),
        { cancel_reason: reason },
        { headers: getAuthHeaders() },
      );
      setSuccessMessage(response.data?.message || "Request cancelled.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to cancel request.",
      );
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Extended Stay Request</Text>
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

        <Group grow>
          <TextInput
            type="date"
            label="Start Date"
            value={form.start_date}
            onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.currentTarget.value }))}
          />
          <TextInput
            type="date"
            label="End Date"
            value={form.end_date}
            onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.currentTarget.value }))}
          />
        </Group>

        <Textarea
          label="Reason"
          placeholder="Why do you need to stay in hostel during vacation?"
          minRows={2}
          value={form.reason}
          onChange={(event) => setForm((prev) => ({ ...prev, reason: event.currentTarget.value }))}
        />

        <Textarea
          label="Faculty Authorization"
          placeholder="Enter faculty authorization details"
          minRows={2}
          value={form.faculty_authorization}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              faculty_authorization: event.currentTarget.value,
            }))
          }
        />

        <Button onClick={handleSubmit} loading={saving}>
          Submit Request
        </Button>

        <Text fw={600}>My Extended Stay Requests</Text>

        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Dates</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Caretaker</Table.Th>
                <Table.Th>Warden</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && sortedRequests.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text align="center" c="dimmed" py="md">
                      No extended stay requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {sortedRequests.map((requestItem) => {
                const isPending = (requestItem.status || "").toLowerCase() === "pending";

                return (
                  <Table.Tr key={requestItem.id}>
                    <Table.Td>{requestItem.id}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{requestItem.start_date || "-"}</Text>
                      <Text size="xs" c="dimmed">
                        to {requestItem.end_date || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColor(requestItem.status)} variant="light">
                        {requestItem.status || "Pending"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{requestItem.caretaker_decision || "Pending"}</Text>
                      <Text size="xs" c="dimmed">
                        {requestItem.caretaker_remarks || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{requestItem.warden_decision || "Pending"}</Text>
                      <Text size="xs" c="dimmed">
                        {requestItem.warden_remarks || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group spacing={6}>
                        <Button size="xs" variant="outline" disabled={!isPending} onClick={() => openEditModal(requestItem)}>
                          Modify
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          disabled={!isPending}
                          onClick={() => handleCancel(requestItem.id)}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>

      <Modal opened={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Extended Stay" size="lg">
        <Stack spacing="sm">
          <Group grow>
            <TextInput
              type="date"
              label="Start Date"
              value={editState.start_date}
              onChange={(event) => handleEditChange("start_date", event.currentTarget.value)}
            />
            <TextInput
              type="date"
              label="End Date"
              value={editState.end_date}
              onChange={(event) => handleEditChange("end_date", event.currentTarget.value)}
            />
          </Group>

          <Textarea
            label="Reason"
            minRows={2}
            value={editState.reason}
            onChange={(event) => handleEditChange("reason", event.currentTarget.value)}
          />

          <Textarea
            label="Faculty Authorization"
            minRows={2}
            value={editState.faculty_authorization}
            onChange={(event) => handleEditChange("faculty_authorization", event.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsEditOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSaveEdit} loading={saving}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
