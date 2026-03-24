import React, { useState, useEffect } from "react";
import {
  Text,
  Group,
  Button,
  Stack,
  ScrollArea,
  Badge,
  Container,
  Loader,
  Card,
  Box,
  Divider,
  Alert,
} from "@mantine/core";
import axios from "axios";
import { host } from "../../../../routes/globalRoutes";

export default function FineManagement() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repeatOffenders, setRepeatOffenders] = useState([]);

  const fetchFines = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${host}/hostelmanagement/fines/hostel/`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setFines(response.data);
      setError(null);

      // Identify repeat offenders (students with 3+ unpaid fines)
      const unpaidFines = response.data.filter(
        (fine) => fine.status === "Pending",
      );
      const studentCounts = {};
      unpaidFines.forEach((fine) => {
        studentCounts[fine.student] = (studentCounts[fine.student] || 0) + 1;
      });
      const offenders = Object.keys(studentCounts).filter(
        (student) => studentCounts[student] >= 3,
      );
      setRepeatOffenders(offenders);
    } catch (err) {
      console.error("Error fetching fines:", err);
      setError(
        err.response?.data?.error ||
          "Failed to fetch fines. Please try again later.",
      );
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFineStatus = async (fineId, newStatus) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    try {
      await axios.patch(
        `${host}/hostelmanagement/fines/${fineId}/status/`,
        { status: newStatus },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      // Refresh fines
      fetchFines();
      alert(`Fine status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating fine status:", err);
      alert("Failed to update fine status. Please try again.");
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "green";
      case "pending":
        return "orange";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <Container size="md" px="md" style={{ height: "100%" }}>
        <Card
          shadow="sm"
          p="xl"
          radius="md"
          withBorder
          style={{ height: "100%" }}
        >
          <Group position="center" style={{ height: "100%" }}>
            <Loader size="md" />
          </Group>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" px="md">
        <Alert title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" px="md">
      <Card shadow="sm" p={0} radius="md" withBorder>
        <Box p="lg" sx={{ height: "70vh" }}>
          <ScrollArea style={{ height: "100%" }}>
            <Stack spacing="xl">
              {/* Repeat Offenders Alert */}
              {repeatOffenders.length > 0 && (
                <Alert title="Repeat Offenders" color="red" variant="filled">
                  <Text>
                    Students with 3+ unpaid fines: {repeatOffenders.join(", ")}
                  </Text>
                  <Text size="sm" mt="xs">
                    Consider disciplinary action.
                  </Text>
                </Alert>
              )}

              {/* Fine Summary */}
              <div>
                <Text weight={500} size="lg" mb="md">
                  Fine Summary
                </Text>
                <Group spacing="xl">
                  <div>
                    <Text size="sm" color="dimmed">
                      Total Fines
                    </Text>
                    <Text weight={600} size="xl">
                      {fines.length}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="dimmed">
                      Pending
                    </Text>
                    <Text weight={600} size="xl" color="orange">
                      {fines.filter((f) => f.status === "Pending").length}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="dimmed">
                      Paid
                    </Text>
                    <Text weight={600} size="xl" color="green">
                      {fines.filter((f) => f.status === "Paid").length}
                    </Text>
                  </div>
                </Group>
              </div>

              <Divider my="md" />

              {/* All Fines */}
              <div>
                <Text weight={500} size="lg" mb="md">
                  All Fines
                </Text>
                <Stack spacing="md">
                  {fines.length > 0 ? (
                    fines.map((fine) => (
                      <Card
                        key={fine.fine_id}
                        padding="md"
                        withBorder
                        radius="sm"
                      >
                        <Group position="apart" mb="sm">
                          <Group spacing="xs">
                            <Text weight={600} size="lg">
                              ₹{fine.amount.toLocaleString()}
                            </Text>
                            <Badge
                              color={getStatusColor(fine.status)}
                              size="sm"
                            >
                              {fine.status}
                            </Badge>
                          </Group>
                          {fine.status === "Pending" && (
                            <Button
                              size="xs"
                              color="green"
                              onClick={() =>
                                updateFineStatus(fine.fine_id, "Paid")
                              }
                            >
                              Mark as Paid
                            </Button>
                          )}
                        </Group>

                        <Group grow mb="sm">
                          <div>
                            <Text size="xs" color="dimmed">
                              Student
                            </Text>
                            <Text size="sm">{fine.student_name}</Text>
                          </div>
                          <div>
                            <Text size="xs" color="dimmed">
                              Category
                            </Text>
                            <Text size="sm">{fine.category}</Text>
                          </div>
                          <div>
                            <Text size="xs" color="dimmed">
                              Caretaker
                            </Text>
                            <Text size="sm">
                              {fine.caretaker_name || "N/A"}
                            </Text>
                          </div>
                        </Group>

                        <div>
                          <Text size="xs" color="dimmed" mb="xs">
                            Reason
                          </Text>
                          <Text size="sm">{fine.reason}</Text>
                        </div>

                        {fine.evidence && (
                          <div style={{ marginTop: "8px" }}>
                            <Text size="xs" color="dimmed" mb="xs">
                              Evidence
                            </Text>
                            <a
                              href={fine.evidence}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#228be6",
                                textDecoration: "underline",
                                fontSize: "14px",
                              }}
                            >
                              View Evidence
                            </a>
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <Text color="dimmed" align="center" py="md">
                      No fines found
                    </Text>
                  )}
                </Stack>
              </div>
            </Stack>
          </ScrollArea>
        </Box>
      </Card>
    </Container>
  );
}
