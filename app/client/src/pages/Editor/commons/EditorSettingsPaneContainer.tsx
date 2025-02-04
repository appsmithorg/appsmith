import React from "react";
import styled from "styled-components";
import PaneHeader from "pages/AppIDE/LeftPane/PaneHeader";

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

  border-right: 1px solid var(--ads-v2-color-border);
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
