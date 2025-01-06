import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import styled from "styled-components/native";

const Container = styled(Pressable)`
  width: 100%;
`;

const Content = styled(Animated.View)`
  background-color: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  overflow: hidden;
  shadow-color: #000;
  elevation: 2;
`;

export const AnimatedCard = ({
  children,
  style,
  onPress,
  elevation = 2,
  animateOnMount = true,
  delayMount = 0,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const shadowValue = useRef(new Animated.Value(elevation)).current;

  useEffect(() => {
    if (animateOnMount) {
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            damping: 15,
            mass: 0.8,
          }),
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 12,
            mass: 0.8,
          }),
        ]).start();
      }, delayMount);

      return () => clearTimeout(timeout);
    }
  }, [animateOnMount, delayMount, scaleValue, opacityValue, translateY]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
        damping: 15,
        mass: 0.8,
      }),
      Animated.timing(shadowValue, {
        toValue: elevation - 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        mass: 0.8,
      }),
      Animated.timing(shadowValue, {
        toValue: elevation,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedShadowStyle = {
    shadowOffset: {
      width: 0,
      height: shadowValue.interpolate({
        inputRange: [0, elevation],
        outputRange: [0, elevation],
      }),
    },
    shadowOpacity: shadowValue.interpolate({
      inputRange: [0, elevation],
      outputRange: [0, 0.2],
    }),
    shadowRadius: shadowValue.interpolate({
      inputRange: [0, elevation],
      outputRange: [0, elevation * 1.41],
    }),
  };

  return (
    <Container
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Content
        style={[
          {
            opacity: opacityValue,
            transform: [{ scale: scaleValue }, { translateY }],
          },
          animatedShadowStyle,
        ]}
      >
        {children}
      </Content>
    </Container>
  );
};

export default AnimatedCard;
