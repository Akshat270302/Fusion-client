import React, { useState } from "react";
import {
  Alert,
  Card,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import { addHostelRoute } from "../../../../routes/hostelManagementRoutes"; // Adjust the import path as per your file structure

function AddHostel() {
  const [hallName, setHallName] = useState("");
  const [maxAccommodation, setMaxAccommodation] = useState(0);
  const [assignedBatch, setAssignedBatch] = useState("");
  const [typeOfSeater, setTypeOfSeater] = useState("");
  const [roomCount, setRoomCount] = useState(0);
  const [roomCapacity, setRoomCapacity] = useState(0);
  const [blockNo, setBlockNo] = useState("A");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: null,
    message: "",
  });

  const resetForm = () => {
    setHallName("");
    setMaxAccommodation(0);
    setAssignedBatch("");
    setTypeOfSeater("");
    setRoomCount(0);
    setRoomCapacity(0);
    setBlockNo("A");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!token) {
      setMessage({
        type: "error",
        message: "Authentication token not found. Please login again.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: null, message: "" });
    try {
      const data = {
        hall_name: hallName,
        max_accomodation: maxAccommodation,
        assigned_batch: assignedBatch,
        type_of_seater: typeOfSeater,
        room_count: roomCount,
        room_capacity: roomCapacity || undefined,
        block_no: blockNo,
      };

      const response = await axios.post(addHostelRoute, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (response.status === 201) {
        setMessage({
          type: "success",
          message:
            response.data?.message ||
            "Hostel created in inactive state successfully!",
        });
        resetForm();
      } else {
        setMessage({
          type: "error",
          message: "Submission failed. Please try again.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        message:
          error.response?.data?.error ||
          "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="lg" style={{ maxWidth: 640 }}>
      <Text fw={700} size="lg" mb="md">
        Add New Hostel
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack spacing="md">
          <TextInput
            label="Hostel Name"
            value={hallName}
            onChange={(e) => setHallName(e.target.value)}
            required
            placeholder="Enter hostel name"
          />

          <NumberInput
            label="Total Capacity"
            value={maxAccommodation}
            onChange={(value) => setMaxAccommodation(value)}
            required
            min={1}
            placeholder="Enter total student capacity"
          />

          <TextInput
            label="Assigned Batch"
            value={assignedBatch}
            onChange={(e) => setAssignedBatch(e.target.value)}
            required
            placeholder="e.g. 2024"
          />

          <Select
            label="Hostel Type (Seater)"
            placeholder="Select seater type"
            value={typeOfSeater}
            onChange={setTypeOfSeater}
            data={[
              { value: "single", label: "Single Seater" },
              { value: "double", label: "Double Seater" },
              { value: "triple", label: "Triple Seater" },
            ]}
            required
          />

          <NumberInput
            label="Number of Rooms"
            value={roomCount}
            onChange={(value) => setRoomCount(value)}
            min={1}
            required
            placeholder="Enter total rooms"
          />

          <NumberInput
            label="Room Capacity (optional override)"
            value={roomCapacity}
            onChange={(value) => setRoomCapacity(value)}
            min={0}
            placeholder="Leave 0 to use seater default"
          />

          <TextInput
            label="Block"
            value={blockNo}
            onChange={(e) => setBlockNo(e.target.value)}
            maxLength={1}
            placeholder="A"
          />

          <Group position="right" spacing="sm" mt="md">
            <Button variant="outline" onClick={resetForm}>
              Clear
            </Button>
            <Button type="submit" loading={loading}>
              Save Hostel
            </Button>
          </Group>

          {message.type === "success" && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              {message.message}
            </Alert>
          )}
          {message.type === "error" && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {message.message}
            </Alert>
          )}
        </Stack>
      </form>
    </Card>
  );
}

export default AddHostel;
