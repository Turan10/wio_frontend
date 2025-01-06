import React, { useState } from "react";
import { Alert, Pressable, Text, Platform } from "react-native";
import { useTheme } from "styled-components/native";
import styled from "styled-components/native";
import { useDispatch } from "react-redux";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Card, TextInput, Button } from "react-native-paper";
import { setUser } from "../store/slices/userSlice";
import { apiPost, BACKEND_URL } from "../utils/api";
import { storeAuthToken } from "../utils/auth";
import { PlatformUtils } from "../utils/platformConfig";

const ScreenContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding-horizontal: ${({ theme }) => theme.spacing.lg}px;
  justify-content: center;
  align-items: center;
`;

const HeaderContainer = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const HeaderTitle = styled.Text`
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FormCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: ${({ theme }) => theme.spacing.md}px;
  elevation: 3;
  overflow: hidden;
  ${PlatformUtils.getShadowStyle(3)};
`;

const CardContentWrapper = styled.View`
  min-height: 420px;
  max-height: 520px;
`;

const CardInnerScroll = styled(KeyboardAwareScrollView).attrs({
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: "handled",
  enableOnAndroid: true,
  enableAutomaticScroll: true,
  extraScrollHeight: 0,
  keyboardVerticalOffset: Platform.select({ ios: 80, android: 80 }),
  contentContainerStyle: { flexGrow: 1 },
})`
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const CardTitle = styled.Text`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const InputWrapper = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const StyledInput = styled(TextInput)`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [selectedSegment, setSelectedSegment] = useState(0);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCode, setRegCode] = useState("");

  const handleSignIn = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      const data = await apiPost(`${BACKEND_URL}/api/users/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      await storeAuthToken(data.token);
      dispatch(setUser(data));
      if (data.role === "ADMIN") {
        navigation.replace("AdminDashboard");
      } else {
        navigation.replace("EmployeeDashboard");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRegisterWithCode = async () => {
    if (!regName || !regEmail || !regPassword || !regCode) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await apiPost(`${BACKEND_URL}/api/users/register`, {
        name: regName,
        email: regEmail,
        password: regPassword,
        oneTimeCode: regCode,
      });
      Alert.alert("Success", "Registered! Verify your email and then log in.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScreenContainer>
      <HeaderContainer>
        <HeaderTitle>Who's in Office</HeaderTitle>
        <HeaderSubtitle>Select an option below</HeaderSubtitle>
      </HeaderContainer>

      <FormCard>
        <SegmentedControl
          values={["Sign In", "Register"]}
          selectedIndex={selectedSegment}
          onChange={(event) =>
            setSelectedSegment(event.nativeEvent.selectedSegmentIndex)
          }
          style={{
            marginTop: theme.spacing.lg,
            marginHorizontal: theme.spacing.lg,
          }}
          tintColor={theme.colors.primary}
          backgroundColor={theme.colors.surface}
          fontStyle={{ color: theme.colors.textSecondary }}
          activeFontStyle={{
            color: theme.colors.textPrimary,
            fontWeight: "600",
          }}
        />

        <CardContentWrapper>
          <CardInnerScroll>
            {selectedSegment === 0 && (
              <>
                <CardTitle>Sign In</CardTitle>
                <InputWrapper>
                  <StyledInput
                    label="Email"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    mode="outlined"
                  />
                  <StyledInput
                    label="Password"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    mode="outlined"
                  />
                </InputWrapper>

                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Sign In
                </Button>
              </>
            )}

            {selectedSegment === 1 && (
              <>
                <CardTitle>Register w/ Code</CardTitle>
                <InputWrapper>
                  <StyledInput
                    label="Full Name"
                    value={regName}
                    onChangeText={setRegName}
                    mode="outlined"
                  />
                  <StyledInput
                    label="Email"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    mode="outlined"
                  />
                  <StyledInput
                    label="Password"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry
                    mode="outlined"
                  />
                  <StyledInput
                    label="One-Time Code"
                    value={regCode}
                    onChangeText={setRegCode}
                    mode="outlined"
                  />
                </InputWrapper>

                <Button
                  mode="contained"
                  onPress={handleRegisterWithCode}
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Register
                </Button>
              </>
            )}
          </CardInnerScroll>
        </CardContentWrapper>
      </FormCard>

      <Pressable
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate("CompanyRegistration")}
      >
        <Text style={{ color: theme.colors.primary }}>
          Create a New Company (Admin only)
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
