import type { Route } from "./+types/_index";
import { MarketingPage } from "../marketing/marketing-page";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Video Clerk - Solve the 'what do we watch?' conundrum" },
    {
      name: "description",
      content: "A mobile-first web application that solves the \"what do we watch?\" conundrum. It separates the Discovery Phase from the Decision Phase.",
    },
  ];
}

export default function Index() {
  return <MarketingPage />;
}
