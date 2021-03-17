import React from "react";

import { ERROR_CODES } from "constants/ApiConstants";
import PageNotFound from "pages/common/PageNotFound";
import ServerTimeout from "pages/common/ServerTimeout";
import ServerUnavailable from "pages/common/ServerUnavailable";
import ClientError from "pages/common/ClientError";

interface ErrorPageProps {
  code: ERROR_CODES;
}

const ErrorPage: React.FC<ErrorPageProps> = (props: ErrorPageProps) => {
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
      return <ServerUnavailable />;
  }
};

export default ErrorPage;
