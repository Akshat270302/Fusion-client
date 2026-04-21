import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Group, Select, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import axios from "axios";
import { getBatches } from "../../../../routes/hostelManagementRoutes";

export default function HallSelector({
  value,
  onChange,
  label = "Select Hall",
  placeholder = "Choose a hall",
  required = true,
  disabled = false,
}) {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hallOptions = useMemo(
    () =>
      halls.map((hall) => ({
        value: hall.hall_id,
        label: `${hall.hall_name} (${hall.hall_id})`,
      })),
    [halls],
  );

  const loadHalls = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(getBatches, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const rows = Array.isArray(response.data?.halls) ? response.data.halls : [];
      setHalls(rows);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load halls.",
      );
      setHalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHalls();
  }, []);

  return (
    <Stack spacing="xs">
      <Group justify="space-between" align="end">
        <Select
          label={label}
          placeholder={placeholder}
          data={hallOptions}
          value={value}
          onChange={onChange}
          required={required}
          searchable
          clearable={!required}
          disabled={disabled || loading}
          w={320}
        />
        <Button variant="subtle" size="xs" onClick={loadHalls} loading={loading}>
          Refresh halls
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      {!error && !loading && hallOptions.length === 0 && (
        <Text size="sm" c="dimmed">
          No halls are available.
        </Text>
      )}
    </Stack>
  );
}
