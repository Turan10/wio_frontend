import React, { useRef, useEffect, memo } from "react";
import { Animated, TouchableWithoutFeedback } from "react-native";
import {
  PanGestureHandler,
  State as GHState,
} from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import styled from "styled-components/native";

const IconContainer = styled.View`
  width: 45px;
  height: 45px;
  border-radius: 8px;
  background-color: ${(props) =>
    props.status === "AVAILABLE"
      ? props.theme.colors.success
      : props.theme.colors.error};
  justify-content: center;
  align-items: center;
  border-color: #ccc;
  border-width: 1px;
`;

function DraggableSeat({
  seat,
  snapToGrid,
  updateSeatPosition,
  editable,
  onPressSeat,
}) {
  const theme = useTheme();

  const initX = Number(seat.x) || 0;
  const initY = Number(seat.y) || 0;
  const initAngle = Number(seat.angle) || 0;

  const baseX = useRef(new Animated.Value(initX)).current;
  const baseY = useRef(new Animated.Value(initY)).current;
  const dx = useRef(new Animated.Value(0)).current;
  const dy = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    baseX.setValue(Number(seat.x) || 0);
    baseY.setValue(Number(seat.y) || 0);
  }, [seat.x, seat.y, baseX, baseY]);

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dx, translationY: dy } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (evt) => {
    if (
      evt.nativeEvent.state === GHState.END ||
      evt.nativeEvent.state === GHState.CANCELLED
    ) {
      if (!editable) {
        dx.setValue(0);
        dy.setValue(0);
        return;
      }
      const finalX = initX + (evt.nativeEvent.translationX || 0);
      const finalY = initY + (evt.nativeEvent.translationY || 0);
      const snappedX = snapToGrid(finalX);
      const snappedY = snapToGrid(finalY);
      updateSeatPosition(seat.id, snappedX, snappedY);
      baseX.setValue(snappedX);
      baseY.setValue(snappedY);
      dx.setValue(0);
      dy.setValue(0);
    }
  };

  const handlePress = () => {
    if (!editable) return;
    onPressSeat?.(seat);
  };

  const finalX = Animated.add(baseX, dx);
  const finalY = Animated.add(baseY, dy);

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: finalX,
          top: finalY,
          transform: [{ rotate: `${initAngle}deg` }],
          zIndex: 9999,
        }}
      >
        <TouchableWithoutFeedback onPress={handlePress} disabled={!editable}>
          <IconContainer theme={theme} status={seat.status}>
            <MaterialCommunityIcons
              name="seat"
              size={35}
              color={theme.colors.textPrimary}
            />
          </IconContainer>
        </TouchableWithoutFeedback>
      </Animated.View>
    </PanGestureHandler>
  );
}

export default memo(DraggableSeat);
