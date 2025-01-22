import React from "react";
import { Text } from "react-native";
import styled from "styled-components/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { PlatformUtils } from "../utils/platformConfig";

const CardContainer = styled.View`
  background-color: ${(props) => props.theme.colors.light};
  padding: ${(props) => props.theme.spacing.md}px;
  border-radius: ${(props) => props.theme.spacing.md}px;
  width: 180px;
  margin-right: ${(props) => props.theme.spacing.md}px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
`;

const TitleText = styled.Text`
  font-size: ${PlatformUtils.scaleFontSize(14)}px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.xs}px;
`;

const ValueText = styled.Text`
  font-size: ${PlatformUtils.scaleFontSize(20)}px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.xs}px;
`;

const TrendContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TrendText = styled.Text`
  font-size: ${PlatformUtils.scaleFontSize(12)}px;
  font-weight: 600;
  color: ${(props) =>
    props.trendUp ? props.theme.colors.success : props.theme.colors.error};
  margin-left: 4px;
`;


export default function StatCard({
  title,
  value = 0,
  trend = "",
  timeframeLabel = "",
  trendUp = false,
  icon = "chart-bar",
}) {
  return (
    <CardContainer accessibilityRole="summary">
      <TitleText>{title}</TitleText>
      <ValueText>{value}</ValueText>

      <TrendContainer>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={trendUp ? "#4CAF50" : "#F44336"}
        />
        <TrendText trendUp={trendUp}>
          {trend} {timeframeLabel}
        </TrendText>
      </TrendContainer>
    </CardContainer>
  );
}
