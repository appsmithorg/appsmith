import React from "react";
import PageWrapper from "pages/common/PageWrapper";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";

type Props = {
  displayName: string;
};

const PageLoadingScreen = (props: Props) => (
  <PageWrapper displayName={props.displayName}>
    <CenteredWrapper>
      <Spinner />
    </CenteredWrapper>
  </PageWrapper>
);

export default PageLoadingScreen;
