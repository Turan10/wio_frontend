import React, { useState } from "react";
import styled from "styled-components/native";
import { Pressable, Text } from "react-native";
import { useTheme } from "styled-components/native";
import { AppCard } from "./AppCard";

const InviteLinkText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const InviteStatsText = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const JoinedUsersToggle = styled(Pressable)`
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.spacing.xs}px;
  background-color: ${({ theme }) => theme.colors.background};
  align-self: flex-start;
`;

const JoinedUserText = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin-left: ${({ theme }) => theme.spacing.xs}px;
`;

export default function InviteCard({ invite }) {
  const theme = useTheme();
  const [showUsers, setShowUsers] = useState(false);

  return (
    <AppCard>
      <InviteLinkText>Link: {invite.inviteLink}</InviteLinkText>
      <InviteStatsText>Joined Count: {invite.joinedCount}</InviteStatsText>
      {invite.joinedCount > 0 && (
        <JoinedUsersToggle onPress={() => setShowUsers(!showUsers)}>
          <Text style={{ color: theme.colors.primary }}>
            Show/Hide Joined Users
          </Text>
        </JoinedUsersToggle>
      )}
      {showUsers &&
        invite.joinedUsers &&
        invite.joinedUsers.map((user, index) => (
          <JoinedUserText key={index}>- {user.name}</JoinedUserText>
        ))}
    </AppCard>
  );
}
