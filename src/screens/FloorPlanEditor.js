import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dimensions,
  Alert,
  StatusBar,
  Pressable,
  Text,
  View,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line as SvgLine } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  Searchbar,
  Menu,
  Provider as PaperProvider,
  Button as PaperButton,
  ActivityIndicator,
  Surface,
  IconButton,
} from "react-native-paper";
import styled, { useTheme } from "styled-components/native";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import DraggableSeat from "../components/DraggableSeat";
import { apiGet, apiPost, getAuthToken, BACKEND_URL } from "../utils/api";

const GRID_SIZE = 20;
const FAB_SIZE = 60;
const BOTTOM_BAR_HEIGHT = 110;

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const TopBar = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xs}px;
  z-index: 10;
`;

const FloorSelector = styled.Pressable`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${({ theme }) => theme.spacing.sm}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
`;

const FloorText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-right: ${({ theme }) => theme.spacing.xs}px;
  max-width: 100px;
`;

const CenterSection = styled.View`
  flex: 1;
  margin-horizontal: ${({ theme }) => theme.spacing.xs}px;
`;

const IconButtonWrap = styled.Pressable`
  padding: ${({ theme }) => theme.spacing.xs}px;
`;

const SaveButton = styled(PaperButton)`
  margin-left: ${({ theme }) => theme.spacing.sm}px;
  height: 36px;
  justify-content: center;
`;

const Canvas = styled.View`
  flex: 1;
  position: relative;
  background-color: #f9f9f9;
  width: 100%;
  height: 100%;
`;

const FabContainer = styled.View`
  position: absolute;
  right: ${({ theme }) => theme.spacing.lg}px;
  z-index: 11;
`;

const LockIndicator = styled.View`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md}px;
  right: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ locked, theme }) =>
    locked ? theme.colors.error : theme.colors.secondary};
  padding: ${({ theme }) => theme.spacing.xs}px
    ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  elevation: 2;
`;

const ModalBackdrop = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ModalInput = styled.TextInput`
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

function useSeatQuery(floorId, options = {}) {
  return useQuery({
    queryKey: ["seats", floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const response = await apiGet(
        `${BACKEND_URL}/api/seats/floor/${floorId}`
      );
      if (!Array.isArray(response)) {
        throw new Error("Seats response is not an array");
      }
      return response.map((seat) => ({
        ...seat,
        id: seat.id.toString(),
        x: Number(seat.xCoordinate) || 0,
        y: Number(seat.yCoordinate) || 0,
        angle: Number(seat.angle) || 0,
        label: seat.seatNumber || `Seat ${seat.id}`,
      }));
    },
    enabled: !!floorId,
    ...options,
  });
}

export default function FloorPlanEditor({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  const { currentUser } = useSelector((state) => state.user);
  const companyId = currentUser?.companyId;
  const floorIdParamRaw = route.params?.floorId || null;
  const isNew = route.params?.isNew || false;

  const [selectedFloorId, setSelectedFloorId] = useState(
    floorIdParamRaw ? Number(floorIdParamRaw) : null
  );
  const [showGrid, setShowGrid] = useState(true);
  const [locked, setLocked] = useState(false);
  const [editable, setEditable] = useState(false);
  const [lockError, setLockError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [floorMenuVisible, setFloorMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const lockedFloorRef = useRef(null);
  const prevFloorIdRef = useRef(null);

  const [showCreateFloorModal, setShowCreateFloorModal] = useState(false);
  const [floorName, setFloorName] = useState("");
  const [floorNumber, setFloorNumber] = useState("");

  const [selectedSeat, setSelectedSeat] = useState(null);

  const floorsQuery = useQuery({
    queryKey: ["floors", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return apiGet(`${BACKEND_URL}/api/floors/company/${companyId}`);
    },
    enabled: !!companyId,
  });

  const {
    data: seatsData = [],
    isLoading: seatLoading,
    refetch: refetchSeats,
  } = useSeatQuery(selectedFloorId, {
    onSuccess: () => {
      setHasUnsavedChanges(false);
    },
  });

  useEffect(() => {
    if (isNew) {
      setShowCreateFloorModal(true);
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew && !floorsQuery.isLoading && floorsQuery.data?.length > 0) {
      if (!selectedFloorId) {
        setSelectedFloorId(floorsQuery.data[0].id);
      }
    }
  }, [floorsQuery.isLoading, floorsQuery.data, selectedFloorId, isNew]);

  const tryLockFloor = useCallback(async (floorId) => {
    if (!floorId) return;
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/api/floors/${floorId}/lock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setLockError(errData.message || "Floor locked by another admin");
        setLocked(true);
        setEditable(false);
      } else {
        setLockError("Failed to lock floor");
        setLocked(true);
        setEditable(false);
      }
    } else {
      setLockError("");
      setLocked(false);
      setEditable(true);
      lockedFloorRef.current = floorId;
    }
  }, []);

  const unlockFloor = useCallback(async (floorId) => {
    if (!floorId) return;
    const token = await getAuthToken();
    await fetch(`${BACKEND_URL}/api/floors/${floorId}/lock`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (lockedFloorRef.current === floorId) {
      lockedFloorRef.current = null;
    }
    setLocked(false);
    setEditable(false);
  }, []);

  useEffect(() => {
    const updateLock = async () => {
      if (
        prevFloorIdRef.current &&
        prevFloorIdRef.current !== selectedFloorId
      ) {
        await unlockFloor(prevFloorIdRef.current);
      }
      if (selectedFloorId) {
        await tryLockFloor(selectedFloorId);
      }
      prevFloorIdRef.current = selectedFloorId;
    };
    if (selectedFloorId) {
      updateLock();
    }
  }, [selectedFloorId, tryLockFloor, unlockFloor]);

  const handleSave = async () => {
    if (!selectedFloorId) {
      Alert.alert("No Floor Selected", "Select a floor first.");
      return;
    }
    try {
      setIsSaving(true);
      const token = await getAuthToken();
      const updatedSeats = seatsData.map((s) => ({
        id: String(s.id).startsWith("temp-") ? null : Number(s.id),
        seatNumber: s.seatNumber,
        xCoordinate: s.x,
        yCoordinate: s.y,
        angle: s.angle ?? 0,
        floorId: selectedFloorId,
        status: s.status,
      }));
      const res = await fetch(`${BACKEND_URL}/api/seats/bulk-update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seats: updatedSeats }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update seats");
      }
      refetchSeats();
      setHasUnsavedChanges(false);
      Alert.alert("Success", "Floor plan saved!");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const snapToGrid = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const updateSeatPosition = async (seatId, x, y) => {
    if (!editable) {
      Alert.alert("Not Editable", "Floor is locked or not editable.");
      return;
    }
    try {
      const seat = seatsData.find((s) => s.id === seatId);
      if (!seat) return;
      const token = await getAuthToken();
      const updatedSeat = { ...seat, xCoordinate: x, yCoordinate: y };
      const response = await fetch(`${BACKEND_URL}/api/seats/${seatId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSeat),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update seat position");
      }
      setHasUnsavedChanges(true);
      refetchSeats();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const rotateSeat = async (seatId) => {
    if (!editable) {
      Alert.alert("Not Editable", "You cannot rotate seats right now.");
      return;
    }
    try {
      const seat = seatsData.find((s) => s.id === seatId);
      if (!seat) return;
      const token = await getAuthToken();
      const newAngle = (seat.angle + 90) % 360;
      const response = await fetch(`${BACKEND_URL}/api/seats/${seatId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...seat, angle: newAngle }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to rotate seat");
      }
      setHasUnsavedChanges(true);
      refetchSeats();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteSeat = async (seatId) => {
    if (!editable) {
      Alert.alert("Not Editable", "Cannot delete seats now.");
      return;
    }
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BACKEND_URL}/api/seats/${seatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete seat");
      }
      setHasUnsavedChanges(true);
      refetchSeats();
      if (selectedSeat && selectedSeat.id === seatId.toString()) {
        setSelectedSeat(null);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const addSeat = async () => {
    if (!editable) {
      Alert.alert("Cannot Add Seat", "Floor is locked or not editable.");
      return;
    }
    if (!selectedFloorId) {
      Alert.alert("No Floor Selected", "Create or select a floor first.");
      return;
    }
    const newSeat = {
      seatNumber: `S${seatsData.length + 1}`,
      xCoordinate: snapToGrid(width / 2),
      yCoordinate: snapToGrid(height / 2),
      angle: 0,
      floorId: selectedFloorId,
      status: "AVAILABLE",
    };
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BACKEND_URL}/api/seats/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSeat),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create seat");
      }
      await refetchSeats();
      setHasUnsavedChanges(true);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSeatPress = (seat) => {
    setSelectedSeat(seat);
  };

  useEffect(() => {
    if (selectedSeat && !seatsData.find((s) => s.id === selectedSeat.id)) {
      setSelectedSeat(null);
    }
  }, [seatsData, selectedSeat]);

  const renderGrid = () => {
    if (!showGrid) return null;
    const numH = Math.floor(height / GRID_SIZE);
    const numV = Math.floor(width / GRID_SIZE);
    const lines = [];
    for (let i = 0; i <= numH; i++) {
      lines.push(
        <SvgLine
          key={`h${i}`}
          x1="0"
          y1={i * GRID_SIZE}
          x2={width}
          y2={i * GRID_SIZE}
          stroke="#ddd"
          strokeWidth="0.5"
        />
      );
    }
    for (let i = 0; i <= numV; i++) {
      lines.push(
        <SvgLine
          key={`v${i}`}
          x1={i * GRID_SIZE}
          y1="0"
          x2={i * GRID_SIZE}
          y2={height}
          stroke="#ddd"
          strokeWidth="0.5"
        />
      );
    }
    return (
      <Svg
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {lines}
      </Svg>
    );
  };

  const handleCreateFloor = async () => {
    if (!floorName.trim() || !floorNumber.trim()) {
      Alert.alert("Validation", "Please enter both floor name and number.");
      return;
    }
    try {
      const token = await getAuthToken();
      const body = {
        name: floorName.trim(),
        floorNumber: parseInt(floorNumber.trim(), 10),
        companyId,
      };
      const newFloor = await apiPost(
        `${BACKEND_URL}/api/floors/create`,
        body,
        "POST",
        token
      );
      setSelectedFloorId(newFloor.id);
      setShowCreateFloorModal(false);
      setFloorName("");
      setFloorNumber("");
      floorsQuery.refetch();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create floor.");
    }
  };

  const floorsDataList = floorsQuery.data || [];

  return (
    <PaperProvider theme={theme}>
      <Container>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />

        <TopBar style={{ paddingTop: insets.top }}>
          <Menu
            visible={floorMenuVisible}
            onDismiss={() => setFloorMenuVisible(false)}
            anchor={
              <FloorSelector onPress={() => setFloorMenuVisible(true)}>
                <FloorText numberOfLines={1}>
                  {floorsDataList.length > 0 && selectedFloorId
                    ? floorsDataList.find((f) => f.id === selectedFloorId)
                        ?.name || "No Floor Selected"
                    : "No Floor Selected"}
                </FloorText>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </FloorSelector>
            }
          >
            {floorsDataList.length === 0 ? (
              <Menu.Item title="No floors" disabled />
            ) : (
              floorsDataList.map((fl) => (
                <Menu.Item
                  key={fl.id}
                  onPress={() => {
                    if (hasUnsavedChanges) {
                      Alert.alert(
                        "Unsaved Changes",
                        "Save changes before switching floors?",
                        [
                          {
                            text: "Don't Save",
                            onPress: () => setSelectedFloorId(fl.id),
                          },
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Save",
                            onPress: async () => {
                              await handleSave();
                              setSelectedFloorId(fl.id);
                            },
                          },
                        ]
                      );
                    } else {
                      setSelectedFloorId(fl.id);
                    }
                  }}
                  title={fl.name}
                />
              ))
            )}
          </Menu>

          <CenterSection>
            <Searchbar
              placeholder="Search seat..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{
                height: 36,
                justifyContent: "center",
                backgroundColor: theme.colors.light,
                elevation: 0,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
              inputStyle={{
                textAlignVertical: "center",
                paddingVertical: 0,
                fontSize: 14,
                includeFontPadding: false,
                textAlign: "left",
                height: "100%",
                marginVertical: -11,
              }}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </CenterSection>

          <IconButtonWrap onPress={() => setShowGrid(!showGrid)}>
            <MaterialCommunityIcons
              name="grid"
              size={24}
              color={
                showGrid ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </IconButtonWrap>

          <SaveButton
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={!hasUnsavedChanges || isSaving || !editable}
          >
            Save
          </SaveButton>
        </TopBar>

        <Canvas>
          {renderGrid()}
          {selectedFloorId && seatLoading && (
            <ActivityIndicator
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginLeft: -20,
                marginTop: -20,
              }}
              color={theme.colors.primary}
            />
          )}
          {selectedFloorId && seatsData.length === 0 ? (
            <Text
              style={{
                position: "absolute",
                top: "45%",
                alignSelf: "center",
                color: theme.colors.textSecondary,
              }}
            >
              No seats found.
            </Text>
          ) : (
            seatsData
              .filter((s) =>
                s.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((seat) => (
                <DraggableSeat
                  key={seat.id}
                  seat={seat}
                  snapToGrid={(val) => Math.round(val / GRID_SIZE) * GRID_SIZE}
                  updateSeatPosition={updateSeatPosition}
                  editable={editable}
                  onPressSeat={handleSeatPress}
                />
              ))
          )}

          <LockIndicator locked={locked}>
            <Text
              style={{
                color: theme.colors.light,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {locked
                ? lockError || "Locked by another admin"
                : "Editing allowed"}
            </Text>
          </LockIndicator>
        </Canvas>

        <FabContainer
          style={{ bottom: BOTTOM_BAR_HEIGHT + theme.spacing.lg * 1.5 }}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary]}
            style={{
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: FAB_SIZE / 2,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={addSeat}
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="plus"
                size={28}
                color={theme.colors.light}
              />
            </Pressable>
          </LinearGradient>
        </FabContainer>

        <Surface
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: BOTTOM_BAR_HEIGHT,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            elevation: 10,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.textPrimary,
            }}
          >
            {selectedSeat
              ? `Selected: ${selectedSeat.label} (Angle: ${selectedSeat.angle}°)`
              : "No seat selected"}
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <IconButton
              icon="rotate-3d-variant"
              size={28}
              disabled={!selectedSeat}
              onPress={() => {
                if (selectedSeat) rotateSeat(selectedSeat.id);
              }}
            />
            <IconButton
              icon="delete-forever"
              size={28}
              disabled={!selectedSeat}
              color={theme.colors.error}
              onPress={() => {
                if (selectedSeat) handleDeleteSeat(selectedSeat.id);
              }}
            />
            <IconButton
              icon="close"
              size={28}
              disabled={!selectedSeat}
              onPress={() => setSelectedSeat(null)}
            />
          </View>
        </Surface>

        <Modal
          visible={showCreateFloorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateFloorModal(false)}
        >
          <ModalBackdrop>
            {/* Centered box: Using a View wrapper + KeyboardAwareScrollView inside */}
            <View
              style={{
                width: "80%",
                maxWidth: 400,
                backgroundColor: theme.colors.light,
                borderRadius: theme.spacing.md,
                padding: 20,
              }}
            >
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={0}
                keyboardVerticalOffset={Platform.select({
                  ios: 80,
                  android: 80,
                })}
                style={{ maxHeight: 400 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                }}
              >
                <ModalTitle>Create New Floor</ModalTitle>

                <ModalTitle>Floor Name</ModalTitle>
                <ModalInput
                  placeholder="Floor Name"
                  placeholderTextColor="#999"
                  value={floorName}
                  onChangeText={setFloorName}
                />

                <ModalTitle>Floor Number</ModalTitle>
                <ModalInput
                  placeholder="Floor Number"
                  placeholderTextColor="#999"
                  value={floorNumber}
                  onChangeText={setFloorNumber}
                  keyboardType="numeric"
                />

                <PaperButton
                  mode="contained"
                  onPress={handleCreateFloor}
                  style={{ marginBottom: 12 }}
                >
                  Create
                </PaperButton>

                <PaperButton onPress={() => setShowCreateFloorModal(false)}>
                  Cancel
                </PaperButton>
              </KeyboardAwareScrollView>
            </View>
          </ModalBackdrop>
        </Modal>
      </Container>
    </PaperProvider>
  );
}
