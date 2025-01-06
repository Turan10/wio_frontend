import React, { useState } from "react";
import {
  Alert,
  StatusBar,
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Avatar } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import styled from "styled-components/native";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";

import spacing from "../theme/spacing";
import { PlatformUtils, useLayoutConfig } from "../utils/platformConfig";
import { apiGet, apiPut, BACKEND_URL } from "../utils/api";
import { getAuthToken } from "../utils/auth";
import { setUser } from "../store/slices/userSlice";

const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.colors.background};
`;

const AvatarSection = styled.View`
  align-items: center;
  margin-vertical: ${(props) => props.theme.spacing.xl}px;
`;

const AvatarContainer = styled.View`
  position: relative;
`;

const EditAvatarButton = styled.Pressable`
  position: absolute;
  right: -10px;
  bottom: -10px;
  background-color: ${(props) => props.theme.colors.primary};
  border-radius: 20px;
  padding: 8px;
`;

const ProfileCard = styled.View`
  background-color: ${(props) => props.theme.colors.light};
  border-radius: ${(props) => props.theme.spacing.md}px;
  padding: ${(props) => props.theme.spacing.lg}px;
  elevation: 2;
  margin-bottom: ${(props) => props.theme.spacing.xl}px;
`;

const SectionTitle = styled.Text`
  font-size: ${() => PlatformUtils.scaleFontSize(20)}px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
`;

const FieldLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textPrimary};
  margin-bottom: ${(props) => props.theme.spacing.xs}px;
`;

const StyledInput = styled.TextInput`
  background-color: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  border-color: ${(props) => props.theme.colors.border};
  border-width: 1px;
  padding: ${(props) => props.theme.spacing.md}px;
  font-size: 16px;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.md}px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: ${(props) => props.theme.spacing.md}px;
`;

const CancelButton = styled.Pressable`
  background-color: ${(props) => props.theme.colors.light};
  border-color: ${(props) => props.theme.colors.border};
  border-width: 1px;
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding-vertical: ${(props) => props.theme.spacing.md}px;
  padding-horizontal: ${(props) => props.theme.spacing.lg}px;
  margin-right: ${(props) => props.theme.spacing.md}px;
`;

const CancelButtonText = styled.Text`
  color: ${(props) => props.theme.colors.textPrimary};
  font-weight: 600;
`;

const EditButton = styled.Pressable`
  background-color: ${(props) => props.theme.colors.primary};
  border-radius: ${(props) => props.theme.spacing.sm}px;
  padding-vertical: ${(props) => props.theme.spacing.md}px;
  padding-horizontal: ${(props) => props.theme.spacing.lg}px;
`;

const SaveButtonText = styled.Text`
  color: ${(props) => props.theme.colors.light};
  font-weight: 600;
`;

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  title: Yup.string().required("Title is required"),
  department: Yup.string().required("Department is required"),
  phone: Yup.string().required("Phone number is required"),
});

function ChangePasswordModal({ visible, onClose, userId }) {
  const theme = useTheme();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const token = await getAuthToken();
      const res = await fetch(
        `${BACKEND_URL}/api/users/${userId}/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change password");
      }

      Alert.alert("Success", "Password changed successfully!");
      onClose();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.light },
          ]}
        >
          <Text
            style={[styles.modalTitle, { color: theme.colors.textPrimary }]}
          >
            Change Password
          </Text>

          <StyledInput
            placeholder="Old Password"
            placeholderTextColor={theme.colors.placeholder}
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <StyledInput
            placeholder="New Password"
            placeholderTextColor={theme.colors.placeholder}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <ButtonRow>
            <CancelButton onPress={onClose}>
              <CancelButtonText>Cancel</CancelButtonText>
            </CancelButton>
            <EditButton onPress={handleChangePassword}>
              <SaveButtonText>Update</SaveButtonText>
            </EditButton>
          </ButtonRow>
        </View>
      </View>
    </Modal>
  );
}

export default function UserProfileScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const userId = currentUser?.id;

  const { getHeaderHeight, topInset, statusBarHeight } = useLayoutConfig();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const {
    data: userData,
    isLoading: userLoading,
    isError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => apiGet(`${BACKEND_URL}/api/users/${userId}`),
    enabled: !!userId,
    onSuccess: (fetched) => {
      if (!avatar && fetched?.avatar) {
        setAvatar(fetched.avatar);
      }
    },
  });

  const handleImagePick = async () => {
    if (!editing) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Enable photo library access to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Error picking image.");
    }
  };

  const handleEdit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(true);
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(false);
    if (userData?.avatar) {
      setAvatar(userData.avatar);
    }
  };

  const handleSave = async (values) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        title: values.title,
        department: values.department,
        phone: values.phone,
        avatar,
      };

      const updatedUser = await apiPut(
        `${BACKEND_URL}/api/users/${userId}`,
        payload
      );

      dispatch(setUser({ ...currentUser, ...updatedUser }));

      refetchUser();

      setEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (userLoading) {
    return (
      <Container>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
          translucent
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Text>Loading user profile...</Text>
        </View>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
          translucent
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Text>
            Failed to load user profile. Pull to refresh or try again.
          </Text>
        </View>
      </Container>
    );
  }

  const initialValues = {
    name: userData?.name || "",
    email: userData?.email || "",
    title: userData?.title || "",
    department: userData?.department || "",
    phone: userData?.phone || "",
    company: userData?.companyName || "No Company",
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
          translucent
        />

        <ChangePasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={userId}
        />

        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSave}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <>
              <AvatarSection>
                <AvatarContainer>
                  {avatar ? (
                    <Avatar.Image size={120} source={{ uri: avatar }} />
                  ) : (
                    <Avatar.Icon
                      size={120}
                      icon="account"
                      backgroundColor={theme.colors.border}
                    />
                  )}
                  {editing && (
                    <EditAvatarButton onPress={handleImagePick}>
                      <MaterialIcons
                        name="camera-alt"
                        size={20}
                        color={theme.colors.light}
                      />
                    </EditAvatarButton>
                  )}
                </AvatarContainer>
              </AvatarSection>

              <ProfileCard>
                <SectionTitle>Personal Information</SectionTitle>

                {editing ? (
                  <>
                    <FieldLabel>Name</FieldLabel>
                    <StyledInput
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      value={values.name}
                      placeholder="Your Name"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    {touched.name && errors.name && (
                      <Text style={{ color: theme.colors.error }}>
                        {errors.name}
                      </Text>
                    )}

                    <FieldLabel>Email</FieldLabel>
                    <StyledInput
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Your Email"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    {touched.email && errors.email && (
                      <Text style={{ color: theme.colors.error }}>
                        {errors.email}
                      </Text>
                    )}

                    <FieldLabel>Title</FieldLabel>
                    <StyledInput
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                      value={values.title}
                      placeholder="Your Title"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    {touched.title && errors.title && (
                      <Text style={{ color: theme.colors.error }}>
                        {errors.title}
                      </Text>
                    )}

                    <FieldLabel>Department</FieldLabel>
                    <StyledInput
                      onChangeText={handleChange("department")}
                      onBlur={handleBlur("department")}
                      value={values.department}
                      placeholder="Your Department"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    {touched.department && errors.department && (
                      <Text style={{ color: theme.colors.error }}>
                        {errors.department}
                      </Text>
                    )}

                    <FieldLabel>Phone</FieldLabel>
                    <StyledInput
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      value={values.phone}
                      keyboardType="phone-pad"
                      placeholder="Your Phone"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                    {touched.phone && errors.phone && (
                      <Text style={{ color: theme.colors.error }}>
                        {errors.phone}
                      </Text>
                    )}

                    <FieldLabel>Company</FieldLabel>
                    <StyledInput
                      value={values.company}
                      editable={false}
                      style={{
                        backgroundColor: theme.colors.background,
                        color: theme.colors.textSecondary,
                      }}
                    />

                    <ButtonRow>
                      <CancelButton onPress={handleCancel}>
                        <CancelButtonText>Cancel</CancelButtonText>
                      </CancelButton>
                      <EditButton onPress={handleSubmit}>
                        <SaveButtonText>Save</SaveButtonText>
                      </EditButton>
                    </ButtonRow>
                  </>
                ) : (
                  <>
                    <FieldLabel>Name</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.name}
                    </Text>

                    <FieldLabel>Email</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.email}
                    </Text>

                    <FieldLabel>Title</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.title}
                    </Text>

                    <FieldLabel>Department</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.department}
                    </Text>

                    <FieldLabel>Phone</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.phone}
                    </Text>

                    <FieldLabel>Company</FieldLabel>
                    <Text
                      style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginBottom: spacing.md,
                      }}
                    >
                      {values.company}
                    </Text>

                    <ButtonRow>
                      <CancelButton onPress={() => setShowPasswordModal(true)}>
                        <CancelButtonText>Change Password</CancelButtonText>
                      </CancelButton>
                      <EditButton onPress={handleEdit}>
                        <SaveButtonText>Edit Profile</SaveButtonText>
                      </EditButton>
                    </ButtonRow>
                  </>
                )}
              </ProfileCard>
            </>
          )}
        </Formik>
      </Container>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
});
