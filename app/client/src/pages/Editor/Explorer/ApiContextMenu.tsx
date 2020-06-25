import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import { ControlIcons } from "icons/ControlIcons";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { AppState } from "reducers";
import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/actionActions";
import { noop } from "lodash";
const useNewAPIName = (apiName: string, pageId: string) => {
  console.log({ apiName, pageId });
};
export const APIContextMenu = (props: {
  theme: Theme;
  apiId: string;
  apiName: string;
}) => {
  const { pageId } = useParams<{ pageId: string }>();
  const dispatch = useDispatch();
  const copyAPIToPage = (apiId: string, apiName: string, pageId: string) =>
    dispatch(
      copyActionRequest({
        id: apiId,
        destinationPageId: pageId,
        // TODO: This will be the name of the new copied API
        // As the API names have to be unique
        name: `${apiName}Copy`,
      }),
    );
  const moveAPIToPage = (apiId: string, apiName: string, pageId: string) => {
    console.log({ apiId, apiName, pageId });
  };
  const deleteAPI = (apiId: string, apiName: string) =>
    dispatch(deleteAction({ id: apiId, name: apiName }));

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map(page => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });

  return (
    <TreeDropdown
      defaultText=""
      onSelect={() => {
        return null;
      }}
      selectedValue=""
      optionTree={[
        {
          value: "copy",
          onSelect: () => null,
          label: "Copy to",
          children: menuPages.map(page => {
            return {
              ...page,
              onSelect: () =>
                copyAPIToPage(props.apiId, props.apiName, page.id),
            };
          }),
        },
        {
          value: "move",
          onSelect: () => null,
          label: "Move to",
          children: menuPages
            .filter(page => page.id !== pageId) // Remove current page from the list
            .map(page => {
              return {
                ...page,
                onSelect: () =>
                  moveAPIToPage(props.apiId, props.apiName, page.id),
              };
            }),
        },
        {
          value: "delete",
          onSelect: () => deleteAPI(props.apiId, props.apiName),
          label: "Delete",
          intent: "danger",
        },
      ]}
      toggle={
        <ControlIcons.MORE_HORIZONTAL_CONTROL
          width={props.theme.fontSizes[4]}
          height={props.theme.fontSizes[4]}
        />
      }
    />
  );
};

export default withTheme(APIContextMenu);
