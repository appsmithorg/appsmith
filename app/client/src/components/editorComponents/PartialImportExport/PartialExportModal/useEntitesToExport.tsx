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
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { JSLibrary } from "workers/common/JSLibrary";
import EntityCheckboxSelector from "./EntityCheckboxSelector";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import WidgetsExport from "./WidgetsExport";
import { groupQueriesNJSObjets } from "./partialExportUtils";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";

export function useEntitesToExport(
  selectedParams: PartialExportParams,
  setSelectedParams: React.Dispatch<React.SetStateAction<PartialExportParams>>,
  onEntitySelected: (
    keyToUpdate: keyof PartialExportParams,
    id: string,
    selected: boolean,
  ) => void,
  widgetSelectAllChecked: boolean,
  setWidgetSelectAllChecked: (checked: boolean) => void,
  customJsLibraries: JSLibrary[],
) {
  const { appWideDS } = useAppWideAndOtherDatasource();
  const files = useSelector(selectFilesForExplorer);
  const canvasWidgets = useSelector(selectWidgetsForCurrentPage);

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
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.customLibs),
      },
      {
        content: canvasWidgets ? (
          <WidgetsExport
            selectAllchecked={widgetSelectAllChecked}
            selectedWidgetIds={selectedParams.widgets}
            updateSelectAllChecked={setWidgetSelectAllChecked}
            updateSelectedWidgets={(widgets) =>
              setSelectedParams((prev) => ({ ...prev, widgets }))
            }
            widgets={canvasWidgets}
          />
        ) : null,
        icon: <ControlIcons.GROUP_CONTROL height={16} keepColors width={16} />,
        shouldShowReset: !!selectedParams.widgets.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            widgets: [],
          }));
          setWidgetSelectAllChecked(false);
          event.stopPropagation();
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
  ]);
}
