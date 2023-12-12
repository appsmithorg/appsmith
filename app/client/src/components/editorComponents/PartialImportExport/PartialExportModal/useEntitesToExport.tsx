import {
  PARTIAL_IMPORT_EXPORT,
  createMessage,
} from "@appsmith/constants/messages";
import { useAppWideAndOtherDatasource } from "@appsmith/pages/Editor/Explorer/hooks";
import {
  selectFilesForExplorer,
  selectWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import { Icon } from "design-system";
import { ControlIcons } from "icons/ControlIcons";
import { MenuIcons } from "icons/MenuIcons";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";
import type { JSLibrary } from "workers/common/JSLibrary";
import EntityCheckboxSelector from "./EntityCheckboxSelector";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import WidgetsExport from "./WidgetsExport";
import {
  getWidgetIdsForSelection,
  groupQueriesNJSObjets,
} from "./partialExportUtils";

interface EntityCollapsibleState {
  jsObjects: { isOpen: boolean; allChecked: boolean };
  datasources: { isOpen: boolean; allChecked: boolean };
  customJSLibs: { isOpen: boolean; allChecked: boolean };
  widgets: { isOpen: boolean; allChecked: boolean };
  queries: { isOpen: boolean; allChecked: boolean };
}

export function useEntitesToExport(
  selectedParams: PartialExportParams,
  setSelectedParams: React.Dispatch<React.SetStateAction<PartialExportParams>>,
  customJsLibraries: JSLibrary[],
) {
  const { appWideDS } = useAppWideAndOtherDatasource();
  const files = useSelector(selectFilesForExplorer);
  const canvasWidgets = useSelector(selectWidgetsForCurrentPage);
  const [entityCollapsibleState, setEntityCollapsibleState] =
    useState<EntityCollapsibleState>({
      jsObjects: { isOpen: false, allChecked: false },
      datasources: { isOpen: false, allChecked: false },
      customJSLibs: { isOpen: false, allChecked: false },
      widgets: { isOpen: false, allChecked: false },
      queries: { isOpen: false, allChecked: false },
    });

  function onEntitySelected(
    keyToUpdate: keyof PartialExportParams,
    id: string,
    selected: boolean,
  ) {
    const prevSelectedIdsCopy = [...selectedParams[keyToUpdate]];
    if (selected) {
      prevSelectedIdsCopy.push(id);
    } else {
      prevSelectedIdsCopy.splice(prevSelectedIdsCopy.indexOf(id), 1);
    }
    setSelectedParams((prev: PartialExportParams): PartialExportParams => {
      const toUpdate = { ...prev, [keyToUpdate]: prevSelectedIdsCopy };
      return toUpdate;
    });
  }
  const updateEntityCollapsibleState = (
    entityName: keyof EntityCollapsibleState,
    isOpen: boolean,
  ) => {
    setEntityCollapsibleState((prev) => ({
      ...prev,
      [entityName]: {
        ...prev[entityName],
        isOpen,
      },
    }));
  };

  return useMemo(() => {
    const groupedData: Record<string, any> = groupQueriesNJSObjets(files);
    const jsObjects =
      groupedData["JS Objects"] &&
      groupedData["JS Objects"].map((item: any) => item.entity);
    delete groupedData["JS Objects"];

    return [
      {
        content: jsObjects ? (
          <EntityCheckboxSelector
            entities={jsObjects}
            onEntityChecked={(id, selected) =>
              onEntitySelected("jsObjects", id, selected)
            }
            selectedIds={selectedParams.jsObjects}
          />
        ) : null,
        icon: <Icon name="js" size="md" />,
        shouldShowReset: !!selectedParams.jsObjects.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            jsObjects: [],
          }));
          event.stopPropagation();
        },
        onSelectAllClick: (checked: boolean) => {
          setSelectedParams((prev) => ({
            ...prev,
            jsObjects: checked
              ? jsObjects
                ? jsObjects.map((item: any) => item.id)
                : []
              : [],
          }));
        },
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.jsObjects),
      },
      {
        content:
          appWideDS.length > 0 ? (
            <EntityCheckboxSelector
              entities={appWideDS}
              onEntityChecked={(id, selected) =>
                onEntitySelected("datasources", id, selected)
              }
              selectedIds={selectedParams.datasources}
            />
          ) : null,
        icon: <Icon name="database-2-line" size="md" />,
        shouldShowReset: !!selectedParams.datasources.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            datasources: [],
          }));
          event.stopPropagation();
        },
        onSelectAllClick: (checked: boolean) => {
          setSelectedParams((prev) => ({
            ...prev,
            datasources: checked ? appWideDS.map((item: any) => item.id) : [],
          }));
        },
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.databases),
      },
      {
        content: groupedData ? (
          <JSObjectsNQueriesExport
            appDS={appWideDS}
            data={groupedData}
            selectedQueries={selectedParams.queries}
            updateSelectedQueries={(queries) =>
              setSelectedParams((prev) => ({ ...prev, queries }))
            }
          />
        ) : null,
        icon: <MenuIcons.GROUP_QUERY_ICON height={16} keepColors width={16} />,
        shouldShowReset: !!selectedParams.queries.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            queries: [],
          }));
          event.stopPropagation();
        },
        onSelectAllClick: (checked: boolean) => {
          setSelectedParams((prev) => ({
            ...prev,
            queries: checked
              ? Object.values(groupedData).flatMap((item: any) =>
                  item.map((query: any) => query.id),
                )
              : [],
          }));
        },
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.queries),
      },
      {
        content:
          customJsLibraries.length > 0 ? (
            <EntityCheckboxSelector
              entities={customJsLibraries}
              onEntityChecked={(id, selected) =>
                onEntitySelected("customJSLibs", id, selected)
              }
              selectedIds={selectedParams.customJSLibs}
            />
          ) : null,
        icon: <MenuIcons.LIBRARY_ICON height={16} keepColors width={16} />,
        shouldShowReset: !!selectedParams.customJSLibs.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            customJSLibs: [],
          }));
          event.stopPropagation();
        },
        onSelectAllClick: (checked: boolean) => {
          setSelectedParams((prev) => ({
            ...prev,
            customJSLibs: checked
              ? customJsLibraries?.map((item) => item?.id || "") || []
              : [],
          }));
        },
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.customLibs),
      },
      {
        content: canvasWidgets ? (
          <WidgetsExport
            selectAllchecked={entityCollapsibleState.widgets.allChecked}
            selectedWidgetIds={selectedParams.widgets}
            updateSelectAllChecked={(checked) =>
              updateEntityCollapsibleState("widgets", checked)
            }
            updateSelectedWidgets={(widgets) =>
              setSelectedParams((prev) => ({ ...prev, widgets }))
            }
            widgets={canvasWidgets}
          />
        ) : null,
        icon: <ControlIcons.GROUP_CONTROL height={16} keepColors width={16} />,
        isOpen: entityCollapsibleState.widgets.isOpen,
        isSelectAllChecked: entityCollapsibleState.widgets.allChecked,
        shouldShowReset: !!selectedParams.widgets.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            widgets: [],
          }));
          updateEntityCollapsibleState("widgets", false);
          event.stopPropagation();
        },
        onSelectAllClick: (checked: boolean) => {
          setSelectedParams((prev) => {
            const widgets = [...prev.widgets];
            getWidgetIdsForSelection(canvasWidgets!, widgets, checked);
            return {
              ...prev,
              widgets,
            };
          });
          setEntityCollapsibleState((prev) => ({
            ...prev,
            widgets: {
              isOpen: checked,
              allChecked: checked,
            },
          }));
        },
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.widgets),
      },
    ];
  }, [
    files,
    appWideDS,
    customJsLibraries,
    canvasWidgets,
    selectedParams,
    setSelectedParams,
    entityCollapsibleState,
  ]);
}
