import React, { useRef, useCallback, useState, useMemo } from "react";
import {
  Animated,
  RefreshControl,
  Alert,
  ScrollView,
  Text,
  Pressable,
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FAB, Portal, Provider as PaperProvider } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { BottomSheet, ListItem } from "@rneui/themed";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";
import PlatformLayout from "../components/PlatformLayout";
import { PlatformUtils, useLayoutConfig } from "../utils/platformConfig";
import { apiGet, BACKEND_URL, getAuthToken } from "../utils/api";
import { logout } from "../store/slices/userSlice";
import BookingCard from "../components/BookingCard";
import EmptyState from "../components/EmptyState";
import { ActivityIndicator } from "react-native";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled(Animated.ScrollView)`
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const QuickBookCard = styled.Pressable`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.light};
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
`;

const QuickBookTextContainer = styled.View`
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.md}px;
`;

const QuickBookTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const QuickBookSubtitle = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

const SectionTitle = styled.Text`
  font-size: ${() => PlatformUtils.scaleFontSize(20)}px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const NoBookingsText = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

const styles = StyleSheet.create({
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: "hidden",
  },
  headerTitle: {
    paddingHorizontal: 20,
    justifyContent: "center",
    flex: 1,
  },
  welcomeText: {
    color: "#fff",
    fontWeight: "300",
  },
  nameText: {
    color: "#fff",
    fontWeight: "600",
    marginTop: 4,
  },
  floorSelectorContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gradientBorder: {
    padding: 2,
  },
  floorContent: {
    backgroundColor: "white",
    padding: 16,
  },
  currentFloorLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#666",
  },
  floorSelection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  floorNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  floorName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#333",
  },
  modalContainer: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: "80%",
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginHorizontal: 20,
    marginBottom: 16,
    color: "#333",
  },
  floorList: {
    maxHeight: "70%",
  },
  floorItem: {
    paddingVertical: 16,
  },
  selectedFloorItem: {
    backgroundColor: "rgba(0, 100, 200, 0.15)",
  },
  floorItemTitle: {
    fontSize: 16,
    color: "#333",
  },
  floorItemSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },
  doneButton: {
    margin: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    alignItems: "center",
  },
  doneButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorText: {
    padding: 16,
    color: "red",
  },
  noFloorsText: {
    padding: 16,
  },
  popover: {
    backgroundColor: "transparent",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  popoverBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  seat: {
    position: "absolute",
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  seatIcon: {
    marginBottom: 2,
  },
  seatText: {
    fontSize: 10,
    color: "#777",
    marginBottom: 2,
    fontWeight: "500",
  },
  seatNumber: {
    fontSize: 10,
    color: "#333",
    marginTop: 2,
    fontWeight: "500",
  },
  centerMessage: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
});

function FloorSelector({ floors, selectedFloor, onSelect }) {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();

  const {
    data: seatDataPerFloor = {},
    isLoading: seatDataLoading,
    isError: seatDataError,
  } = useQuery({
    queryKey: ["employeeFloorSelectorSeatData", floors.map((f) => f.id)],
    enabled: floors.length > 0,
    queryFn: async () => {
      const today = getTodayDateString();
      const result = {};
      for (const f of floors) {
        try {
          const seatsInfo = await apiGet(
            `${BACKEND_URL}/api/seats/floor/${f.id}?date=${today}`
          );
          const bookedCount = seatsInfo.filter((s) => s.booked).length;
          result[f.id] = { booked: bookedCount, total: seatsInfo.length };
        } catch {
          result[f.id] = { booked: 0, total: 0 };
        }
      }
      return result;
    },
  });

  const handleSelect = (floor) => {
    onSelect(floor);
    setIsVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setIsVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={styles.floorSelectorContainer}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary]}
          style={styles.gradientBorder}
        >
          <View style={styles.floorContent}>
            <Text style={styles.currentFloorLabel}>Current Floor</Text>
            <View style={styles.floorSelection}>
              <View style={styles.floorNameContainer}>
                <MaterialCommunityIcons
                  name="seat"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.floorName}>
                  {selectedFloor?.name || "Select Floor"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      <Modal
        isVisible={isVisible}
        onBackdropPress={() => setIsVisible(false)}
        onSwipeComplete={() => setIsVisible(false)}
        swipeDirection={["down"]}
        style={styles.modalContainer}
        propagateSwipe
        backdropTransitionOutTiming={0}
        statusBarTranslucent
        deviceHeight={PlatformUtils.screenHeight}
        useNativeDriverForBackdrop
      >
        <View style={styles.modalContent}>
          <View style={styles.modalIndicator} />
          <Text style={styles.modalTitle}>Select Floor</Text>

          <ScrollView style={styles.floorList}>
            {seatDataLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading seat data...</Text>
              </View>
            ) : seatDataError ? (
              <Text style={styles.errorText}>Error loading seat data.</Text>
            ) : floors.length === 0 ? (
              <Text style={styles.noFloorsText}>No floors found.</Text>
            ) : (
              floors.map((floor) => {
                const seatStats = seatDataPerFloor[floor.id] || {
                  booked: 0,
                  total: 0,
                };
                const seatsString = `${seatStats.booked}/${seatStats.total} seats booked`;

                const isSelected = selectedFloor?.id === floor.id;
                return (
                  <ListItem
                    key={floor.id}
                    onPress={() => handleSelect(floor)}
                    containerStyle={[
                      styles.floorItem,
                      isSelected && styles.selectedFloorItem,
                    ]}
                    Component={Pressable}
                    android_ripple={{ color: `${theme.colors.primary}30` }}
                  >
                    <ListItem.Content>
                      <ListItem.Title
                        style={[
                          styles.floorItemTitle,
                          {
                            color: isSelected ? theme.colors.primary : "#333",
                            fontWeight: isSelected ? "600" : "400",
                          },
                        ]}
                      >
                        {floor.name}
                      </ListItem.Title>
                      <ListItem.Subtitle style={styles.floorItemSubtitle}>
                        {seatsString}
                      </ListItem.Subtitle>
                    </ListItem.Content>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
                  </ListItem>
                );
              })
            )}
          </ScrollView>

          <Pressable
            onPress={() => setIsVisible(false)}
            style={styles.doneButton}
            accessibilityRole="button"
            accessibilityLabel="Done selecting floor"
          >
            <Text style={styles.doneButtonTitle}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return "N/A";
  return `${day}-${month}-${year}`;
}

export default function EmployeeDashboard({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { getHeaderHeight, topInset, statusBarHeight } = useLayoutConfig();
  const { currentUser } = useSelector((state) => state.user);
  const userId = currentUser?.id;
  const companyId = currentUser?.companyId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bookings", userId],
    queryFn: () =>
      apiGet(`${BACKEND_URL}/api/bookings/user/${userId}?page=0&size=10`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const bookings = data?.content || [];

  const {
    data: floorsData = [],
    isLoading: floorsLoading,
    isError: floorsError,
  } = useQuery({
    queryKey: ["companyFloors", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return apiGet(`${BACKEND_URL}/api/floors/company/${companyId}`);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedFloor, setSelectedFloor] = useState(null);
  const [isFABOpen, setIsFABOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const baseExpandedHeight = 80;
  const baseCollapsedHeight = 60;
  const expandedHeaderHeight = getHeaderHeight(baseExpandedHeight);
  const collapsedHeaderHeight = getHeaderHeight(baseCollapsedHeight);

  const mappedBookings = useMemo(() => {
    if (!floorsData.length) {
      return bookings.map((b) => ({ ...b, floorName: "N/A" }));
    }
    return bookings.map((b) => {
      const floor = floorsData.find((f) => f.seatIds.includes(b.seatId));
      return floor
        ? { ...b, floorName: floor.name }
        : { ...b, floorName: "N/A" };
    });
  }, [bookings, floorsData]);

  const filteredBookings = useMemo(
    () => mappedBookings.filter((b) => b.status !== "CANCELLED"),
    [mappedBookings]
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -(expandedHeaderHeight - collapsedHeaderHeight) / 2],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const handleLogout = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/users/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Logout failed");
      dispatch(logout());
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch {
      dispatch(logout());
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  const handleDeleteBooking = useCallback(
    (bookingId) => {
      Alert.alert(
        "Cancel Booking",
        "Are you sure you want to cancel this booking?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await getAuthToken();
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                const res = await fetch(
                  `${BACKEND_URL}/api/bookings/cancel/${bookingId}`,
                  {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.message || "Failed to cancel booking");
                }
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                refetch();
              } catch (error) {
                Alert.alert("Error", error.message);
              }
            },
          },
        ]
      );
    },
    [refetch]
  );

  const onRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [refetch]);

  const getFABActions = (navigation, handleHaptic) => [
    {
      icon: "seat",
      label: "Quick Book",
      onPress: async () => {
        await handleHaptic();
        if (!selectedFloor) {
          Alert.alert("Select a Floor", "Please pick a floor before booking");
          return;
        }
        navigation.navigate("BookingScreen", { floorId: selectedFloor.id });
      },
    },
    {
      icon: "inbox",
      label: "Inbox",
      onPress: async () => {
        await handleHaptic();
        navigation.navigate("ShareInbox");
      },
    },
    {
      icon: "share-variant",
      label: "Share Schedule",
      onPress: async () => {
        await handleHaptic();
        navigation.navigate("ShareScheduler");
      },
    },
    {
      icon: "account-circle",
      label: "Profile",
      onPress: async () => {
        await handleHaptic();
        navigation.navigate("UserProfile");
      },
    },
    {
      icon: "logout",
      label: "Logout",
      onPress: async () => {
        await handleHaptic();
        handleLogout();
      },
    },
  ];

  const renderFAB = useCallback(
    () => (
      <Portal>
        <FAB.Group
          visible
          open={isFABOpen}
          icon={isFABOpen ? "close" : "plus"}
          actions={getFABActions(navigation, async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          })}
          onStateChange={async ({ open }) => {
            await Haptics.impactAsync(
              open
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light
            );
            setIsFABOpen(open);
          }}
          fabStyle={{
            backgroundColor: theme.colors.primary,
            borderRadius: 28,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            zIndex: 1000,
          }}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            zIndex: 9999,
          }}
          color={theme.colors.light}
          theme={{ colors: { backdrop: "rgba(0, 0, 0, 0.4)" } }}
        />
      </Portal>
    ),
    [isFABOpen, navigation, theme]
  );

  if (isError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <PlatformLayout
            style={{ flex: 1 }}
            headerHeight={expandedHeaderHeight}
            edges={["left", "right"]}
          >
            <Container style={{ paddingTop: insets.top }}>
              <Text
                style={{
                  margin: 20,
                  color: theme.colors.error,
                  textAlign: "center",
                }}
              >
                Failed to load bookings. Pull down to retry.
              </Text>
            </Container>
          </PlatformLayout>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <PlatformLayout
          style={{ flex: 1 }}
          headerHeight={expandedHeaderHeight}
          edges={["left", "right"]}
        >
          <Animated.View
            style={[
              styles.headerBackground,
              {
                backgroundColor: theme.colors.primary,
                height: expandedHeaderHeight + 30,
                paddingTop: Platform.OS === "android" ? statusBarHeight : 0,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.headerContent,
              {
                transform: [{ translateY: headerTranslate }],
                height: expandedHeaderHeight,
                opacity: headerOpacity,
                paddingTop: topInset,
                backgroundColor: theme.colors.primary,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.headerTitle,
                {
                  transform: [{ scale: titleScale }],
                  width: PlatformUtils.screenWidth,
                },
              ]}
            >
              <Text
                style={[
                  styles.welcomeText,
                  { fontSize: PlatformUtils.scaleFontSize(18) },
                ]}
              >
                Welcome back,
              </Text>
              <Text
                style={[
                  styles.nameText,
                  { fontSize: PlatformUtils.scaleFontSize(16) },
                ]}
              >
                {currentUser?.name ?? "Employee"}
              </Text>
            </Animated.View>
          </Animated.View>
          <Container style={{ paddingTop: insets.top }}>
            <Content
              refreshControl={
                <RefreshControl
                  refreshing={isLoading || floorsLoading}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              onScroll={handleScroll}
              scrollEventThrottle={32}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: expandedHeaderHeight + theme.spacing.md,
                paddingBottom: insets.bottom + theme.spacing.xl + 60,
              }}
              removeClippedSubviews
              overScrollMode="never"
            >
              <FloorSelector
                floors={floorsData}
                selectedFloor={selectedFloor}
                onSelect={setSelectedFloor}
              />

              <QuickBookCard
                onPress={() => {
                  if (!selectedFloor) {
                    Alert.alert(
                      "Select a Floor",
                      "Please pick a floor before booking"
                    );
                    return;
                  }
                  navigation.navigate("BookingScreen", {
                    floorId: selectedFloor.id,
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Quickly book a seat"
              >
                <MaterialCommunityIcons
                  name="seat"
                  size={32}
                  color={theme.colors.primary}
                />
                <QuickBookTextContainer>
                  <QuickBookTitle>Quick Book</QuickBookTitle>
                  <QuickBookSubtitle>
                    Reserve your spot in the office
                  </QuickBookSubtitle>
                </QuickBookTextContainer>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </QuickBookCard>

              <SectionTitle>Upcoming Bookings</SectionTitle>
              {!isLoading && filteredBookings.length === 0 ? (
                <NoBookingsText>No upcoming bookings.</NoBookingsText>
              ) : (
                filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={{
                      id: booking.id,
                      date: formatDate(booking.date),
                      floor: booking.floorName || "N/A",
                    }}
                    onDelete={handleDeleteBooking}
                    navigation={navigation}
                  />
                ))
              )}
            </Content>
            {renderFAB()}
          </Container>
        </PlatformLayout>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}