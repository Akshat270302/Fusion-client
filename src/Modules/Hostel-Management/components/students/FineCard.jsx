import React from "react";
import { Paper, Text, Group, Badge, Divider } from "@mantine/core";

const defaultProps = {
  fine_id: "",
  student_name: "Unknown",
  hall: "Unknown Hall",
  caretaker_name: "Unknown",
  amount: 0,
  category: "Rule Violation",
  status: "Pending",
  reason: "No reason provided",
  evidence: null,
  created_at: null,
};

export default function FineCard(props = defaultProps) {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "green";
      case "pending":
        return "orange";
      default:
        return "gray";
    }
  };

  const {
    student_name,
    hall,
    caretaker_name,
    amount,
    category,
    status,
    reason,
    evidence,
    created_at,
  } = {
    ...defaultProps,
    ...props,
  };

  return (
    <Paper
      radius="sm"
      withBorder
      p="md"
      sx={(theme) => ({
        backgroundColor: theme.white,
        borderColor: theme.colors.gray[3],
      })}
    >
      <Group position="apart" mb="md">
        <Group spacing="xs">
          <Text
            weight={600}
            size="lg"
            color={status === "Pending" ? "red" : "dark"}
          >
            ₹{amount.toLocaleString()}
          </Text>
        </Group>
        <Badge color={getStatusColor(status)} size="md" variant="light">
          {status}
        </Badge>
      </Group>

      <Group grow mb="sm">
        <div>
          <Text size="xs" color="dimmed">
            Student
          </Text>
          <Text size="sm">{student_name}</Text>
        </div>
        <div>
          <Text size="xs" color="dimmed">
            Hall
          </Text>
          <Text size="sm">{hall}</Text>
        </div>
      </Group>

      <Group grow mb="sm">
        <div>
          <Text size="xs" color="dimmed">
            Caretaker
          </Text>
          <Text size="sm">{caretaker_name || "N/A"}</Text>
        </div>
        <div>
          <Text size="xs" color="dimmed">
            Category
          </Text>
          <Text size="sm">{category}</Text>
        </div>
      </Group>

      {created_at && (
        <div style={{ marginBottom: "8px" }}>
          <Text size="xs" color="dimmed">
            Date Imposed
          </Text>
          <Text size="sm">{new Date(created_at).toLocaleDateString()}</Text>
        </div>
      )}

      <Divider my="xs" />

      <div>
        <Text size="xs" color="dimmed" mb="xs">
          Reason
        </Text>
        <Text size="sm">{reason}</Text>
      </div>

      {evidence && (
        <div style={{ marginTop: "8px" }}>
          <Text size="xs" color="dimmed" mb="xs">
            Evidence
          </Text>
          <a
            href={evidence}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#228be6", textDecoration: "underline" }}
          >
            View Evidence
          </a>
        </div>
      )}
    </Paper>
  );
}

FineCard.defaultProps = defaultProps;
