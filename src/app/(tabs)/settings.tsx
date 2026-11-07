import { View, Text } from "@/tw";

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-sf-bg items-center justify-center p-4">
      <Text className="text-xl font-bold text-sf-text mb-2">Settings</Text>
      <Text className="text-sm text-sf-text-2 text-center">
        Manage storage, permissions, and app preferences.
      </Text>
    </View>
  );
}
