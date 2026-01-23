import { useCallback, useEffect, useMemo, useState } from "react";
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
  return name.trim().toLowerCase();
}

function parseTagInput(raw: string) {
  const seen = new Set<string>();
  const tags: string[] = [];
  raw
    .split(/[,\\n]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => {
      const key = normalizeTagKey(tag);
      if (seen.has(key)) return;
      seen.add(key);
      tags.push(tag);
    });
  return tags;
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

  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
            id,
            added_at,
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
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setEntry(null);
        setError("Entry not found.");
        return;
      }

      const row = data as unknown as EntriesQueryRow;
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
        tags,
      });
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

  useEffect(() => {
    if (!entry) return;
    setTagsInput(entry.tags.map((tag) => tag.name).join(", "));
    setSaveError(null);
    setSaveSuccess(false);
  }, [entry?.id]);

  const handleTagsChange = useCallback((value: string) => {
    setTagsInput(value);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  const handleSaveTags = useCallback(async () => {
    if (!entryId || !entry) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const desiredNames = parseTagInput(tagsInput);
      const existingByKey = new Map<string, EditEntryTag>();
      for (const tag of entry.tags) {
        existingByKey.set(normalizeTagKey(tag.name), tag);
      }

      const nameByKey = new Map<string, string>();
      for (const name of desiredNames) {
        const key = normalizeTagKey(name);
        if (!nameByKey.has(key)) {
          nameByKey.set(key, name);
        }
      }

      const unresolvedKeys = Array.from(nameByKey.keys()).filter((key) => !existingByKey.has(key));
      const namesToFind = unresolvedKeys.map((key) => nameByKey.get(key) as string);

      const resolvedByKey = new Map<string, EditEntryTag>();
      const supabase = createClient();

      if (namesToFind.length > 0) {
        const { data: tagRows, error: tagsError } = await supabase
          .from("tags")
          .select("id,name,is_custom")
          .in("name", namesToFind);
        if (tagsError) throw tagsError;

        const grouped = new Map<string, EditEntryTag[]>();
        for (const row of tagRows ?? []) {
          if (!row.name || typeof row.id !== "number") continue;
          const tag: EditEntryTag = {
            id: row.id,
            name: row.name,
            is_custom: Boolean(row.is_custom),
          };
          const key = normalizeTagKey(tag.name);
          const list = grouped.get(key) ?? [];
          list.push(tag);
          grouped.set(key, list);
        }

        const namesToCreate: string[] = [];
        for (const key of unresolvedKeys) {
          const candidates = grouped.get(key) ?? [];
          const pick = candidates.find((tag) => tag.is_custom) ?? candidates[0];
          if (pick) {
            resolvedByKey.set(key, pick);
          } else {
            const name = nameByKey.get(key);
            if (name) namesToCreate.push(name);
          }
        }

        if (namesToCreate.length > 0) {
          const { data: groupId, error: groupError } = await supabase.rpc("current_user_group_id");
          if (groupError) throw groupError;
          if (!groupId) {
            throw new Error("Could not determine group.");
          }

          const { data: created, error: createError } = await supabase
            .from("tags")
            .upsert(
              namesToCreate.map((name) => ({
                name,
                tmdb_id: null,
                group_id: groupId,
                is_custom: true,
              })),
              { onConflict: "name,group_id" }
            )
            .select("id,name,is_custom");
          if (createError) throw createError;

          for (const row of created ?? []) {
            if (!row.name || typeof row.id !== "number") continue;
            const tag: EditEntryTag = {
              id: row.id,
              name: row.name,
              is_custom: Boolean(row.is_custom),
            };
            resolvedByKey.set(normalizeTagKey(tag.name), tag);
          }
        }
      }

      const finalTags: EditEntryTag[] = [];
      const seenIds = new Set<number>();
      for (const name of desiredNames) {
        const key = normalizeTagKey(name);
        const tag = existingByKey.get(key) ?? resolvedByKey.get(key);
        if (!tag || seenIds.has(tag.id)) continue;
        seenIds.add(tag.id);
        finalTags.push(tag);
      }

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

      setEntry((prev) => (prev ? { ...prev, tags: finalTags } : prev));
      setTagsInput(finalTags.map((tag) => tag.name).join(", "));
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getErrorMessage(err, "Failed to update tags"));
    } finally {
      setSaving(false);
    }
  }, [entry, entryId, tagsInput]);

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
      tagsInput={tagsInput}
      onTagsChange={handleTagsChange}
      onSaveTags={handleSaveTags}
      saving={saving}
      saveError={saveError}
      saveSuccess={saveSuccess}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={handleDelete}
    />
  );
}
