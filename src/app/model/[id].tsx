import React, { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  ScrollView, 
  useColorScheme 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "@/tw";
import { 
  huggingFaceService, 
  estimateRequiredRAM, 
  getSpeedRating, 
  formatBytes 
} from "@/services/huggingface";
import { useModelStore } from "@/store/useModelStore";
import { GGUFFile } from "@/types";

export default function ModelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const modelId = id ? decodeURIComponent(id) : "";
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Zustand Store select state
  const installedModels = useModelStore((state) => state.installedModels);
  const activeDownloads = useModelStore((state) => state.activeDownloads);
  const startDownload = useModelStore((state) => state.startDownload);
  const pauseDownload = useModelStore((state) => state.pauseDownload);
  const resumeDownload = useModelStore((state) => state.resumeDownload);
  const cancelDownload = useModelStore((state) => state.cancelDownload);
  const deleteModel = useModelStore((state) => state.deleteModel);

  // Selected file for detail expansion
  const [selectedFile, setSelectedFile] = useState<GGUFFile | null>(null);

  // Fetch model details
  const { data: model, isLoading, error, refetch } = useQuery({
    queryKey: ["model-details", modelId],
    queryFn: () => huggingFaceService.fetchModelDetails(modelId),
    enabled: !!modelId,
  });

  // Set default selected file once data loads
  useEffect(() => {
    if (model && model.ggufFiles.length > 0 && !selectedFile) {
      // Prioritize Q4_K_M or Q4_0 as default (balanced recommendation)
      const recommended = model.ggufFiles.find(
        (f) => f.name.toLowerCase().includes("q4_k_m") || f.name.toLowerCase().includes("q4_0")
      );
      setSelectedFile(recommended || model.ggufFiles[0]);
    }
  }, [model]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-sf-bg justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? "#818cf8" : "#4f46e5"} />
        <Text className="text-sm text-sf-text-2 mt-3">Loading model details...</Text>
      </View>
    );
  }

  if (error || !model) {
    return (
      <View className="flex-1 bg-sf-bg justify-center items-center p-4">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-base font-bold text-sf-text mt-2 text-center">Failed to load model details</Text>
        <Text className="text-sm text-sf-text-2 text-center mt-1 mb-4">
          {error instanceof Error ? error.message : "Error connecting to Hugging Face."}
        </Text>
        <Pressable 
          className="bg-brand-primary px-5 py-2.5 rounded-xl active:opacity-85"
          onPress={() => refetch()}
        >
          <Text className="text-white font-bold text-sm">Retry Loading</Text>
        </Pressable>
      </View>
    );
  }

  // Device specs
  const deviceRamBytes = Device.totalMemory || 8 * 1024 * 1024 * 1024;
  const deviceRamGB = Math.round(deviceRamBytes / (1024 * 1024 * 1024));

  // Clean names
  const authorName = model.author || model.id.split("/")[0] || "Unknown";
  const modelName = (model.id.split("/")[1] || model.id)
    .replace(/-GGUF$/i, "")
    .replace(/-gguf$/i, "")
    .replace(/-/g, " ")
    .replace(/_/g, " ");

  // Local storage state
  const isInstalled = !!installedModels[modelId];
  const installedInfo = installedModels[modelId];
  const activeDownload = activeDownloads[modelId];

  // Get compatibility details
  const getCompatibility = (fileSize: number) => {
    const requiredRAM = estimateRequiredRAM(fileSize);
    
    if (deviceRamGB >= requiredRAM) {
      return {
        level: "green",
        label: "Compatible",
        color: "text-sf-green bg-sf-green/10 border-sf-green/20",
        icon: "checkmark-circle",
        description: `Your phone has ${deviceRamGB}GB RAM, which is enough to run this model smoothly (needs ~${requiredRAM}GB RAM).`,
      };
    } else if (deviceRamGB >= requiredRAM - 1.5) {
      return {
        level: "yellow",
        label: "Low RAM Warning",
        color: "text-sf-orange bg-sf-orange/10 border-sf-orange/20",
        icon: "warning",
        description: `This model needs ~${requiredRAM}GB RAM. Your phone has ${deviceRamGB}GB RAM, so it might run slowly or crash.`,
      };
    } else {
      return {
        level: "red",
        label: "Incompatible",
        color: "text-sf-red bg-sf-red/10 border-sf-red/20",
        icon: "close-circle",
        description: `Requires ~${requiredRAM}GB RAM, but your phone only has ${deviceRamGB}GB RAM. Not recommended.`,
      };
    }
  };

  const comp = selectedFile ? getCompatibility(selectedFile.size) : null;
  const speed = selectedFile ? getSpeedRating(modelId, selectedFile.size) : "slow";

  return (
    <ScrollView className="flex-1 bg-sf-bg" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Title Header */}
      <View className="mb-5">
        <Text className="text-xs text-brand-primary font-bold uppercase tracking-wider mb-0.5">
          {authorName}
        </Text>
        <Text className="text-2xl font-black text-sf-text mb-2 leading-tight">
          {modelName}
        </Text>
        <Text className="text-xs text-sf-text-3 font-medium">
          Repository: {model.id}
        </Text>
      </View>

      {/* Model Stats Strip */}
      <View className="flex-row bg-sf-bg-2 border border-sf-gray-3 p-3.5 rounded-2xl mb-5 justify-around items-center">
        <View className="items-center">
          <Text className="text-xs text-sf-text-2 font-semibold mb-0.5">Downloads</Text>
          <Text className="text-base font-black text-sf-text">
            {model.downloads.toLocaleString()}
          </Text>
        </View>
        <View className="w-px h-8 bg-sf-gray-3" />
        <View className="items-center">
          <Text className="text-xs text-sf-text-2 font-semibold mb-0.5">Likes</Text>
          <Text className="text-base font-black text-sf-text">
            {model.likes}
          </Text>
        </View>
        <View className="w-px h-8 bg-sf-gray-3" />
        <View className="items-center">
          <Text className="text-xs text-sf-text-2 font-semibold mb-0.5">Format</Text>
          <Text className="text-base font-black text-sf-text uppercase text-brand-primary">
            GGUF
          </Text>
        </View>
      </View>

      {/* Selected File Details & Download Flow */}
      {selectedFile && (
        <View className="mb-6">
          <Text className="text-xs font-bold text-sf-text-2 uppercase mb-2">Target Quantization</Text>
          
          <View className="bg-sf-bg-2 border border-sf-gray-3 p-4 rounded-2xl">
            <Text className="text-sm font-bold text-sf-text mb-1" numberOfLines={1}>
              {selectedFile.name}
            </Text>
            
            <View className="flex-row flex-wrap gap-2 mt-2 mb-3">
              <View className="bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-lg">
                <Text className="text-xs font-bold text-brand-primary">
                  Size: {formatBytes(selectedFile.size)}
                </Text>
              </View>
              <View className="bg-sf-bg-3 border border-sf-gray-3 px-2.5 py-1 rounded-lg">
                <Text className="text-xs font-bold text-sf-text-2 uppercase">
                  Quant: {selectedFile.quantization}
                </Text>
              </View>
              <View className="bg-sf-bg-3 border border-sf-gray-3 px-2.5 py-1 rounded-lg">
                <Text className="text-xs font-bold text-sf-text-2 uppercase">
                  Speed: {speed}
                </Text>
              </View>
            </View>

            {/* Compatibility Warning Card */}
            {comp && (
              <View className={`p-3 rounded-xl border flex-row items-start gap-2.5 mb-4 ${comp.color}`}>
                <Ionicons name={comp.icon as any} size={18} className="mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs font-black uppercase mb-0.5">{comp.label}</Text>
                  <Text className="text-xs font-medium leading-relaxed">{comp.description}</Text>
                </View>
              </View>
            )}

            {/* Install / Download Actions */}
            {isInstalled ? (
              // Case 1: Model already installed
              <View className="gap-2.5">
                <View className="bg-sf-green/10 border border-sf-green/20 p-3 rounded-xl flex-row items-center justify-center gap-2">
                  <Ionicons name="checkmark-done" size={16} color="#22c55e" />
                  <Text className="text-xs font-bold text-sf-green">Installed: {installedInfo.fileName}</Text>
                </View>
                
                <View className="flex-row gap-2">
                  <Pressable 
                    className="flex-1 bg-brand-primary py-3 rounded-xl items-center justify-center active:opacity-90 flex-row gap-1.5"
                    onPress={() => router.push(`/chat/${encodeURIComponent(modelId)}`)}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color="#ffffff" />
                    <Text className="text-white font-bold text-sm">Start Offline Chat</Text>
                  </Pressable>
                  <Pressable 
                    className="bg-sf-red/10 border border-sf-red/20 px-4 rounded-xl items-center justify-center active:opacity-80"
                    onPress={() => {
                      deleteModel(modelId);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ) : activeDownload ? (
              // Case 2: Active download in progress
              <View className="p-3 bg-sf-bg-3 border border-sf-gray-3 rounded-xl">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-black text-sf-text">
                    {activeDownload.isPaused ? "Download Paused" : "Downloading..."}
                  </Text>
                  <Text className="text-xs font-black text-brand-primary">
                    {activeDownload.progress}%
                  </Text>
                </View>
                
                {/* Progress bar background */}
                <View className="w-full h-2 bg-sf-gray-3 rounded-full overflow-hidden mb-3">
                  <View 
                    className="h-full bg-brand-primary rounded-full" 
                    style={{ width: `${activeDownload.progress}%` }} 
                  />
                </View>

                {/* Control Actions */}
                <View className="flex-row gap-2">
                  {activeDownload.isPaused ? (
                    <Pressable 
                      className="flex-1 bg-brand-primary py-2.5 rounded-xl items-center justify-center active:opacity-90 flex-row gap-1"
                      onPress={() => resumeDownload(modelId)}
                    >
                      <Ionicons name="play" size={14} color="#ffffff" />
                      <Text className="text-white font-bold text-xs">Resume</Text>
                    </Pressable>
                  ) : (
                    <Pressable 
                      className="flex-1 bg-sf-gray-2 py-2.5 rounded-xl items-center justify-center active:opacity-90 flex-row gap-1"
                      onPress={() => pauseDownload(modelId)}
                    >
                      <Ionicons name="pause" size={14} color="#ffffff" />
                      <Text className="text-white font-bold text-xs">Pause</Text>
                    </Pressable>
                  )}
                  <Pressable 
                    className="flex-1 bg-sf-red/10 border border-sf-red/20 py-2.5 rounded-xl items-center justify-center active:opacity-85 flex-row gap-1"
                    onPress={() => cancelDownload(modelId)}
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                    <Text className="text-sf-red font-bold text-xs">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // Case 3: Ready to download
              <Pressable 
                className="bg-brand-primary py-3.5 rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
                onPress={() => {
                  startDownload(modelId, selectedFile.name);
                }}
              >
                <Ionicons name="cloud-download-outline" size={18} color="#ffffff" />
                <Text className="text-white font-bold text-sm">Download & Install Brain</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* GGUF Files List (Quantizations) */}
      <View className="mb-4">
        <Text className="text-xs font-bold text-sf-text-2 uppercase mb-2">Available Quantizations</Text>
        
        {model.ggufFiles.length === 0 ? (
          <View className="p-4 bg-sf-bg-2 rounded-2xl border border-sf-gray-3 items-center">
            <Text className="text-xs text-sf-text-2">No GGUF files found in this repository.</Text>
          </View>
        ) : (
          model.ggufFiles.map((file) => {
            const isSelected = selectedFile?.name === file.name;
            return (
              <Pressable
                key={file.path}
                className={`p-3.5 mb-2.5 rounded-xl border flex-row justify-between items-center active:opacity-90 ${isSelected ? "bg-brand-primary/5 border-brand-primary" : "bg-sf-bg-2 border-sf-gray-3"}`}
                onPress={() => setSelectedFile(file)}
              >
                <View className="flex-1 mr-2">
                  <Text 
                    className={`text-xs font-bold ${isSelected ? "text-brand-primary" : "text-sf-text"}`} 
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text className="text-2xs text-sf-text-2 mt-0.5">
                    Quantization: {file.quantization} • Size: {formatBytes(file.size)}
                  </Text>
                </View>
                <Ionicons 
                  name={isSelected ? "radio-button-on" : "radio-button-off"} 
                  size={16} 
                  color={isSelected ? (isDark ? "#818cf8" : "#4f46e5") : (isDark ? "#4b5563" : "#d1d5db")} 
                />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
