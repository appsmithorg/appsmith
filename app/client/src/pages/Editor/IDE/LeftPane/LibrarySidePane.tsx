import React, { useCallback } from "react";
import AddLibraryPopover from "./AddLibraryPopover";
import PaneHeader from "./PaneHeader";
import { useDispatch, useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { Button, List } from "design-system";
import { uninstallLibraryInit } from "actions/JSLibraryActions";
import recommendedLibraries from "../../Explorer/Libraries/recommendedLibraries";
import type { JSLibrary } from "../../../../workers/common/JSLibrary";

const docsURLMap = recommendedLibraries.reduce(
  (acc, lib) => {
    acc[lib.url] = lib.docsURL;
    return acc;
  },
  {} as Record<string, string>,
);

const LibrarySidePane = () => {
  const dispatch = useDispatch();
  const libraries = useSelector(selectLibrariesForExplorer);
  const uninstallLibrary = useCallback((lib) => {
    dispatch(uninstallLibraryInit(lib));
  }, []);
  const openDocs = useCallback((lib: JSLibrary) => {
    const docsURL = docsURLMap[lib.url || ""] || lib.docsURL;
    docsURL && window.open(docsURL, "_blank");
  }, []);
  return (
    <div>
      <PaneHeader
        rightIcon={<AddLibraryPopover />}
        title="Installed Libraries"
      />
      <List
        items={libraries.map((lib) => ({
          title: lib.name,
          startIcon: (
            <Button isIconButton kind="tertiary" startIcon="share-box-line" />
          ),
          description: lib.version || "",
          onClick: () => openDocs(lib),
          descriptionType: "inline",
          endIcon: "delete-bin-line",
          onEndIconClick: () => uninstallLibrary(lib),
        }))}
      />
    </div>
  );
};

export default LibrarySidePane;
