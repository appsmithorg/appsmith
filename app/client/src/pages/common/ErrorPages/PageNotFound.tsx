import React, { useEffect } from "react";
import { connect } from "react-redux";
import { APPLICATIONS_URL } from "constants/routes";
import { Button } from "design-system";
import { flushErrorsAndRedirect } from "actions/errorActions";
import {
  BACK_TO_HOMEPAGE,
  createMessage,
  PAGE_NOT_FOUND,
  PAGE_NOT_FOUND_TITLE,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";

import Page from "./Page";

interface Props {
  flushErrorsAndRedirect: any;
}

function PageNotFound(props: Props) {
  const { flushErrorsAndRedirect } = props;
  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_NOT_FOUND");
  }, []);

  return (
    <Page
      cta={
        <Button
          className="mt-4 button-position"
          endIcon="right-arrow"
          kind="primary"
          onClick={() => flushErrorsAndRedirect(APPLICATIONS_URL)}
          size="md"
        >
          {createMessage(BACK_TO_HOMEPAGE)}
        </Button>
      }
      description="Either this page doesn't exist, or you don't have access to this page"
      errorCode={createMessage(PAGE_NOT_FOUND_TITLE)}
      title={createMessage(PAGE_NOT_FOUND)}
    />
  );
}

export default connect(null, {
  flushErrorsAndRedirect,
})(PageNotFound);
