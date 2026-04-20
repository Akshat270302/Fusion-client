import React, { useState, useEffect } from "react";
import {
  Text,
  Stack,
  ScrollArea,
  Loader,
  Group,
  Alert,
  Container,
  Card,
  Box,
  Divider,
  Select,
  TextInput,
  Button,
} from "@mantine/core";
import axios from "axios";
import FineCard from "../../components/students/FineCard";
import { fine_show } from "../../../../routes/hostelManagementRoutes";

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const token = localStorage.getItem("authToken"); // Get the auth token from local storage

  const fetchFines = async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch fines from the backend
      const response = await axios.get(fine_show, {
        headers: { Authorization: `Token ${token}` },
      });

      setFines(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to fetch fines. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines(); // Fetch fines on component mount
  }, []);

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

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...Array.from(new Set(fines.map((fine) => fine.category).filter(Boolean))).map(
      (category) => ({ value: category, label: category }),
    ),
  ];

  const filteredFines = fines.filter((fine) => {
    if (statusFilter !== "all" && fine.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== "all" && fine.category !== categoryFilter) {
      return false;
    }

    if (fromDate || toDate) {
      const fineDate = fine.created_at ? new Date(fine.created_at) : null;
      if (!fineDate || Number.isNaN(fineDate.getTime())) {
        return false;
      }

      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (fineDate < from) {
          return false;
        }
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (fineDate > to) {
          return false;
        }
      }
    }

    return true;
  });

  const activeFines = filteredFines.filter((fine) => fine.status === "Pending");
  const pastFines = filteredFines.filter((fine) => fine.status === "Paid");

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setFromDate("");
    setToDate("");
  };

  const appliedFilters = [];
  if (statusFilter !== "all") appliedFilters.push(`Status: ${statusFilter}`);
  if (categoryFilter !== "all") appliedFilters.push(`Category: ${categoryFilter}`);
  if (fromDate) appliedFilters.push(`From: ${fromDate}`);
  if (toDate) appliedFilters.push(`To: ${toDate}`);

  return (
    <Container size="md" px="md">
      <Card shadow="sm" p={0} radius="md" withBorder>
        <Box p="lg" sx={{ height: "70vh" }}>
          <ScrollArea style={{ height: "100%" }}>
            <Stack spacing="xl">
              <div>
                <Text weight={500} size="lg" mb="md">
                  Filter Fines
                </Text>
                <Group align="end" spacing="sm" mb="sm">
                  <Select
                    label="Status"
                    w={180}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value || "all")}
                    data={[
                      { value: "all", label: "All" },
                      { value: "Pending", label: "Pending" },
                      { value: "Paid", label: "Paid" },
                    ]}
                  />
                  <Select
                    label="Category"
                    w={220}
                    value={categoryFilter}
                    onChange={(value) => setCategoryFilter(value || "all")}
                    data={categoryOptions}
                  />
                  <TextInput
                    label="From Date"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.currentTarget.value)}
                    w={170}
                  />
                  <TextInput
                    label="To Date"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.currentTarget.value)}
                    w={170}
                  />
                  <Button variant="light" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Group>
                {appliedFilters.length > 0 ? (
                  <Text size="sm" c="dimmed">
                    Applied filters: {appliedFilters.join(" | ")}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    Applied filters: None
                  </Text>
                )}
              </div>

              <Divider my="md" />

              {/* Active Fines */}
              <div>
                <Text weight={500} size="lg" mb="md">
                  Active Fines
                </Text>
                <Stack spacing="md">
                  {activeFines.length > 0 ? (
                    activeFines.map((fine) => (
                      <FineCard
                        key={fine.fine_id}
                        fine_id={fine.fine_id}
                        student_name={fine.student_name}
                        hall={fine.hall_name}
                        caretaker_name={fine.caretaker_name}
                        amount={fine.amount}
                        category={fine.category}
                        status={fine.status}
                        reason={fine.reason}
                        evidence={fine.evidence}
                        created_at={fine.created_at}
                        isPastFine={false}
                      />
                    ))
                  ) : (
                    <Text color="dimmed" align="center" py="md">
                      No active fines
                    </Text>
                  )}
                </Stack>
              </div>

              <Divider my="md" />

              {/* Past Fines */}
              <div>
                <Text weight={500} size="lg" mb="md">
                  Past Fines History
                </Text>
                <Stack spacing="md">
                  {pastFines.length > 0 ? (
                    pastFines.map((fine) => (
                      <FineCard
                        key={fine.fine_id}
                        fine_id={fine.fine_id}
                        student_name={fine.student_name}
                        hall={fine.hall_name}
                        caretaker_name={fine.caretaker_name}
                        amount={fine.amount}
                        category={fine.category}
                        status={fine.status}
                        reason={fine.reason}
                        evidence={fine.evidence}
                        created_at={fine.created_at}
                        isPastFine
                      />
                    ))
                  ) : (
                    <Text color="dimmed" align="center" py="md">
                      No past fines found.
                    </Text>
                  )}
                </Stack>
              </div>

              {filteredFines.length === 0 && (
                <Text color="dimmed" align="center" py="md">
                  No fines found matching the applied filters.
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Box>
      </Card>
    </Container>
  );
}
