import type { Route } from "./+types/app.list_.add";
import { useSearchParams } from "react-router";
import { Check } from "lucide-react";
import { AddToListPage } from "../list/add-to-list-page";
import type { RouteHandle } from "./app";

export const handle: RouteHandle = {
  rightHeaderAction: {
    to: "/app/list",
    icon: <Check />,
  },
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Video Clerk - Add to List" },
    {
      name: "description",
      content: "Add movies and TV shows to your watch list.",
    },
  ];
}

export default function ListAdd() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  return <AddToListPage initialQuery={query} />;
}
