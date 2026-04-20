import {
  Paper,
  Button,
  Title,
  Container,
  Stack,
  Text,
  Box,
  Divider,
  Group,
  Table,
  Select,
  Badge,
  TextInput,
} from "@mantine/core";
import { useState, useEffect } from "react";
import {
  attendance_students,
  attendance_submit,
} from "../../../../routes/hostelManagementRoutes";

export default function UploadAttendanceComponent() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const studentId = (student.student_id || "").toLowerCase();
    const studentName = (student.name || "").toLowerCase();
    return studentId.includes(query) || studentName.includes(query);
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(attendance_students, {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        });

        const responseText = await response.text();
        let data = {};
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data?.error || "Failed to fetch students");
        }

        const studentList = Array.isArray(data?.students) ? data.students : [];
        setStudents(studentList);

        const defaultAttendance = {};
        studentList.forEach((student) => {
          defaultAttendance[student.student_id] = "present";
        });
        setAttendance(defaultAttendance);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleStatusChange = (studentId, value) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!attendanceDate) {
      setError("Attendance date is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const payload = students.map((student) => ({
      student_id: student.student_id,
      status: attendance[student.student_id] || "present",
    }));

    try {
      const response = await fetch(
        `${attendance_submit}?date=${attendanceDate}`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const responseText = await response.text();
      let result = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit attendance");
      }

      setSuccessMessage(
        `Attendance submitted: ${result?.summary?.total_submitted || payload.length} students`,
      );
    } catch (submitError) {
      setError(submitError.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Text align="center" mt="xl" color="dimmed">
        Loading...
      </Text>
    );
  }

  return (
    <Container size="sm" px="xs">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Box ta="center" mb="lg">
          <Title order={2} color="#4299E1">
            Upload Attendance
          </Title>
          <Text color="dimmed" size="sm" mt={4}>
            Mark daily attendance for students in your hostel
          </Text>
        </Box>

        <Divider mb="lg" />

        <Stack spacing="md">
          {error && (
            <Text color="red" size="sm" fw={500}>
              {error}
            </Text>
          )}

          {successMessage && (
            <Text color="green" size="sm" fw={500}>
              {successMessage}
            </Text>
          )}

          <Box>
            <Text fw={500} size="sm" mb={6}>
              Attendance Date
            </Text>
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
              }}
            />
          </Box>

          <Divider my="xs" />

          <TextInput
            label="Search Students"
            placeholder="Search by student ID or name"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />

          {students.length === 0 && !loading ? (
            <Text size="sm" color="dimmed" ta="center">
              No students found for your hostel.
            </Text>
          ) : filteredStudents.length === 0 ? (
            <Text size="sm" color="dimmed" ta="center">
              No students match your search.
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Room</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredStudents.map((student) => (
                  <Table.Tr key={student.student_id}>
                    <Table.Td>{student.student_id}</Table.Td>
                    <Table.Td>{student.name}</Table.Td>
                    <Table.Td>{student.room_no || "-"}</Table.Td>
                    <Table.Td>
                      <Select
                        data={[
                          { value: "present", label: "Present" },
                          { value: "absent", label: "Absent" },
                        ]}
                        value={attendance[student.student_id] || "present"}
                        onChange={(value) =>
                          handleStatusChange(
                            student.student_id,
                            value || "present",
                          )
                        }
                        w={120}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          <Group justify="space-between" mt="sm">
            <Badge color="blue" variant="light">
              Showing {filteredStudents.length} of {students.length} students
            </Badge>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={loading || submitting || students.length === 0}
              styles={{
                root: {
                  backgroundColor: "#4299E1",
                  "&:hover": { backgroundColor: "#3182CE" },
                },
              }}
            >
              Submit Attendance
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
