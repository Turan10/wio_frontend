import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";
import { apiGet, apiPost, BACKEND_URL } from "../utils/api";
import { getAuthToken } from "../utils/auth";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return "N/A";
  return `${day}-${month}-${year}`;
}

export default function ShareScheduler({ navigation }) {
  const theme = useTheme();
  const { currentUser } = useSelector((state) => state.user);
  const companyId = currentUser?.companyId;
  const userId = currentUser?.id;
  const [selectedCoworker, setSelectedCoworker] = useState(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [coworkerSearch, setCoworkerSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const {
    data: coworkers = [],
    isLoading: coworkersLoading,
    isError: coworkersError,
  } = useQuery({
    queryKey: ["coworkers", companyId],
    queryFn: () => apiGet(`${BACKEND_URL}/api/companies/${companyId}/users`),
    enabled: !!companyId,
  });

  const {
    data: userBookingsRaw = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
  } = useQuery({
    queryKey: ["userBookingsToShare", userId],
    queryFn: async () => {
      const result = await apiGet(
        `${BACKEND_URL}/api/bookings/user/${userId}?page=0&size=50`
      );
      const now = new Date();
      const twoWeeks = new Date();
      twoWeeks.setDate(now.getDate() + 14);
      const filtered = result.content?.filter((bk) => {
        const d = new Date(bk.date);
        return d >= now && d <= twoWeeks;
      });
      return filtered || [];
    },
    enabled: !!userId,
  });

  const filteredCoworkers = useMemo(() => {
    if (!coworkerSearch) return coworkers.filter((c) => c.id !== userId);
    return coworkers
      .filter((c) => c.id !== userId)
      .filter(
        (c) =>
          c.name.toLowerCase().includes(coworkerSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(coworkerSearch.toLowerCase())
      );
  }, [coworkerSearch, coworkers, userId]);

  const filteredBookings = useMemo(() => {
    const activeBookings = userBookingsRaw.filter(
      (bk) => bk.status !== "CANCELLED"
    );
    if (!bookingSearch) return activeBookings;
    return activeBookings.filter((bk) => {
      const dateStr = formatDate(bk.date);
      const seatNumberString = bk.seatNumber || "";
      const combined = (seatNumberString + dateStr).toLowerCase();
      return combined.includes(bookingSearch.toLowerCase());
    });
  }, [bookingSearch, userBookingsRaw]);

  const handleSelectCoworker = async (coworker) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCoworker((prev) => (prev?.id === coworker.id ? null : coworker));
  };

  const handleToggleBooking = async (bookingId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBookingIds((prev) => {
      if (prev.includes(bookingId)) {
        return prev.filter((id) => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  const handleShare = async () => {
    if (!selectedCoworker) {
      Alert.alert("Validation", "Pick a coworker first");
      return;
    }
    if (selectedBookingIds.length === 0) {
      Alert.alert("Validation", "Select at least one future booking");
      return;
    }
    try {
      const token = await getAuthToken();
      const payload = {
        recipientId: selectedCoworker.id,
        bookingIds: selectedBookingIds,
        message: `Sharing ${selectedBookingIds.length} booking(s) with you!`,
      };
      await apiPost(`${BACKEND_URL}/api/shares`, payload, "POST", token);
      Alert.alert("Success", "Your bookings have been shared!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.innerContainer}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Select a Coworker
        </Text>
        <TextInput
          placeholder="Search coworker..."
          placeholderTextColor={theme.colors.textSecondary}
          value={coworkerSearch}
          onChangeText={setCoworkerSearch}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
            },
          ]}
        />
        {coworkersLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : coworkersError ? (
          <Text style={{ color: theme.colors.error }}>
            Failed to load coworkers
          </Text>
        ) : (
          <View style={styles.coworkerBox}>
            <ScrollView style={{ maxHeight: 180 }}>
              {filteredCoworkers.map((cw) => {
                const isSelected = selectedCoworker?.id === cw.id;
                return (
                  <Pressable
                    key={cw.id}
                    onPress={() => handleSelectCoworker(cw)}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.light,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? theme.colors.light
                          : theme.colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      {cw.name} ({cw.email})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        <Text
          style={[
            styles.title,
            { marginTop: 24, color: theme.colors.textPrimary },
          ]}
        >
          Select Which Bookings to Share
        </Text>
        <TextInput
          placeholder="Search bookings..."
          placeholderTextColor={theme.colors.textSecondary}
          value={bookingSearch}
          onChangeText={setBookingSearch}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
            },
          ]}
        />
        {bookingsLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : bookingsError ? (
          <Text style={{ color: theme.colors.error }}>
            Failed to load bookings
          </Text>
        ) : filteredBookings.length === 0 ? (
          <Text>
            No future bookings in the next 14 days or none match your search.
          </Text>
        ) : (
          <View style={styles.bookingBox}>
            <ScrollView style={{ maxHeight: 200 }}>
              {filteredBookings.map((bk) => {
                const isSelected = selectedBookingIds.includes(bk.id);
                return (
                  <Pressable
                    key={bk.id}
                    onPress={() => handleToggleBooking(bk.id)}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.light,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? theme.colors.light
                          : theme.colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      Booking on {formatDate(bk.date)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        <Pressable
          onPress={handleShare}
          style={[
            styles.shareButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text
            style={{
              color: theme.colors.light,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Share Selected Bookings
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  coworkerBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  bookingBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  listItem: {
    padding: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  shareButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
});
