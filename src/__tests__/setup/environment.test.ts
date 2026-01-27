import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Environment Configuration", () => {
  describe(".env.example file", () => {
    it("exists in project root", () => {
      const envExamplePath = path.join(__dirname, "../../../.env.example");
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it("contains required EXPO_PUBLIC_ variables", () => {
      const envExamplePath = path.join(__dirname, "../../../.env.example");
      const content = fs.readFileSync(envExamplePath, "utf-8");

      expect(content).toContain("EXPO_PUBLIC_SUPABASE_URL");
      expect(content).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
      expect(content).toContain("EXPO_PUBLIC_TMDB_API_READ_TOKEN");
    });

    it("has correct variable format", () => {
      const envExamplePath = path.join(__dirname, "../../../.env.example");
      const content = fs.readFileSync(envExamplePath, "utf-8");

      // Check that variables are in KEY=value format
      expect(content).toMatch(/EXPO_PUBLIC_SUPABASE_URL=/);
      expect(content).toMatch(/EXPO_PUBLIC_SUPABASE_ANON_KEY=/);
      expect(content).toMatch(/EXPO_PUBLIC_TMDB_API_READ_TOKEN=/);
    });
  });

  describe("Environment variable naming convention", () => {
    it("uses EXPO_PUBLIC_ prefix for all public variables", () => {
      const envExamplePath = path.join(__dirname, "../../../.env.example");
      const content = fs.readFileSync(envExamplePath, "utf-8");

      // All non-comment lines should use EXPO_PUBLIC_ or be empty/comments
      const lines = content.split("\n");
      const varLines = lines.filter(line =>
        line.trim() &&
        !line.trim().startsWith("#") &&
        line.includes("=")
      );

      varLines.forEach(line => {
        expect(line).toMatch(/^EXPO_PUBLIC_/);
      });
    });
  });
});
