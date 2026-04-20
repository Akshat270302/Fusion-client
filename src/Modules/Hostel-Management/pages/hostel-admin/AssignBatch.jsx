import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Alert,
  Anchor,
  Box,
  Select,
  Text,
  Button,
  Card,
  Stack,
  TextInput,
  Group,
  FileButton,
  Container,
  Table,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { Upload } from "@phosphor-icons/react";
import {
  getBatches,
  assign_batch,
} from "../../../../routes/hostelManagementRoutes";

axios.defaults.withXSRFToken = true;

export default function AssignBatch() {
  const [allHall, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [batchInput, setBatchInput] = useState("");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [academicSession, setAcademicSession] = useState(
    "August 2024 - July 2025",
  );
  const [message, setMessage] = useState({
    type: null,
    message: "",
  });
  const [errors, setErrors] = useState({});

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_FILE_EXTENSIONS = ["pdf", "docx", "xlsx"];

  const generateAcademicSessions = () => {
    const sessions = [];
    for (let i = 0; i < 10; i += 1) {
      const startYear = 2024 + i;
      sessions.push(`August ${startYear} - July ${startYear + 1}`);
    }
    return sessions;
  };

  const academicSessions = generateAcademicSessions();

  const showMessage = (type, text) => {
    setMessage({ type, message: text });
  };

  const resetForm = () => {
    setSelectedHall(null);
    setBatchInput("");
    setFile(null);
    setErrors({});
  };

  const loadBatchData = () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      showMessage("error", "Authentication token not found. Please login again.");
      return;
    }

    axios
      .get(getBatches, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const {
          halls = [],
          allocations: fetchedAllocations = [],
          available_batches: fetchedBatches = [],
        } = response.data;
        setHalls(
          halls.map((h) => ({
            value: h.hall_id,
            label: `${h.hall_name} (${h.hall_id})`,
          })),
        );
        setAllocations(fetchedAllocations);
        setAvailableBatches(
          fetchedBatches.map((batch) => ({
            value: batch.value,
            label: `${batch.label} (${batch.student_count} students)`,
          })),
        );
      })
      .catch(() => {
        showMessage("error", "Failed to fetch data. Please try again.");
      });
  };

  useEffect(() => {
    loadBatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const validationErrors = {};

    if (!selectedHall) validationErrors.selectedHall = "Hall is required.";
    if (!batchInput.trim()) validationErrors.batchInput = "Assigned batch is required.";
    if (!academicSession) validationErrors.academicSession = "Academic session is required.";

    if (file) {
      const extension = (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
        validationErrors.file = "Allowed formats: pdf, docx, xlsx.";
      } else if (file.size > MAX_FILE_SIZE) {
        validationErrors.file = "File size must be 5 MB or less.";
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    setMessage({ type: null, message: "" });

    if (!token) {
      showMessage("error", "Authentication token not found. Please login again.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("academic_session", academicSession);
    formData.append("hall_id", selectedHall);
    formData.append("batch", batchInput.trim());
    if (file) {
      formData.append("document", file);
    }

    try {
      await axios.post(assign_batch, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      showMessage("success", "Batch allocation saved successfully.");
      resetForm();
      loadBatchData();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.error || "Failed to upload file. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Card withBorder shadow="md" p="lg" radius="md">
        <Stack spacing="md">
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

          <Select
            label="Hall"
            placeholder="Select Hall"
            data={allHall}
            value={selectedHall}
            onChange={setSelectedHall}
            error={errors.selectedHall}
            required
          />

          {availableBatches.length > 0 ? (
            <Select
              label="Assigned Batch"
              placeholder="Select Batch"
              data={availableBatches}
              value={batchInput}
              onChange={(value) => setBatchInput(value || "")}
              error={errors.batchInput}
              searchable
              required
            />
          ) : (
            <TextInput
              label="Assigned Batch"
              placeholder="Enter Batch"
              value={batchInput}
              onChange={(e) => setBatchInput(e.currentTarget.value)}
              error={errors.batchInput}
              required
            />
          )}

          <Select
            label="Academic Session"
            placeholder="Select Academic Session"
            data={academicSessions}
            value={academicSession}
            onChange={setAcademicSession}
            error={errors.academicSession}
            required
          />

          <Box>
            <Text fw={500} size="sm" mb={5}>
              Upload Document
            </Text>
            <Group spacing="sm">
              <FileButton onChange={setFile} accept=".pdf,.docx,.xlsx">
                {(props) => (
                  /* eslint-disable react/jsx-props-no-spreading */
                  <Button
                    leftIcon={<Upload size={20} />}
                    variant="light"
                    {...props}
                  >
                    {file ? file.name : "Choose File"}
                  </Button>
                )}
              </FileButton>
              {file && (
                <Button
                  variant="subtle"
                  color="red"
                  onClick={() => {
                    setFile(null);
                    setErrors((prev) => ({ ...prev, file: null }));
                  }}
                >
                  Clear
                </Button>
              )}
            </Group>
            {errors.file && (
              <Text c="red" size="sm" mt={6}>
                {errors.file}
              </Text>
            )}
            <Text c="dimmed" size="xs" mt={6}>
              Allowed: pdf, docx, xlsx (max 5 MB)
            </Text>
          </Box>

          <Group position="right" mt="md">
            <Button
              color="green"
              loading={loading}
              onClick={handleUpload}
            >
              Upload / Submit
            </Button>
          </Group>

          <Table withTableBorder withColumnBorders striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Hall</Table.Th>
                <Table.Th>Batch</Table.Th>
                <Table.Th>Academic Session</Table.Th>
                <Table.Th>Document</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {allocations.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>No batch allocations yet.</Table.Td>
                </Table.Tr>
              )}
              {allocations.map((allocation) => (
                <Table.Tr key={allocation.id}>
                  <Table.Td>{allocation.hall_name}</Table.Td>
                  <Table.Td>{allocation.batch_name}</Table.Td>
                  <Table.Td>{allocation.academic_session}</Table.Td>
                  <Table.Td>
                    {allocation.document_url ? (
                      <Anchor href={allocation.document_url} target="_blank" rel="noreferrer">
                        View
                      </Anchor>
                    ) : (
                      "-"
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Container>
  );
}
