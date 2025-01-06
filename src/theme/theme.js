import {
  MD3LightTheme as PaperDefaultTheme,
  MD3DarkTheme as PaperDarkTheme,
} from "react-native-paper";
import colors from "./colors";
import spacing from "./spacing";

const CustomLightTheme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.light,
    error: colors.error,
    text: colors.textPrimary,
    placeholder: colors.textSecondary,
    border: colors.border,
    backdrop: "rgba(0, 0, 0, 0.5)",
  },
  spacing: spacing,
};

const CustomDarkTheme = {
  ...PaperDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.darkSurface,
    error: colors.error,
    text: colors.textPrimary,
    placeholder: colors.textSecondary,
    border: colors.border,
    backdrop: "rgba(255, 255, 255, 0.5)",
  },
  spacing: spacing,
};

export { CustomLightTheme, CustomDarkTheme };
