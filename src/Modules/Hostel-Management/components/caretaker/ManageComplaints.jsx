import React, { useEffect, useState } from "react";
import {
  Box,
  Badge,
  Button,
  Modal,
  Select,
  Group,
  Loader,
  Alert,
  Stack,
  Paper,
  Text,
  Flex,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import {
  get_hostel_complaints,
  update_complaint_status,
  escalate_complaint,
} from "../../../../routes/hostelManagementRoutes";
import EscalationModal from "./EscalationModal";

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("pending");
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [selectedComplaintForEscalation, setSelectedComplaintForEscalation] =
    useState(null);

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
      const response = await fetch(get_hostel_complaints, {
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
      case "escalated":
        return "orange";
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

  const handleOpenUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(update_complaint_status, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          complaint_id: selectedComplaint.id,
          status: newStatus,
        }),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          data?.error || data?.detail || "Failed to update complaint status",
        );
        return;
      }

      setSuccess("Complaint status updated successfully!");
      setModalOpen(false);
      fetchComplaints();
    } catch (err) {
      console.error("Error updating complaint:", err);
      setError("An error occurred while updating the complaint");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenEscalationModal = (complaint) => {
    setSelectedComplaintForEscalation(complaint);
    setEscalationModalOpen(true);
  };

  const handleEscalateComplaint = async (escalationData) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setEscalationLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(escalate_complaint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(escalationData),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data?.error || data?.detail || "Failed to escalate complaint");
        return;
      }

      setSuccess("Complaint escalated to warden successfully!");
      setEscalationModalOpen(false);
      setSelectedComplaintForEscalation(null);
      fetchComplaints();
    } catch (err) {
      console.error("Error escalating complaint:", err);
      setError("An error occurred while escalating the complaint");
    } finally {
      setEscalationLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    if (status === "in_progress") return "In Progress";
    if (status === "escalated") return "Escalated";
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

      {success && (
        <Alert
          icon={<IconCheck size={20} />}
          color="green"
          mb="md"
          title="Success"
        >
          {success}
        </Alert>
      )}

      {complaints.length === 0 ? (
        <Paper p="md" sx={{ textAlign: "center" }}>
          <Text color="dimmed">No complaints to manage.</Text>
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
              <Stack spacing="md">
                <Flex justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group mb="xs">
                      <Text fw={600} size="lg">
                        {complaint.title}
                      </Text>
                      <Badge
                        color={getStatusColor(complaint.status)}
                        variant="filled"
                      >
                        {formatStatus(complaint.status)}
                      </Badge>
                    </Group>

                    <Text size="sm" color="dimmed" mb="xs">
                      <strong>Student:</strong>{" "}
                      {complaint.student?.id?.user?.username || "Unknown"}
                    </Text>

                    <Text size="sm" color="dimmed" mb="xs">
                      <strong>Submitted:</strong>{" "}
                      {formatDate(complaint.created_at)}
                    </Text>

                    <Text
                      size="sm"
                      style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}
                    >
                      {complaint.description}
                    </Text>
                  </Box>

                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleOpenUpdateModal(complaint)}
                    ml="md"
                  >
                    Update Status
                  </Button>
                </Flex>

                {complaint.status === "in_progress" && (
                  <Group mt="md">
                    <Button
                      variant="filled"
                      color="orange"
                      size="sm"
                      onClick={() => handleOpenEscalationModal(complaint)}
                    >
                      Escalate to Warden
                    </Button>
                  </Group>
                )}

                {complaint.escalation_reason && (
                  <Box
                    mt="md"
                    p="sm"
                    sx={{ backgroundColor: "#fff3bf" }}
                    style={{ borderRadius: "4px" }}
                  >
                    <Text size="xs" fw={500} mb="xs">
                      Escalation Reason:
                    </Text>
                    <Text size="sm">{complaint.escalation_reason}</Text>
                    {complaint.escalated_at && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Escalated on {formatDate(complaint.escalated_at)} by{" "}
                        {complaint.escalated_by_username || "Unknown"}
                      </Text>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Update Complaint Status"
        size="sm"
      >
        <Stack spacing="md">
          <Select
            label="New Status"
            value={newStatus}
            onChange={(value) => setNewStatus(value)}
            data={[
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
            ]}
          />

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating}
              loading={updating}
            >
              Update
            </Button>
          </Group>
        </Stack>
      </Modal>

      <EscalationModal
        opened={escalationModalOpen}
        onClose={() => setEscalationModalOpen(false)}
        onSubmit={handleEscalateComplaint}
        complaint={selectedComplaintForEscalation}
        loading={escalationLoading}
      />
    </Box>
  );
}
