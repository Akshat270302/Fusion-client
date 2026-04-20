import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import axios from "axios";
import { roomChangeMyRequests } from "../../../../routes/hostelManagementRoutes";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (["approved", "allocated"].includes(normalized)) return "green";
  if (normalized === "rejected") return "red";
  return "yellow";
};

export default function RoomChangeRequestHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(roomChangeMyRequests, {
        headers: authHeaders(),
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch room change history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Paper shadow="xs" p={24} radius="md" withBorder>
      <Stack spacing="md">
        <Button variant="subtle" onClick={fetchHistory} loading={loading}>
          Refresh History
        </Button>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Request ID</Table.Th>
                <Table.Th>Current Room</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Decision Remarks</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requests.length === 0 && !loading && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text align="center" c="dimmed" py="md">
                      No room change requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {requests.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.request_id || item.id}</Table.Td>
                  <Table.Td>{item.current_room_no || "-"}</Table.Td>
                  <Table.Td>{item.reason || "-"}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(item.status)} variant="light">
                      {item.status || "Pending"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    Caretaker: {item.caretaker_remarks || "-"}
                    <br />
                    Warden: {item.warden_remarks || "-"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}
