import { useCallback } from "react";
import history from "utils/history";
import { ADD_PATH, LIST_PATH } from "@appsmith/constants/routes/appRoutes";

export const useQueryAdd = () => {
  const addButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${ADD_PATH}`);
  }, []);
  return addButtonClickHandler;
};

export const useQueryList = () => {
  const listButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${LIST_PATH}`);
  }, []);
  return listButtonClickHandler;
};
