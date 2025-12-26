import type { Route } from "./+types/index";
import { ListPage } from "../list/list-page";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Video Clerk" },
    {
      name: "description",
      content: "A mobile-first web application that solves the \"what do we watch?\" argument. It separates the **Discovery Phase** (adding things to the list when you hear about them) from the **Decision Phase** (filtering that list based on current mood to find a winner).",
    },
  ];
}

export default function List() {
  return <ListPage />;
}
