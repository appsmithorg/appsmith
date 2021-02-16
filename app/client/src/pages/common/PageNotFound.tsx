import React from "react";
import { connect } from "react-redux";
import { APPLICATIONS_URL } from "constants/routes";
import { flushErrorsAndRedirect } from "actions/errorActions";
import NotFound from "./NotFound";

interface Props {
  flushErrorsAndRedirect?: any;
}

const PageNotFound: React.FC<Props> = (props: Props) => {
  const { flushErrorsAndRedirect } = props;

  return (
    <NotFound
      title="Page not found"
      subtitle="Either this page doesn't exist, or you don't have access to this page."
      buttonText="Go back to homepage"
      onBackButton={() => flushErrorsAndRedirect(APPLICATIONS_URL)}
    />
  );
};

export default connect(null, {
  flushErrorsAndRedirect,
})(PageNotFound);
