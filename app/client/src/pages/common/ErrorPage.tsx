import React from "react";

import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import PageNotFound from "pages/common/ErrorPages/PageNotFound";
import ServerTimeout from "pages/common/ErrorPages/ServerTimeout";
import ServerUnavailable from "pages/common/ErrorPages/ServerUnavailable";
import ClientError from "pages/common/ErrorPages/ClientError";
import GenericError from "./ErrorPages/GenericError";

interface ErrorPageProps {
  code: ERROR_CODES;
}

function ErrorPage(props: ErrorPageProps) {
  const { code } = props;

  switch (code) {
    case ERROR_CODES.PAGE_NOT_FOUND:
      return <PageNotFound />;
    case ERROR_CODES.SERVER_ERROR:
      return <ServerUnavailable />;
    case ERROR_CODES.REQUEST_TIMEOUT:
      return <ServerTimeout />;
    case ERROR_CODES.FAILED_TO_CORRECT_BINDING:
      return <ClientError />;
    default:
      return <GenericError errorCode={code} />;
  }
}

export default ErrorPage;
