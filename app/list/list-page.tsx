import { PlusIcon } from "./plus-icon";
import { ActionLink } from "./action-link";

export function ListPage() {
  return (
    <>
      <p className="text-xl text-gray-700 dark:text-gray-200">List of saved items</p>
      <ActionLink to="/list/add">
        <PlusIcon />
      </ActionLink>
    </>
  );
}
