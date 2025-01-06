import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";

export const PlatformLayout = ({
  children,
  style,
  useSafeArea = true,
  edges = ["left", "right"],
  headerHeight = 60,
}) => {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, style]} edges={edges}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default PlatformLayout;
