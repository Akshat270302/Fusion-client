import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Stack,
  Textarea,
  Button,
  Group,
  Alert,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function EscalationModal({
  opened,
  onClose,
  onSubmit,
  loading,
  complaint,
}) {
  const [escalationReason, setEscalationReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setEscalationReason("");
    setRemarks("");
    setError("");
    onClose();
  };

  const handleSubmit = () => {
    setError("");

    // Validate escalation reason
    if (!escalationReason.trim()) {
      setError("Escalation reason is mandatory.");
      return;
    }

    if (escalationReason.trim().length < 10) {
      setError("Escalation reason must be at least 10 characters.");
      return;
    }

    // Call submit handler with data
    onSubmit({
      complaint_id: complaint?.id,
      escalation_reason: escalationReason.trim(),
      remarks: remarks.trim(),
    });

    // Clear form on success (parent will handle modal closing)
    handleClose();
  };

  if (!complaint) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Escalate Complaint to Warden"
      size="md"
    >
      <Stack spacing="md">
        <div>
          <Text fw={500} size="sm" mb="xs">
            Complaint Details
          </Text>
          <Text size="sm" c="dimmed">
            <strong>ID:</strong> #{complaint.id}
          </Text>
          <Text size="sm" c="dimmed">
            <strong>Title:</strong> {complaint.title}
          </Text>
          <Text size="sm" c="dimmed">
            <strong>Student:</strong> {complaint.student_id || "Unknown"}
          </Text>
        </div>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        )}

        <Textarea
          label="Escalation Reason *"
          placeholder="Explain why this complaint needs to be escalated to the warden (minimum 10 characters)"
          value={escalationReason}
          onChange={(e) => setEscalationReason(e.currentTarget.value)}
          minRows={4}
          required
          error={
            escalationReason && escalationReason.length < 10
              ? "Must be at least 10 characters"
              : ""
          }
        />

        <Textarea
          label="Additional Remarks (Optional)"
          placeholder="Any additional notes or context for the warden"
          value={remarks}
          onChange={(e) => setRemarks(e.currentTarget.value)}
          minRows={3}
        />

        <Group justify="flex-end">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} loading={loading}>
            Escalate Complaint
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

EscalationModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  complaint: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    student_id: PropTypes.string,
    status: PropTypes.string,
  }),
};

EscalationModal.defaultProps = {
  loading: false,
  complaint: null,
};
