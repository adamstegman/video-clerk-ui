import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Supabase Client Setup", () => {
  it("client.ts file exists in correct location", () => {
    const clientPath = path.join(__dirname, "../../lib/supabase/client.ts");
    expect(fs.existsSync(clientPath)).toBe(true);
  });

  it("database.types.ts file exists in correct location", () => {
    const typesPath = path.join(__dirname, "../../lib/supabase/database.types.ts");
    expect(fs.existsSync(typesPath)).toBe(true);
  });

  it("client file exports createClient function", () => {
    const clientPath = path.join(__dirname, "../../lib/supabase/client.ts");
    const content = fs.readFileSync(clientPath, "utf-8");

    // Check for export function createClient
    expect(content).toContain("export function createClient");

    // Check for required imports
    expect(content).toContain("react-native-url-polyfill/auto");
    expect(content).toContain("@react-native-async-storage/async-storage");
    expect(content).toContain("@supabase/supabase-js");
  });

  it("client uses EXPO_PUBLIC environment variables", () => {
    const clientPath = path.join(__dirname, "../../lib/supabase/client.ts");
    const content = fs.readFileSync(clientPath, "utf-8");

    expect(content).toContain("EXPO_PUBLIC_SUPABASE_URL");
    expect(content).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  });
});
