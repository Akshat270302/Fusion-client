import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  guestRoomCaretakerCheckIn,
  guestRoomCaretakerCheckOut,
  guestRoomCaretakerDecision,
  guestRoomCaretakerPending,
  guestRoomCaretakerReport,
  guestRoomCaretakerSettings,
} from "../../../../routes/hostelManagementRoutes";

const today = new Date();
const formatDateInput = (dateObj) => dateObj.toISOString().slice(0, 10);

const defaultPolicy = {
  feature_enabled: true,
  charge_per_day: 0,
  min_advance_days: 0,
  max_advance_days: 90,
  max_booking_duration_days: 7,
  max_concurrent_bookings_per_student: 1,
  eligibility_note: "",
};

export default function ManageGuestRoomBookings() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingBookings, setPendingBookings] = useState([]);
  const [reportBookings, setReportBookings] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState({});
  const [policy, setPolicy] = useState(defaultPolicy);
  const [dateRange, setDateRange] = useState({
    start_date: formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)),
    end_date: formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 180)),
  });
  const [decisionInputs, setDecisionInputs] = useState({});
  const [checkinInputs, setCheckinInputs] = useState({});
  const [checkoutInputs, setCheckoutInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const resetStatusBanner = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchPending = async () => {
    try {
      const response = await axios.get(guestRoomCaretakerPending, {
        headers: getAuthHeaders(),
      });
      setPendingBookings(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch pending requests.",
      );
      setPendingBookings([]);
    }
  };

  const fetchPolicy = async () => {
    try {
      const response = await axios.get(guestRoomCaretakerSettings, {
        headers: getAuthHeaders(),
      });
      setPolicy({
        ...defaultPolicy,
        ...response.data,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch policy settings.",
      );
    }
  };

  const fetchReport = async () => {
    try {
      const response = await axios.get(guestRoomCaretakerReport, {
        headers: getAuthHeaders(),
        params: dateRange,
      });

      setReportBookings(Array.isArray(response.data?.bookings) ? response.data.bookings : []);
      setStatusBreakdown(response.data?.status_breakdown || {});
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch booking report.",
      );
      setReportBookings([]);
      setStatusBreakdown({});
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    resetStatusBanner();
    await Promise.all([fetchPending(), fetchReport(), fetchPolicy()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const updateDecisionInput = (bookingId, field, value) => {
    setDecisionInputs((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { decision: "approved", guest_room_id: "", comment: "" }),
        [field]: value,
      },
    }));
  };

  const handleDecision = async (bookingId) => {
    resetStatusBanner();
    const payload = decisionInputs[bookingId] || {
      decision: "approved",
      guest_room_id: "",
      comment: "",
    };

    try {
      const response = await axios.post(guestRoomCaretakerDecision(bookingId), payload, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Booking decision updated.");
      refreshAll();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to update booking decision.",
      );
    }
  };

  const updateCheckinInput = (bookingId, field, value) => {
    setCheckinInputs((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { id_proof_type: "", id_proof_number: "", checkin_notes: "" }),
        [field]: value,
      },
    }));
  };

  const handleCheckin = async (bookingId) => {
    resetStatusBanner();
    const payload = checkinInputs[bookingId] || {
      id_proof_type: "",
      id_proof_number: "",
      checkin_notes: "",
    };

    try {
      const response = await axios.post(guestRoomCaretakerCheckIn(bookingId), payload, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Guest checked in.");
      refreshAll();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to check in guest.",
      );
    }
  };

  const updateCheckoutInput = (bookingId, field, value) => {
    setCheckoutInputs((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { inspection_notes: "", damage_report: "", damage_amount: 0 }),
        [field]: value,
      },
    }));
  };

  const handleCheckout = async (bookingId) => {
    resetStatusBanner();
    const payload = checkoutInputs[bookingId] || {
      inspection_notes: "",
      damage_report: "",
      damage_amount: 0,
    };

    try {
      const response = await axios.post(guestRoomCaretakerCheckOut(bookingId), payload, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Guest checked out.");
      refreshAll();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to check out guest.",
      );
    }
  };

  const handlePolicyChange = (field, value) => {
    setPolicy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const savePolicy = async () => {
    resetStatusBanner();
    try {
      const response = await axios.post(guestRoomCaretakerSettings, policy, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Policy updated.");
      fetchPolicy();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to save policy.",
      );
    }
  };

  const actionableReportBookings = useMemo(
    () =>
      reportBookings.filter((booking) => ["approved", "checked_in"].includes((booking.status || "").toLowerCase())),
    [reportBookings],
  );

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Guest Room Management</Text>
          <Button variant="subtle" onClick={refreshAll} loading={loading}>
            Refresh
          </Button>
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

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="pending">Pending Requests</Tabs.Tab>
            <Tabs.Tab value="ops">Check-in / Check-out</Tabs.Tab>
            <Tabs.Tab value="settings">Policy & Report</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending" pt="md">
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Guest</Table.Th>
                    <Table.Th>Dates</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingBookings.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text align="center" color="dimmed" py="md">
                          No pending booking requests.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}

                  {pendingBookings.map((booking) => {
                    const form = decisionInputs[booking.id] || {
                      decision: "approved",
                      guest_room_id: "",
                      comment: "",
                    };

                    return (
                      <Table.Tr key={booking.id}>
                        <Table.Td>{booking.id}</Table.Td>
                        <Table.Td>{booking.intender_username || "-"}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{booking.guest_name}</Text>
                          <Text size="xs" color="dimmed">
                            {booking.guest_phone}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{booking.arrival_date}</Text>
                          <Text size="xs" color="dimmed">
                            to {booking.departure_date}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Stack spacing={6}>
                            <Group grow>
                              <TextInput
                                label="Decision"
                                value={form.decision}
                                onChange={(event) =>
                                  updateDecisionInput(
                                    booking.id,
                                    "decision",
                                    event.currentTarget.value.toLowerCase(),
                                  )
                                }
                                placeholder="approved / rejected"
                              />
                              <TextInput
                                label="Guest Room ID"
                                value={form.guest_room_id}
                                onChange={(event) =>
                                  updateDecisionInput(booking.id, "guest_room_id", event.currentTarget.value)
                                }
                                placeholder="Required for approval"
                              />
                            </Group>
                            <Textarea
                              label="Comment"
                              value={form.comment}
                              onChange={(event) =>
                                updateDecisionInput(booking.id, "comment", event.currentTarget.value)
                              }
                              minRows={2}
                              placeholder="Reason for decision"
                            />
                            <Button size="xs" onClick={() => handleDecision(booking.id)}>
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
          </Tabs.Panel>

          <Tabs.Panel value="ops" pt="md">
            <Group mb="sm" align="flex-end">
              <TextInput
                type="date"
                label="From"
                value={dateRange.start_date}
                onChange={(event) =>
                  setDateRange((prev) => ({ ...prev, start_date: event.currentTarget.value }))
                }
              />
              <TextInput
                type="date"
                label="To"
                value={dateRange.end_date}
                onChange={(event) =>
                  setDateRange((prev) => ({ ...prev, end_date: event.currentTarget.value }))
                }
              />
              <Button variant="outline" onClick={fetchReport}>
                Load Bookings
              </Button>
            </Group>

            <ScrollArea>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Booking</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Check-in</Table.Th>
                    <Table.Th>Check-out</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {actionableReportBookings.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text align="center" color="dimmed" py="md">
                          No approved or checked-in bookings in selected date range.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}

                  {actionableReportBookings.map((booking) => {
                    const normalizedStatus = (booking.status || "").toLowerCase();
                    const canCheckin = normalizedStatus === "approved";
                    const canCheckout = normalizedStatus === "checked_in";
                    const checkinForm = checkinInputs[booking.booking_id] || {
                      id_proof_type: "",
                      id_proof_number: "",
                      checkin_notes: "",
                    };
                    const checkoutForm = checkoutInputs[booking.booking_id] || {
                      inspection_notes: "",
                      damage_report: "",
                      damage_amount: 0,
                    };

                    return (
                      <Table.Tr key={booking.booking_id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            #{booking.booking_id} - {booking.guest_name}
                          </Text>
                          <Text size="xs" color="dimmed">
                            {booking.arrival_date} to {booking.departure_date}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={canCheckin || canCheckout ? "blue" : "gray"}>
                            {normalizedStatus}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Stack spacing={6}>
                            <TextInput
                              size="xs"
                              placeholder="ID proof type"
                              value={checkinForm.id_proof_type}
                              onChange={(event) =>
                                updateCheckinInput(
                                  booking.booking_id,
                                  "id_proof_type",
                                  event.currentTarget.value,
                                )
                              }
                              disabled={!canCheckin}
                            />
                            <TextInput
                              size="xs"
                              placeholder="ID proof number"
                              value={checkinForm.id_proof_number}
                              onChange={(event) =>
                                updateCheckinInput(
                                  booking.booking_id,
                                  "id_proof_number",
                                  event.currentTarget.value,
                                )
                              }
                              disabled={!canCheckin}
                            />
                            <Button
                              size="xs"
                              disabled={!canCheckin}
                              onClick={() => handleCheckin(booking.booking_id)}
                            >
                              Check-in
                            </Button>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack spacing={6}>
                            <TextInput
                              size="xs"
                              placeholder="Inspection notes"
                              value={checkoutForm.inspection_notes}
                              onChange={(event) =>
                                updateCheckoutInput(
                                  booking.booking_id,
                                  "inspection_notes",
                                  event.currentTarget.value,
                                )
                              }
                              disabled={!canCheckout}
                            />
                            <TextInput
                              size="xs"
                              placeholder="Damage details"
                              value={checkoutForm.damage_report}
                              onChange={(event) =>
                                updateCheckoutInput(
                                  booking.booking_id,
                                  "damage_report",
                                  event.currentTarget.value,
                                )
                              }
                              disabled={!canCheckout}
                            />
                            <NumberInput
                              size="xs"
                              placeholder="Damage amount"
                              value={checkoutForm.damage_amount}
                              min={0}
                              onChange={(value) =>
                                updateCheckoutInput(
                                  booking.booking_id,
                                  "damage_amount",
                                  Number(value) || 0,
                                )
                              }
                              disabled={!canCheckout}
                            />
                            <Button
                              size="xs"
                              color="teal"
                              disabled={!canCheckout}
                              onClick={() => handleCheckout(booking.booking_id)}
                            >
                              Check-out
                            </Button>
                          </Stack>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="settings" pt="md">
            <Stack spacing="md" maw={760}>
              <Checkbox
                checked={Boolean(policy.feature_enabled)}
                onChange={(event) => handlePolicyChange("feature_enabled", event.currentTarget.checked)}
                label="Enable Guest Room Booking"
              />

              <Group grow>
                <NumberInput
                  label="Charge per day"
                  min={0}
                  value={policy.charge_per_day}
                  onChange={(value) => handlePolicyChange("charge_per_day", Number(value) || 0)}
                />
                <NumberInput
                  label="Min advance days"
                  min={0}
                  value={policy.min_advance_days}
                  onChange={(value) => handlePolicyChange("min_advance_days", Number(value) || 0)}
                />
                <NumberInput
                  label="Max advance days"
                  min={1}
                  value={policy.max_advance_days}
                  onChange={(value) => handlePolicyChange("max_advance_days", Number(value) || 1)}
                />
              </Group>

              <Group grow>
                <NumberInput
                  label="Max booking duration (days)"
                  min={1}
                  value={policy.max_booking_duration_days}
                  onChange={(value) =>
                    handlePolicyChange("max_booking_duration_days", Number(value) || 1)
                  }
                />
                <NumberInput
                  label="Max concurrent bookings per student"
                  min={1}
                  value={policy.max_concurrent_bookings_per_student}
                  onChange={(value) =>
                    handlePolicyChange(
                      "max_concurrent_bookings_per_student",
                      Number(value) || 1,
                    )
                  }
                />
              </Group>

              <Textarea
                label="Eligibility note"
                value={policy.eligibility_note || ""}
                onChange={(event) => handlePolicyChange("eligibility_note", event.currentTarget.value)}
                minRows={2}
              />

              <Button onClick={savePolicy}>Save Policy</Button>

              <Box>
                <Text size="sm" fw={500} mb={6}>
                  Status Breakdown (selected report range)
                </Text>
                <Group>
                  {Object.keys(statusBreakdown).length === 0 && (
                    <Text size="sm" color="dimmed">
                      No bookings available for selected period.
                    </Text>
                  )}
                  {Object.entries(statusBreakdown).map(([statusKey, count]) => (
                    <Badge key={statusKey} variant="light">
                      {statusKey}: {count}
                    </Badge>
                  ))}
                </Group>
              </Box>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
}
