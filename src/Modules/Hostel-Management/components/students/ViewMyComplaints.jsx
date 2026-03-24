import React, { useEffect, useState } from "react";
import {
  Box,
  Badge,
  Group,
  Loader,
  Alert,
  Stack,
  Paper,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { get_student_complaints } from "../../../../routes/hostelManagementRoutes";

export default function ViewMyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchComplaints() {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(get_student_complaints, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
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
        setError(data?.error || data?.detail || "Failed to fetch complaints");
        return;
      }

      setComplaints(data?.complaints || []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError("An error occurred while fetching complaints");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "yellow";
      case "in_progress":
        return "blue";
      case "resolved":
        return "green";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    if (status === "in_progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          color="red"
          mb="md"
          title="Error"
        >
          {error}
        </Alert>
      )}

      {complaints.length === 0 ? (
        <Paper p="md" sx={{ textAlign: "center" }}>
          <Text color="dimmed">No complaints submitted yet.</Text>
        </Paper>
      ) : (
        <Stack spacing="md">
          {complaints.map((complaint) => (
            <Paper
              key={complaint.id}
              p="md"
              sx={(theme) => ({
                border: `1px solid ${theme.colors.gray[3]}`,
                borderRadius: theme.radius.md,
                backgroundColor: theme.white,
              })}
            >
              <Stack spacing="xs">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text fw={600}>{complaint.title}</Text>
                    <Text size="sm" color="dimmed">
                      {formatDate(complaint.created_at)}
                    </Text>
                  </Box>
                  <Badge
                    color={getStatusColor(complaint.status)}
                    variant="filled"
                  >
                    {formatStatus(complaint.status)}
                  </Badge>
                </Group>

                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {complaint.description}
                </Text>

                {complaint.updated_at &&
                  new Date(complaint.updated_at) >
                    new Date(complaint.created_at) && (
                    <Text size="xs" color="dimmed">
                      Last updated: {formatDate(complaint.updated_at)}
                    </Text>
                  )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
