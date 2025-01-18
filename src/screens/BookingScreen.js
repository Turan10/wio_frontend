import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Pressable,
  Dimensions,
  Text,
  View,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import styled, { useTheme } from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Popover, { PopoverPlacement } from "react-native-popover-view";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LottieView from "lottie-react-native";
import { apiGet, apiPost, BACKEND_URL } from "../utils/api";
import SuccessAnimation from "../../assets/success.json";
import LoadingAnimation from "../../assets/loading.json";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;

const DateSelector = styled.Pressable`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  margin: ${({ theme }) => theme.spacing.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  elevation: 2;
`;

const DateText = styled.Text`
  margin-left: ${({ theme }) => theme.spacing.md}px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const CanvasWrapper = styled.View`
  flex: 1;
  position: relative;
`;

const Canvas = styled.View`
  width: ${SCREEN_WIDTH}px;
  height: ${SCREEN_HEIGHT}px;
  position: relative;
  background-color: ${({ theme }) => theme.colors.background};
`;

const BookButton = styled.Pressable`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg}px;
  elevation: 4;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const BookButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  font-weight: bold;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const CalendarContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  margin: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  elevation: 5;
`;

const CloseButton = styled.Pressable`
  margin-top: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
`;

const CloseButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.surface};
  font-weight: bold;
  font-size: 16px;
`;

const TooltipContent = styled.View`
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  min-width: 200px;
`;

const OccupantName = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const BookingDetails = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 20px;
`;

const SeatAnimation = Animated.createAnimatedComponent(Pressable);

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(dateString) {
  if (!dateString) return "Select Date";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return "Select Date";
  return `${day}-${month}-${year}`;
}

function formatDateVerbose(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SuccessModal = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.successModal}>
        <View style={{ width: 150, height: 150 }}>
          <LottieView
            key="booking-success"
            source={SuccessAnimation}
            autoPlay
            loop={false}
            style={{ flex: 1 }}
          />
        </View>
        <Text style={styles.successText}>Seat Booked Successfully!</Text>
        <Pressable style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>OK</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

function SeatView({ seat, onPress }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isBooked = seat.booked;
  const occupantName = seat.occupantName || "";
  const shouldShowTooltip = isBooked && occupantName;

  const animatePress = useCallback(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          friction: 5,
          tension: 40,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 40,
        }),
      ]),
      Animated.sequence([
        Animated.spring(rotateAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 40,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 5,
          tension: 40,
        }),
      ]),
    ]).start();
  }, [scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  });

  return (
    <Popover
      isVisible={tooltipVisible}
      onRequestClose={() => setTooltipVisible(false)}
      placement={PopoverPlacement.TOP}
      popoverStyle={styles.popover}
      backgroundStyle={styles.popoverBackground}
      from={
        <SeatAnimation
          onLongPress={() => {
            if (shouldShowTooltip) {
              setTooltipVisible(true);
              animatePress();
            }
          }}
          onPress={() => {
            if (!isBooked) {
              animatePress();
              onPress(seat);
            } else {
              setTooltipVisible(true);
              animatePress();
            }
          }}
          style={[
            styles.seat,
            {
              left: seat.xcoordinate,
              top: seat.ycoordinate,
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
                { rotate: `${seat.angle}deg` },
              ],
              backgroundColor: isBooked ? "#f0f0f0" : "#ffffff",
              borderColor: isBooked ? "#aaa" : theme.colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="seat"
            size={24}
            color={isBooked ? "#666" : theme.colors.primary}
            style={styles.seatIcon}
          />
          {isBooked ? (
            <Text style={styles.seatText}>{getInitials(occupantName)}</Text>
          ) : (
            <Text style={styles.seatNumber}>{seat.seatNumber}</Text>
          )}
        </SeatAnimation>
      }
    >
      <TooltipContent>
        <OccupantName>{occupantName}</OccupantName>
        <BookingDetails>
          {`Booked for ${formatDateVerbose(seat.bookingDate || new Date())}\n${
            seat.department ? `Department: ${seat.department}\n` : ""
          }Duration: Full Day`}
        </BookingDetails>
      </TooltipContent>
    </Popover>
  );
}

export default function BookingScreen({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.user.currentUser);
  const queryClient = useQueryClient();
  const floorId = route?.params?.floorId || 1;
  const [selectedDate, setSelectedDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const {
    data: seatData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["seats", floorId, selectedDate],
    queryFn: async () => {
      if (!floorId || !selectedDate) return [];
      const url = `${BACKEND_URL}/api/seats/floor/${floorId}?date=${selectedDate}`;
      return apiGet(url);
    },
    enabled: Boolean(floorId) && Boolean(selectedDate),
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingDetails) => {
      return apiPost(`${BACKEND_URL}/api/bookings/create`, bookingDetails);
    },
    onMutate: async (bookingDetails) => {
      await queryClient.cancelQueries({
        queryKey: ["seats", floorId, selectedDate],
      });
      const previousData = queryClient.getQueryData([
        "seats",
        floorId,
        selectedDate,
      ]);
      queryClient.setQueryData(["seats", floorId, selectedDate], (old) => {
        if (!old) return old;
        return old.map((seat) =>
          seat.id === bookingDetails.seatId
            ? {
                ...seat,
                booked: true,
                occupantName: user.name,
                bookingDate: selectedDate,
              }
            : seat
        );
      });
      return { previousData };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        ["seats", floorId, selectedDate],
        context?.previousData
      );
      if (error?.status === 409) {
        Alert.alert(
          "Booking Conflict",
          "You have already booked a seat for this date. Please choose a different date."
        );
      } else {
        Alert.alert(
          "Error",
          error?.message || "Failed to book seat. Please try again."
        );
      }
    },
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["seats", floorId, selectedDate],
      });
    },
  });

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const handleSeatPress = (seat) => {
    setSelectedSeat(seat);
  };

  const handleBooking = () => {
    if (!selectedSeat || !selectedDate) {
      Alert.alert("Error", "Please select both a date and a seat.");
      return;
    }
    bookingMutation.mutate({
      seatId: selectedSeat.id,
      userId: user.id,
      date: selectedDate,
    });
  };

  return (
    <Container style={{ paddingTop: insets.top }}>
      <Header>
        <Title>Book a Seat</Title>
        <Subtitle>Select a date and seat to proceed</Subtitle>
      </Header>
      <DateSelector onPress={() => setShowCalendar(true)}>
        <MaterialIcons
          name="calendar-today"
          size={24}
          color={theme.colors.primary}
        />
        <DateText>{formatDate(selectedDate)}</DateText>
      </DateSelector>
      <CanvasWrapper>
        <Canvas>
          {isLoading && (
            <View style={styles.centerMessage}>
              <View style={{ width: 100, height: 100 }}>
                <LottieView
                  key="loading-seats"
                  source={LoadingAnimation}
                  autoPlay
                  loop
                  style={{ flex: 1 }}
                />
              </View>
              <Text
                style={[
                  styles.messageText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Loading seats...
              </Text>
            </View>
          )}
          {isError && (
            <View style={styles.centerMessage}>
              <MaterialIcons
                name="error-outline"
                size={32}
                color={theme.colors.error}
              />
              <Text style={[styles.messageText, { color: theme.colors.error }]}>
                Error loading seats. Please try again.
              </Text>
            </View>
          )}
          {!isLoading &&
            !isError &&
            seatData.map((seat) => (
              <SeatView key={seat.id} seat={seat} onPress={handleSeatPress} />
            ))}
        </Canvas>
      </CanvasWrapper>
      {selectedSeat && (
        <BookButton
          onPress={handleBooking}
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? (
            <View style={{ width: 50, height: 50 }}>
              <LottieView
                key="booking-loading"
                source={LoadingAnimation}
                autoPlay
                loop
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <BookButtonText>Book Seat {selectedSeat.seatNumber}</BookButtonText>
          )}
        </BookButton>
      )}

      {/* KALENDER-MODAL */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <ModalContainer>
          <CalendarContainer>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary,
                },
              }}
              minDate={new Date().toISOString().split("T")[0]}
              maxDate={
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              }
              // Forhindrer scrolling til måneder før nuværende
              pastScrollRange={0}
              // Deaktiverer tryk på "forbudte" datoer (for eksempel i går)
              disableAllTouchEventsForDisabledDays={true}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.surface,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                dotColor: theme.colors.primary,
                selectedDotColor: theme.colors.surface,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.primary,
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
              }}
            />
            <CloseButton onPress={() => setShowCalendar(false)}>
              <CloseButtonText>Close</CloseButtonText>
            </CloseButton>
          </CalendarContainer>
        </ModalContainer>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  popover: {
    backgroundColor: "transparent",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
