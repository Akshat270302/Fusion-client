import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import AddHostel from "./AddHostel";
import AssignCaretaker from "./AssignCaretaker";
import ManageHostelStatus from "./ManageHostelStatus";
import AssignBatch from "./AssignBatch";
import InventoryManagement from "./InventoryManagement";
import {
  hostelWorkflowBulkAllot,
  hostelWorkflowDashboard,
  hostelWorkflowEligibleStudents,
} from "../../../../routes/hostelManagementRoutes";

const STEP_LABELS = [
  "Step 1: Create Hostel",
  "Step 2: Assign Warden and Caretaker",
  "Step 3: Configure Rooms",
  "Step 4: Activate Hostel",
  "Step 5: Assign Batch",
  "Step 6: Fetch Eligible Students",
  "Step 7: Bulk Room Allotment",
  "Step 8: Occupancy Update",
  "Step 9: Notifications Sent",
  "Step 10: Hostel Operational",
];

const flagMap = {
  2: "staff_assigned",
  3: "rooms_configured",
  4: "hostel_activated",
  5: "batch_assigned",
  6: "eligible_students_fetched",
  7: "bulk_allotment_completed",
  8: "occupancy_updated",
  9: "notifications_sent",
  10: "operational",
};

export default function HostelLifecycleWorkflow() {
  const [workflow, setWorkflow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [studentSource, setStudentSource] = useState("batch");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [allotting, setAllotting] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const token = localStorage.getItem("authToken");

  const authHeaders = useMemo(
    () => ({ Authorization: `Token ${token}` }),
    [token],
  );

  const selectedHall = useMemo(
    () => workflow.find((row) => row.hall_id === selectedHallId) || null,
    [workflow, selectedHallId],
  );

  const refreshWorkflow = async () => {
    if (!token) {
      setMessage({ type: "error", text: "Authentication token missing." });
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(hostelWorkflowDashboard, {
        headers: authHeaders,
      });
      const rows = data?.workflow || [];
      setWorkflow(rows);
      if (!selectedHallId && rows.length > 0) {
        setSelectedHallId(rows[0].hall_id);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Unable to load workflow dashboard.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEligibleStudents = async () => {
    if (!selectedHallId) {
      setMessage({ type: "error", text: "Select a hostel first." });
      return;
    }

    try {
      const { data } = await axios.get(
        hostelWorkflowEligibleStudents(selectedHallId, studentSource),
        { headers: authHeaders },
      );
      const rows = data?.eligible_students || [];
      setEligibleStudents(rows);
      setSelectedStudentIds(rows.map((row) => row.student_id));
      setMessage({ type: "success", text: `Fetched ${rows.length} eligible students.` });
      await refreshWorkflow();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Unable to fetch eligible students.",
      });
    }
  };

  const handleToggleStudent = (studentId, checked) => {
    setSelectedStudentIds((prev) => {
      if (checked) {
        return prev.includes(studentId) ? prev : [...prev, studentId];
      }
      return prev.filter((id) => id !== studentId);
    });
  };

  const runBulkAllotment = async () => {
    if (!selectedHallId) {
      setMessage({ type: "error", text: "Select a hostel first." });
      return;
    }
    if (!selectedHall?.step_flags?.hostel_activated) {
      setMessage({
        type: "error",
        text: "Hostel must be active before running bulk allotment.",
      });
      return;
    }
    if (!selectedHall?.step_flags?.batch_assigned) {
      setMessage({
        type: "error",
        text: "Assign batch first, then fetch eligible students.",
      });
      return;
    }
    if (selectedStudentIds.length === 0) {
      setMessage({ type: "error", text: "Select at least one eligible student." });
      return;
    }
    if (selectedStudentIds.length % 3 !== 0) {
      setMessage({
        type: "error",
        text: "Selected students must be in complete groups of 3. Adjust selection and try again.",
      });
      return;
    }

    setAllotting(true);
    try {
      const { data } = await axios.post(
        hostelWorkflowBulkAllot(selectedHallId),
        {
          source: studentSource,
          student_ids: selectedStudentIds,
          force_reassign: false,
        },
        { headers: { ...authHeaders, "Content-Type": "application/json" } },
      );
      const assignedCount =
        data?.result?.assigned_groups_count || data?.result?.assigned_count || 0;
      setMessage({
        type: "success",
        text: `Bulk allotment completed for ${assignedCount} groups.`,
      });
      await refreshWorkflow();
      await fetchEligibleStudents();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Bulk allotment failed.",
      });
    } finally {
      setAllotting(false);
    }
  };

  const stepComplete = (stepIndex, hall) => {
    if (stepIndex === 1) return true;
    const key = flagMap[stepIndex];
    return Boolean(hall?.step_flags?.[key]);
  };

  return (
    <Tabs defaultValue="dashboard" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="dashboard">Room Allotment Dashboard</Tabs.Tab>
        <Tabs.Tab value="create">Step 1: Create Hostel</Tabs.Tab>
        <Tabs.Tab value="staff">Step 2: Assign Staff</Tabs.Tab>
        <Tabs.Tab value="activate">Step 4: Activate</Tabs.Tab>
        <Tabs.Tab value="batch">Step 5: Batch</Tabs.Tab>
        <Tabs.Tab value="allot">Bulk Room Assignment (Students)</Tabs.Tab>
        <Tabs.Tab value="inventory">Inventory Dependency</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="dashboard" pt="md">
        <Stack>
          {message.type === "success" && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              {message.text}
            </Alert>
          )}
          {message.type === "error" && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {message.text}
            </Alert>
          )}

          <Card withBorder>
            <Group justify="space-between" align="end">
              <Select
                label="Select Hostel"
                placeholder="Choose hostel"
                value={selectedHallId}
                onChange={setSelectedHallId}
                data={workflow.map((row) => ({
                  value: row.hall_id,
                  label: `${row.hall_name} (${row.hall_id})`,
                }))}
                style={{ minWidth: 320 }}
              />
              <Button loading={loading} onClick={refreshWorkflow}>
                Refresh State
              </Button>
            </Group>

            {selectedHall && (
              <Stack mt="md">
                <Group>
                  <Text fw={600}>{selectedHall.hall_name}</Text>
                  <Badge color={selectedHall.operational_status === "Active" ? "green" : "gray"}>
                    {selectedHall.operational_status}
                  </Badge>
                  <Badge color="blue">Current Step: {selectedHall.current_step}</Badge>
                </Group>

                <Table withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Lifecycle Step</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {STEP_LABELS.map((label, index) => {
                      const step = index + 1;
                      const complete = stepComplete(step, selectedHall);
                      return (
                        <Table.Tr key={label}>
                          <Table.Td>{label}</Table.Td>
                          <Table.Td>
                            <Badge color={complete ? "green" : "yellow"}>
                              {complete ? "Completed" : "Pending"}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}
          </Card>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="create" pt="md">
        <AddHostel />
      </Tabs.Panel>

      <Tabs.Panel value="staff" pt="md">
        <AssignCaretaker />
      </Tabs.Panel>

      <Tabs.Panel value="activate" pt="md">
        <ManageHostelStatus />
      </Tabs.Panel>

      <Tabs.Panel value="batch" pt="md">
        <AssignBatch />
      </Tabs.Panel>

      <Tabs.Panel value="allot" pt="md">
        <Stack>
          {message.type === "success" && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              {message.text}
            </Alert>
          )}
          {message.type === "error" && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {message.text}
            </Alert>
          )}
          <Alert color="blue" variant="light">
            Use this tab for super-admin bulk room assignment: first fetch eligible students, then click Run Bulk Room Allotment.
          </Alert>
          <Card withBorder>
            <Stack>
              <Text fw={600}>Step 6: Fetch Eligible Students</Text>
              <Group>
                <Select
                  label="Hostel"
                  value={selectedHallId}
                  onChange={setSelectedHallId}
                  data={workflow.map((row) => ({
                    value: row.hall_id,
                    label: `${row.hall_name} (${row.hall_id})`,
                  }))}
                  style={{ minWidth: 280 }}
                />
                <Select
                  label="Student Source"
                  value={studentSource}
                  onChange={(value) => setStudentSource(value || "batch")}
                  data={[
                    { value: "batch", label: "Batch List" },
                    { value: "requests", label: "Approved Requests" },
                  ]}
                  style={{ minWidth: 220 }}
                />
                <Button mt={24} onClick={fetchEligibleStudents}>
                  Fetch Eligible Students
                </Button>
              </Group>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Text fw={600}>Steps 7-10: Bulk Allotment, Occupancy, Notifications, Operational</Text>
              <Button onClick={runBulkAllotment} loading={allotting}>
                Run Bulk Room Allotment
              </Button>

              <ScrollArea.Autosize mah={360}>
                <Table withTableBorder striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Select</Table.Th>
                      <Table.Th>Student ID</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Batch</Table.Th>
                      <Table.Th>Current Allocation</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {eligibleStudents.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={5}>No eligible students loaded.</Table.Td>
                      </Table.Tr>
                    )}
                    {eligibleStudents.map((student) => (
                      <Table.Tr key={student.student_id}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedStudentIds.includes(student.student_id)}
                            onChange={(event) =>
                              handleToggleStudent(student.student_id, event.currentTarget.checked)
                            }
                          />
                        </Table.Td>
                        <Table.Td>{student.student_id}</Table.Td>
                        <Table.Td>{student.full_name}</Table.Td>
                        <Table.Td>{student.batch}</Table.Td>
                        <Table.Td>
                          {student.current_hall_id || "-"} {student.current_room ? `(${student.current_room})` : ""}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            </Stack>
          </Card>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="inventory" pt="md">
        {selectedHall?.step_flags?.hostel_activated ? (
          <InventoryManagement />
        ) : (
          <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
            Inventory workflow is locked until the hostel is activated.
          </Alert>
        )}
      </Tabs.Panel>
    </Tabs>
  );
}
