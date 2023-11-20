import React, { useEffect } from "react";
import Helmet from "react-helmet";
import { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import PackageMainContainer from "./PackageMainContainer";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { ThemeMode, getTheme } from "selectors/themeSelectors";
import {
  getCurrentPackage,
  getIsPackageEditorInitialized,
} from "@appsmith/selectors/packageSelectors";
import { Spinner } from "design-system";
import { editorInitializer } from "utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "actions/widgetActions";

const theme = getTheme(ThemeMode.LIGHT);

function PackageEditor() {
  const dispatch = useDispatch();
  const currentPackage = useSelector(getCurrentPackage);
  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);

  /**
   * initializes the widgets factory and registers all widgets
   */
  useEffect(() => {
    editorInitializer().then(() => {
      dispatch(widgetInitialisationSuccess());
    });
  }, []);

  if (!isPackageEditorInitialized) {
    return (
      <CenteredWrapper
        style={{ height: `calc(100vh - ${theme.smallHeaderHeight})` }}
      >
        <Spinner size="lg" />
      </CenteredWrapper>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{`${currentPackage?.name} | Editor | Appsmith`}</title>
        </Helmet>
        <GlobalHotKeys>
          <PackageMainContainer />
        </GlobalHotKeys>
      </div>
    </ThemeProvider>
  );
}

export default PackageEditor;
