import AddQuery from "./Add";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import ListQuery from "./List";

export const ListRoutes = (path: string) => [
  {
    key: "AddQuery",
    exact: true,
    component: AddQuery,
    path: [`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`],
  },
  {
    key: "ListQuery",
    exact: false,
    component: ListQuery,
    path: [path],
  },
];
