import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? "#121212" : "#ffffff",
        },
        headerTintColor: isDark ? "#ffffff" : "#000000",
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#121212" : "#ffffff",
          borderTopWidth: 0,
          elevation: 0,
          boxShadow: isDark ? "0 -1px 0 rgba(255, 255, 255, 0.05)" : "0 -1px 0 rgba(0, 0, 0, 0.05)",
        },
        tabBarActiveTintColor: isDark ? "#818cf8" : "#4f46e5", // indigo-400 / indigo-600
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarLabel: "Discover",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-models"
        options={{
          title: "My Models",
          tabBarLabel: "My Models",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
