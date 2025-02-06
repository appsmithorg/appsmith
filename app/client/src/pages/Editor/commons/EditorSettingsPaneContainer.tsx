import React from "react";
import styled from "styled-components";
import PaneHeader from "../IDE/LeftPane/PaneHeader";

type EditorSettingsPaneContainerProps = React.PropsWithChildren<{
  title: string;
}>;

const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  &:nth-child(2) {
    height: 100%;
  }
`;

const EditorSettingsPaneContainer = ({
  children,
  title,
}: EditorSettingsPaneContainerProps) => {
  return (
    <div className="h-full flex">
      <SettingsPageWrapper>
        <PaneHeader title={title} />
        {children}
      </SettingsPageWrapper>
    </div>
  );
};

export default EditorSettingsPaneContainer;
