import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Tabs,
  Table,
  Badge,
  Button,
  Modal,
  Stack,
  Group,
  Paper,
  Text,
  TextInput,
  Textarea,
  Select,
  Alert,
  Grid,
  ThemeIcon,
  SimpleGrid,
  Loader,
  Center,
  Divider,
  Title,
  Card,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFilter,
  IconReload,
  IconChecks,
  IconArrowRight,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  get_escalated_complaints,
  get_all_complaints_for_warden,
  resolve_complaint,
  reassign_complaint,
} from "../../routes/hostelManagementRoutes";

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

const getStatusColor = (status) => {
  const colorMap = {
    pending: "blue",
    in_progress: "yellow",
    escalated: "orange",
    resolved: "green",
  };
  return colorMap[status] || "gray";
};

const getStatusLabel = (status) => {
  const labelMap = {
    pending: "Pending",
    in_progress: "In Progress",
    escalated: "Escalated",
    resolved: "Resolved",
  };
  return labelMap[status] || status;
};

// ══════════════════════════════════════════════════════════════
// ESCALATED COMPLAINTS TAB
// ══════════════════════════════════════════════════════════════

function EscalatedComplaintsTab({ onRefresh }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const fetchEscalatedComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(get_escalated_complaints, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch escalated complaints");
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message || "An error occurred while fetching complaints");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch escalated complaints
  useEffect(() => {
    fetchEscalatedComplaints();
  }, []);

  const handleResolveComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResolveModalOpen(true);
  };

  const handleReassignComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setReassignModalOpen(true);
  };

  const handleRefresh = () => {
    fetchEscalatedComplaints();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert icon={<IconAlertCircle />} title="Error" color="red">
          {error}
        </Alert>
      )}

      <Group justify="space-between">
        <Text>
          Total Escalated: <strong>{complaints.length}</strong>
        </Text>
        <Button
          variant="light"
          leftSection={<IconReload size={16} />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Group>

      {complaints.length === 0 ? (
        <Paper p="xl" ta="center">
          <Text c="dimmed">No escalated complaints at the moment</Text>
        </Paper>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Student</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Escalated By</Table.Th>
              <Table.Th>Escalation Reason</Table.Th>
              <Table.Th>Escalated At</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {complaints.map((complaint) => (
              <Table.Tr key={complaint.id}>
                <Table.Td>#{complaint.id}</Table.Td>
                <Table.Td>{complaint.student_id}</Table.Td>
                <Table.Td>{complaint.title}</Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light">
                    General
                  </Badge>
                </Table.Td>
                <Table.Td>{complaint.escalated_by_username || "N/A"}</Table.Td>
                <Table.Td style={{ maxWidth: 200, wordBreak: "break-word" }}>
                  <Text size="sm">{complaint.escalation_reason || "N/A"}</Text>
                </Table.Td>
                <Table.Td>
                  {new Date(complaint.escalated_at).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      leftSection={<IconCheck size={14} />}
                      onClick={() => handleResolveComplaint(complaint)}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      leftSection={<IconArrowRight size={14} />}
                      onClick={() => handleReassignComplaint(complaint)}
                    >
                      Reassign
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <ResolveComplaintModal
        opened={resolveModalOpen}
        onClose={() => {
          setResolveModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onSuccess={() => {
          setResolveModalOpen(false);
          setSelectedComplaint(null);
          fetchEscalatedComplaints();
        }}
      />

      <ReassignComplaintModal
        opened={reassignModalOpen}
        onClose={() => {
          setReassignModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onSuccess={() => {
          setReassignModalOpen(false);
          setSelectedComplaint(null);
          fetchEscalatedComplaints();
        }}
      />
    </Stack>
  );
}

// ══════════════════════════════════════════════════════════════
// ALL COMPLAINTS TAB (HISTORY)
// ══════════════════════════════════════════════════════════════

function AllComplaintsTabHistory({ onRefresh }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAllComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(get_all_complaints_for_warden, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch complaints");
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const handleRefresh = () => {
    fetchAllComplaints();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert icon={<IconAlertCircle />} title="Error" color="red">
          {error}
        </Alert>
      )}

      <Group justify="space-between">
        <Text>
          Total Complaints: <strong>{complaints.length}</strong>
        </Text>
        <Button
          variant="light"
          leftSection={<IconReload size={16} />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Group>

      {complaints.length === 0 ? (
        <Paper p="xl" ta="center">
          <Text c="dimmed">No complaints found</Text>
        </Paper>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Escalated At</Table.Th>
                <Table.Th>Resolved At</Table.Th>
                <Table.Th>Resolved By</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {complaints.map((complaint) => (
                <Table.Tr key={complaint.id}>
                  <Table.Td>#{complaint.id}</Table.Td>
                  <Table.Td>{complaint.student_id}</Table.Td>
                  <Table.Td>{complaint.title}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={getStatusColor(complaint.status)}
                      variant="light"
                    >
                      {getStatusLabel(complaint.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    {complaint.escalated_at
                      ? new Date(complaint.escalated_at).toLocaleDateString()
                      : "-"}
                  </Table.Td>
                  <Table.Td>
                    {complaint.resolved_at
                      ? new Date(complaint.resolved_at).toLocaleDateString()
                      : "-"}
                  </Table.Td>
                  <Table.Td>{complaint.resolved_by_username || "-"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Stack>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS TAB
// ══════════════════════════════════════════════════════════════

function ReportsTab() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchReportData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(get_all_complaints_for_warden, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await response.json();
      let filtered = data.complaints || [];

      // Apply date range filter
      if (startDate) {
        filtered = filtered.filter((c) => new Date(c.created_at) >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter((c) => new Date(c.created_at) <= endDate);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }

      setComplaints(filtered);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      inProgress: complaints.filter((c) => c.status === "in_progress").length,
      escalated: complaints.filter((c) => c.status === "escalated").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      resolutionRate:
        complaints.length > 0
          ? (
              (complaints.filter((c) => c.status === "resolved").length /
                complaints.length) *
              100
            ).toFixed(1)
          : "0",
    };
  };

  const stats = calculateStatistics();

  return (
    <Stack gap="md">
      {error && (
        <Alert icon={<IconAlertCircle />} title="Error" color="red">
          {error}
        </Alert>
      )}

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text fw={500}>Generate Report</Text>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateInput
                label="Start Date"
                placeholder="From"
                value={startDate}
                onChange={setStartDate}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateInput
                label="End Date"
                placeholder="To"
                value={endDate}
                onChange={setEndDate}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Status Filter"
                placeholder="Select status"
                data={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "escalated", label: "Escalated" },
                  { value: "resolved", label: "Resolved" },
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || "all")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Button
                mt="xl"
                onClick={fetchReportData}
                loading={loading}
                fullWidth
              >
                Generate Report
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <StatCard
          title="Total Complaints"
          value={stats.total}
          color="blue"
          icon={<IconAlertTriangle size={24} />}
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          color="green"
          icon={<IconCheck size={24} />}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          color="yellow"
          icon={<IconClock size={24} />}
        />
        <StatCard
          title="Escalated"
          value={stats.escalated}
          color="orange"
          icon={<IconAlertCircle size={24} />}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          color="gray"
          icon={<IconFilter size={24} />}
        />
        <StatCard
          title="Resolution Rate"
          value={`${stats.resolutionRate}%`}
          color="violet"
          icon={<IconChecks size={24} />}
        />
      </SimpleGrid>

      {/* Detailed Report Table */}
      {complaints.length > 0 && (
        <Paper p="md" withBorder>
          <Text fw={500} mb="md">
            Report Details ({complaints.length} complaints)
          </Text>
          <Table striped highlightOnHover size="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {complaints.map((complaint) => (
                <Table.Tr key={complaint.id}>
                  <Table.Td>#{complaint.id}</Table.Td>
                  <Table.Td>{complaint.student_id}</Table.Td>
                  <Table.Td>{complaint.title}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={getStatusColor(complaint.status)}
                      variant="light"
                    >
                      {getStatusLabel(complaint.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}

// ══════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════

function ResolveComplaintModal({ opened, onClose, complaint, onSuccess }) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 10) {
      setError("Resolution notes must be at least 10 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(resolve_complaint, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaint_id: complaint.id,
          resolution_notes: resolutionNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resolve complaint");
      }

      setResolutionNotes("");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Resolve Complaint">
      <Stack gap="md">
        {complaint && (
          <>
            <div>
              <Text size="sm" c="dimmed">
                Complaint ID: #{complaint.id}
              </Text>
              <Text fw={500}>{complaint.title}</Text>
              <Text size="sm" mt="xs">
                {complaint.description}
              </Text>
            </div>
            <Divider />
          </>
        )}

        {error && (
          <Alert icon={<IconAlertCircle />} title="Error" color="red">
            {error}
          </Alert>
        )}

        <Textarea
          label="Resolution Notes"
          placeholder="Provide resolution details (minimum 10 characters)"
          minRows={4}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.currentTarget.value)}
          required
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleResolve} loading={loading} color="green">
            Resolve Complaint
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function ReassignComplaintModal({ opened, onClose, complaint, onSuccess }) {
  const [caretakerId, setCaretakerId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReassign = async () => {
    if (!caretakerId) {
      setError("Please select a caretaker");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(reassign_complaint, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaint_id: complaint.id,
          caretaker_id: parseInt(caretakerId, 10),
          instructions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reassign complaint");
      }

      setCaretakerId("");
      setInstructions("");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Reassign Complaint">
      <Stack gap="md">
        {complaint && (
          <>
            <div>
              <Text size="sm" c="dimmed">
                Complaint ID: #{complaint.id}
              </Text>
              <Text fw={500}>{complaint.title}</Text>
            </div>
            <Divider />
          </>
        )}

        {error && (
          <Alert icon={<IconAlertCircle />} title="Error" color="red">
            {error}
          </Alert>
        )}

        <TextInput
          label="Caretaker Staff ID"
          placeholder="Enter caretaker staff ID"
          value={caretakerId}
          onChange={(e) => setCaretakerId(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Reassignment Instructions"
          placeholder="Provide instructions for the caretaker (optional)"
          minRows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReassign} loading={loading} color="blue">
            Reassign to Caretaker
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ══════════════════════════════════════════════════════════════

function StatCard({ title, value, color, icon }) {
  return (
    <Card p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text c="dimmed" size="sm" fw={500}>
            {title}
          </Text>
          <Text fw={700} size="lg" mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function WardenComplaintsView() {
  return (
    <Container py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Warden Complaint Management Dashboard</Title>
          <Text c="dimmed" mt="xs">
            Manage hostel complaints, view escalations, and generate reports
          </Text>
        </div>

        <Tabs defaultValue="escalated">
          <Tabs.List>
            <Tabs.Tab
              value="escalated"
              leftSection={<IconAlertTriangle size={14} />}
            >
              Escalated Complaints
            </Tabs.Tab>
            <Tabs.Tab value="all" leftSection={<IconClock size={14} />}>
              All Complaints (History)
            </Tabs.Tab>
            <Tabs.Tab value="reports" leftSection={<IconFilter size={14} />}>
              Reports & Statistics
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="escalated" pt="md">
            <EscalatedComplaintsTab />
          </Tabs.Panel>

          <Tabs.Panel value="all" pt="md">
            <AllComplaintsTabHistory />
          </Tabs.Panel>

          <Tabs.Panel value="reports" pt="md">
            <ReportsTab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

const complaintShape = PropTypes.shape({
  id: PropTypes.number,
  student_id: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  status: PropTypes.string,
  escalation_reason: PropTypes.string,
  escalated_by_username: PropTypes.string,
  escalated_at: PropTypes.string,
  resolved_at: PropTypes.string,
  resolved_by_username: PropTypes.string,
  created_at: PropTypes.string,
});

EscalatedComplaintsTab.propTypes = {
  onRefresh: PropTypes.func,
};

EscalatedComplaintsTab.defaultProps = {
  onRefresh: undefined,
};

AllComplaintsTabHistory.propTypes = {
  onRefresh: PropTypes.func,
};

AllComplaintsTabHistory.defaultProps = {
  onRefresh: undefined,
};

ResolveComplaintModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  complaint: complaintShape,
  onSuccess: PropTypes.func,
};

ResolveComplaintModal.defaultProps = {
  complaint: null,
  onSuccess: undefined,
};

ReassignComplaintModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  complaint: complaintShape,
  onSuccess: PropTypes.func,
};

ReassignComplaintModal.defaultProps = {
  complaint: null,
  onSuccess: undefined,
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};
