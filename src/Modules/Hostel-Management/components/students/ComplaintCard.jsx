import React from "react";
import PropTypes from "prop-types";
import { Paper, Stack, Text, Group } from "@mantine/core";

export default function ComplaintCard({
  hall_name,
  roll_number,
  student_name,
  description,
  contact_number,
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack spacing="xs">
        <Group justify="space-between">
          <Text fw={600}>{student_name || "Unknown Student"}</Text>
          <Text size="sm" c="dimmed">
            {roll_number || "N/A"}
          </Text>
        </Group>

        <Text size="sm">{description || "No description provided."}</Text>

        <Group gap="lg">
          <Text size="xs" c="dimmed">
            Hall: {hall_name || "N/A"}
          </Text>
          <Text size="xs" c="dimmed">
            Contact: {contact_number || "N/A"}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

ComplaintCard.propTypes = {
  hall_name: PropTypes.string,
  roll_number: PropTypes.string,
  student_name: PropTypes.string,
  description: PropTypes.string,
  contact_number: PropTypes.string,
};

ComplaintCard.defaultProps = {
  hall_name: "",
  roll_number: "",
  student_name: "",
  description: "",
  contact_number: "",
};
