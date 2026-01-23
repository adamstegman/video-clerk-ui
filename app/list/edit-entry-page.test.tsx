import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { EditEntryPage, type EditEntryData } from "./edit-entry-page";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import type { TMDBConfig } from "../tmdb-api/tmdb-api";

const mockConfig: TMDBConfig = {
  images: {
    base_url: "http://image.tmdb.org/t/p/",
    secure_base_url: "https://image.tmdb.org/t/p/",
    backdrop_sizes: ["w300", "w780", "w1280", "original"],
    logo_sizes: ["w45", "w92", "w154", "w185", "w300", "w500", "original"],
    poster_sizes: ["w92", "w154", "w185", "w300", "w500", "w780", "original"],
    profile_sizes: ["w45", "w185", "h632", "original"],
    still_sizes: ["w92", "w185", "w300", "original"],
  },
  change_keys: [],
};

const mockConfigurationState = {
  ...mockConfig,
  error: null,
};

function renderEditEntryPage(props: Partial<Parameters<typeof EditEntryPage>[0]> = {}) {
  const entry: EditEntryData = {
    id: 1,
    title: "Example Movie",
    releaseYear: "2025",
    posterPath: "/poster.jpg",
  };
  const selectedTags = [
    { id: 1, name: "Drama", is_custom: false },
    { id: 2, name: "Cozy", is_custom: true },
  ];
  const availableTags = [...selectedTags, { id: 3, name: "Weekend", is_custom: true }];

  const defaultProps: Parameters<typeof EditEntryPage>[0] = {
    entry,
    loading: false,
    error: null,
    selectedTags,
    availableTags,
    tagQuery: "Weekend",
    suggestions: [],
    canCreateTag: true,
    onTagQueryChange: vi.fn(),
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
    onToggleTag: vi.fn(),
    onCreateTag: vi.fn(),
    onSaveTags: vi.fn(),
    saving: false,
    saveError: null,
    saveSuccess: false,
    creatingTag: false,
    deleting: false,
    deleteError: null,
    onDelete: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <TMDBConfigurationContext value={mockConfigurationState}>
        <EditEntryPage {...defaultProps} {...props} />
      </TMDBConfigurationContext>
    </MemoryRouter>
  );
}

describe("EditEntryPage", () => {
  it("shows loading state", () => {
    renderEditEntryPage({ loading: true, entry: null });
    expect(screen.getByText("Loading entry...")).toBeInTheDocument();
  });

  it("renders entry details and handles tag and delete actions", async () => {
    const user = userEvent.setup();
    const onTagQueryChange = vi.fn();
    const onRemoveTag = vi.fn();
    const onCreateTag = vi.fn();
    const onSaveTags = vi.fn();
    const onDelete = vi.fn();

    renderEditEntryPage({
      onTagQueryChange,
      onRemoveTag,
      onCreateTag,
      onSaveTags,
      onDelete,
      saveSuccess: true,
    });

    expect(screen.getByText("Example Movie")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Drama, Cozy", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Tags updated.")).toBeInTheDocument();

    const tagInput = screen.getByLabelText("Add tag");
    await user.type(tagInput, "New Tag");
    expect(onTagQueryChange).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreateTag).toHaveBeenCalledWith("Weekend");

    await user.click(screen.getByRole("button", { name: "Save tags" }));
    expect(onSaveTags).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Remove tag Drama" }));
    expect(onRemoveTag).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Delete entry" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
