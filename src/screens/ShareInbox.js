import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { useTheme } from "styled-components/native";
import { getAuthToken } from "../utils/auth";
import { apiGet, apiPatch, BACKEND_URL } from "../utils/api";
import { useSelector } from "react-redux";
import EmptyState from "../components/EmptyState";

export default function ShareInbox({ navigation }) {
  const theme = useTheme();
  const { currentUser } = useSelector((state) => state.user);
  const userId = currentUser?.id;

  const {
    data: sharesRaw = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sharesInbox", userId],
    queryFn: async () => {
      const token = await getAuthToken();
      return apiGet(`${BACKEND_URL}/api/shares/inbox`, token);
    },
    enabled: !!userId,
  });

  const isFetching = useIsFetching({ queryKey: ["sharesInbox", userId] }) > 0;
  const shares = [...sharesRaw].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const markShareAsRead = async (shareId) => {
    try {
      const token = await getAuthToken();
      await apiPatch(`${BACKEND_URL}/api/shares/${shareId}/read`, {}, token);
      refetch();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const markShareAsUnread = async (shareId) => {
    try {
      const token = await getAuthToken();
      await apiPatch(`${BACKEND_URL}/api/shares/${shareId}/unread`, {}, token);
      refetch();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleOpenShare = async (share) => {
    if (!share.readAt) {
      await markShareAsRead(share.id);
    }
    navigation.navigate("ShareDetail", { share });
  };

  if (isLoading) {
    return <EmptyState icon="clock-outline" message="Loading shares..." />;
  }
  if (isError) {
    return (
      <EmptyState
        icon="alert-circle"
        message="Failed to load shares. Pull down to retry."
      />
    );
  }
  if (shares.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        message="No one has shared any bookings with you yet."
      />
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          margin: 16,
          color: theme.colors.textPrimary,
        }}
      >
        Shared with Me
      </Text>
      <FlatList
        data={shares}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isFetching > 0}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        renderItem={({ item }) => {
          const senderDisplay = item.senderName || `User #${item.senderId}`;
          const expired = item.bookingIds.length === 0;
          const isRead = !!item.readAt;
          return (
            <Pressable
              onPress={() => handleOpenShare(item)}
              style={{
                backgroundColor: isRead
                  ? theme.colors.light
                  : theme.colors.accent,
                padding: 12,
                marginHorizontal: 16,
                marginVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                {expired ? "Expired Share" : "Active Share"}
              </Text>
              <Text style={{ fontWeight: "600" }}>
                Shared by {senderDisplay}
              </Text>
              <Text>Message: {item.message || "No message"}</Text>
              {expired ? (
                <Text style={{ color: theme.colors.error }}>
                  All shared bookings have expired.
                </Text>
              ) : (
                <Text>Bookings: {item.bookingIds.length} shared</Text>
              )}
              <Text style={{ marginTop: 4 }}>
                Created: {new Date(item.createdAt).toLocaleString()}
              </Text>
              {isRead && (
                <Text
                  style={{ fontSize: 12, color: theme.colors.textSecondary }}
                >
                  Read at: {new Date(item.readAt).toLocaleString()}
                </Text>
              )}
              {isRead ? (
                <Pressable
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "dodgerblue",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                  onPress={() => markShareAsUnread(item.id)}
                >
                  <Text style={{ color: theme.colors.light }}>Mark Unread</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "dodgerblue",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                  onPress={() => markShareAsRead(item.id)}
                >
                  <Text style={{ color: theme.colors.light }}>Mark Read</Text>
                </Pressable>
              )}
            </Pressable>
          );
        }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
