import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Text,
  Input,
  Group,
  Card,
  ScrollArea,
  Modal,
  Container,
  Stack,
  Button,
  Textarea,
  Loader,
  Box,
} from "@mantine/core";
import { MagnifyingGlass } from "@phosphor-icons/react";
import {
  getStudentsInfo2,
  imposeFineRoute,
} from "../../../../routes/hostelManagementRoutes"; // Adjust the path as needed

export default function ImposeFine() {
  const [opened, setOpened] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fineAmount, setFineAmount] = useState("");
  const [fineReason, setFineReason] = useState("");
  const [fineCategory, setFineCategory] = useState("Rule Violation");
  const [evidence, setEvidence] = useState(null);

  // Fetch students data
  const fetchStudents = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(getStudentsInfo2, {
        headers: { Authorization: `Token ${token}` },
      });
      setStudents(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to fetch student information. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      (student.id__user__username &&
        student.id__user__username
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (student.room_no &&
        student.room_no.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleImposeFine = async () => {
    if (!fineAmount || !fineReason || !selectedStudent) {
      alert("Please fill in all required fields before imposing a fine.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("student_id", selectedStudent.id__user__username);
      formData.append("amount", fineAmount);
      formData.append("category", fineCategory);
      formData.append("reason", fineReason);
      if (evidence) {
        formData.append("evidence", evidence);
      }

      const response = await axios.post(imposeFineRoute, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Fine imposed successfully!");
      console.log(response);
      setOpened(false);
      setFineAmount("");
      setFineReason("");
      setFineCategory("Rule Violation");
      setEvidence(null);
    } catch (err) {
      console.error("Error imposing fine:", err);
      alert(
        err.response?.data?.error ||
          "Failed to impose fine. Please try again later.",
      );
    }
  };

  return (
    <Container size="md" px="md">
      <Card shadow="sm" p={0} radius="md" withBorder>
        <Box p="lg">
          <Input
            placeholder="Search by student ID or room number"
            icon={<MagnifyingGlass size={16} />}
            mb="lg"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />

          <ScrollArea style={{ height: "60vh" }}>
            {loading ? (
              <Container
                py="xl"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Loader size="lg" />
              </Container>
            ) : error ? (
              <Text align="center" color="red" size="lg">
                {error}
              </Text>
            ) : (
              <Stack spacing="sm">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <Card
                      key={index}
                      padding="sm"
                      withBorder
                      radius="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setOpened(true);
                      }}
                      sx={(theme) => ({
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: theme.colors.gray[0],
                        },
                      })}
                    >
                      <Group position="apart">
                        <Box style={{ width: "66%" }}>
                          <Text weight={500}>{student.id__user__username}</Text>
                        </Box>
                        <Group spacing="md">
                          <Text color="dimmed" size="sm">
                            {student.programme}
                          </Text>
                          <Text
                            size="sm"
                            sx={(theme) => ({
                              backgroundColor: theme.colors.gray[1],
                              padding: "3px 10px",
                              borderRadius: theme.radius.sm,
                            })}
                          >
                            Room {student.room_no}
                          </Text>
                        </Group>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Text align="center" color="dimmed" mt="xl">
                    No students found matching your search criteria.
                  </Text>
                )}
              </Stack>
            )}
          </ScrollArea>
        </Box>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Impose Fine"
        size="md"
      >
        {selectedStudent && (
          <Stack spacing="md">
            <Card p="md" radius="sm" withBorder>
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Student ID
                </Text>
                <Text weight={500}>{selectedStudent.id__user__username}</Text>
              </Group>
              <Group position="apart" mt="xs">
                <Text size="sm" color="dimmed">
                  Room
                </Text>
                <Text>{selectedStudent.room_no}</Text>
              </Group>
            </Card>

            <Input
              placeholder="Enter amount"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.currentTarget.value)}
              label="Fine Amount"
              type="number"
              min="0.01"
              step="0.01"
            />

            <select
              value={fineCategory}
              onChange={(e) => setFineCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="Rule Violation">Rule Violation</option>
              <option value="Damage">Property Damage/Loss</option>
              <option value="Attendance">Attendance Violation</option>
              <option value="Room Standards">Room Standards Violation</option>
            </select>

            <Textarea
              placeholder="Enter reason for imposing fine"
              value={fineReason}
              onChange={(e) => setFineReason(e.currentTarget.value)}
              label="Reason"
              minRows={3}
            />

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setEvidence(e.target.files[0])}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <Text size="xs" color="dimmed">
              Optional: Upload evidence (PDF, JPG, PNG, max 5MB)
            </Text>

            <Group position="right" mt="md">
              <Button variant="default" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button onClick={handleImposeFine}>Impose Fine</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
