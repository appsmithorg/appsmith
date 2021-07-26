import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useScript, ScriptStatus } from "utils/hooks/useScript";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import { setOnboardingFormInProgress } from "utils/storage";

export const TypeformContainer = styled.div`
  & iframe {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    border: 0;
  }
`;

function OnboardingForm() {
  const status = useScript(`https://embed.typeform.com/embed.js`);
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    setOnboardingFormInProgress(true);
  }, []);

  if (status !== ScriptStatus.READY || !currentUser) return null;

  return (
    <TypeformContainer>
      <iframe
        allow="camera; microphone; autoplay; encrypted-media;"
        frameBorder="0"
        height="100%"
        id="typeform-full"
        src={`https://form.typeform.com/to/m7sRcK1Y?typeform-medium=embed-snippet#email=${currentUser?.email}`}
        width="100%"
      />
    </TypeformContainer>
  );
}

export default OnboardingForm;
