import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import styled from "styled-components/native";

const SeatContainer = styled.View`
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  margin: 5px;
  opacity: ${(props) => (props.booked ? 0.5 : 1)};
`;

const Seat = ({ booked, rotation }) => {
  const theme = useTheme();
  return (
    <SeatContainer
      booked={booked}
      style={{ transform: [{ rotate: `${rotation}deg` }] }}
    >
      <MaterialCommunityIcons
        name="seat"
        size={24}
        color={booked ? theme.colors.placeholder : theme.colors.primary}
        accessibilityLabel={booked ? "Booked seat" : "Available seat"}
      />
    </SeatContainer>
  );
};

Seat.propTypes = {
  booked: PropTypes.bool,
  rotation: PropTypes.number,
};

Seat.defaultProps = {
  booked: false,
  rotation: 0,
};

export default Seat;
