import { PlusIcon } from "./plus-icon";
import { ActionLink } from "./action-link";
import { pageTitleClasses } from "../lib/utils";

export function ListPage() {
  return (
    <>
      <p className={pageTitleClasses}>List of saved items</p>
      <ActionLink to="/app/list/add">
        <PlusIcon />
      </ActionLink>
    </>
  );
}
