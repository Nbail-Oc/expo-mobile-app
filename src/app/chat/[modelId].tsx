import { View, Text } from "@/tw";
import { useLocalSearchParams } from "expo-router";

export default function ChatScreen() {
  const { modelId } = useLocalSearchParams<{ modelId: string }>();

  return (
    <View className="flex-1 bg-sf-bg items-center justify-center p-4">
      <Text className="text-xl font-bold text-sf-text mb-2">Chat Room</Text>
      <Text className="text-sm text-sf-text-2 text-center mb-4">
        Model ID: {modelId}
      </Text>
      <Text className="text-sm text-sf-text-2 text-center">
        On-device offline chat screen with automated device context.
      </Text>
    </View>
  );
}
