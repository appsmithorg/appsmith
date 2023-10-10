import React from "react";
import Helmet from "react-helmet";
import { ThemeProvider } from "styled-components";
import { useSelector } from "react-redux";

import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import PackageMainContainer from "./PackageMainContainer";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { ThemeMode, getTheme } from "selectors/themeSelectors";
import {
  getCurrentPackage,
  getIsPackageEditorInitialized,
} from "@appsmith/selectors/packageSelectors";
import { Spinner } from "design-system";

const theme = getTheme(ThemeMode.LIGHT);

function PackageEditor() {
  const currentPackage = useSelector(getCurrentPackage);
  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);

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
