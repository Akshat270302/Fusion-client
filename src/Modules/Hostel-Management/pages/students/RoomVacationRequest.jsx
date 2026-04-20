import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
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
  roomVacationChecklistGenerate,
  roomVacationMyRequests,
  roomVacationSubmit,
} from "../../../../routes/hostelManagementRoutes";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "completed") return "green";
  if (normalized.includes("approved")) return "teal";
  if (normalized.includes("action required")) return "orange";
  return "yellow";
};

export default function RoomVacationRequest() {
  const [form, setForm] = useState({
    intended_vacation_date: "",
    reason: "",
  });
  const [checklistPreview, setChecklistPreview] = useState(null);
  const [checklistAcknowledged, setChecklistAcknowledged] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
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
    setLoadingRequests(true);
    try {
      const response = await axios.get(roomVacationMyRequests, {
        headers: getAuthHeaders(),
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load room vacation history.",
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      ),
    [requests],
  );

  const handleGenerateChecklist = async () => {
    resetStatus();
    setLoadingChecklist(true);
    try {
      const response = await axios.post(roomVacationChecklistGenerate, form, {
        headers: getAuthHeaders(),
      });
      setChecklistPreview(response.data || null);
      setChecklistAcknowledged(false);
      setSuccessMessage("Clearance checklist generated successfully.");
    } catch (requestError) {
      setChecklistPreview(null);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to generate checklist.",
      );
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleSubmitRequest = async () => {
    resetStatus();
    setSaving(true);
    try {
      const response = await axios.post(
        roomVacationSubmit,
        {
          intended_vacation_date: form.intended_vacation_date,
          reason: form.reason,
          checklist_acknowledged: checklistAcknowledged,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccessMessage(response.data?.message || "Vacation request submitted.");
      setChecklistPreview(null);
      setChecklistAcknowledged(false);
      setForm({
        intended_vacation_date: "",
        reason: "",
      });
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit room vacation request.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Room Vacation Request</Text>
          <Button variant="subtle" loading={loadingRequests} onClick={fetchRequests}>
            Refresh History
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

        <Card withBorder radius="md" p="md">
          <Stack spacing="sm">
            <Text fw={500}>Step 1: Fill Vacation Details</Text>
            <TextInput
              type="date"
              label="Intended Vacation Date"
              value={form.intended_vacation_date}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  intended_vacation_date: event.currentTarget.value,
                }))
              }
            />
            <Textarea
              label="Reason for Vacation"
              minRows={3}
              placeholder="Explain why you are vacating the room"
              value={form.reason}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  reason: event.currentTarget.value,
                }))
              }
            />
            <Button loading={loadingChecklist} onClick={handleGenerateChecklist}>
              Generate Clearance Checklist
            </Button>
          </Stack>
        </Card>

        {checklistPreview && (
          <Card withBorder radius="md" p="md">
            <Stack spacing="sm">
              <Text fw={500}>Step 2: Review Clearance Checklist</Text>
              <Text size="sm" c="dimmed">
                Blocking items are highlighted and must be resolved before final clearance approval.
              </Text>

              <Table withTableBorder withColumnBorders striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Details</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(checklistPreview.checklist || []).map((item) => (
                    <Table.Tr key={item.code}>
                      <Table.Td>{item.title}</Table.Td>
                      <Table.Td>
                        <Badge color={item.is_blocking ? "red" : "green"} variant="light">
                          {item.is_blocking ? "Pending Requirement" : "Clear"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{item.details}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Checkbox
                label="I acknowledge the clearance checklist and want to submit the vacation request"
                checked={checklistAcknowledged}
                onChange={(event) => setChecklistAcknowledged(event.currentTarget.checked)}
              />

              <Button
                color="teal"
                onClick={handleSubmitRequest}
                loading={saving}
                disabled={!checklistAcknowledged}
              >
                Submit Vacation Request
              </Button>
            </Stack>
          </Card>
        )}

        <Divider />

        <Text fw={600}>My Vacation Request History</Text>
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Checklist</Table.Th>
                <Table.Th>Certificate</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loadingRequests && sortedRequests.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text align="center" c="dimmed" py="md">
                      No room vacation requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {sortedRequests.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.id}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{row.intended_vacation_date || "-"}</Text>
                    <Text size="xs" c="dimmed">
                      Created: {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(row.status)} variant="light">
                      {row.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {(row.checklist_summary?.unresolved_blocking || 0) > 0
                        ? `${row.checklist_summary?.unresolved_blocking || 0} blocking unresolved`
                        : "All blocking items verified"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{row.clearance_certificate_no || "-"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}
