import AddJS from "./Add";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import JSEditor from "pages/Editor/JSEditor";
import { BlankStateContainer } from "./BlankStateContainer";

export const CodeRoutes = (path: string) => [
  {
    exact: true,
    key: "AddJS",
    component: AddJS,
    path: [`${path}${ADD_PATH}`, `${path}/:collectionId${ADD_PATH}`],
  },
  {
    exact: true,
    key: "JSEditor",
    component: JSEditor,
    path: [path + "/:collectionId"],
  },
  {
    key: "JSEmpty",
    component: BlankStateContainer,
    exact: true,
    path: [path],
  },
];
