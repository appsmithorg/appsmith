import React, { useEffect } from "react";
import Helmet from "react-helmet";
import { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { ThemeMode, getTheme } from "selectors/themeSelectors";
import {
  getCurrentPackage,
  getIsPackageEditorInitialized,
} from "@appsmith/selectors/packageSelectors";
import { Spinner } from "design-system";
import { editorInitializer } from "utils/editor/EditorUtils";
import { widgetInitialisationSuccess } from "actions/widgetActions";
import PackageIDE from "./PackageIDE";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { setCurrentModule } from "@appsmith/actions/moduleActions";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { resetEditorRequest } from "actions/initActions";

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

    return () => {
      dispatch({
        type: ReduxActionTypes.SET_CURRENT_PACKAGE_ID,
        payload: {
          packageId: undefined,
        },
      });
      dispatch(setCurrentModule(undefined));
      urlBuilder.setCurrentModuleId(undefined);
      dispatch(resetEditorRequest());
    };
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
          <PackageIDE />
        </GlobalHotKeys>
      </div>
    </ThemeProvider>
  );
}

export default PackageEditor;
