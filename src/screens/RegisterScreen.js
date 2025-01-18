import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTheme } from "styled-components/native";
import styled from "styled-components/native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { apiPost, BACKEND_URL } from "../utils/api";

const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.colors.background};
  padding: ${(props) => props.theme.spacing.lg}px;
  justify-content: center;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.lg}px;
  text-align: center;
`;

const Input = styled.TextInput`
  background-color: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md}px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${(props) => props.theme.colors.border};
  font-size: 16px;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
`;

const PrimaryButton = styled.Pressable`
  background-color: ${(props) => props.theme.colors.primary};
  padding-vertical: ${(props) => props.theme.spacing.md}px;
  align-items: center;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  margin-top: ${(props) => props.theme.spacing.md}px;
`;

const PrimaryButtonText = styled.Text`
  color: ${(props) => props.theme.colors.light};
  font-weight: 600;
  font-size: 16px;
`;

export default function RegisterScreen() {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  const initialCode = route.params?.token || "";
  const [oneTimeCode, setOneTimeCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !oneTimeCode) {
      Alert.alert("Error", "Please fill all fields, including one-time code.");
      return;
    }

    try {
      const body = {
        name,
        email,
        password,
        oneTimeCode,
      };

      await apiPost(`${BACKEND_URL}/api/users/register`, body);
      Alert.alert(
        "Success",
        "Registration successful! You can now login with your credentials.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <Container>
      <Title>Join with a One-Time Code</Title>
      <Input
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={theme.colors.placeholder}
      />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.colors.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.colors.placeholder}
        secureTextEntry
      />
      <Input
        placeholder="One-Time Code"
        value={oneTimeCode}
        onChangeText={setOneTimeCode}
        placeholderTextColor={theme.colors.placeholder}
      />
      <PrimaryButton onPress={handleRegister}>
        <PrimaryButtonText>Register</PrimaryButtonText>
      </PrimaryButton>
    </Container>
  );
}
