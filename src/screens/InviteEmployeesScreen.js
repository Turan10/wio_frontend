import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from "react-native";
import styled from "styled-components/native";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { format } from "date-fns";

import { apiPost, apiGet, BACKEND_URL } from "../utils/api";
import CustomHeader from "../components/CustomHeader";

const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.colors.background};
`;

const SectionCard = styled.View`
  background-color: ${(props) => props.theme.colors.light};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding: ${(props) => props.theme.spacing.md}px;
  margin-bottom: ${(props) => props.theme.spacing.xl}px;
  elevation: 2;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.sm}px;
`;

const SectionDescription = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
  line-height: 20px;
`;

const SecondaryButton = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding-vertical: ${(props) => props.theme.spacing.md}px;
`;

const SecondaryButtonText = styled.Text`
  color: ${(props) => props.theme.colors.light};
  font-size: 16px;
  font-weight: bold;
`;

const CodeListTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
`;

const CodeContainer = styled.View`
  background-color: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding: ${(props) => props.theme.spacing.md}px;
  margin-bottom: ${(props) => props.theme.spacing.md}px;
  elevation: 2;
`;

const CodeRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CodeText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
`;

const ExpiryText = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const ExpirationInput = styled(TextInput)`
  border-color: ${(props) => props.theme.colors.border};
  border-width: 1px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding: ${(props) => props.theme.spacing.sm}px;
  font-size: 16px;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
  width: 80px;
  text-align: center;
`;

export default function InviteEmployeesScreen({ navigation, route }) {
  const theme = useTheme();
  const { currentUser } = useSelector((state) => state.user);
  const companyId = currentUser?.companyId;

  const {
    data: activeCodes = [],
    isLoading: codesLoading,
    refetch: refetchCodes,
  } = useQuery({
    queryKey: ["activeOneTimeCodes", companyId],
    queryFn: () =>
      apiGet(`${BACKEND_URL}/api/onetime-codes/company/${companyId}/active`),
    enabled: !!companyId,
  });

  const [loading, setLoading] = useState(false);
  const [expirationInHours, setExpirationInHours] = useState("24");

  const handleGenerateCode = async () => {
    if (!companyId) {
      Alert.alert("Error", "No companyId found.");
      return;
    }
    if (!expirationInHours.trim()) {
      Alert.alert(
        "Validation",
        "Please enter an expiration in hours (e.g., 24)"
      );
      return;
    }
    const hoursNum = parseInt(expirationInHours, 10);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      Alert.alert("Validation", "Expiration hours must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const url = `${BACKEND_URL}/api/onetime-codes/generate?companyId=${companyId}&expirationInHours=${hoursNum}`;
      const res = await apiPost(url, {});
      Alert.alert(
        "Success",
        `New Code: ${res.code}\nExpires at: ${res.expiryDate}`
      );
      refetchCodes();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (theCode) => {
    try {
      await Clipboard.setStringAsync(theCode);
      Alert.alert("Copied", "Code copied to clipboard!");
    } catch (err) {
      Alert.alert("Error", `Failed to copy code: ${err.message}`);
    }
  };

  const formatExpiryDate = (expiryDate) => {
    const date = new Date(expiryDate);
    return format(date, "dd-MM-yyyy HH:mm");
  };

  return (
    <Container>
      <CustomHeader
        navigation={navigation}
        route={route}
        options={{ title: "One-Time Codes" }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
        }}
      >
        <SectionCard>
          <SectionTitle>Generate a One-Time Code</SectionTitle>
          <SectionDescription>
            Enter an expiration time in hours, then tap "Generate" to create a
            code employees can use to register in your company.
          </SectionDescription>
          <ExpirationInput
            placeholder="Hours"
            value={expirationInHours}
            onChangeText={setExpirationInHours}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <SecondaryButton onPress={handleGenerateCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.light} />
            ) : (
              <SecondaryButtonText>Generate One-Time Code</SecondaryButtonText>
            )}
          </SecondaryButton>
        </SectionCard>

        <SectionCard>
          <CodeListTitle>Active Codes</CodeListTitle>
          {codesLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : activeCodes.length > 0 ? (
            activeCodes.map((codeObj) => (
              <CodeContainer key={codeObj.id}>
                <CodeRow>
                  <CodeText>Code: {codeObj.code}</CodeText>
                  <Pressable onPress={() => copyToClipboard(codeObj.code)}>
                    <SectionDescription style={{ color: theme.colors.primary }}>
                      Copy
                    </SectionDescription>
                  </Pressable>
                </CodeRow>
                <ExpiryText>
                  Expires: {formatExpiryDate(codeObj.expiryDate)}
                </ExpiryText>
              </CodeContainer>
            ))
          ) : (
            <SectionDescription>No active codes found.</SectionDescription>
          )}
        </SectionCard>
      </ScrollView>
    </Container>
  );
}
