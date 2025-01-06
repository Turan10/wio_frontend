import React from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useTheme } from "styled-components/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import styled from "styled-components/native";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";

import { getAuthToken } from "../utils/auth";
import { apiGet, BACKEND_URL } from "../utils/api";
import BookingCard from "../components/BookingCard";
import EmptyState from "../components/EmptyState";
import spacing from "../theme/spacing";
import PlatformLayout from "../components/PlatformLayout";

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  background-color: ${({ theme }) => theme.colors.light};
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export default function MyBookings({ navigation }) {
  const theme = useTheme();
  const { currentUser } = useSelector((state) => state.user);
  const userId = currentUser?.id;

  const {
    data: bookingsData = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["userBookings", userId],
    queryFn: async () => {
      const res = await apiGet(
        `${BACKEND_URL}/api/bookings/user/${userId}?page=0&size=10`
      );
      return res.content || [];
    },
    enabled: !!userId,
  });

  const handleDeleteBooking = async (bookingId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const token = await getAuthToken();
      const res = await fetch(
        `${BACKEND_URL}/api/bookings/cancel/${bookingId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to cancel booking");
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (error) {}
  };

  const renderBooking = ({ item }) => {
    return (
      <BookingCard
        booking={{
          id: item.id,
          date: item.date,
          seatId: item.seatId,
          seatNumber: item.seatNumber,
          floorNumber: item.floorNumber,
        }}
        onDelete={handleDeleteBooking}
        navigation={navigation}
      />
    );
  };

  if (isLoading) {
    return (
      <PlatformLayout>
        <EmptyState icon="clock-outline" message="Loading your bookings..." />
      </PlatformLayout>
    );
  }

  if (isError) {
    return (
      <PlatformLayout>
        <EmptyState
          icon="alert-circle"
          message="Failed to load bookings. Pull down to retry."
        />
      </PlatformLayout>
    );
  }

  if (bookingsData.length === 0) {
    return (
      <PlatformLayout>
        <EmptyState icon="event-busy" message="No bookings found." />
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <Container>
        <Header>
          <Title>My Bookings</Title>
        </Header>
        <FlatList
          data={bookingsData}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
            />
          }
        />
      </Container>
    </PlatformLayout>
  );
}
