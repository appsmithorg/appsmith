import React from "react";
import SuperUserWelcome from "./SuperUserWelcome";
import NonSuperUserWelcome from "./NonSuperUserWelcome";

type LandingPageProps = {
  onGetStarted?: (role?: string, useCase?: string) => void;
  forSuperUser: boolean;
};

export default function LandingPage(props: LandingPageProps) {
  return props.forSuperUser ? (
    <SuperUserWelcome />
  ) : (
    <NonSuperUserWelcome onGetStarted={props.onGetStarted} />
  );
}
