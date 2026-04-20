import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  extendedStayCaretakerDecision,
  extendedStayReviewRequests,
  extendedStayWardenDecision,
} from "../../../../routes/hostelManagementRoutes";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "green";
  if (["rejected", "cancelled"].includes(normalized)) return "red";
  return "yellow";
};

export default function ExtendedStayReviewPanel({ role }) {
  const [requests, setRequests] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      const params = {};
      if (statusFilter !== "all") {
        params.status = [statusFilter];
      }

      const response = await axios.get(extendedStayReviewRequests, {
        headers: getAuthHeaders(),
        params,
      });

      const rows = Array.isArray(response.data) ? response.data : [];
      setRequests(rows);
      setForms((prev) => {
        const next = { ...prev };
        rows.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = {
              decision: "Approved",
              remarks: "",
            };
          }
        });
        return next;
      });
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load extended stay requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const updateForm = (id, field, value) => {
    setForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { decision: "Approved", remarks: "" }),
        [field]: value,
      },
    }));
  };

  const handleSubmitDecision = async (requestId) => {
    setError("");
    setSuccessMessage("");

    const currentForm = forms[requestId] || {
      decision: "Approved",
      remarks: "",
    };

    try {
      const endpoint =
        role === "warden"
          ? extendedStayWardenDecision(requestId)
          : extendedStayCaretakerDecision(requestId);

      const response = await axios.post(
        endpoint,
        {
          decision: currentForm.decision,
          remarks: currentForm.remarks,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccessMessage(response.data?.message || "Decision submitted.");
      fetchRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit decision.",
      );
    }
  };

  const visibleRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((item) => (item.status || "").toLowerCase() === statusFilter.toLowerCase());
  }, [requests, statusFilter]);

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Extended Stay Review</Text>
          <Group>
            <Select
              label="Status"
              data={[
                { value: "all", label: "All" },
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
              allowDeselect={false}
              w={170}
            />
            <Button variant="subtle" onClick={fetchRequests} loading={loading}>
              Refresh
            </Button>
          </Group>
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

        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Dates</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && visibleRequests.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text align="center" c="dimmed" py="md">
                      No extended stay requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {visibleRequests.map((requestItem) => {
                const currentForm = forms[requestItem.id] || {
                  decision: "Approved",
                  remarks: "",
                };
                const isActionable = (requestItem.status || "").toLowerCase() === "pending";

                return (
                  <Table.Tr key={requestItem.id}>
                    <Table.Td>{requestItem.id}</Table.Td>
                    <Table.Td>{requestItem.student_username || "-"}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{requestItem.start_date || "-"}</Text>
                      <Text size="xs" c="dimmed">
                        to {requestItem.end_date || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>
                        {requestItem.reason || "-"}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        Auth: {requestItem.faculty_authorization || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColor(requestItem.status)} variant="light">
                        {requestItem.status || "Pending"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack spacing={6}>
                        <Select
                          label="Decision"
                          value={currentForm.decision || "Approved"}
                          data={[
                            { value: "Approved", label: "Approved" },
                            { value: "Rejected", label: "Rejected" },
                          ]}
                          onChange={(value) => updateForm(requestItem.id, "decision", value || "Approved")}
                          allowDeselect={false}
                          disabled={!isActionable}
                        />
                        <Textarea
                          label="Remarks"
                          minRows={1}
                          value={currentForm.remarks || ""}
                          onChange={(event) =>
                            updateForm(requestItem.id, "remarks", event.currentTarget.value)
                          }
                          disabled={!isActionable}
                        />
                        <Button
                          size="xs"
                          onClick={() => handleSubmitDecision(requestItem.id)}
                          disabled={!isActionable}
                        >
                          Submit Decision
                        </Button>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

ExtendedStayReviewPanel.propTypes = {
  role: PropTypes.oneOf(["caretaker", "warden"]).isRequired,
};
