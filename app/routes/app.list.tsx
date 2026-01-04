import type { Route } from "./+types/app.list";
import { ListPageContainer } from "../list/list-page-container";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Video Clerk" },
    {
      name: "description",
      content: "A mobile-first web application that solves the \"what do we watch?\" conundrum. It separates the **Discovery Phase** (adding things to the list when you hear about them) from the **Decision Phase** (filtering that list based on current mood to find a winner).",
    },
  ];
}

export default function List() {
  return <ListPageContainer />;
}

