import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  StyleSheet,
  Pressable,
} from "react-native";
import { useTheme } from "styled-components/native";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import * as Haptics from "expo-haptics";
import { FAB, Portal, Provider as PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { apiGet, BACKEND_URL, getAuthToken } from "../utils/api";
import { logout } from "../store/slices/userSlice";
import BookingCard from "../components/BookingCard";
import StatCard from "../components/StatCard";
import PlatformLayout from "../components/PlatformLayout";
import EmptyState from "../components/EmptyState";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingBottom: 120,
    paddingRight: 72,
  },
}))`
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const StatsSection = styled.View`
  margin: ${({ theme }) => theme.spacing.lg}px 0;
`;

const StatsSectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const EmployeeSection = styled.View`
  margin-top: ${({ theme }) => theme.spacing.xl}px;
`;

const EmployeeCard = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  elevation: 2;
`;

const EmployeeInfo = styled.View`
  flex: 1;
`;

const EmployeeName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EmployeeEmail = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

const DeleteButton = styled.Pressable`
  padding: ${({ theme }) => theme.spacing.xs}px;
  background-color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
  justify-content: center;
  margin-left: ${({ theme }) => theme.spacing.md}px;
`;

export default function AdminDashboard({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const companyId = currentUser?.companyId;
  const [isFABOpen, setIsFABOpen] = useState(false);

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["companyUsers", companyId],
    queryFn: () => apiGet(`${BACKEND_URL}/api/companies/${companyId}/users`),
    enabled: !!companyId,
  });

  const {
    data: floorsData = [],
    isLoading: floorsLoading,
    isError: floorsError,
    refetch: refetchFloors,
  } = useQuery({
    queryKey: ["floors", companyId],
    queryFn: () => apiGet(`${BACKEND_URL}/api/floors/company/${companyId}`),
    enabled: !!companyId,
  });

  // For each floor, we fetch occupant info for "today" to count seats
  const {
    data: floorBookings = {},
    refetch: refetchFloorBookings,
    isLoading: floorBookingsLoading,
  } = useQuery({
    queryKey: ["floorSeatBookings", companyId],
    enabled: !!companyId && floorsData.length > 0,
    queryFn: async () => {
      const today = getTodayDateString();
      const results = {};
      for (const fl of floorsData) {
        try {
          const seatsInfo = await apiGet(
            `${BACKEND_URL}/api/seats/floor/${fl.id}?date=${today}`
          );
          const bookedCount = seatsInfo.filter((s) => s.booked).length;
          results[fl.id] = {
            booked: bookedCount,
            total: seatsInfo.length,
          };
        } catch {
          results[fl.id] = { booked: 0, total: 0 };
        }
      }
      return results;
    },
  });

  const totalEmployees = users.length;
  const activeFloors = floorsData.length;

  const fetchData = async () => {
    if (companyId) {
      await refetchUsers();
      await refetchFloors();
      await refetchFloorBookings();
    }
  };

  const handleHaptic = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteEmployee = useCallback(
    async (employeeId) => {
      Alert.alert(
        "Remove Employee",
        "Are you sure you want to remove this employee?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await getAuthToken();
                const res = await fetch(
                  `${BACKEND_URL}/api/companies/${companyId}/users/${employeeId}`,
                  {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.message || "Failed to remove employee.");
                }
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                refetchUsers();
              } catch (err) {
                Alert.alert("Error", err.message);
              }
            },
          },
        ]
      );
    },
    [refetchUsers, companyId]
  );

  const onRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetchData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/api/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errorMsg = "Logout failed";
        if (contentType.includes("application/json")) {
          const errJson = await res.json().catch(() => ({}));
          errorMsg = errJson.message || errorMsg;
        } else {
          const errText = await res.text();
          errorMsg = errText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      dispatch(logout());
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      dispatch(logout());
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  const getFABActions = () => [
    {
      icon: "office-building",
      label: "Add New Floor",
      onPress: async () => {
        await handleHaptic();
        navigation.navigate("FloorPlanEditor", { isNew: true });
      },
    },
    {
      icon: "account-multiple",
      label: "Invite Management",
      onPress: async () => {
        await handleHaptic();
        navigation.navigate("InviteEmployees");
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
          actions={getFABActions()}
          onStateChange={async ({ open }) => {
            await handleHaptic();
            setIsFABOpen(open);
          }}
          fabStyle={{
            backgroundColor: theme.colors.primary,
            borderRadius: 28,
            elevation: 4,
          }}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
          }}
          color={theme.colors.light}
        />
      </Portal>
    ),
    [isFABOpen, theme]
  );

  if (usersError || floorsError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <PlatformLayout style={{ flex: 1 }}>
            <EmptyState
              icon="alert-circle"
              message="Failed to load data. Pull down to retry."
            />
          </PlatformLayout>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <PlatformLayout style={{ flex: 1 }}>
          <Container>
            <Content
              refreshControl={
                <RefreshControl
                  refreshing={
                    floorsLoading || usersLoading || floorBookingsLoading
                  }
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              <StatsSection>
                <StatsSectionTitle>Overview</StatsSectionTitle>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingHorizontal: theme.spacing.xs,
                  }}
                >
                  <StatCard
                    title="Total Employees"
                    value={`${totalEmployees}`}
                    trend="+5%"
                    timeframeLabel="(Weekly)"
                    icon="account-multiple"
                    trendUp
                  />
                  <StatCard
                    title="Active Floors"
                    value={`${activeFloors}`}
                    trend="+100%"
                    icon="office-building"
                    trendUp
                  />
                </ScrollView>
              </StatsSection>

              <View style={{ marginBottom: theme.spacing.xl }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Floor Plans</Text>
                </View>

                {floorsData.map((floor) => {
                  const bData = floorBookings[floor.id] || {
                    booked: 0,
                    total: 0,
                  };
                  const seatsString = `${bData.booked}/${bData.total} seats booked`;

                  return (
                    <Pressable
                      key={floor.id}
                      onPress={async () => {
                        await handleHaptic();
                        navigation.navigate("FloorPlanEditor", {
                          floorId: floor.id,
                          isNew: false,
                        });
                      }}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          padding: theme.spacing.lg,
                          backgroundColor: theme.colors.light,
                          borderRadius: theme.spacing.md,
                          marginBottom: theme.spacing.md,
                          opacity: pressed ? 0.8 : 1,
                        },
                        styles.shadow2,
                      ]}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                          backgroundColor: `${theme.colors.primary}10`,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="office-building"
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: theme.colors.textPrimary,
                            marginBottom: theme.spacing.xs,
                          }}
                        >
                          {floor.name}
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary }}>
                          {seatsString}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <EmployeeSection>
                <Text style={styles.sectionTitle}>Employees</Text>
                {usersLoading ? (
                  <Text>Loading...</Text>
                ) : (
                  users.map((user) => (
                    <EmployeeCard key={user.id}>
                      <EmployeeInfo>
                        <EmployeeName>
                          {user.name}
                          {user.role === "ADMIN" ? " (Admin)" : ""}
                        </EmployeeName>
                        <EmployeeEmail>{user.email}</EmployeeEmail>
                      </EmployeeInfo>
                      {user.role === "EMPLOYEE" && (
                        <DeleteButton
                          onPress={() => handleDeleteEmployee(user.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${user.name}`}
                        >
                          <MaterialCommunityIcons
                            name="delete"
                            size={20}
                            color={theme.colors.light}
                          />
                        </DeleteButton>
                      )}
                    </EmployeeCard>
                  ))
                )}
              </EmployeeSection>
            </Content>
            {renderFAB()}
          </Container>
        </PlatformLayout>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  shadow2: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
});
