import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import {
  guestRoomAvailability,
  guestRoomBookingRequest,
} from "../../../../routes/hostelManagementRoutes";

const ROOM_TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
];

const initialFormState = {
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
  nationality: "Indian",
  room_type: "single",
};

export default function GuestRoomBookingForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

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

  const checkAvailability = async () => {
    setError("");
    setSuccessMessage("");

    if (!formData.arrival_date || !formData.departure_date || !formData.room_type) {
      setError("Please select arrival date, departure date and room type first.");
      return;
    }

    setLoadingAvailability(true);
    try {
      const response = await axios.get(guestRoomAvailability, {
        headers: getAuthHeaders(),
        params: {
          arrival_date: formData.arrival_date,
          departure_date: formData.departure_date,
          room_type: formData.room_type,
          rooms_required: formData.rooms_required,
        },
      });

      setAvailabilityInfo(response.data);
    } catch (requestError) {
      setAvailabilityInfo(null);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to fetch availability.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        rooms_required: Number(formData.rooms_required) || 1,
        total_guest: Number(formData.total_guest) || 1,
      };

      const response = await axios.post(guestRoomBookingRequest, payload, {
        headers: getAuthHeaders(),
      });

      setSuccessMessage(response.data?.message || "Booking request submitted.");
      setFormData(initialFormState);
      setAvailabilityInfo(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit booking request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper shadow="xs" p={24} radius="md" withBorder sx={{ maxWidth: 980, margin: "0 auto" }}>
      <Stack spacing="md">
        {successMessage && (
          <Alert icon={<IconCheck size={16} />} color="teal" title="Success" variant="light">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <Group grow>
              <TextInput
                label="Guest Name"
                placeholder="Enter guest full name"
                value={formData.guest_name}
                onChange={(event) => handleChange("guest_name", event.currentTarget.value)}
                required
              />
              <TextInput
                label="Guest Phone"
                placeholder="10-digit phone number"
                value={formData.guest_phone}
                onChange={(event) => handleChange("guest_phone", event.currentTarget.value)}
                required
              />
            </Group>

            <Group grow>
              <TextInput
                label="Guest Email"
                placeholder="example@email.com"
                value={formData.guest_email}
                onChange={(event) => handleChange("guest_email", event.currentTarget.value)}
              />
              <TextInput
                label="Nationality"
                placeholder="Nationality"
                value={formData.nationality}
                onChange={(event) => handleChange("nationality", event.currentTarget.value)}
              />
            </Group>

            <Textarea
              label="Guest Address"
              placeholder="Enter guest address"
              value={formData.guest_address}
              onChange={(event) => handleChange("guest_address", event.currentTarget.value)}
              minRows={2}
            />

            <Group grow>
              <Select
                label="Room Type"
                data={ROOM_TYPE_OPTIONS}
                value={formData.room_type}
                onChange={(value) => handleChange("room_type", value || "single")}
                required
              />
              <NumberInput
                label="Rooms Required"
                value={formData.rooms_required}
                min={1}
                onChange={(value) => handleChange("rooms_required", Number(value) || 1)}
                required
              />
              <NumberInput
                label="Total Guests"
                value={formData.total_guest}
                min={1}
                onChange={(value) => handleChange("total_guest", Number(value) || 1)}
                required
              />
            </Group>

            <Group grow>
              <TextInput
                type="date"
                label="Arrival Date"
                value={formData.arrival_date}
                onChange={(event) => handleChange("arrival_date", event.currentTarget.value)}
                required
              />
              <TextInput
                type="time"
                label="Arrival Time"
                value={formData.arrival_time}
                onChange={(event) => handleChange("arrival_time", event.currentTarget.value)}
              />
              <TextInput
                type="date"
                label="Departure Date"
                value={formData.departure_date}
                onChange={(event) => handleChange("departure_date", event.currentTarget.value)}
                required
              />
              <TextInput
                type="time"
                label="Departure Time"
                value={formData.departure_time}
                onChange={(event) => handleChange("departure_time", event.currentTarget.value)}
              />
            </Group>

            <Textarea
              label="Purpose"
              placeholder="Reason for guest room request"
              value={formData.purpose}
              onChange={(event) => handleChange("purpose", event.currentTarget.value)}
              minRows={2}
              required
            />

            <Group justify="space-between">
              <Button variant="outline" loading={loadingAvailability} onClick={checkAvailability}>
                Check Availability
              </Button>
              <Button type="submit" loading={submitting}>
                Submit Booking Request
              </Button>
            </Group>
          </Stack>
        </form>

        {availabilityInfo && (
          <Box mt="sm">
            <Group mb="xs">
              <Badge color={availabilityInfo.is_available ? "green" : "red"}>
                {availabilityInfo.is_available ? "Available" : "Not Available"}
              </Badge>
              <Text size="sm" color="dimmed">
                Available rooms: {availabilityInfo.available_count} | Estimated total charge: Rs. {availabilityInfo.estimated_total_charge}
              </Text>
            </Group>
            <Text size="xs" color="dimmed">
              Policy: Min advance {availabilityInfo.policy?.min_advance_days} day(s), Max advance {availabilityInfo.policy?.max_advance_days} day(s), Max stay {availabilityInfo.policy?.max_booking_duration_days} day(s).
            </Text>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
