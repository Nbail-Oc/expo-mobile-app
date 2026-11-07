import React, { useState } from "react";
import { 
  ActivityIndicator, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  useColorScheme 
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TextInput, Pressable } from "@/tw";
import { huggingFaceService, getParameterSize, formatBytes } from "@/services/huggingface";
import { Ionicons } from "@expo/vector-icons";
import { HFModel } from "@/types";

export default function DiscoverScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"downloads" | "likes" | "trending" | "created">("downloads");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");

  // Debounce search query to prevent excessive API calls
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Query Hugging Face API
  const { data: models, isLoading, error, refetch } = useQuery({
    queryKey: ["models", debouncedSearch, sortBy],
    queryFn: () => huggingFaceService.fetchModels(debouncedSearch, sortBy, 40),
  });

  // Filter models locally based on size estimation
  const filteredModels = React.useMemo(() => {
    if (!models) return [];
    
    return models.filter((model) => {
      const paramSizeStr = getParameterSize(model.id);
      if (!paramSizeStr) return selectedSizeFilter === "all"; // defaults to all if size is unknown

      const paramSize = parseFloat(paramSizeStr);
      
      if (selectedSizeFilter === "small") {
        return paramSize <= 3.5;
      }
      if (selectedSizeFilter === "medium") {
        return paramSize > 3.5 && paramSize <= 8.5;
      }
      if (selectedSizeFilter === "large") {
        return paramSize > 8.5;
      }
      
      return true;
    });
  }, [models, selectedSizeFilter]);

  // Helper to format large numbers (e.g. 1.4M or 38k)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

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
  const renderModelCard = ({ item }: { item: HFModel }) => {
    const paramSize = getParameterSize(item.id) || "Unknown Size";
    const displayName = getDisplayName(item.id);
    const author = item.author || item.id.split("/")[0] || "Unknown";

    // Speed estimate based on parameter size
    let speedLabel = "Slow";
    let speedColor = "text-sf-orange bg-sf-orange/10 border-sf-orange/20";
    if (paramSize !== "Unknown Size") {
      const numParams = parseFloat(paramSize);
      if (numParams <= 3.5) {
        speedLabel = "Fast";
        speedColor = "text-sf-green bg-sf-green/10 border-sf-green/20";
      } else if (numParams > 8.5) {
        speedLabel = "Very Slow";
        speedColor = "text-sf-red bg-sf-red/10 border-sf-red/20";
      }
    }

    return (
      <Pressable
        className="p-4 mb-3 rounded-2xl bg-sf-bg-2 border border-sf-gray-3 active:opacity-80"
        onPress={() => {
          // Dynamic route navigation with encoded ID
          router.push(`/model/${encodeURIComponent(item.id)}`);
        }}
      >
        <View className="flex-row justify-between items-start mb-1">
          <View className="flex-1 mr-2">
            <Text className="text-xs text-brand-primary font-semibold tracking-wider uppercase mb-0.5">
              {author}
            </Text>
            <Text className="text-base font-bold text-sf-text" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View className={`px-2 py-0.5 rounded-full border ${speedColor}`}>
            <Text className="text-2xs font-bold uppercase">{speedLabel}</Text>
          </View>
        </View>

        <Text className="text-xs text-sf-text-2 mb-3" numberOfLines={2}>
          {item.id}
        </Text>

        <View className="flex-row items-center justify-between border-t border-sf-gray-3/50 pt-3">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Ionicons name="download-outline" size={13} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text className="text-xs text-sf-text-2 font-medium">
                {formatNumber(item.downloads)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="heart-outline" size={13} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text className="text-xs text-sf-text-2 font-medium">
                {formatNumber(item.likes)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-lg">
            <Ionicons name="hardware-chip-outline" size={12} color={isDark ? "#818cf8" : "#4f46e5"} />
            <Text className="text-xs font-bold text-brand-primary">
              {paramSize}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-sf-bg px-4 pt-2"
    >
      {/* Header */}
      <View className="mb-4">
        <Text className="text-2xl font-black text-sf-text">Discover</Text>
        <Text className="text-xs text-sf-text-2 mt-0.5">
          Browse on-device AI models from Hugging Face
        </Text>
      </View>

      {/* Search Input */}
      <View className="flex-row items-center bg-sf-bg-2 border border-sf-gray-3 px-3 py-2 rounded-2xl mb-3">
        <Ionicons name="search-outline" size={18} color={isDark ? "#9ca3af" : "#6b7280"} className="mr-2" />
        <TextInput
          className="flex-1 text-sm text-sf-text p-0 h-5"
          placeholder="Search models..."
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips Row */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {/* Size Filters */}
        <Pressable 
          className={`px-3 py-1.5 rounded-xl border ${selectedSizeFilter === "all" ? "bg-brand-primary border-brand-primary" : "bg-sf-bg-2 border-sf-gray-3"}`}
          onPress={() => setSelectedSizeFilter("all")}
        >
          <Text className={`text-xs font-bold ${selectedSizeFilter === "all" ? "text-white" : "text-sf-text-2"}`}>All Sizes</Text>
        </Pressable>
        <Pressable 
          className={`px-3 py-1.5 rounded-xl border ${selectedSizeFilter === "small" ? "bg-brand-primary border-brand-primary" : "bg-sf-bg-2 border-sf-gray-3"}`}
          onPress={() => setSelectedSizeFilter("small")}
        >
          <Text className={`text-xs font-bold ${selectedSizeFilter === "small" ? "text-white" : "text-sf-text-2"}`}>Small (≤3.5B)</Text>
        </Pressable>
        <Pressable 
          className={`px-3 py-1.5 rounded-xl border ${selectedSizeFilter === "medium" ? "bg-brand-primary border-brand-primary" : "bg-sf-bg-2 border-sf-gray-3"}`}
          onPress={() => setSelectedSizeFilter("medium")}
        >
          <Text className={`text-xs font-bold ${selectedSizeFilter === "medium" ? "text-white" : "text-sf-text-2"}`}>Medium (3.5B - 8.5B)</Text>
        </Pressable>
        <Pressable 
          className={`px-3 py-1.5 rounded-xl border ${selectedSizeFilter === "large" ? "bg-brand-primary border-brand-primary" : "bg-sf-bg-2 border-sf-gray-3"}`}
          onPress={() => setSelectedSizeFilter("large")}
        >
          <Text className={`text-xs font-bold ${selectedSizeFilter === "large" ? "text-white" : "text-sf-text-2"}`}>Large (&gt;8.5B)</Text>
        </Pressable>
      </View>

      {/* Sort Options Bar */}
      <View className="flex-row items-center justify-between border-b border-sf-gray-3 pb-2 mb-3">
        <Text className="text-xs font-bold text-sf-text-2 uppercase">Available Models</Text>
        
        <View className="flex-row gap-3">
          <Pressable onPress={() => setSortBy("downloads")}>
            <Text className={`text-xs font-bold ${sortBy === "downloads" ? "text-brand-primary" : "text-sf-text-3"}`}>
              Downloads
            </Text>
          </Pressable>
          <Pressable onPress={() => setSortBy("likes")}>
            <Text className={`text-xs font-bold ${sortBy === "likes" ? "text-brand-primary" : "text-sf-text-3"}`}>
              Likes
            </Text>
          </Pressable>
          <Pressable onPress={() => setSortBy("trending")}>
            <Text className={`text-xs font-bold ${sortBy === "trending" ? "text-brand-primary" : "text-sf-text-3"}`}>
              Trending
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#818cf8" : "#4f46e5"} />
          <Text className="text-sm text-sf-text-2 mt-2">Fetching models from Hugging Face...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-base font-bold text-sf-text mt-2 text-center">Failed to load models</Text>
          <Text className="text-sm text-sf-text-2 text-center mt-1 mb-4">
            {error instanceof Error ? error.message : "Please check your internet connection and try again."}
          </Text>
          <Pressable 
            className="bg-brand-primary px-5 py-2.5 rounded-xl active:opacity-85"
            onPress={() => refetch()}
          >
            <Text className="text-white font-bold text-sm">Retry Connection</Text>
          </Pressable>
        </View>
      ) : filteredModels.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="search-outline" size={48} color={isDark ? "#4b5563" : "#d1d5db"} />
          <Text className="text-base font-bold text-sf-text mt-2 text-center">No models found</Text>
          <Text className="text-sm text-sf-text-2 text-center mt-1">
            Try adjusting your search query or size filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredModels}
          keyExtractor={(item) => item.id}
          renderItem={renderModelCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
