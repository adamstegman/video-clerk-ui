import { SettingsSection } from "../../components/settings-section";
import { EditEntryWatchedStatus } from "./edit-entry-watched-status";

interface EditEntryWatchedStatusSectionProps {
  watched: boolean;
  onWatchedChange: (value: boolean) => void;
}

export function EditEntryWatchedStatusSection({
  watched,
  onWatchedChange,
}: EditEntryWatchedStatusSectionProps) {
  return (
    <SettingsSection title="Status">
      <EditEntryWatchedStatus watched={watched} onWatchedChange={onWatchedChange} />
    </SettingsSection>
  );
}
