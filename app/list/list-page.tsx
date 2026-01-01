import { Plus } from "lucide-react";
import { ActionLink } from "./action-link";
import { pageTitleClasses } from "../lib/utils";

export function ListPage() {
  return (
    <>
      <p className={pageTitleClasses}>List of saved items</p>
      <ActionLink to="/app/list/add">
        <Plus />
      </ActionLink>
    </>
  );
}
