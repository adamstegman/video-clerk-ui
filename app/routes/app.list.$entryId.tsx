import type { Route } from "./+types/app.list.$entryId";
import { ArrowLeft } from "lucide-react";
import { EditEntryPageContainer } from "../list/edit-entry-page-container";
import type { RouteHandle } from "./app";

export const handle: RouteHandle = {
  leftHeaderAction: {
    to: "/app/list",
    icon: <ArrowLeft />,
  },
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Video Clerk - Edit Entry" },
    {
      name: "description",
      content: "Edit saved list entries and update tags.",
    },
  ];
}

export default function ListEntryEdit() {
  return <EditEntryPageContainer />;
}
