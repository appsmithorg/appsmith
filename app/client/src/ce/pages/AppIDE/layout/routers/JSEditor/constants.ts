import type { UseRoutes } from "IDE/Interfaces/UseRoutes";
import { ADD_PATH } from "ee/constants/routes/appRoutes";
import AddJS from "pages/AppIDE/components/JSAdd/loader";
import JSEditor from "pages/Editor/JSEditor/loader";
import JSBlankState from "pages/Editor/JSEditor/JSBlankState";

export const JSEditorRoutes = (path: string): UseRoutes => {
  return [
    {
      exact: true,
      key: "AddJS",
      component: AddJS,
      path: [`${path}${ADD_PATH}`, `${path}/:baseCollectionId${ADD_PATH}`],
    },
    {
      exact: true,
      key: "JSEditor",
      component: JSEditor,
      path: [path + "/:baseCollectionId"],
    },
    {
      key: "JSEmpty",
      component: JSBlankState,
      exact: true,
      path: [path],
    },
  ];
};
