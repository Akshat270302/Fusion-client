import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  roomVacationFinalizationRequests,
  roomVacationFinalize,
} from "../../../../routes/hostelManagementRoutes";
import HallSelector from "../shared/HallSelector";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "completed") return "green";
  if (normalized.includes("approved")) return "teal";
  return "yellow";
};

export default function FinalizeRoomVacation() {
  const role = (useSelector((state) => state.user.role) || "").toLowerCase();
  const isSuperAdmin = role.includes("admin");

  const [selectedHall, setSelectedHall] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
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

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(roomVacationFinalizationRequests, {
        headers: getAuthHeaders(),
        params: isSuperAdmin ? { hall_id: selectedHall } : undefined,
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
          "Unable to load finalization requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !selectedHall) {
      setRequests([]);
      setSelectedRequestId(null);
      setLoading(false);
      setError("");
      return;
    }
    fetchRequests();
  }, [isSuperAdmin, selectedHall]);

  const selectedRequest = useMemo(
    () => requests.find((row) => row.id === selectedRequestId) || null,
    [requests, selectedRequestId],
  );

  const handleFinalize = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!window.confirm("Finalize room vacation? This will deallocate the room and archive records.")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        roomVacationFinalize(selectedRequest.id),
        {
          confirm: true,
          ...(isSuperAdmin ? { hall_id: selectedHall } : {}),
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccessMessage(response.data?.message || "Room vacation finalized successfully.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to finalize room vacation.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Vacation Finalization</Text>
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

        {isSuperAdmin && (
          <HallSelector
            value={selectedHall}
            onChange={setSelectedHall}
            label="Select Hall"
          />
        )}

        {isSuperAdmin && !selectedHall && (
          <Text size="sm" c="dimmed">
            Select a hall to access room vacation finalization data.
          </Text>
        )}

        {(!isSuperAdmin || selectedHall) && (
          <>

            <Select
              label="Select Request"
              placeholder="Choose clearance-approved request"
              data={requests.map((row) => ({
                value: String(row.id),
                label: `#${row.id} - ${row.student_username} (${row.status})`,
              }))}
              value={selectedRequestId ? String(selectedRequestId) : null}
              onChange={(value) => setSelectedRequestId(value ? Number(value) : null)}
            />

            {!selectedRequest && (
              <Text size="sm" c="dimmed">
                No request selected.
              </Text>
            )}

            {selectedRequest && (
              <>
                <Card withBorder radius="md" p="md">
                  <Stack spacing={4}>
                    <Group justify="space-between">
                      <Text fw={500}>Request Overview</Text>
                      <Badge color={statusColor(selectedRequest.status)} variant="light">
                        {selectedRequest.status}
                      </Badge>
                    </Group>
                    <Text size="sm">Student: {selectedRequest.student_username}</Text>
                    <Text size="sm">Hall: {selectedRequest.hall_name}</Text>
                    <Text size="sm">Room: {selectedRequest.room_label || "-"}</Text>
                    <Text size="sm">Certificate: {selectedRequest.clearance_certificate_no || "-"}</Text>
                    <Text size="sm">Vacation Date: {selectedRequest.intended_vacation_date || "-"}</Text>
                    <Text size="sm">Reason: {selectedRequest.reason}</Text>
                  </Stack>
                </Card>

                <Card withBorder radius="md" p="md">
                  <Stack spacing="sm">
                    <Text fw={500}>Checklist Status</Text>
                    <ScrollArea>
                      <Table striped withTableBorder withColumnBorders>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Item</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Blocking</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {(selectedRequest.checklist || []).map((item) => (
                            <Table.Tr key={item.code}>
                              <Table.Td>{item.title}</Table.Td>
                              <Table.Td>{item.status}</Table.Td>
                              <Table.Td>
                                <Badge color={item.is_blocking ? "red" : "green"} variant="light">
                                  {item.is_blocking ? "Yes" : "No"}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Stack>
                </Card>

                <Button
                  color="teal"
                  onClick={handleFinalize}
                  loading={saving}
                  disabled={(selectedRequest.status || "").toLowerCase() !== "clearance approved"}
                >
                  Finalize Room Vacation
                </Button>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
