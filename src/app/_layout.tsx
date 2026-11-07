import "react-native-gesture-handler";
import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useModelStore } from "@/store/useModelStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    useModelStore.getState().initializeStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === "dark" ? "#121212" : "#ffffff",
            },
            headerTintColor: colorScheme === "dark" ? "#ffffff" : "#000000",
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="model/[id]" options={{ title: "Model Details", presentation: "card" }} />
          <Stack.Screen name="chat/[modelId]" options={{ title: "Chat", presentation: "card" }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
