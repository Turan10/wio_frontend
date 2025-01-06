import React from "react";
import styled from "styled-components/native";
import { Pressable } from "react-native";

const BaseCard = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 1px;
`;

export function AppCard({ children, onPress, style, ...rest }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style} {...rest}>
        <BaseCard>{children}</BaseCard>
      </Pressable>
    );
  }
  return (
    <BaseCard style={style} {...rest}>
      {children}
    </BaseCard>
  );
}
