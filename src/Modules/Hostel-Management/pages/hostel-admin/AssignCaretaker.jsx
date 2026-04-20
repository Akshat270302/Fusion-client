import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Alert,
  Badge,
  Box,
  Select,
  Text,
  Button,
  Stack,
  Tabs,
  Card,
  Divider,
  Group,
  Table,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

import {
  getCaretakers,
  assignCaretakers,
  getWardens,
  assignWarden,
} from "../../../../routes/hostelManagementRoutes";

import AddHostel from "./AddHostel";

axios.defaults.withXSRFToken = true;

export default function AssignPersonnel() {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState("caretaker");

  // Caretaker states
  const [hallsForCaretaker, setHallsForCaretaker] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [selectedHallForCaretaker, setSelectedHallForCaretaker] =
    useState(null);
  const [selectedCaretaker, setSelectedCaretaker] = useState(null);
  const [caretakerStartDate, setCaretakerStartDate] = useState(today);
  const [caretakerEndDate, setCaretakerEndDate] = useState("");
  const [caretakerAssignments, setCaretakerAssignments] = useState([]);

  // Warden states
  const [hallsForWarden, setHallsForWarden] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [selectedHallForWarden, setSelectedHallForWarden] = useState(null);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [wardenStartDate, setWardenStartDate] = useState(today);
  const [wardenEndDate, setWardenEndDate] = useState("");
  const [wardenDesignation, setWardenDesignation] = useState("primary");
  const [wardenAssignments, setWardenAssignments] = useState([]);

  // Shared states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: null,
    message: "",
  });

  const showMessage = (type, text) => {
    setMessage({ type, message: text });
  };

  const fetchCaretakerData = () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      showMessage(
        "error",
        "Authentication token not found. Please login again.",
      );
      return;
    }

    axios
      .get(getCaretakers, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const { halls, caretaker_usernames } = response.data;
        setCaretakerAssignments(halls);
        setHallsForCaretaker(
          halls.map((hallData) => ({
            value: hallData.hall_id,
            label: `${hallData.hall_name} (${hallData.hall_id})`,
          })),
        );
        setCaretakers(
          caretaker_usernames.map((user) => ({
            value: user.id_id,
            label: user.full_name
              ? `${user.id_id} - ${user.full_name}`
              : user.id_id,
          })),
        );
      })
      .catch((error) => {
        console.error("Error fetching caretaker data", error);
        showMessage(
          "error",
          "Failed to fetch caretaker data. Please try again.",
        );
      });
  };

  // Load caretaker data
  useEffect(() => {
    if (activeTab === "caretaker") {
      fetchCaretakerData();
    }
  }, [activeTab]);

  const fetchWardenData = () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      showMessage(
        "error",
        "Authentication token not found. Please login again.",
      );
      return;
    }

    axios
      .get(getWardens, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const { halls, warden_usernames } = response.data;
        setWardenAssignments(halls);
        setHallsForWarden(
          halls.map((hallData) => ({
            value: hallData.hall_id,
            label: `${hallData.hall_name} (${hallData.hall_id})`,
          })),
        );
        setWardens(
          warden_usernames.map((user) => ({
            value: user.id_id,
            label: user.full_name
              ? `${user.id_id} - ${user.full_name}`
              : user.id_id,
          })),
        );
      })
      .catch((error) => {
        console.error("Error fetching warden data", error);
        showMessage(
          "error",
          "Failed to fetch warden data. Please try again.",
        );
      });
  };

  // Load warden data
  useEffect(() => {
    if (activeTab === "warden") {
      fetchWardenData();
    }
  }, [activeTab]);

  const handleAssignCaretaker = (forceReassign = false) => {
    const shouldForceReassign = forceReassign === true;
    const token = localStorage.getItem("authToken");

    if (!token) {
      showMessage(
        "error",
        "Authentication token not found. Please login again.",
      );
      return;
    }

    if (!selectedHallForCaretaker || !selectedCaretaker) {
      showMessage("error", "Please select both a hall and a caretaker.");
      return;
    }

    if (caretakerEndDate && caretakerEndDate < caretakerStartDate) {
      showMessage("error", "Invalid assignment dates.");
      return;
    }

    setLoading(true);

    axios
      .post(
        assignCaretakers,
        {
          hall_id: selectedHallForCaretaker,
          caretaker_username: selectedCaretaker,
          start_date: caretakerStartDate,
          end_date: caretakerEndDate || null,
          force_reassign: shouldForceReassign,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      )
      .then((response) => {
        const advisory = response.data?.advisory;
        showMessage(
          "success",
          advisory
            ? `${response.data?.message} ${advisory}`
            : "Caretaker assigned successfully!",
        );
        setSelectedHallForCaretaker(null);
        setSelectedCaretaker(null);
        setCaretakerStartDate(today);
        setCaretakerEndDate("");
        fetchCaretakerData();
      })
      .catch((error) => {
        if (error.response?.status === 409 && error.response?.data?.requires_confirmation) {
          const shouldProceed = window.confirm(
            `${error.response.data.warning}\n\nClick OK to confirm reassignment.`,
          );
          if (shouldProceed) {
            handleAssignCaretaker(true);
          }
        } else {
          console.error("Error assigning caretaker", error);
          showMessage(
            "error",
            error.response?.data?.error ||
              "Failed to assign caretaker. Please try again.",
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAssignWarden = (forceReassign = false) => {
    const shouldForceReassign = forceReassign === true;
    const token = localStorage.getItem("authToken");

    if (!token) {
      showMessage(
        "error",
        "Authentication token not found. Please login again.",
      );
      return;
    }

    if (!selectedHallForWarden || !selectedWarden) {
      showMessage("error", "Please select both a hall and a warden.");
      return;
    }

    if (wardenEndDate && wardenEndDate < wardenStartDate) {
      showMessage("error", "Invalid assignment dates.");
      return;
    }

    setLoading(true);

    axios
      .post(
        assignWarden,
        {
          hall_id: selectedHallForWarden,
          warden_username: selectedWarden,
          start_date: wardenStartDate,
          end_date: wardenEndDate || null,
          assignment_role: wardenDesignation,
          force_reassign: shouldForceReassign,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      )
      .then(() => {
        showMessage("success", "Warden assigned successfully!");
        setSelectedHallForWarden(null);
        setSelectedWarden(null);
        setWardenStartDate(today);
        setWardenEndDate("");
        setWardenDesignation("primary");
        fetchWardenData();
      })
      .catch((error) => {
        if (error.response?.status === 409 && error.response?.data?.requires_confirmation) {
          const shouldProceed = window.confirm(
            `${error.response.data.warning}\n\nClick OK to confirm reassignment.`,
          );
          if (shouldProceed) {
            handleAssignWarden(true);
          }
        } else {
          console.error("Error assigning warden", error);
          showMessage(
            "error",
            error.response?.data?.error ||
              "Failed to assign warden. Please try again.",
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const currentCaretakerDetails = caretakers.find(
    (item) => item.value === selectedCaretaker,
  );
  const currentWardenDetails = wardens.find(
    (item) => item.value === selectedWarden,
  );

  return (
    <Box p="md" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Card shadow="xs" radius="md" p="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab} mb="md">
          <Tabs.List>
            <Tabs.Tab value="caretaker" style={{ fontSize: "0.95rem" }}>
              Assign Caretaker
            </Tabs.Tab>
            <Tabs.Tab value="warden" style={{ fontSize: "0.95rem" }}>
              Assign Warden
            </Tabs.Tab>
            <Tabs.Tab value="addHostel" style={{ fontSize: "0.95rem" }}>
              Add Hostel
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Divider mb="md" />

        {message.type === "success" && (
          <Alert icon={<IconCheck size={16} />} color="green" mb="sm" variant="light">
            {message.message}
          </Alert>
        )}
        {message.type === "error" && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mb="sm"
            variant="light"
          >
            {message.message}
          </Alert>
        )}

        {activeTab === "caretaker" && (
          <Stack spacing="sm">
            <Box mb="xs">
              <Text component="label" size="sm" fw={500}>
                Select Hall:
              </Text>
              <Select
                placeholder="Choose a hall"
                data={hallsForCaretaker}
                value={selectedHallForCaretaker}
                onChange={setSelectedHallForCaretaker}
                w="100%"
                size="sm"
                styles={{ root: { marginTop: 4 } }}
              />
            </Box>

            <Box mb="md">
              <Text component="label" size="sm" fw={500}>
                Select Caretaker:
              </Text>
              <Select
                placeholder="Choose a caretaker"
                data={caretakers}
                value={selectedCaretaker}
                onChange={setSelectedCaretaker}
                w="100%"
                size="sm"
                styles={{ root: { marginTop: 4 } }}
              />
            </Box>

            {currentCaretakerDetails && (
              <Text size="sm" c="dimmed">
                Selected staff: {currentCaretakerDetails.label}
              </Text>
            )}

            <Group grow>
              <TextInput
                type="date"
                label="Start Date"
                value={caretakerStartDate}
                onChange={(event) => setCaretakerStartDate(event.currentTarget.value)}
              />
              <TextInput
                type="date"
                label="End Date (optional)"
                value={caretakerEndDate}
                onChange={(event) => setCaretakerEndDate(event.currentTarget.value)}
              />
            </Group>

            <Group position="right">
              <Button
                variant="filled"
                onClick={() => handleAssignCaretaker()}
                loading={loading}
                size="sm"
              >
                Confirm Assignment
              </Button>
            </Group>

            <Table striped withTableBorder withColumnBorders mt="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hostel</Table.Th>
                  <Table.Th>Current Caretaker</Table.Th>
                  <Table.Th>Assignment Window</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {caretakerAssignments.map((item) => (
                  <Table.Tr key={`c-${item.hall_id}`}>
                    <Table.Td>{item.hall_name}</Table.Td>
                    <Table.Td>{item.current_caretaker || "Unassigned"}</Table.Td>
                    <Table.Td>
                      {item.current_assignment
                        ? `${item.current_assignment.start_date || "-"} to ${item.current_assignment.end_date || "Open"}`
                        : "-"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}

        {activeTab === "warden" && (
          <Stack spacing="sm">
            <Box mb="xs">
              <Text component="label" size="sm" fw={500}>
                Select Hall:
              </Text>
              <Select
                placeholder="Choose a hall"
                data={hallsForWarden}
                value={selectedHallForWarden}
                onChange={setSelectedHallForWarden}
                w="100%"
                size="sm"
                styles={{ root: { marginTop: 4 } }}
              />
            </Box>

            <Box mb="md">
              <Text component="label" size="sm" fw={500}>
                Select Warden:
              </Text>
              <Select
                placeholder="Choose a warden"
                data={wardens}
                value={selectedWarden}
                onChange={setSelectedWarden}
                w="100%"
                size="sm"
                styles={{ root: { marginTop: 4 } }}
              />
            </Box>

            {currentWardenDetails && (
              <Text size="sm" c="dimmed">
                Selected staff: {currentWardenDetails.label}
              </Text>
            )}

            <Group grow>
              <TextInput
                type="date"
                label="Start Date"
                value={wardenStartDate}
                onChange={(event) => setWardenStartDate(event.currentTarget.value)}
              />
              <TextInput
                type="date"
                label="End Date (optional)"
                value={wardenEndDate}
                onChange={(event) => setWardenEndDate(event.currentTarget.value)}
              />
            </Group>

            <Select
              label="Warden Designation"
              value={wardenDesignation}
              onChange={(value) => setWardenDesignation(value || "primary")}
              data={[
                { value: "primary", label: "Primary Warden" },
                { value: "secondary", label: "Secondary Warden" },
              ]}
            />

            <Group position="right">
              <Button
                variant="filled"
                onClick={() => handleAssignWarden()}
                loading={loading}
                size="sm"
              >
                Confirm Assignment
              </Button>
            </Group>

            <Table striped withTableBorder withColumnBorders mt="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hostel</Table.Th>
                  <Table.Th>Current Warden</Table.Th>
                  <Table.Th>Designation</Table.Th>
                  <Table.Th>Assignment Window</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {wardenAssignments.map((item) => (
                  <Table.Tr key={`w-${item.hall_id}`}>
                    <Table.Td>{item.hall_name}</Table.Td>
                    <Table.Td>{item.current_warden || "Unassigned"}</Table.Td>
                    <Table.Td>
                      {item.current_assignment?.assignment_role ? (
                        <Badge variant="light">
                          {item.current_assignment.assignment_role}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                    <Table.Td>
                      {item.current_assignment
                        ? `${item.current_assignment.start_date || "-"} to ${item.current_assignment.end_date || "Open"}`
                        : "-"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}

        {activeTab === "addHostel" && <AddHostel />}
      </Card>
    </Box>
  );
}
