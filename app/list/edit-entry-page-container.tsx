import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { createClient } from "../lib/supabase/client";
import { EditEntryPage, type EditEntryData, type EditEntryTag } from "./edit-entry-page";

type EntryTagRow = {
  tags:
    | {
        id: number;
        name: string | null;
        is_custom: boolean | null;
      }
    | Array<{
        id: number;
        name: string | null;
        is_custom: boolean | null;
      }>
    | null;
};

type EntriesQueryRow = {
  id: number;
  added_at: string;
  watched_at: string | null;
  tmdb_details:
    | {
        poster_path: string | null;
        name: string | null;
        release_date: string | null;
      }
    | Array<{
        poster_path: string | null;
        name: string | null;
        release_date: string | null;
      }>
    | null;
  entry_tags: EntryTagRow[] | null;
};

function getReleaseYear(releaseDate: string | null | undefined) {
  if (!releaseDate) return "";
  const year = releaseDate.split("-")[0];
  return year || "";
}

function normalizeDetails(
  details: EntriesQueryRow["tmdb_details"]
): { poster_path: string | null; name: string | null; release_date: string | null } | null {
  if (!details) return null;
  return Array.isArray(details) ? details[0] ?? null : details;
}

function normalizeTag(
  tags: EntryTagRow["tags"]
): { id: number; name: string | null; is_custom: boolean | null } | null {
  if (!tags) return null;
  return Array.isArray(tags) ? tags[0] ?? null : tags;
}

function normalizeTagKey(name: string) {
  return normalizeTagName(name).toLowerCase();
}

function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error
    ? err.message
    : typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ? String((err as { message: string }).message)
      : fallback;
}

export function EditEntryPageContainer() {
  const params = useParams();
  const navigate = useNavigate();
  const entryId = useMemo(() => {
    const raw = params.entryId;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }, [params.entryId]);

  const [entry, setEntry] = useState<EditEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<EditEntryTag[]>([]);
  const [availableTags, setAvailableTags] = useState<EditEntryTag[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [watched, setWatched] = useState(false);
  const [watchedAt, setWatchedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entryId) {
      setEntry(null);
      setError("Invalid entry.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const [entryResponse, tagsResponse] = await Promise.all([
        supabase
          .from("entries")
          .select(
            `
              id,
              added_at,
              watched_at,
              tmdb_details (
                poster_path,
                name,
                release_date
              ),
              entry_tags (
                tags (
                  id,
                  name,
                  is_custom
                )
              )
            `
          )
          .eq("id", entryId)
          .maybeSingle(),
        supabase.from("tags").select("id,name,is_custom").order("name"),
      ]);

      if (entryResponse.error) throw entryResponse.error;
      if (!entryResponse.data) {
        setEntry(null);
        setError("Entry not found.");
        return;
      }

      if (tagsResponse.error) {
        console.error("Failed to load tags", tagsResponse.error);
        setAvailableTags([]);
      } else {
        const normalizedTags =
          tagsResponse.data
            ?.filter((row) => row.name && typeof row.id === "number")
            .map((row) => ({
              id: row.id,
              name: row.name as string,
              is_custom: Boolean(row.is_custom),
            })) ?? [];
        setAvailableTags(normalizedTags);
      }

      const row = entryResponse.data as unknown as EntriesQueryRow;
      const details = normalizeDetails(row.tmdb_details);
      const tags =
        row.entry_tags
          ?.map((et) => normalizeTag(et.tags))
          .filter((tag): tag is { id: number; name: string; is_custom: boolean } =>
            !!tag && typeof tag.id === "number" && !!tag.name
          )
          .map((tag) => ({
            id: tag.id,
            name: tag.name,
            is_custom: Boolean(tag.is_custom),
          })) ?? [];

      setEntry({
        id: row.id,
        title: details?.name || "Untitled",
        releaseYear: getReleaseYear(details?.release_date ?? null),
        posterPath: details?.poster_path ?? null,
      });
      setSelectedTags(tags);
      setWatched(Boolean(row.watched_at));
      setWatchedAt(row.watched_at ?? null);
    } catch (err) {
      setEntry(null);
      setError(getErrorMessage(err, "Failed to load entry"));
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!entry) return;
    setTagQuery("");
    setSaveError(null);
    setSaveCompleted(false);
  }, [entry?.id]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveError(null);
    setSaveCompleted(false);
  }, []);

  const handleWatchedChange = useCallback(
    (value: boolean) => {
      setWatched(value);
      setWatchedAt((prev) => (value ? prev ?? new Date().toISOString() : null));
      resetSaveStatus();
    },
    [resetSaveStatus]
  );

  const handleTagQueryChange = useCallback(
    (value: string) => {
      setTagQuery(value);
      resetSaveStatus();
    },
    [resetSaveStatus]
  );

  const handleAddTag = useCallback(
    (tag: EditEntryTag) => {
      setSelectedTags((prev) => {
        const exists = prev.some(
          (selected) => normalizeTagKey(selected.name) === normalizeTagKey(tag.name)
        );
        if (exists) return prev;
        return [...prev, tag];
      });
      setTagQuery("");
      resetSaveStatus();
    },
    [resetSaveStatus]
  );

  const handleRemoveTag = useCallback(
    (tag: EditEntryTag) => {
      setSelectedTags((prev) => prev.filter((selected) => selected.id !== tag.id));
      resetSaveStatus();
    },
    [resetSaveStatus]
  );

  const handleToggleTag = useCallback(
    (tag: EditEntryTag) => {
      setSelectedTags((prev) => {
        const exists = prev.some((selected) => selected.id === tag.id);
        if (exists) {
          return prev.filter((selected) => selected.id !== tag.id);
        }
        return [...prev, tag];
      });
      setTagQuery("");
      resetSaveStatus();
    },
    [resetSaveStatus]
  );

  const fetchExistingTag = useCallback(
    async (supabase: ReturnType<typeof createClient>, name: string) => {
      const normalizedName = normalizeTagName(name);
      if (!normalizedName) return null;
      const { data, error } = await supabase
        .from("tags")
        .select("id,name,is_custom")
        .ilike("name", normalizedName);
      if (error) throw error;
      const normalized =
        data
          ?.filter((row) => row.name && typeof row.id === "number")
          .map((row) => ({
            id: row.id,
            name: row.name as string,
            is_custom: Boolean(row.is_custom),
          })) ?? [];
      if (normalized.length === 0) return null;
      const pick = normalized.find((tag) => tag.is_custom) ?? normalized[0] ?? null;
      if (!pick) return null;
      setAvailableTags((prev) => {
        const exists = prev.some(
          (tag) => normalizeTagKey(tag.name) === normalizeTagKey(pick.name)
        );
        if (exists) return prev;
        return [...prev, pick];
      });
      return pick;
    },
    []
  );

  const ensureTagExists = useCallback(
    async (rawName: string) => {
      const normalizedName = normalizeTagName(rawName);
      if (!normalizedName) return null;
      const key = normalizeTagKey(normalizedName);
      const existing = availableTags.find((tag) => normalizeTagKey(tag.name) === key);
      if (existing) return existing;

      const supabase = createClient();
      const { data: groupId, error: groupError } = await supabase.rpc("current_user_group_id");
      if (groupError) throw groupError;
      if (!groupId) {
        throw new Error("Could not determine group.");
      }

      const { data: created, error: createError } = await supabase
        .from("tags")
        .insert({
          name: normalizedName,
          tmdb_id: null,
          group_id: groupId,
          is_custom: true,
        })
        .select("id,name,is_custom")
        .maybeSingle();

      if (createError) {
        const existingTag = await fetchExistingTag(supabase, normalizedName);
        if (existingTag) return existingTag;
        throw createError;
      }

      if (!created || !created.name || typeof created.id !== "number") {
        return null;
      }

      const newTag: EditEntryTag = {
        id: created.id,
        name: created.name,
        is_custom: Boolean(created.is_custom),
      };
      setAvailableTags((prev) => {
        const exists = prev.some((tag) => normalizeTagKey(tag.name) === key);
        if (exists) return prev;
        return [...prev, newTag];
      });
      return newTag;
    },
    [availableTags, fetchExistingTag]
  );

  const handleCreateTag = useCallback(
    async (value: string) => {
      if (creatingTag) return;
      const normalizedName = normalizeTagName(value);
      if (!normalizedName) return;
      setCreatingTag(true);
      resetSaveStatus();
      try {
        const tag = await ensureTagExists(normalizedName);
        if (tag) {
          setSelectedTags((prev) => {
            const exists = prev.some(
              (selected) => normalizeTagKey(selected.name) === normalizeTagKey(tag.name)
            );
            if (exists) return prev;
            return [...prev, tag];
          });
        }
        setTagQuery("");
      } catch (err) {
        setSaveError(getErrorMessage(err, "Failed to create tag"));
      } finally {
        setCreatingTag(false);
      }
    },
    [creatingTag, ensureTagExists, resetSaveStatus]
  );

  const suggestions = useMemo(() => {
    const query = normalizeTagKey(tagQuery);
    if (!query) return [];
    const selectedKeys = new Set(selectedTags.map((tag) => normalizeTagKey(tag.name)));
    return availableTags.filter((tag) => {
      const key = normalizeTagKey(tag.name);
      return key.includes(query) && !selectedKeys.has(key);
    });
  }, [availableTags, selectedTags, tagQuery]);

  const canCreateTag = useMemo(() => {
    const query = normalizeTagKey(tagQuery);
    if (!query) return false;
    return !availableTags.some((tag) => normalizeTagKey(tag.name) === query);
  }, [availableTags, tagQuery]);

  const handleSaveTags = useCallback(async () => {
    if (!entryId || !entry) return;
    setSaving(true);
    setSaveError(null);
    setSaveCompleted(false);

    try {
      let finalTags = selectedTags;
      if (tagQuery.trim().length > 0) {
        const created = await ensureTagExists(tagQuery);
        if (created) {
          const exists = finalTags.some(
            (tag) => normalizeTagKey(tag.name) === normalizeTagKey(created.name)
          );
          if (!exists) {
            finalTags = [...finalTags, created];
          }
          setSelectedTags(finalTags);
        }
        setTagQuery("");
      }

      const supabase = createClient();
      const nextWatchedAt = watched ? watchedAt ?? new Date().toISOString() : null;
      const { data: updatedEntry, error: watchedError } = await supabase
        .from("entries")
        .update({ watched_at: nextWatchedAt })
        .eq("id", entryId)
        .select("watched_at")
        .maybeSingle();
      if (watchedError) throw watchedError;
      setWatchedAt(updatedEntry?.watched_at ?? null);
      setWatched(Boolean(updatedEntry?.watched_at));

      const { error: clearError } = await supabase
        .from("entry_tags")
        .delete()
        .eq("entry_id", entryId);
      if (clearError) throw clearError;

      if (finalTags.length > 0) {
        const { error: insertError } = await supabase.from("entry_tags").insert(
          finalTags.map((tag) => ({
            entry_id: entryId,
            tag_id: tag.id,
          }))
        );
        if (insertError) throw insertError;
      }

      setSaveCompleted(true);
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate("/app/list");
      }, 500);
    } catch (err) {
      setSaveError(getErrorMessage(err, "Failed to update tags"));
    } finally {
      setSaving(false);
    }
  }, [entry, entryId, ensureTagExists, navigate, selectedTags, tagQuery, watched, watchedAt]);

  const handleDelete = useCallback(async () => {
    if (!entryId || deleting) return;
    const confirmation = window.confirm(
      entry?.title ? `Delete "${entry.title}" from your list?` : "Delete this entry from your list?"
    );
    if (!confirmation) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("entries").delete().eq("id", entryId);
      if (error) throw error;
      navigate("/app/list");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete entry"));
    } finally {
      setDeleting(false);
    }
  }, [deleting, entry?.title, entryId, navigate]);

  return (
    <EditEntryPage
      entry={entry}
      loading={loading}
      error={error}
      selectedTags={selectedTags}
      availableTags={availableTags}
      tagQuery={tagQuery}
      suggestions={suggestions}
      canCreateTag={canCreateTag}
      watched={watched}
      onWatchedChange={handleWatchedChange}
      onTagQueryChange={handleTagQueryChange}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      onToggleTag={handleToggleTag}
      onCreateTag={handleCreateTag}
      onSaveTags={handleSaveTags}
      saving={saving}
      saveError={saveError}
      saveCompleted={saveCompleted}
      creatingTag={creatingTag}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={handleDelete}
    />
  );
}
