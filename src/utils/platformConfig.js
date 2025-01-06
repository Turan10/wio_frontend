import { Platform, StatusBar, Dimensions, PixelRatio } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

export const PlatformUtils = {
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",

  screenWidth: WINDOW_WIDTH,
  screenHeight: WINDOW_HEIGHT,

  select: Platform.select,

  getShadowStyle: (elevation = 2) => ({
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: elevation,
        },
        shadowOpacity: 0.1,
        shadowRadius: elevation * 1.5,
      },
      android: {
        elevation: elevation,
      },
    }),
  }),

  scaleFontSize: (size) => {
    const scale = WINDOW_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  fonts: {
    regular: Platform.select({
      ios: "System",
      android: "sans-serif",
    }),
    medium: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
    }),
    light: Platform.select({
      ios: "System",
      android: "sans-serif-light",
    }),
    bold: Platform.select({
      ios: "System",
      android: "sans-serif-bold",
    }),
  },
};

export const useLayoutConfig = () => {
  const insets = useSafeAreaInsets();

  const topPadding = PlatformUtils.isIOS ? insets.top : STATUSBAR_HEIGHT;

  return {
    statusBarHeight: PlatformUtils.isAndroid ? STATUSBAR_HEIGHT : 0,
    topInset: insets.top,
    bottomInset: insets.bottom,

    getHeaderHeight: (baseHeight = 60) => baseHeight + topPadding,

    getScreenPadding: () => ({
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
  };
};

export const createPlatformStyle = (styles) => {
  const transformedStyles = {};

  Object.keys(styles).forEach((key) => {
    transformedStyles[key] = Platform.select({
      ios: {
        fontFamily: PlatformUtils.fonts.regular,
        ...styles[key],
      },
      android: {
        fontFamily: PlatformUtils.fonts.regular,
        ...styles[key],
      },
    });
  });

  return transformedStyles;
};
