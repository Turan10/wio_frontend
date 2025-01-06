import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { PlatformUtils } from "../utils/platformConfig";

export default function CustomHeader({ navigation, route, options }) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const baseHeight = 20;
  const expandedHeaderHeight =
    baseHeight + (Platform === "android" ? 0 : insets.top);
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -(expandedHeaderHeight - 60) / 2],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });
  const title = options.title || route.name;

  return (
    <View style={[styles.container, { height: expandedHeaderHeight + 30 }]}>
      <Animated.View
        style={[
          styles.headerBackground,
          {
            transform: [{ translateY: headerTranslate }],
            height: expandedHeaderHeight + 30,
            opacity: headerOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.headerTitleContainer,
          { transform: [{ scale: titleScale }] },
        ]}
      >
        <View style={styles.leftContainer}>
          {navigation.canGoBack() && (
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#fff"
              />
            </Pressable>
          )}
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <View style={styles.rightContainer} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#2196F3",
    zIndex: 15,
  },
  headerBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#2196F3",
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginTop: 25,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  leftContainer: {
    width: 50,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  rightContainer: {
    width: 50,
  },
  titleText: {
    color: "#fff",
    fontSize: PlatformUtils.scaleFontSize(18),
    fontWeight: "600",
  },
});
