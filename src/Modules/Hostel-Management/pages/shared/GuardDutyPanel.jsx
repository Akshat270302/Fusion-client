import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import PropTypes from "prop-types";
import HallSelector from "./HallSelector";
import {
  guardDutyConcerns,
  guardDutyResolveConcern,
  guardDutyScheduleDetail,
  guardDutySchedules,
  getGuards,
} from "../../../../routes/hostelManagementRoutes";

const DAY_OPTIONS = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

const concernColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "resolved") return "green";
  if (normalized === "escalated") return "orange";
  return "gray";
};

export default function GuardDutyPanel({ role }) {
  const isAdmin = role === "admin";
  const canRaiseConcern = role === "warden" || role === "caretaker";

  const [selectedHall, setSelectedHall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingConcern, setSavingConcern] = useState(false);
  const [resolvingConcernId, setResolvingConcernId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [overview, setOverview] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [availableGuards, setAvailableGuards] = useState([]);
  const [guardNameByUsername, setGuardNameByUsername] = useState({});
  const [guardOptions, setGuardOptions] = useState([]);
  const [concerns, setConcerns] = useState([]);

  const [scheduleForm, setScheduleForm] = useState({
    staff_id: "",
    day: "Monday",
    start_time: "06:00",
    end_time: "14:00",
    override_policy: false,
  });
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const [concernSubject, setConcernSubject] = useState("");
  const [concernMessage, setConcernMessage] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState({});

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

  const resetStatus = () => {
    setError("");
    setSuccessMessage("");
  };

  const hallParams = useMemo(() => {
    if (isAdmin) {
      return selectedHall ? { hall_id: selectedHall } : null;
    }
    return null;
  }, [isAdmin, selectedHall]);

  const fetchSchedules = async () => {
    if (isAdmin && !selectedHall) {
      setSchedules([]);
      setOverview(null);
      setGuardOptions([]);
      return;
    }

    const response = await axios.get(guardDutySchedules, {
      headers: getAuthHeaders(),
      params: hallParams || undefined,
    });

    setOverview(response.data?.overview || null);
    setSchedules(Array.isArray(response.data?.schedules) ? response.data.schedules : []);

    const guards = Array.isArray(response.data?.available_guards)
      ? response.data.available_guards
      : [];
    setAvailableGuards(guards);
  };

  const fetchGuardDirectory = async () => {
    if (!isAdmin) {
      return;
    }

    const response = await axios.get(getGuards, {
      headers: getAuthHeaders(),
    });

    const guards = Array.isArray(response.data?.guard_staff)
      ? response.data.guard_staff
      : [];

    const nameMap = {};
    guards.forEach((guard) => {
      const username = String(guard.username || "").trim();
      const fullName = String(guard.full_name || "").trim();
      if (username) {
        nameMap[username] = fullName;
      }
    });

    setGuardNameByUsername(nameMap);
  };

  const fetchConcerns = async () => {
    if (isAdmin && !selectedHall) {
      setConcerns([]);
      return;
    }

    const response = await axios.get(guardDutyConcerns, {
      headers: getAuthHeaders(),
      params: hallParams || undefined,
    });

    setConcerns(Array.isArray(response.data?.concerns) ? response.data.concerns : []);
  };

  const fetchData = async () => {
    setLoading(true);
    resetStatus();
    const settled = await Promise.allSettled([
      fetchSchedules(),
      fetchConcerns(),
      fetchGuardDirectory(),
    ]);

    const firstFailure = settled.find((result) => result.status === "rejected");
    if (firstFailure) {
      const requestError = firstFailure.reason;
      setError(
        requestError?.response?.data?.error ||
          requestError?.message ||
          "Some guard duty data failed to load.",
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin && !selectedHall) {
      return;
    }
    fetchData();
  }, [selectedHall, role]);

  useEffect(() => {
    const options = availableGuards.map((guard) => {
      const preferredName = String(guardNameByUsername[guard.username] || "").trim();
      const fallbackName = String(guard.name || "").trim();
      const displayName = preferredName || fallbackName || guard.username;

      return {
        value: String(guard.staff_id),
        label: `${displayName} (${guard.username})`,
      };
    });
    setGuardOptions(options);
  }, [availableGuards, guardNameByUsername]);

  const resetScheduleForm = () => {
    setScheduleForm({
      staff_id: "",
      day: "Monday",
      start_time: "06:00",
      end_time: "14:00",
      override_policy: false,
    });
    setEditingScheduleId(null);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.staff_id) {
      setError("Please select a guard before saving schedule.");
      return;
    }

    resetStatus();
    setSavingSchedule(true);
    try {
      const payload = {
        ...scheduleForm,
        staff_id: scheduleForm.staff_id,
        hall_id: selectedHall,
      };

      if (editingScheduleId) {
        await axios.patch(guardDutyScheduleDetail(editingScheduleId), payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage("Guard duty schedule updated successfully.");
      } else {
        await axios.post(guardDutySchedules, payload, {
          headers: getAuthHeaders(),
        });
        setSuccessMessage("Guard duty schedule created successfully.");
      }

      resetScheduleForm();
      fetchData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to save guard schedule.",
      );
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      staff_id: String(schedule.staff_id),
      day: schedule.day,
      start_time: schedule.start_time || "06:00",
      end_time: schedule.end_time || "14:00",
      override_policy: false,
    });
  };

  const handleDeleteSchedule = async (scheduleId) => {
    resetStatus();
    try {
      await axios.delete(guardDutyScheduleDetail(scheduleId), {
        headers: getAuthHeaders(),
        data: { hall_id: selectedHall },
      });
      setSuccessMessage("Guard duty schedule deleted successfully.");
      fetchData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to delete guard schedule.",
      );
    }
  };

  const handleRaiseConcern = async () => {
    resetStatus();
    setSavingConcern(true);
    try {
      await axios.post(
        guardDutyConcerns,
        {
          subject: concernSubject,
          message: concernMessage,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setConcernSubject("");
      setConcernMessage("");
      setSuccessMessage("Guard duty concern submitted to super admin.");
      fetchConcerns();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit concern.",
      );
    } finally {
      setSavingConcern(false);
    }
  };

  const handleResolveConcern = async (concernId) => {
    resetStatus();
    setResolvingConcernId(concernId);
    try {
      await axios.post(
        guardDutyResolveConcern(concernId),
        {
          hall_id: selectedHall,
          response_notes: resolutionNotes[concernId] || "Reviewed and actioned.",
        },
        {
          headers: getAuthHeaders(),
        },
      );
      setSuccessMessage("Guard duty concern resolved.");
      fetchConcerns();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to resolve concern.",
      );
    } finally {
      setResolvingConcernId(null);
    }
  };

  return (
    <Stack spacing="md">
      {isAdmin && (
        <Paper withBorder radius="md" p="md">
          <HallSelector
            value={selectedHall}
            onChange={setSelectedHall}
            label="Select Hall For Guard Duty Management"
            placeholder="Choose hall before assigning guards"
            required
          />
        </Paper>
      )}

      {isAdmin && !selectedHall ? (
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          Select a hall first to assign and schedule guards.
        </Alert>
      ) : null}

      {error ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert icon={<IconCheck size={16} />} color="green" variant="light">
          {successMessage}
        </Alert>
      ) : null}

      {overview ? (
        <Group grow>
          <Card withBorder radius="md" p="md">
            <Text size="sm" c="dimmed">Active Guards Now</Text>
            <Text fw={700} fz="xl">{overview.active_guard_count}</Text>
          </Card>
          <Card withBorder radius="md" p="md">
            <Text size="sm" c="dimmed">Total Guard Shifts</Text>
            <Text fw={700} fz="xl">{overview.total_guard_shifts}</Text>
          </Card>
          <Card withBorder radius="md" p="md">
            <Text size="sm" c="dimmed">Coverage Risk</Text>
            <Badge color={overview.critical_gap ? "red" : "green"} variant="light">
              {overview.critical_gap ? "Critical Gap" : "Covered"}
            </Badge>
          </Card>
        </Group>
      ) : null}

      {isAdmin && (!isAdmin || selectedHall) ? (
        <Paper withBorder radius="md" p="md">
          <Stack>
            <Text fw={600}>Assign / Update Guard Shift</Text>
            <Group grow align="end">
              <Select
                label="Guard"
                data={guardOptions}
                searchable
                value={scheduleForm.staff_id}
                onChange={(value) =>
                  setScheduleForm((prev) => ({ ...prev, staff_id: value || "" }))
                }
                placeholder="Select guard"
                required
              />
              <Select
                label="Day"
                data={DAY_OPTIONS}
                value={scheduleForm.day}
                onChange={(value) =>
                  setScheduleForm((prev) => ({ ...prev, day: value || "Monday" }))
                }
                required
              />
              <TextInput
                label="Start Time"
                placeholder="HH:MM"
                value={scheduleForm.start_time}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, start_time: event.currentTarget.value }))
                }
              />
              <TextInput
                label="End Time"
                placeholder="HH:MM"
                value={scheduleForm.end_time}
                onChange={(event) =>
                  setScheduleForm((prev) => ({ ...prev, end_time: event.currentTarget.value }))
                }
              />
            </Group>

            <Group>
              <Button loading={savingSchedule} onClick={handleSaveSchedule}>
                {editingScheduleId ? "Update Schedule" : "Save Schedule"}
              </Button>
              {editingScheduleId ? (
                <Button variant="light" color="gray" onClick={resetScheduleForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </Group>
          </Stack>
        </Paper>
      ) : null}

      <Paper withBorder radius="md" p="md">
        <Stack>
          <Text fw={600}>Guard Shift Schedules</Text>
          <Table striped highlightOnHover withBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Guard</Table.Th>
                <Table.Th>Day</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Hall</Table.Th>
                {isAdmin ? <Table.Th>Actions</Table.Th> : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {schedules.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={isAdmin ? 5 : 4}>
                    <Text c="dimmed">{loading ? "Loading schedules..." : "No guard schedules found."}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                schedules.map((schedule) => {
                  const displayName = String(guardNameByUsername[schedule.staff_name] || schedule.staff_name || "Unknown");
                  return (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{displayName}</Table.Td>
                      <Table.Td>{schedule.day}</Table.Td>
                      <Table.Td>
                        {schedule.start_time} - {schedule.end_time}
                      </Table.Td>
                      <Table.Td>{schedule.hall_name}</Table.Td>
                      {isAdmin ? (
                        <Table.Td>
                          <Group spacing="xs">
                            <Button size="xs" variant="light" onClick={() => handleEditSchedule(schedule)}>
                              Edit
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              Delete
                            </Button>
                          </Group>
                        </Table.Td>
                      ) : null}
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      {canRaiseConcern ? (
        <Paper withBorder radius="md" p="md">
          <Stack>
            <Text fw={600}>Raise Guard Duty Concern</Text>
            <TextInput
              label="Subject"
              placeholder="Brief concern title"
              value={concernSubject}
              onChange={(event) => setConcernSubject(event.currentTarget.value)}
            />
            <Textarea
              label="Message"
              minRows={3}
              placeholder="Describe what needs to be changed or reviewed by super admin"
              value={concernMessage}
              onChange={(event) => setConcernMessage(event.currentTarget.value)}
            />
            <Button loading={savingConcern} onClick={handleRaiseConcern}>
              Submit Concern
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Paper withBorder radius="md" p="md">
        <Stack>
          <Text fw={600}>{isAdmin ? "Guard Duty Concerns Inbox" : "Submitted Guard Duty Concerns"}</Text>
          {concerns.length === 0 ? (
            <Text c="dimmed">No concerns found.</Text>
          ) : (
            concerns.map((concern) => (
              <Card key={concern.id} withBorder radius="md" p="md">
                <Stack spacing="xs">
                  <Group position="apart">
                    <Text fw={600}>{concern.subject}</Text>
                    <Badge color={concernColor(concern.status)} variant="light">
                      {concern.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Raised by: {concern.raised_by || "Unknown"}
                  </Text>
                  <Text size="sm">{concern.message}</Text>
                  {concern.response_notes ? (
                    <Alert color="green" variant="light">
                      Response: {concern.response_notes}
                    </Alert>
                  ) : null}

                  {isAdmin && concern.status !== "resolved" ? (
                    <Group align="end" grow>
                      <Textarea
                        label="Resolution Notes"
                        minRows={2}
                        value={resolutionNotes[concern.id] || ""}
                        onChange={(event) =>
                          setResolutionNotes((prev) => ({
                            ...prev,
                            [concern.id]: event.currentTarget.value,
                          }))
                        }
                      />
                      <Button
                        loading={resolvingConcernId === concern.id}
                        onClick={() => handleResolveConcern(concern.id)}
                      >
                        Resolve
                      </Button>
                    </Group>
                  ) : null}
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

GuardDutyPanel.propTypes = {
  role: PropTypes.oneOf(["admin", "warden", "caretaker"]).isRequired,
};
