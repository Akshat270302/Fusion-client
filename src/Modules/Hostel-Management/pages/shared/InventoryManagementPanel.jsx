import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
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
  inventoryDashboard,
  inventoryInspectionSubmit,
  inventoryInspections,
  inventoryItemUpdate,
  inventoryResourceRequestReview,
  inventoryResourceRequests,
  inventoryResourceRequestSubmit,
  inventoryUpdateLogs,
} from "../../../../routes/hostelManagementRoutes";
import HallSelector from "./HallSelector";

const conditionOptions = ["Good", "Damaged", "Missing", "Depleted"];
const requestTypeOptions = ["Replacement", "New", "Additional"];
const reviewDecisionOptions = ["Approved", "Rejected"];

export default function InventoryManagementPanel({ role }) {
  const isAdmin = role === "admin";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedHall, setSelectedHall] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [updateLogs, setUpdateLogs] = useState([]);
  const [inspectionRows, setInspectionRows] = useState({});
  const [updateRows, setUpdateRows] = useState({});
  const [reviewRows, setReviewRows] = useState({});
  const [requestPayload, setRequestPayload] = useState({
    request_type: "Replacement",
    justification: "",
    items: [{ inventory_id: "", item_name: "", requested_quantity: 1, remarks: "" }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCaretaker = role === "caretaker";
  const canReview = role === "warden" || isAdmin;

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

  const clearBanners = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchDashboard = async () => {
    const response = await axios.get(inventoryDashboard, {
      headers: getAuthHeaders(),
      params: isAdmin ? { hall_id: selectedHall } : undefined,
    });
    const rows = Array.isArray(response.data) ? response.data : [];
    setInventoryItems(rows);

    const inspectionSeed = {};
    const updateSeed = {};
    rows.forEach((item) => {
      inspectionSeed[item.inventory_id] = {
        observed_quantity: item.quantity,
        observed_condition: item.condition_status || "Good",
        remarks: "",
      };
      updateSeed[item.inventory_id] = {
        quantity: item.quantity,
        condition_status: item.condition_status || "Good",
        reason: "",
      };
    });

    setInspectionRows(inspectionSeed);
    setUpdateRows(updateSeed);
  };

  const fetchRequests = async () => {
    const response = await axios.get(inventoryResourceRequests, {
      headers: getAuthHeaders(),
      params: isAdmin ? { hall_id: selectedHall } : undefined,
    });
    setResourceRequests(Array.isArray(response.data) ? response.data : []);
  };

  const fetchInspections = async () => {
    const response = await axios.get(inventoryInspections, {
      headers: getAuthHeaders(),
      params: isAdmin ? { hall_id: selectedHall } : undefined,
    });
    setInspections(Array.isArray(response.data) ? response.data : []);
  };

  const fetchLogs = async () => {
    const response = await axios.get(inventoryUpdateLogs, {
      headers: getAuthHeaders(),
      params: isAdmin ? { hall_id: selectedHall } : undefined,
    });
    setUpdateLogs(Array.isArray(response.data) ? response.data : []);
  };

  const refreshAll = async () => {
    setLoading(true);
    clearBanners();
    try {
      await Promise.all([fetchDashboard(), fetchRequests(), fetchInspections(), fetchLogs()]);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Unable to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !selectedHall) {
      setInventoryItems([]);
      setResourceRequests([]);
      setInspections([]);
      setUpdateLogs([]);
      setLoading(false);
      setError("");
      return;
    }
    refreshAll();
  }, [isAdmin, selectedHall]);

  const updateInspectionRow = (inventoryId, field, value) => {
    setInspectionRows((prev) => ({
      ...prev,
      [inventoryId]: {
        ...(prev[inventoryId] || {}),
        [field]: value,
      },
    }));
  };

  const submitInspection = async () => {
    clearBanners();
    const items = inventoryItems.map((item) => ({
      inventory_id: item.inventory_id,
      observed_quantity: inspectionRows[item.inventory_id]?.observed_quantity ?? item.quantity,
      observed_condition: inspectionRows[item.inventory_id]?.observed_condition ?? item.condition_status,
      remarks: inspectionRows[item.inventory_id]?.remarks || "",
    }));

    try {
      const response = await axios.post(
        inventoryInspectionSubmit,
        { items, remarks: "Periodic inventory check" },
        { headers: getAuthHeaders() },
      );
      setSuccessMessage(response.data?.message || "Inspection submitted successfully.");
      refreshAll();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Unable to submit inspection.");
    }
  };

  const updateRequestItem = (index, field, value) => {
    setRequestPayload((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const addRequestItem = () => {
    setRequestPayload((prev) => ({
      ...prev,
      items: [...prev.items, { inventory_id: "", item_name: "", requested_quantity: 1, remarks: "" }],
    }));
  };

  const removeRequestItem = (index) => {
    setRequestPayload((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const submitResourceRequest = async () => {
    clearBanners();
    const payload = {
      ...requestPayload,
      items: requestPayload.items.map((row) => ({
        ...row,
        inventory_id: row.inventory_id ? Number(row.inventory_id) : undefined,
        requested_quantity: Number(row.requested_quantity || 0),
      })),
    };

    try {
      const response = await axios.post(inventoryResourceRequestSubmit, payload, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Resource request submitted successfully.");
      setRequestPayload({
        request_type: "Replacement",
        justification: "",
        items: [{ inventory_id: "", item_name: "", requested_quantity: 1, remarks: "" }],
      });
      refreshAll();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Unable to submit resource request.");
    }
  };

  const updateReviewRow = (requestId, field, value) => {
    setReviewRows((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || { decision: "Approved", remarks: "" }),
        [field]: value,
      },
    }));
  };

  const submitReview = async (requestId) => {
    clearBanners();
    const payload = {
      ...(reviewRows[requestId] || { decision: "Approved", remarks: "" }),
      ...(isAdmin ? { hall_id: selectedHall } : {}),
    };

    try {
      const response = await axios.post(inventoryResourceRequestReview(requestId), payload, {
        headers: getAuthHeaders(),
      });
      setSuccessMessage(response.data?.message || "Request reviewed successfully.");
      refreshAll();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Unable to review request.");
    }
  };

  const updateInventoryRow = (inventoryId, field, value) => {
    setUpdateRows((prev) => ({
      ...prev,
      [inventoryId]: {
        ...(prev[inventoryId] || {}),
        [field]: value,
      },
    }));
  };

  const submitInventoryUpdate = async (inventoryId) => {
    clearBanners();
    const payload = updateRows[inventoryId] || {};
    try {
      const response = await axios.post(
        inventoryItemUpdate(inventoryId),
        {
          quantity: Number(payload.quantity),
          condition_status: payload.condition_status,
          reason: payload.reason || "",
        },
        { headers: getAuthHeaders() },
      );
      setSuccessMessage(response.data?.message || "Inventory updated.");
      refreshAll();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Unable to update inventory.");
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Inventory Management</Text>
          <Button variant="subtle" onClick={refreshAll} loading={loading}>
            Refresh
          </Button>
        </Group>

        {isAdmin && (
          <HallSelector
            value={selectedHall}
            onChange={setSelectedHall}
            label="Select Hall"
          />
        )}

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

        {isAdmin && !selectedHall && (
          <Text size="sm" c="dimmed">
            Select a hall to access inventory data.
          </Text>
        )}

        {(!isAdmin || selectedHall) && (
          <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
            {isCaretaker && <Tabs.Tab value="inspection">Check Inventory</Tabs.Tab>}
            {isCaretaker && <Tabs.Tab value="request">Request Resources</Tabs.Tab>}
            <Tabs.Tab value="resource-requests">Resource Requests</Tabs.Tab>
            {isCaretaker && <Tabs.Tab value="updates">Update Inventory</Tabs.Tab>}
            <Tabs.Tab value="logs">Update Logs</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="dashboard" pt="md">
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Hall</Table.Th>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Condition</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {inventoryItems.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="md">
                          No inventory items found.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {inventoryItems.map((item) => (
                    <Table.Tr key={item.inventory_id}>
                      <Table.Td>{item.inventory_id}</Table.Td>
                      <Table.Td>{item.hall_name || item.hall_id}</Table.Td>
                      <Table.Td>{item.inventory_name}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">{item.condition_status}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Tabs.Panel>

          {isCaretaker && (
            <Tabs.Panel value="inspection" pt="md">
              <Stack spacing="sm">
                <Text size="sm" c="dimmed">
                  Compare observed stock and condition, then submit a periodic inspection report.
                </Text>
                <ScrollArea>
                  <Table striped withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Item</Table.Th>
                        <Table.Th>Expected</Table.Th>
                        <Table.Th>Observed</Table.Th>
                        <Table.Th>Condition</Table.Th>
                        <Table.Th>Remarks</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {inventoryItems.map((item) => (
                        <Table.Tr key={`inspect-${item.inventory_id}`}>
                          <Table.Td>{item.inventory_name}</Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                          <Table.Td>
                            <NumberInput
                              min={0}
                              value={inspectionRows[item.inventory_id]?.observed_quantity ?? item.quantity}
                              onChange={(value) =>
                                updateInspectionRow(item.inventory_id, "observed_quantity", Number(value || 0))
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <Select
                              data={conditionOptions}
                              value={inspectionRows[item.inventory_id]?.observed_condition ?? item.condition_status}
                              onChange={(value) =>
                                updateInspectionRow(item.inventory_id, "observed_condition", value || "Good")
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              value={inspectionRows[item.inventory_id]?.remarks || ""}
                              onChange={(event) =>
                                updateInspectionRow(item.inventory_id, "remarks", event.currentTarget.value)
                              }
                              placeholder="Optional discrepancy note"
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
                <Group justify="flex-end">
                  <Button onClick={submitInspection}>Submit Inspection</Button>
                </Group>
              </Stack>
            </Tabs.Panel>
          )}

          {isCaretaker && (
            <Tabs.Panel value="request" pt="md">
              <Stack spacing="sm">
                <Group grow>
                  <Select
                    label="Request Type"
                    data={requestTypeOptions}
                    value={requestPayload.request_type}
                    onChange={(value) =>
                      setRequestPayload((prev) => ({ ...prev, request_type: value || "Replacement" }))
                    }
                  />
                  <TextInput
                    label="Justification"
                    value={requestPayload.justification}
                    onChange={(event) =>
                      setRequestPayload((prev) => ({ ...prev, justification: event.currentTarget.value }))
                    }
                    placeholder="Why is this needed?"
                  />
                </Group>

                <ScrollArea>
                  <Table striped withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Inventory ID (optional)</Table.Th>
                        <Table.Th>Item Name</Table.Th>
                        <Table.Th>Requested Qty</Table.Th>
                        <Table.Th>Remarks</Table.Th>
                        <Table.Th>Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {requestPayload.items.map((row, index) => (
                        <Table.Tr key={`req-item-${index}`}>
                          <Table.Td>
                            <TextInput
                              value={row.inventory_id}
                              onChange={(event) =>
                                updateRequestItem(index, "inventory_id", event.currentTarget.value)
                              }
                              placeholder="e.g. 14"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              value={row.item_name}
                              onChange={(event) =>
                                updateRequestItem(index, "item_name", event.currentTarget.value)
                              }
                              placeholder="Item name"
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              min={1}
                              value={row.requested_quantity}
                              onChange={(value) =>
                                updateRequestItem(index, "requested_quantity", Number(value || 1))
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              value={row.remarks}
                              onChange={(event) =>
                                updateRequestItem(index, "remarks", event.currentTarget.value)
                              }
                              placeholder="Optional note"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Button
                              color="red"
                              variant="subtle"
                              onClick={() => removeRequestItem(index)}
                              disabled={requestPayload.items.length === 1}
                            >
                              Remove
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>

                <Group justify="space-between">
                  <Button variant="light" onClick={addRequestItem}>
                    Add Item
                  </Button>
                  <Button onClick={submitResourceRequest}>Submit Request</Button>
                </Group>
              </Stack>
            </Tabs.Panel>
          )}

          <Tabs.Panel value="resource-requests" pt="md">
            <ScrollArea>
              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Hall</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Items</Table.Th>
                    <Table.Th>Justification</Table.Th>
                    {canReview && <Table.Th>Review</Table.Th>}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {resourceRequests.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={canReview ? 7 : 6}>
                        <Text c="dimmed" ta="center" py="md">
                          No resource requests found.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {resourceRequests.map((request) => {
                    const review = reviewRows[request.id] || { decision: "Approved", remarks: "" };
                    return (
                      <Table.Tr key={request.id}>
                        <Table.Td>{request.id}</Table.Td>
                        <Table.Td>{request.hall_name || request.hall_id}</Table.Td>
                        <Table.Td>{request.request_type}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{request.status}</Badge>
                        </Table.Td>
                        <Table.Td>
                          {(request.items || []).map((item) => (
                            <Text key={item.item_id} size="xs">
                              {item.item_name} x {item.requested_quantity}
                            </Text>
                          ))}
                        </Table.Td>
                        <Table.Td>{request.justification || "-"}</Table.Td>
                        {canReview && (
                          <Table.Td>
                            {request.status === "Pending" ? (
                              <Stack spacing={6}>
                                <Select
                                  data={reviewDecisionOptions}
                                  value={review.decision}
                                  onChange={(value) =>
                                    updateReviewRow(request.id, "decision", value || "Approved")
                                  }
                                />
                                <Textarea
                                  minRows={2}
                                  value={review.remarks}
                                  onChange={(event) =>
                                    updateReviewRow(request.id, "remarks", event.currentTarget.value)
                                  }
                                  placeholder="Remarks (required for rejection)"
                                />
                                <Button size="xs" onClick={() => submitReview(request.id)}>
                                  Submit Review
                                </Button>
                              </Stack>
                            ) : (
                              <Text size="xs" c="dimmed">
                                Reviewed on {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : "-"}
                              </Text>
                            )}
                          </Table.Td>
                        )}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Tabs.Panel>

          {isCaretaker && (
            <Tabs.Panel value="updates" pt="md">
              <ScrollArea>
                <Table striped withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Condition</Table.Th>
                      <Table.Th>Reason</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {inventoryItems.map((item) => (
                      <Table.Tr key={`update-${item.inventory_id}`}>
                        <Table.Td>{item.inventory_name}</Table.Td>
                        <Table.Td>
                          <NumberInput
                            min={0}
                            value={updateRows[item.inventory_id]?.quantity ?? item.quantity}
                            onChange={(value) =>
                              updateInventoryRow(item.inventory_id, "quantity", Number(value || 0))
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            data={conditionOptions}
                            value={updateRows[item.inventory_id]?.condition_status ?? item.condition_status}
                            onChange={(value) =>
                              updateInventoryRow(item.inventory_id, "condition_status", value || "Good")
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={updateRows[item.inventory_id]?.reason || ""}
                            onChange={(event) =>
                              updateInventoryRow(item.inventory_id, "reason", event.currentTarget.value)
                            }
                            placeholder="Reason for update"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Button size="xs" onClick={() => submitInventoryUpdate(item.inventory_id)}>
                            Update
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Tabs.Panel>
          )}

          <Tabs.Panel value="logs" pt="md">
            <ScrollArea>
              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Condition</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Updated By</Table.Th>
                    <Table.Th>Timestamp</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {updateLogs.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Text c="dimmed" ta="center" py="md">
                          No inventory update logs found.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {updateLogs.map((log) => (
                    <Table.Tr key={log.id}>
                      <Table.Td>{log.id}</Table.Td>
                      <Table.Td>{log.inventory_name}</Table.Td>
                      <Table.Td>
                        {log.previous_quantity} to {log.new_quantity}
                      </Table.Td>
                      <Table.Td>
                        {log.previous_condition} to {log.new_condition}
                      </Table.Td>
                      <Table.Td>{log.reason || "-"}</Table.Td>
                      <Table.Td>{log.updated_by || "-"}</Table.Td>
                      <Table.Td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Paper>
  );
}
