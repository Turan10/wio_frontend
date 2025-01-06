import React from "react";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import styled from "styled-components/native";

const Container = styled(Pressable)`
  width: 30%;
  aspect-ratio: 1;
  margin: ${(props) => props.theme.spacing.sm}px;
  padding: ${(props) => props.theme.spacing.md}px;
  background-color: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  align-items: center;
  justify-content: center;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 1.41px;
`;

const IconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.theme.colors.background};
  align-items: center;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spacing.sm}px;
`;

const Title = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};
  text-align: center;
  font-weight: 500;
`;

export const QuickAction = ({ title, icon, onPress }) => {
  const theme = useTheme();

  return (
    <Container
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Quick action: ${title}`}
    >
      <IconContainer>
        <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
      </IconContainer>
      <Title numberOfLines={1}>{title}</Title>
    </Container>
  );
};

export default QuickAction;
