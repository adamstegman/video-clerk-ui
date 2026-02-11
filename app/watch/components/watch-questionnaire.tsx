import { Check } from "lucide-react";
import { cn, primaryHeadingClasses, secondaryTextClasses } from "../../lib/utils";

export interface QuestionnaireFilters {
  timeTypes: ("short-show" | "long-show" | "movie")[];
  selectedTags: string[];
}

interface WatchQuestionnaireProps {
  availableTags: string[];
  filters: QuestionnaireFilters;
  onFiltersChange: (filters: QuestionnaireFilters) => void;
  onStart: () => void;
  matchingCount: number;
}

export function WatchQuestionnaire({
  availableTags,
  filters,
  onFiltersChange,
  onStart,
  matchingCount,
}: WatchQuestionnaireProps) {
  const toggleTimeType = (type: "short-show" | "long-show" | "movie") => {
    const newTimeTypes = filters.timeTypes.includes(type)
      ? filters.timeTypes.filter((t) => t !== type)
      : [...filters.timeTypes, type];
    onFiltersChange({ ...filters, timeTypes: newTimeTypes });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: newTags });
  };

  const hasSelections = filters.timeTypes.length > 0 || filters.selectedTags.length > 0;

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      {/* Time Section */}
      <div>
        <h2 className={cn("text-lg font-semibold mb-3", primaryHeadingClasses)}>
          How much time do you have?
        </h2>
        <div className="flex flex-col gap-2">
          <TimeOption
            label="Short Show"
            description="Quick episodes (under 30 min)"
            isSelected={filters.timeTypes.includes("short-show")}
            onClick={() => toggleTimeType("short-show")}
          />
          <TimeOption
            label="Long Show"
            description="Full episodes (30+ min)"
            isSelected={filters.timeTypes.includes("long-show")}
            onClick={() => toggleTimeType("long-show")}
          />
          <TimeOption
            label="Movie"
            description="Feature length film"
            isSelected={filters.timeTypes.includes("movie")}
            onClick={() => toggleTimeType("movie")}
          />
        </div>
      </div>

      {/* Mood/Tags Section */}
      {availableTags.length > 0 && (
        <div>
          <h2 className={cn("text-lg font-semibold mb-3", primaryHeadingClasses)}>
            What's your mood?
          </h2>
          <p className={cn("text-sm mb-3", secondaryTextClasses)}>
            Select any tags that match how you're feeling
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                isSelected={filters.selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      <MatchingCountBadge matchingCount={matchingCount} hasFilters={hasSelections} />

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={matchingCount === 0}
        className={cn(
          "w-full py-3 px-4 rounded-lg font-semibold transition-colors",
          "flex items-center justify-center gap-2",
          matchingCount > 0
            ? "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
        )}
      >
        Start Swiping
        <Check className="w-5 h-5" />
      </button>

      {matchingCount === 0 && (
        <p className={cn("text-xs text-center text-amber-600 dark:text-amber-400")}>
          No entries match these filters. Try different options.
        </p>
      )}
    </div>
  );
}

function TimeOption({
  label,
  description,
  isSelected,
  onClick,
}: {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
        isSelected
          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isSelected
            ? "border-indigo-600 bg-indigo-600"
            : "border-zinc-300 dark:border-zinc-700"
        )}
      >
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <div className={cn("font-medium", primaryHeadingClasses)}>{label}</div>
        <div className={cn("text-sm", secondaryTextClasses)}>{description}</div>
      </div>
    </button>
  );
}

function TagChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        isSelected
          ? "bg-indigo-600 text-white"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      )}
    >
      {label}
    </button>
  );
}

function MatchingCountBadge({ matchingCount, hasFilters }: { matchingCount: number; hasFilters: boolean }) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 text-center",
        matchingCount > 0
          ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      <div className={cn("text-3xl font-bold", primaryHeadingClasses)}>
        {matchingCount}
      </div>
      <div className={cn("text-sm mt-1", secondaryTextClasses)}>
        {hasFilters
          ? `${matchingCount === 1 ? "entry matches" : "entries match"} your filters`
          : `${matchingCount === 1 ? "entry" : "entries"} in your list`}
      </div>
    </div>
  );
}
