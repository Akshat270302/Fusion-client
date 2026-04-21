import {
  Text,
  Stack,
  ScrollArea,
  Loader,
  Container,
  Box,
  Card,
  Group,
  Button,
  Anchor,
} from "@mantine/core";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { getNotices, getStudentNotices } from "../../../../routes/hostelManagementRoutes";
import { Empty } from "../../../../components/empty";
import HallSelector from "../shared/HallSelector";

export default function NoticeBoard() {
  const role = (useSelector((state) => state.user.role) || "").toLowerCase();
  const isSuperAdmin = role.includes("admin");

  const [selectedHall, setSelectedHall] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotices = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const endpoint = isSuperAdmin ? getNotices : getStudentNotices;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Token ${token}` },
        params: isSuperAdmin ? { hall_id: selectedHall } : undefined,
      });
      setNotices(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError(
        err.response?.data?.error ||
          "Failed to fetch notices. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !selectedHall) {
      setNotices([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchNotices();
  }, [isSuperAdmin, selectedHall]);

  return (
    <Container size="md" px="md">
      <Card shadow="sm" p={0} radius="md" withBorder>
        {isSuperAdmin ? (
          <Box p="md" sx={{ borderBottom: "1px solid #e9ecef" }}>
            <HallSelector
              value={selectedHall}
              onChange={setSelectedHall}
              label="Select Hall"
            />
          </Box>
        ) : null}

        <Box p="md" sx={{ height: "70vh" }}>
          <ScrollArea style={{ height: "100%" }}>
            {isSuperAdmin && !selectedHall ? (
              <Stack align="center" gap="sm" py="xl">
                <Text align="center" color="dimmed" size="md">
                  Select a hall to view notices.
                </Text>
              </Stack>
            ) : loading ? (
              <Container
                py="xl"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Loader size="lg" />
              </Container>
            ) : error ? (
              <Stack align="center" gap="sm" py="xl">
                <Text align="center" color="red" size="lg">
                  {error}
                </Text>
                <Button variant="light" onClick={fetchNotices}>
                  Retry
                </Button>
              </Stack>
            ) : notices.length === 0 ? (
              <Empty />
            ) : (
              <Stack spacing="md">
                {notices.map((notice) => (
                  <Card key={notice.id} p="md" withBorder radius="sm">
                    <Text size="lg" fw={600} mb="xs">
                      {notice.title}
                    </Text>

                    <Text size="sm" color="dimmed" mb="sm">
                      {notice.description}
                    </Text>

                    {notice.content_url ? (
                      <Anchor
                        href={notice.content_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View attachment
                      </Anchor>
                    ) : null}

                    <Group position="apart" mt="md">
                      <Text size="sm" color="dimmed">
                        Posted by: {notice.posted_by}
                      </Text>
                      <Text size="sm" color="dimmed">
                        Hall: {notice.hall_name || notice.hall_id}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Box>
      </Card>
    </Container>
  );
}
