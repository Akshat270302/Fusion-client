import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  manageHostelStatusRoute,
  viewHostel,
} from "../../../../routes/hostelManagementRoutes";

const ACTION_LABELS = {
  activate: "Activate",
  deactivate: "Deactivate",
  maintenance: "Mark Under Maintenance",
};

const normalizeStatus = (status) => {
  const value = (status || "").toLowerCase();
  if (value === "undermaintenance") return "Under Maintenance";
  if (value === "active") return "Active";
  return "Inactive";
};

const statusColor = (status) => {
  const value = (status || "").toLowerCase();
  if (value === "active") return "green";
  if (value === "undermaintenance") return "yellow";
  return "gray";
};

export default function ManageHostelStatus() {
  const [hostels, setHostels] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [action, setAction] = useState("activate");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [message, setMessage] = useState({ type: null, text: "" });

  const token = localStorage.getItem("authToken");

  const fetchHostels = async () => {
    setTableLoading(true);
    try {
      const { data } = await axios.get(viewHostel, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const details = data?.hostel_details || [];
      setHostels(details);
      if (!selectedHallId && details.length > 0) {
        setSelectedHallId(details[0].hall_id);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to load hostels.",
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedHostel = useMemo(
    () => hostels.find((hostel) => hostel.hall_id === selectedHallId) || null,
    [hostels, selectedHallId],
  );

  const submitStatusUpdate = async () => {
    if (!selectedHallId) {
      setMessage({ type: "error", text: "Please select a hostel." });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });
    try {
      const { data } = await axios.post(
        manageHostelStatusRoute,
        {
          hall_id: selectedHallId,
          action,
          reason,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setMessage({
        type: "success",
        text: data?.advisory
          ? `${data?.message || "Hostel status updated successfully."} ${data.advisory}`
          : data?.message || "Hostel status updated successfully.",
      });
      await fetchHostels();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.error ||
          "Failed to update hostel status. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing="md">
      <Card withBorder radius="md" shadow="sm" p="lg">
        <Stack spacing="sm">
          <Text fw={700} size="lg">
            Manage Hostel Status
          </Text>

          <Select
            label="Select Hostel"
            data={hostels.map((hostel) => ({
              value: hostel.hall_id,
              label: `${hostel.hall_name} (${hostel.hall_id})`,
            }))}
            value={selectedHallId}
            onChange={setSelectedHallId}
            placeholder="Choose a hostel"
            searchable
          />

          <Select
            label="Status Action"
            value={action}
            onChange={(value) => setAction(value || "activate")}
            data={[
              { value: "activate", label: ACTION_LABELS.activate },
              { value: "deactivate", label: ACTION_LABELS.deactivate },
              { value: "maintenance", label: ACTION_LABELS.maintenance },
            ]}
          />

          <TextInput
            label="Reason (optional)"
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            placeholder="Reason for status change"
          />

          <Group justify="flex-end">
            <Button onClick={submitStatusUpdate} loading={loading}>
              Update Status
            </Button>
          </Group>

          {message.type === "success" && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              {message.text}
            </Alert>
          )}
          {message.type === "error" && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {message.text}
            </Alert>
          )}

          {selectedHostel && (
            <Group>
              <Text size="sm" c="dimmed">
                Current status:
              </Text>
              <Badge color={statusColor(selectedHostel.operational_status)} variant="light">
                {normalizeStatus(selectedHostel.operational_status)}
              </Badge>
            </Group>
          )}
        </Stack>
      </Card>

      <Card withBorder radius="md" shadow="sm" p="lg">
        <Text fw={600} mb="sm">
          Existing Hostels
        </Text>
        <Table striped highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Hostel</Table.Th>
              <Table.Th>ID</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Capacity</Table.Th>
              <Table.Th>Occupied Rooms</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {!tableLoading && hostels.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>No hostels found.</Table.Td>
              </Table.Tr>
            )}
            {hostels.map((hostel) => (
              <Table.Tr key={hostel.hall_id}>
                <Table.Td>{hostel.hall_name}</Table.Td>
                <Table.Td>{hostel.hall_id}</Table.Td>
                <Table.Td>
                  <Badge color={statusColor(hostel.operational_status)} variant="light">
                    {normalizeStatus(hostel.operational_status)}
                  </Badge>
                </Table.Td>
                <Table.Td>{hostel.max_accomodation}</Table.Td>
                <Table.Td>{hostel.occupied_rooms || 0}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
