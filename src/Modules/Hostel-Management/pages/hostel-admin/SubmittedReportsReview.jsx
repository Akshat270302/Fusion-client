import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  hostelReportDetail,
  hostelReportDownload,
  hostelReportReview,
  hostelReportSubmitted,
} from "../../../../routes/hostelManagementRoutes";
import HallSelector from "../shared/HallSelector";

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "green";
  if (normalized === "submitted") return "blue";
  if (normalized.includes("revision")) return "orange";
  return "gray";
};

export default function SubmittedReportsReview() {
  const role = (useSelector((state) => state.user.role) || "").toLowerCase();
  const isSuperAdmin = role.includes("admin");

  const [selectedHall, setSelectedHall] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const resetStatus = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchReports = async () => {
    setLoading(true);
    resetStatus();
    try {
      const response = await axios.get(hostelReportSubmitted, {
        headers: getAuthHeaders(),
        params: isSuperAdmin ? { hall_id: selectedHall } : undefined,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setReports(rows);
      if (!selectedReportId && rows.length > 0) {
        setSelectedReportId(rows[0].id);
      }
    } catch (requestError) {
      setReports([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load submitted reports.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (reportId) => {
    if (!reportId) {
      setSelectedReport(null);
      return;
    }

    try {
      const response = await axios.get(hostelReportDetail(reportId), {
        headers: getAuthHeaders(),
        params: isSuperAdmin ? { hall_id: selectedHall } : undefined,
      });
      setSelectedReport(response.data || null);
    } catch (requestError) {
      setSelectedReport(null);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load report detail.",
      );
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !selectedHall) {
      setReports([]);
      setSelectedReportId(null);
      setSelectedReport(null);
      setLoading(false);
      setError("");
      return;
    }

    fetchReports();
  }, [isSuperAdmin, selectedHall]);

  useEffect(() => {
    if (isSuperAdmin && !selectedHall) {
      setSelectedReport(null);
      return;
    }
    fetchDetail(selectedReportId);
  }, [selectedReportId, isSuperAdmin, selectedHall]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0),
      ),
    [reports],
  );

  const handleReview = async () => {
    if (!selectedReportId) {
      return;
    }

    resetStatus();
    setSaving(true);

    try {
      const response = await axios.post(
        hostelReportReview(selectedReportId),
        {
          decision,
          feedback,
          ...(isSuperAdmin ? { hall_id: selectedHall } : {}),
        },
        {
          headers: getAuthHeaders(),
        },
      );
      setSuccessMessage(response.data?.message || "Review saved.");
      fetchReports();
      fetchDetail(selectedReportId);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to save review.",
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async (format) => {
    if (!selectedReportId) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(hostelReportDownload(selectedReportId, format), {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: isSuperAdmin ? { hall_id: selectedHall } : undefined,
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^\"]+)"?/);
      const fallback = `report-${selectedReportId}.${format === "both" ? "zip" : format}`;
      const filename = filenameMatch?.[1] || fallback;

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to download report.",
      );
    }
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Submitted Reports Review</Text>
          <Button variant="subtle" onClick={fetchReports} loading={loading}>
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

        {isSuperAdmin && (
          <HallSelector
            value={selectedHall}
            onChange={setSelectedHall}
            label="Select Hall"
          />
        )}

        {isSuperAdmin && !selectedHall && (
          <Text size="sm" c="dimmed">
            Select a hall to review submitted reports.
          </Text>
        )}

        {(!isSuperAdmin || selectedHall) && (
          <>

            <Select
              label="Select Report"
              placeholder="Choose report"
              data={sortedReports.map((row) => ({
                value: String(row.id),
                label: `${row.report_uid} - ${row.title}`,
              }))}
              value={selectedReportId ? String(selectedReportId) : null}
              onChange={(value) => setSelectedReportId(value ? Number(value) : null)}
            />

            {selectedReport && (
              <>
                <Card withBorder radius="md" p="md">
                  <Stack spacing={4}>
                    <Group justify="space-between">
                      <Text fw={500}>{selectedReport.title}</Text>
                      <Badge color={statusColor(selectedReport.status)} variant="light">
                        {selectedReport.status}
                      </Badge>
                    </Group>
                    <Text size="sm">UID: {selectedReport.report_uid}</Text>
                    <Text size="sm">Creator: {selectedReport.created_by}</Text>
                    <Text size="sm">Hostel: {selectedReport.hall_name}</Text>
                    <Text size="sm">
                      Date Range: {selectedReport.start_date} to {selectedReport.end_date}
                    </Text>
                    <Text size="sm">Priority: {selectedReport.priority}</Text>
                    <Text size="sm">Submission Notes: {selectedReport.submission_notes || "-"}</Text>
                  </Stack>
                </Card>

                <Card withBorder radius="md" p="md">
                  <Stack spacing="sm">
                    <Text fw={500}>Report Sections</Text>
                    <ScrollArea>
                      <Table striped highlightOnHover withTableBorder withColumnBorders>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Section</Table.Th>
                            <Table.Th>Summary</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {(selectedReport.report_data?.sections || []).map((section) => (
                            <Table.Tr key={section.key}>
                              <Table.Td>{section.title}</Table.Td>
                              <Table.Td>
                                {Object.entries(section.summary || {}).map(([key, value]) => (
                                  <Text key={key} size="xs">
                                    {key}: {String(value)}
                                  </Text>
                                ))}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Stack>
                </Card>

                <Card withBorder radius="md" p="md">
                  <Stack spacing="sm">
                    <Text fw={500}>Review Decision</Text>
                    <Select
                      label="Decision"
                      data={[
                        { value: "approved", label: "Approve" },
                        { value: "needs_revision", label: "Needs Revision" },
                      ]}
                      value={decision}
                      onChange={(value) => setDecision(value || "approved")}
                      allowDeselect={false}
                      w={220}
                    />
                    <Textarea
                      label="Feedback"
                      minRows={3}
                      value={feedback}
                      onChange={(event) => setFeedback(event.currentTarget.value)}
                    />
                    <Group>
                      <Button onClick={handleReview} loading={saving}>
                        Save Review
                      </Button>
                      <Button variant="outline" onClick={() => downloadReport("pdf")}>
                        Download PDF
                      </Button>
                      <Button variant="outline" onClick={() => downloadReport("csv")}>
                        Download CSV
                      </Button>
                      <Button variant="outline" onClick={() => downloadReport("both")}>
                        Download Both
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
