import { PlusIcon } from "./plus-icon";
import { ActionLink } from "./action-link";

export function ListPage() {
  return (
    <>
      <p className="text-xl text-zinc-700 dark:text-zinc-200">List of saved items</p>
      <ActionLink to="/app/list/add">
        <PlusIcon />
      </ActionLink>
    </>
  );
}
