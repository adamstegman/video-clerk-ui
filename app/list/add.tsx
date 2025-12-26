import type { Route } from "./+types/add";
import { useSearchParams } from "react-router";
import { AddToListPage } from "../list/add-to-list-page";
import { CheckmarkIcon } from "~/header/checkmark-icon";
import type { RouteHandle } from "~/layouts/main-layout";

export const handle: RouteHandle = {
  rightHeaderAction: {
    to: "/list",
    icon: <CheckmarkIcon />,
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

