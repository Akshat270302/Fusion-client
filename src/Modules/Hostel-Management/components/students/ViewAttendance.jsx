import {
  Paper,
  Title,
  Container,
  Stack,
  Loader,
  Group,
  Text,
  Box,
  Divider,
  Badge,
  Table,
} from "@mantine/core";
import { IconFileReport } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { attendance_my_attendance } from "../../../../routes/hostelManagementRoutes";

export default function ViewAttendanceComponent() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please login again");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(attendance_my_attendance, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Error fetching attendance");
        }

        setAttendanceRecords(
          Array.isArray(data?.attendance) ? data.attendance : [],
        );
      } catch (fetchError) {
        setError(fetchError.message || "Error fetching attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getStatusBadgeColor = (statusValue) => {
    const normalized = String(statusValue || "").toLowerCase();
    return normalized === "present" ? "green" : "red";
  };

  const getStatusLabel = (statusValue) => {
    const normalized = String(statusValue || "").toLowerCase();
    return normalized === "present" ? "Present" : "Absent";
  };

  const formatDate = (dateValue) => {
    try {
      return new Date(dateValue).toLocaleDateString();
    } catch {
      return dateValue;
    }
  };

  return (
    <Container size="md" px="xs">
      <Paper shadow="xs" p={30} radius="md" withBorder>
        <Stack spacing="lg">
          <Box ta="center">
            <Title order={3} style={{ color: "#4299E1" }}>
              My Attendance
            </Title>
          </Box>

          <Divider />

          {error && (
            <Text color="red" size="sm" fw={500} ta="center">
              {error}
            </Text>
          )}

          {loading && (
            <Box ta="center" py="md">
              <Loader size="md" variant="dots" />
              <Text size="sm" color="dimmed" mt="xs">
                Fetching attendance history...
              </Text>
            </Box>
          )}

          {!loading && attendanceRecords.length > 0 && (
            <Paper mt="lg" p="lg" shadow="xs" radius="md" withBorder>
              <Stack spacing="md">
                <Group position="apart">
                  <Group>
                    <IconFileReport size={20} />
                    <Text fw={500}>Attendance Records</Text>
                  </Group>
                  <Badge color="blue" variant="filled" size="sm">
                    Total: {attendanceRecords.length}
                  </Badge>
                </Group>

                <Divider />

                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {attendanceRecords.map((record) => (
                      <Table.Tr
                        key={`${record.date}-${record.created_at || "row"}`}
                      >
                        <Table.Td>{formatDate(record.date)}</Table.Td>
                        <Table.Td>
                          <Badge color={getStatusBadgeColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Paper>
          )}

          {!loading && attendanceRecords.length === 0 && !error && (
            <Text ta="center" color="dimmed" size="sm">
              No attendance records available.
            </Text>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
