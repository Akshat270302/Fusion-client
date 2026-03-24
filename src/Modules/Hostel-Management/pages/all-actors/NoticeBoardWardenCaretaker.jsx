import React, { useState, useEffect } from "react";
import {
  Text,
  Badge,
  Stack,
  ScrollArea,
  Loader,
  Container,
  Button,
  Modal,
  Group,
  Card,
  Box,
  ActionIcon,
} from "@mantine/core";
import { X } from "tabler-icons-react";
import axios from "axios";
import { useSelector } from "react-redux";
import CreateNotice from "../../components/warden/CreateNotice";
import {
  getNotices,
  deleteNotice,
} from "../../../../routes/hostelManagementRoutes";
import { Empty } from "../../../../components/empty";

export default function NoticeBoard() {
  const role = (useSelector((state) => state.user.role) || "").toLowerCase();
  const canCreateNotice = role.includes("warden") || role.includes("caretaker");

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);

  const fetchNotices = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(getNotices, {
        headers: { Authorization: `Token ${token}` },
      });

      setNotices(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to fetch notices. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDeleteNotice = async (noticeId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    try {
      const response = await axios.post(
        deleteNotice,
        { id: noticeId },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (response.status === 200) {
        setNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
        console.log("Notice deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting notice:", err);
      setError("Failed to delete notice. Please try again.");
    }
  };

  const handleCreateNoticeSubmit = () => {
    setIsCreateNoticeOpen(false);
    fetchNotices();
  };

  return (
    <Container size="md" px="md">
      <Card shadow="sm" p={0} radius="md" withBorder>
        <Box
          py="md"
          px="lg"
          sx={(theme) => ({
            backgroundColor: theme.colors.gray[0],
            borderBottom: `1px solid ${theme.colors.gray[3]}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          })}
        >
          {canCreateNotice ? (
            <Button
              size="sm"
              color="blue"
              onClick={() => setIsCreateNoticeOpen(true)}
            >
              Create Notice
            </Button>
          ) : null}
        </Box>

        <Box p="md" sx={{ height: "70vh" }}>
          <ScrollArea style={{ height: "100%" }}>
            {loading ? (
              <Container
                py="xl"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Loader size="lg" />
              </Container>
            ) : error ? (
              <Text align="center" color="red" size="lg">
                {error}
              </Text>
            ) : notices.length === 0 ? (
              <Empty />
            ) : (
              <Stack spacing="md">
                {notices.map((notice) => (
                  <Card
                    key={notice.id}
                    p="md"
                    withBorder
                    radius="sm"
                    sx={{ position: "relative" }}
                  >
                    <Group position="apart" mb="xs" align="flex-start">
                      <Text
                        size="lg"
                        weight={600}
                        color="dark"
                        style={{ flex: 1 }}
                      >
                        {notice.title || notice.head_line}
                      </Text>
                      {canCreateNotice ? (
                        <ActionIcon
                          color="gray"
                          variant="subtle"
                          onClick={() => handleDeleteNotice(notice.id)}
                        >
                          <X size={16} />
                        </ActionIcon>
                      ) : null}
                    </Group>

                    <Text size="sm" color="dimmed" mb="sm">
                      {notice.content || notice.description}
                    </Text>

                    <Group position="apart" mt="md">
                      <Badge size="md" variant="outline" color="blue">
                        {notice.hall_name || notice.hall_id}
                      </Badge>

                      <Text size="sm" color="dimmed">
                        Posted by: {notice.created_by || notice.posted_by}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Box>
      </Card>

      <Modal
        opened={isCreateNoticeOpen}
        onClose={() => setIsCreateNoticeOpen(false)}
        title="Create New Notice"
        size="lg"
      >
        <CreateNotice onSubmit={handleCreateNoticeSubmit} />
      </Modal>
    </Container>
  );
}
