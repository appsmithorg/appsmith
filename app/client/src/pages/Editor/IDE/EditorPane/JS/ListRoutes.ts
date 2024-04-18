import AddJS from "./Add";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import ListJS from "./List";

export const ListRoutes = (path: string) => [
  {
    exact: true,
    key: "AddJS",
    component: AddJS,
    path: [`${path}${ADD_PATH}`, `${path}/:collectionId${ADD_PATH}`],
  },
  {
    exact: false,
    key: "ListJS",
    component: ListJS,
    path: [path],
  },
];
