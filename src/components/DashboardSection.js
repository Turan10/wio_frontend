import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import styled from "styled-components/native";

const Section = styled.View`
  margin-bottom: ${(props) => props.theme.spacing.xl}px;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
`;

export const DashboardSection = ({
  title,
  data,
  renderItem,
  ListFooterComponent,
}) => {
  const theme = useTheme();

  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
      {data.map((item) => renderItem({ item }))}
      {ListFooterComponent}
    </Section>
  );
};

export default DashboardSection;
