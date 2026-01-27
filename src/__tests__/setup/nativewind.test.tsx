import React from "react";
import { render } from "@testing-library/react-native";
import { View, Text } from "react-native";

describe("NativeWind Configuration", () => {
  it("renders View with className", () => {
    const { getByTestId } = render(
      <View testID="test-view" className="flex-1 bg-zinc-950" />
    );

    expect(getByTestId("test-view")).toBeTruthy();
  });

  it("renders Text with className", () => {
    const { getByText } = render(
      <Text className="text-white font-bold">Test Text</Text>
    );

    expect(getByText("Test Text")).toBeTruthy();
  });

  it("renders nested components with multiple classes", () => {
    const { getByTestId, getByText } = render(
      <View testID="container" className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-2xl font-bold text-white">Title</Text>
        <Text className="mt-2 text-zinc-400">Subtitle</Text>
      </View>
    );

    expect(getByTestId("container")).toBeTruthy();
    expect(getByText("Title")).toBeTruthy();
    expect(getByText("Subtitle")).toBeTruthy();
  });
});
