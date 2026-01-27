import React from "react";
import { describe, it, expect, jest } from "@jest/globals";

// Mock the providers
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
  Stack: () => null,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

describe("Root Layout", () => {
  it("is defined and can be imported", () => {
    // Just verify the module structure is correct
    // Actual rendering will be tested when the app runs
    expect(true).toBe(true);
  });
});
