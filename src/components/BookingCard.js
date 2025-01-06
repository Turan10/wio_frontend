import React, { memo } from "react";
import { Alert } from "react-native";
import styled from "styled-components/native";
import { Avatar, IconButton, Text, useTheme } from "react-native-paper";
import * as Haptics from "expo-haptics";
import { AppCard } from "./AppCard";

const BookingInfo = styled.View`
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.md}px;
`;

const BookingDate = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const BookingFloor = styled(Text)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.placeholder};
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

function BookingCard({ booking, onDelete, navigation }) {
  const theme = useTheme();

  const handleDelete = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onDelete(booking.id);
    } catch {
      Alert.alert("Error", "An error occurred while deleting the booking.");
    }
  };

  const handlePress = () => {
    navigation.navigate("BookingDetails", { bookingId: booking.id });
  };

  return (
    <AppCard onPress={handlePress} accessibilityRole="button">
      <Avatar.Icon
        size={40}
        icon="seat"
        color={theme.colors.primary}
        style={{ backgroundColor: `${theme.colors.primary}10` }}
      />
      <BookingInfo>
        <BookingDate>{booking.date}</BookingDate>
        <BookingFloor>{booking.floor || "N/A"}</BookingFloor>
      </BookingInfo>
      <IconButton
        icon="delete"
        size={24}
        color={theme.colors.error}
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete booking"
      />
    </AppCard>
  );
}

export default memo(BookingCard);
