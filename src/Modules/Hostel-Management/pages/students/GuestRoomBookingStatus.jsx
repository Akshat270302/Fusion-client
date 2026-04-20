import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  guestRoomBookingCancel,
  guestRoomBookingModify,
  guestRoomMyBookings,
} from "../../../../routes/hostelManagementRoutes";

const initialEditState = {
  id: null,
  guest_name: "",
  guest_phone: "",
  guest_email: "",
  guest_address: "",
  rooms_required: 1,
  total_guest: 1,
  purpose: "",
  arrival_date: "",
  arrival_time: "",
  departure_date: "",
  departure_time: "",
  nationality: "",
  room_type: "single",
};

const cancellableStatuses = ["pending", "approved", "confirmed"];

export default function GuestRoomBookingStatus() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editState, setEditState] = useState(initialEditState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(guestRoomMyBookings, {
        headers: getAuthHeaders(),
      });

      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load booking history.",
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatStatusColor = (status) => {
    if (["approved", "confirmed", "checked_in", "completed"].includes(status)) {
      return "green";
    }

    if (["rejected", "cancelled", "canceled"].includes(status)) {
      return "red";
    }

    return "yellow";
  };

  const preparedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [bookings],
  );

  const handleCancel = async (bookingId) => {
    const reason = window.prompt("Enter cancellation reason (optional):", "") || "";
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        guestRoomBookingCancel(bookingId),
        { cancel_reason: reason },
        { headers: getAuthHeaders() },
      );

      setSuccessMessage(response.data?.message || "Booking cancelled.");
      fetchBookings();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to cancel booking.",
      );
    }
  };

  const openEditModal = (booking) => {
    setEditState({
      id: booking.id,
      guest_name: booking.guest_name || "",
      guest_phone: booking.guest_phone || "",
      guest_email: booking.guest_email || "",
      guest_address: booking.guest_address || "",
      rooms_required: booking.rooms_required || 1,
      total_guest: booking.total_guest || 1,
      purpose: booking.purpose || "",
      arrival_date: booking.arrival_date || "",
      arrival_time: booking.arrival_time || "",
      departure_date: booking.departure_date || "",
      departure_time: booking.departure_time || "",
      nationality: booking.nationality || "",
      room_type: booking.room_type || "single",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (name, value) => {
    setEditState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSave = async () => {
    setSavingEdit(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        guestRoomBookingModify(editState.id),
        {
          ...editState,
          rooms_required: Number(editState.rooms_required) || 1,
          total_guest: Number(editState.total_guest) || 1,
        },
        { headers: getAuthHeaders() },
      );

      setSuccessMessage(response.data?.message || "Booking updated.");
      setIsEditOpen(false);
      fetchBookings();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to modify booking.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>My Guest Room Booking Requests</Text>
          <Button variant="subtle" onClick={fetchBookings} loading={loading}>
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

        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Guest</Table.Th>
                <Table.Th>Dates</Table.Th>
                <Table.Th>Room Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Total Charge</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && preparedBookings.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text align="center" color="dimmed" py="md">
                      No guest room bookings found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {preparedBookings.map((booking) => {
                const normalizedStatus = (booking.status || "").toLowerCase();
                const canModify = normalizedStatus === "pending";
                const canCancel = cancellableStatuses.includes(normalizedStatus);

                return (
                  <Table.Tr key={booking.id}>
                    <Table.Td>{booking.id}</Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {booking.guest_name || "-"}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {booking.guest_phone || ""}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{booking.arrival_date || "-"}</Text>
                      <Text size="xs" color="dimmed">
                        to {booking.departure_date || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>{booking.room_type || "-"}</Table.Td>
                    <Table.Td>
                      <Badge color={formatStatusColor(normalizedStatus)} variant="light">
                        {normalizedStatus || "pending"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>Rs. {booking.total_charge ?? 0}</Table.Td>
                    <Table.Td>
                      <Group spacing={6}>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={!canModify}
                          onClick={() => openEditModal(booking)}
                        >
                          Modify
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          disabled={!canCancel}
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>

      <Modal
        opened={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modify Booking Request"
        size="lg"
      >
        <Stack spacing="sm">
          <Group grow>
            <TextInput
              label="Guest Name"
              value={editState.guest_name}
              onChange={(event) => handleEditChange("guest_name", event.currentTarget.value)}
            />
            <TextInput
              label="Guest Phone"
              value={editState.guest_phone}
              onChange={(event) => handleEditChange("guest_phone", event.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              type="date"
              label="Arrival Date"
              value={editState.arrival_date}
              onChange={(event) => handleEditChange("arrival_date", event.currentTarget.value)}
            />
            <TextInput
              type="date"
              label="Departure Date"
              value={editState.departure_date}
              onChange={(event) => handleEditChange("departure_date", event.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              type="time"
              label="Arrival Time"
              value={editState.arrival_time || ""}
              onChange={(event) => handleEditChange("arrival_time", event.currentTarget.value)}
            />
            <TextInput
              type="time"
              label="Departure Time"
              value={editState.departure_time || ""}
              onChange={(event) => handleEditChange("departure_time", event.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Room Type"
              value={editState.room_type}
              onChange={(event) => handleEditChange("room_type", event.currentTarget.value)}
            />
            <NumberInput
              label="Rooms Required"
              value={editState.rooms_required}
              min={1}
              onChange={(value) => handleEditChange("rooms_required", Number(value) || 1)}
            />
            <NumberInput
              label="Total Guests"
              value={editState.total_guest}
              min={1}
              onChange={(value) => handleEditChange("total_guest", Number(value) || 1)}
            />
          </Group>

          <Textarea
            label="Purpose"
            value={editState.purpose}
            onChange={(event) => handleEditChange("purpose", event.currentTarget.value)}
            minRows={2}
          />

          <Box>
            <Button onClick={handleEditSave} loading={savingEdit}>
              Save Changes
            </Button>
          </Box>
        </Stack>
      </Modal>
    </Paper>
  );
}
