import React, { useState } from "react";
import {
  Box,
  Button,
  Group,
  Stack,
  Textarea,
  TextInput,
  Alert,
  Card,
  Loader,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { submit_complaint } from "../../../../routes/hostelManagementRoutes";

export default function SubmitComplaint() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.currentTarget.value,
    });
  };

  const handleClear = () => {
    setFormData({
      title: "",
      description: "",
    });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.title.trim()) {
      setMessage("Please enter a complaint title.");
      setMessageType("error");
      return;
    }

    if (!formData.description.trim()) {
      setMessage("Please enter a complaint description.");
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setMessage("Authentication token not found. Please login again.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(submit_complaint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setMessage(
          data?.error ||
            data?.detail ||
            "Failed to submit complaint. Please try again.",
        );
        setMessageType("error");
        return;
      }

      setMessage("Complaint submitted successfully!");
      setMessageType("success");
      setFormData({
        title: "",
        description: "",
      });
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setMessage("An error occurred while submitting the complaint.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card
        sx={(theme) => ({
          border: `1px solid ${theme.colors.gray[3]}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          backgroundColor: theme.white,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        })}
      >
        <Stack spacing="lg">
          <div>
            <h2 style={{ marginBottom: "8px" }}>Submit a Complaint</h2>
            <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
              Describe your hostel-related issue. Our caretaker team will review
              and resolve it promptly.
            </p>
          </div>

          {message && (
            <Alert
              icon={
                messageType === "success" ? (
                  <IconCheck size={20} />
                ) : messageType === "error" ? (
                  <IconAlertCircle size={20} />
                ) : (
                  <IconAlertCircle size={20} />
                )
              }
              color={
                messageType === "success"
                  ? "green"
                  : messageType === "error"
                    ? "red"
                    : "blue"
              }
              title={
                messageType === "success"
                  ? "Success"
                  : messageType === "error"
                    ? "Error"
                    : "Info"
              }
            >
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing="md">
              <TextInput
                label="Complaint Title"
                placeholder="Brief title of your complaint"
                value={formData.title}
                onChange={handleChange("title")}
                disabled={loading}
                minLength={3}
                required
              />

              <Textarea
                label="Description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={handleChange("description")}
                disabled={loading}
                minLength={10}
                rows={6}
                required
              />

              <Group spacing="md" justify="flex-end">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  leftSection={loading ? <Loader size={16} /> : null}
                >
                  {loading ? "Submitting..." : "Submit Complaint"}
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  );
}
