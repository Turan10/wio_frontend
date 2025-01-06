import React, { useState } from "react";
import { Alert } from "react-native";
import styled from "styled-components/native";
import { useTheme } from "styled-components/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { apiPost, apiGet, BACKEND_URL, storeAuthToken } from "../utils/api";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/userSlice";

const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.colors.background};
`;

const Header = styled.View`
  background-color: ${(props) => props.theme.colors.light};
  padding: ${(props) => props.theme.spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.colors.border};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.textPrimary};
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: ${(props) => props.theme.spacing.sm}px;
`;

const Form = styled.View`
  padding: ${(props) => props.theme.spacing.lg}px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: ${(props) => props.theme.spacing.lg}px;
  color: ${(props) => props.theme.colors.textPrimary};
`;

const InputGroup = styled.View`
  margin-bottom: ${(props) => props.theme.spacing.lg}px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.sm}px;
`;

const Input = styled.TextInput`
  background-color: ${(props) => props.theme.colors.light};
  padding: ${(props) => props.theme.spacing.md}px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${(props) => props.theme.colors.border};
  font-size: 16px;
  color: ${(props) => props.theme.colors.text};
`;

const Button = styled.Pressable`
  background-color: ${(props) => props.theme.colors.primary};
  padding: ${(props) => props.theme.spacing.md}px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  align-items: center;
  margin-top: ${(props) => props.theme.spacing.md}px;
`;

const ButtonText = styled.Text`
  color: ${(props) => props.theme.colors.light};
  font-size: 16px;
  font-weight: bold;
`;

const BackButton = styled.Pressable`
  padding: ${(props) => props.theme.spacing.md}px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  align-items: center;
  margin-top: ${(props) => props.theme.spacing.md}px;
`;

const BackButtonText = styled.Text`
  color: ${(props) => props.theme.colors.primary};
  font-size: 16px;
`;

export default function CompanyRegistrationScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    website: "",
    adminEmail: "",
    adminName: "",
    adminTitle: "",
    adminPassword: "",
  });

  const handleNext = () => {
    if (step === 1 && (!company.name || !company.address)) {
      Alert.alert("Required Fields", "Please fill in all required fields");
      return;
    }
    if (
      step === 2 &&
      (!company.adminName || !company.adminEmail || !company.adminPassword)
    ) {
      Alert.alert(
        "Required Fields",
        "Please fill in all required fields, including admin password."
      );
      return;
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await apiPost(`${BACKEND_URL}/api/companies/create`, {
        name: company.name,
        address: company.address,
        adminName: company.adminName,
        adminEmail: company.adminEmail,
        adminPassword: company.adminPassword,
      });
      if (response.adminToken) {
        await storeAuthToken(response.adminToken);
        const tokenParts = response.adminToken.split(".");
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));
        const userId = decodedPayload.sub;
        const userResponse = await apiGet(`${BACKEND_URL}/api/users/${userId}`);
        dispatch(setUser(userResponse));
        Alert.alert(
          "Success",
          "Company and Admin registered successfully! You are now logged in as admin.",
          [
            {
              text: "OK",
              onPress: () => navigation.replace("AdminDashboard"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Success",
          "Company and Admin registered successfully! Please log in as admin with your credentials.",
          [
            {
              text: "OK",
              onPress: () => navigation.replace("Login"),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to register company");
    }
  };

  const updateCompanyField = (field, value) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container>
      <Header>
        <Title>Company Registration</Title>
        <Subtitle>Step {step} of 2</Subtitle>
      </Header>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={60}
      >
        <Form>
          {step === 1 ? (
            <>
              <SectionTitle>Company Information</SectionTitle>
              <InputGroup>
                <Label>Company Name *</Label>
                <Input
                  value={company.name}
                  onChangeText={(text) => updateCompanyField("name", text)}
                  placeholder="Enter company name"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Address *</Label>
                <Input
                  value={company.address}
                  onChangeText={(text) => updateCompanyField("address", text)}
                  placeholder="Enter company address"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>City</Label>
                <Input
                  value={company.city}
                  onChangeText={(text) => updateCompanyField("city", text)}
                  placeholder="Enter city"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Country</Label>
                <Input
                  value={company.country}
                  onChangeText={(text) => updateCompanyField("country", text)}
                  placeholder="Enter country"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Phone</Label>
                <Input
                  value={company.phone}
                  onChangeText={(text) => updateCompanyField("phone", text)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Website</Label>
                <Input
                  value={company.website}
                  onChangeText={(text) => updateCompanyField("website", text)}
                  placeholder="Enter website"
                  keyboardType="url"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
            </>
          ) : (
            <>
              <SectionTitle>Admin Information</SectionTitle>
              <InputGroup>
                <Label>Admin Name *</Label>
                <Input
                  value={company.adminName}
                  onChangeText={(text) => updateCompanyField("adminName", text)}
                  placeholder="Enter admin name"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Admin Email *</Label>
                <Input
                  value={company.adminEmail}
                  onChangeText={(text) =>
                    updateCompanyField("adminEmail", text)
                  }
                  placeholder="Enter admin email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
              <InputGroup>
                <Label>Admin Password *</Label>
                <Input
                  value={company.adminPassword}
                  onChangeText={(text) =>
                    updateCompanyField("adminPassword", text)
                  }
                  placeholder="Enter admin password"
                  placeholderTextColor={theme.colors.placeholder}
                  secureTextEntry
                />
              </InputGroup>
              <InputGroup>
                <Label>Admin Title</Label>
                <Input
                  value={company.adminTitle}
                  onChangeText={(text) =>
                    updateCompanyField("adminTitle", text)
                  }
                  placeholder="Enter admin title"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </InputGroup>
            </>
          )}
          <Button onPress={handleNext}>
            <ButtonText>
              {step === 2 ? "Complete Registration" : "Next Step"}
            </ButtonText>
          </Button>
          {step === 2 && (
            <BackButton onPress={() => setStep(step - 1)}>
              <BackButtonText>Back to Company Information</BackButtonText>
            </BackButton>
          )}
        </Form>
      </KeyboardAwareScrollView>
    </Container>
  );
}
