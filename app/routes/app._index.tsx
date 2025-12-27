import { redirect } from "react-router";

export const clientLoader = () => {
  return redirect("/app/watch");
};

export default function AppIndex() {
  return null;
}

