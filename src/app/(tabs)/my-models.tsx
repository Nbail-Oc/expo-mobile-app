import React from "react";
import { FlatList, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "@/tw";
import { useModelStore, InstalledModel } from "@/store/useModelStore";
import { formatBytes } from "@/services/huggingface";

export default function MyModelsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Zustand Store select state
  const installedModels = useModelStore((state) => state.installedModels);
  const deleteModel = useModelStore((state) => state.deleteModel);

  const installedList = React.useMemo(() => {
    return Object.values(installedModels).sort(
      (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
    );
  }, [installedModels]);

  // Compute total storage consumed
  const totalStorage = React.useMemo(() => {
    return installedList.reduce((acc, curr) => acc + curr.size, 0);
  }, [installedList]);

  // Helper to get clean model display name
  const getDisplayName = (modelId: string) => {
    const parts = modelId.split("/");
    const name = parts.length > 1 ? parts[1] : parts[0];
    return name
      .replace(/-GGUF$/i, "")
      .replace(/-gguf$/i, "")
      .replace(/-/g, " ")
      .replace(/_/g, " ");
  };

  // Model Card Renderer
  const renderInstalledModel = ({ item }: { item: InstalledModel }) => {
    const displayName = getDisplayName(item.id);
    const author = item.id.split("/")[0] || "Unknown";
    const formattedDate = new Date(item.downloadedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return (
      <View className="p-4 mb-3.5 rounded-2xl bg-sf-bg-2 border border-sf-gray-3">
        <View className="flex-row justify-between items-start mb-1">
          <View className="flex-1 mr-2">
            <Text className="text-xs text-brand-primary font-semibold tracking-wider uppercase mb-0.5">
              {author}
            </Text>
            <Text className="text-base font-bold text-sf-text" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <Pressable 
            className="p-1 rounded-lg active:opacity-60 bg-sf-red/5 border border-sf-red/10"
            onPress={() => deleteModel(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </Pressable>
        </View>

        <Text className="text-xs text-sf-text-3 font-medium mb-3.5">
          File: {item.fileName}
        </Text>

        <View className="flex-row items-center justify-between border-t border-sf-gray-3/50 pt-3">
          <View className="flex-row items-center gap-1.5 bg-sf-bg px-2.5 py-1 rounded-lg border border-sf-gray-3/80">
            <Ionicons name="document-text-outline" size={12} color={isDark ? "#9ca3af" : "#6b7280"} />
            <Text className="text-xs font-bold text-sf-text-2">
              {formatBytes(item.size)}
            </Text>
          </View>
          
          <Pressable 
            className="bg-brand-primary px-4 py-1.5 rounded-lg flex-row items-center gap-1 active:opacity-90"
            onPress={() => router.push(`/chat/${encodeURIComponent(item.id)}`)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#ffffff" />
            <Text className="text-white font-bold text-xs">Chat</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-sf-bg px-4 pt-2">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-2xl font-black text-sf-text">My Models</Text>
        <Text className="text-xs text-sf-text-2 mt-0.5">
          Local, offline AI brains installed on your phone
        </Text>
      </View>

      {installedList.length === 0 ? (
        // Empty State
        <View className="flex-1 justify-center items-center p-6">
          <View className="w-16 h-16 bg-brand-primary/10 rounded-full justify-center items-center mb-4">
            <Ionicons name="cube-outline" size={32} color={isDark ? "#818cf8" : "#4f46e5"} />
          </View>
          <Text className="text-base font-bold text-sf-text text-center">No Models Installed</Text>
          <Text className="text-sm text-sf-text-2 text-center mt-1.5 mb-6 leading-relaxed">
            You haven't downloaded any local AI models yet. Head over to the Discover tab to find one compatible with your device.
          </Text>
          <Pressable 
            className="bg-brand-primary px-5 py-3 rounded-xl active:opacity-90 flex-row items-center gap-1.5"
            onPress={() => router.push("/")}
          >
            <Ionicons name="compass-outline" size={18} color="#ffffff" />
            <Text className="text-white font-bold text-sm">Browse Catalog</Text>
          </Pressable>
        </View>
      ) : (
        // Active List
        <View className="flex-1">
          {/* Storage usage Banner */}
          <View className="flex-row items-center justify-between bg-brand-primary/5 border border-brand-primary/10 px-4 py-3 rounded-2xl mb-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="stats-chart" size={16} color={isDark ? "#818cf8" : "#4f46e5"} />
              <Text className="text-xs font-bold text-sf-text-2">Total Storage Used</Text>
            </View>
            <Text className="text-sm font-black text-brand-primary">
              {formatBytes(totalStorage)}
            </Text>
          </View>

          <FlatList
            data={installedList}
            keyExtractor={(item) => item.id}
            renderItem={renderInstalledModel}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      )}
    </View>
  );
}
