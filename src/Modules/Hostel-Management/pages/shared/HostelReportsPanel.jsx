import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Grid,
  Group,
  Paper,
  ScrollArea,
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
import {
  hostelReportGenerate,
  hostelReportMy,
  hostelReportSubmit,
  hostelReportTemplates,
} from "../../../../routes/hostelManagementRoutes";

const REPORT_TYPES = [
  { value: "room_occupancy", label: "Room Occupancy Report" },
  { value: "attendance_summary", label: "Attendance Summary Report" },
  { value: "leave_analysis", label: "Leave Analysis Report" },
  { value: "fine_disciplinary", label: "Fine and Disciplinary Report" },
  { value: "complaint_resolution", label: "Complaint Resolution Report" },
  { value: "guest_room_booking", label: "Guest Room Booking Report" },
  { value: "extended_stay", label: "Extended Stay Report" },
  { value: "comprehensive", label: "Comprehensive Hostel Report" },
];

const statusColor = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return "green";
  if (normalized === "submitted") return "blue";
  if (normalized.includes("revision")) return "orange";
  return "gray";
};

export default function HostelReportsPanel({ role }) {
  const [form, setForm] = useState({
    report_type: "room_occupancy",
    title: "",
    start_date: "",
    end_date: "",
    filters: {
      students: "",
      room_blocks: "",
      room_numbers: "",
      statuses: "",
    },
  });
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [generatedReport, setGeneratedReport] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
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

  const parseFilterValue = (value) =>
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const buildFiltersPayload = () => ({
    students: parseFilterValue(form.filters.students),
    room_blocks: parseFilterValue(form.filters.room_blocks),
    room_numbers: parseFilterValue(form.filters.room_numbers),
    statuses: parseFilterValue(form.filters.statuses),
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(hostelReportMy, {
        headers: getAuthHeaders(),
      });
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setReports([]);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(hostelReportTemplates, {
        headers: getAuthHeaders(),
        params: { report_type: form.report_type },
      });
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [form.report_type]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      ),
    [reports],
  );

  const handleGenerate = async () => {
    resetStatus();
    setGenerating(true);
    try {
      const response = await axios.post(
        hostelReportGenerate,
        {
          report_type: form.report_type,
          title: form.title,
          start_date: form.start_date,
          end_date: form.end_date,
          filters: buildFiltersPayload(),
          template_id: selectedTemplateId,
        },
        {
          headers: getAuthHeaders(),
        },
      );
      setGeneratedReport(response.data);
      setSuccessMessage("Report generated successfully.");
      fetchReports();
    } catch (requestError) {
      setGeneratedReport(null);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to generate report.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError("Template name is required.");
      return;
    }

    resetStatus();
    setSavingTemplate(true);
    try {
      await axios.post(
        hostelReportTemplates,
        {
          template_name: templateName,
          report_type: form.report_type,
          filters: buildFiltersPayload(),
        },
        {
          headers: getAuthHeaders(),
        },
      );
      setSuccessMessage("Template saved successfully.");
      setTemplateName("");
      fetchTemplates();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to save template.",
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const submitReport = async (reportId) => {
    if (role !== "warden") {
      return;
    }

    resetStatus();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submission_notes", submissionNotes);
      formData.append("priority", priority);
      supportingDocuments.forEach((file) => {
        formData.append("supporting_documents", file);
      });

      const token = localStorage.getItem("authToken");
      await axios.post(hostelReportSubmit(reportId), formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Report submitted to Super Admin.");
      setSubmissionNotes("");
      setPriority("Normal");
      setSupportingDocuments([]);
      fetchReports();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to submit report.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(
    (row) => String(row.id) === String(selectedTemplateId || ""),
  );

  const applySelectedTemplate = () => {
    if (!selectedTemplate) {
      return;
    }

    const filters = selectedTemplate.filters || {};
    setForm((prev) => ({
      ...prev,
      filters: {
        students: (filters.students || []).join(", "),
        room_blocks: (filters.room_blocks || []).join(", "),
        room_numbers: (filters.room_numbers || []).join(", "),
        statuses: (filters.statuses || []).join(", "),
      },
    }));
    setSuccessMessage("Template applied.");
  };

  return (
    <Paper shadow="xs" p={20} radius="md" withBorder>
      <Stack spacing="md">
        <Group justify="space-between">
          <Text fw={600}>Generate Hostel Reports</Text>
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

        <Card withBorder radius="md" p="md">
          <Stack spacing="sm">
            <Select
              label="Report Type"
              data={REPORT_TYPES}
              value={form.report_type}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  report_type: value || "room_occupancy",
                }))
              }
              allowDeselect={false}
            />

            <TextInput
              label="Report Title (optional)"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  title: event.currentTarget.value,
                }))
              }
            />

            <Group grow>
              <TextInput
                type="date"
                label="Start Date"
                value={form.start_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: event.currentTarget.value,
                  }))
                }
              />
              <TextInput
                type="date"
                label="End Date"
                value={form.end_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    end_date: event.currentTarget.value,
                  }))
                }
              />
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Student IDs (comma separated)"
                  placeholder="22bcs001, 22bcs002"
                  value={form.filters.students}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        students: event.currentTarget.value,
                      },
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Room Blocks"
                  placeholder="A, B"
                  value={form.filters.room_blocks}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        room_blocks: event.currentTarget.value,
                      },
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Room Numbers"
                  placeholder="101, 203"
                  value={form.filters.room_numbers}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        room_numbers: event.currentTarget.value,
                      },
                    }))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Status Filters"
                  placeholder="Pending, Approved"
                  value={form.filters.statuses}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        statuses: event.currentTarget.value,
                      },
                    }))
                  }
                />
              </Grid.Col>
            </Grid>

            <Group align="end">
              <Select
                label="Saved Templates"
                placeholder="Select template"
                data={templates.map((row) => ({
                  value: String(row.id),
                  label: row.template_name,
                }))}
                value={selectedTemplateId ? String(selectedTemplateId) : null}
                onChange={(value) => setSelectedTemplateId(value || null)}
                w={260}
              />
              <Button variant="default" onClick={applySelectedTemplate}>
                Apply Template
              </Button>
            </Group>

            <Group align="end">
              <TextInput
                label="Save Current Filters As"
                placeholder="Monthly default"
                value={templateName}
                onChange={(event) => setTemplateName(event.currentTarget.value)}
                w={300}
              />
              <Button variant="outline" loading={savingTemplate} onClick={handleSaveTemplate}>
                Save Template
              </Button>
            </Group>

            <Button onClick={handleGenerate} loading={generating}>
              Generate Report
            </Button>
          </Stack>
        </Card>

        {generatedReport && (
          <Card withBorder radius="md" p="md">
            <Stack spacing="sm">
              <Text fw={600}>Generated Report Preview</Text>
              <Group>
                <Badge variant="light">{generatedReport.report_uid}</Badge>
                <Badge color={statusColor(generatedReport.status)} variant="light">
                  {generatedReport.status}
                </Badge>
              </Group>

              {(generatedReport.report_data?.key_insights || []).map((insight) => (
                <Text key={insight} size="sm">
                  - {insight}
                </Text>
              ))}

              {(generatedReport.report_data?.sections || []).map((section) => (
                <Card key={section.key} withBorder radius="sm" p="sm">
                  <Text fw={500}>{section.title}</Text>
                  <Group mt={6}>
                    {Object.entries(section.summary || {}).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              ))}

              {role === "warden" && (
                <>
                  <Textarea
                    label="Submission Notes"
                    minRows={2}
                    value={submissionNotes}
                    onChange={(event) => setSubmissionNotes(event.currentTarget.value)}
                  />
                  <Select
                    label="Priority"
                    data={[
                      { value: "Normal", label: "Normal" },
                      { value: "High", label: "High" },
                      { value: "Urgent", label: "Urgent" },
                    ]}
                    value={priority}
                    onChange={(value) => setPriority(value || "Normal")}
                    allowDeselect={false}
                    w={180}
                  />
                  <FileInput
                    label="Supporting Documents"
                    placeholder="Attach optional files"
                    value={supportingDocuments}
                    onChange={(value) => setSupportingDocuments(value || [])}
                    multiple
                  />
                  <Button
                    color="teal"
                    loading={submitting}
                    onClick={() => submitReport(generatedReport.id)}
                  >
                    Submit to Super Admin
                  </Button>
                </>
              )}
            </Stack>
          </Card>
        )}

        <Text fw={600}>My Report History</Text>
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Report</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Date Range</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Priority</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && sortedReports.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text align="center" c="dimmed" py="md">
                      No reports found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}

              {sortedReports.map((report) => (
                <Table.Tr key={report.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {report.report_uid}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {report.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>{report.report_type}</Table.Td>
                  <Table.Td>
                    {report.start_date} to {report.end_date}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(report.status)} variant="light">
                      {report.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{report.priority}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

HostelReportsPanel.propTypes = {
  role: PropTypes.oneOf(["caretaker", "warden"]).isRequired,
};
