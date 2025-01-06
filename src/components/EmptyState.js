import React from "react";
import styled from "styled-components/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const MessageText = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.md}px;
  text-align: center;
`;

export default function EmptyState({ icon, message }) {
  return (
    <Container>
      {icon && <MaterialCommunityIcons name={icon} size={48} color="#999" />}
      <MessageText>{message}</MessageText>
    </Container>
  );
}
