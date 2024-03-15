import FormRow from "components/editorComponents/FormRow";
import { thinScrollbar } from "constants/DefaultTheme";
import { Button, TabPanel } from "design-system";
import styled from "styled-components";

export const QueryFormContainer = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--ads-v2-spaces-5) 0 0;
  width: 100%;
  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    margin-top: 5px;
  }
  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }
  .executeOnLoad {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
`;

export const SettingsWrapper = styled.div`
  ${thinScrollbar};
  height: 100%;
`;

export const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

export const StyledFormRow = styled(FormRow)`
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-5)
    var(--ads-v2-spaces-7);
  flex: 0;
`;

export const TabContainerView = styled.div`
  display: flex;
  align-items: start;
  flex: 1;
  overflow: auto;
  ${thinScrollbar}
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 12px;
  }
  position: relative;

  & > .ads-v2-tabs {
    height: 100%;

    & > .ads-v2-tabs__panel {
      height: calc(100% - 50px);
      overflow-y: scroll;
    }
  }
`;

export const TabsListWrapper = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
`;

export const TabPanelWrapper = styled(TabPanel)`
  padding: 0 var(--ads-v2-spaces-7);
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 50px);
  width: 100%;
`;

export const DocumentationButton = styled(Button)`
  position: absolute !important;
  right: 24px;
  margin: 7px 0 0;
  z-index: 6;
`;

export const SidebarWrapper = styled.div<{ show: boolean }>`
  border-left: 1px solid var(--ads-v2-color-border);
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-4);
  overflow: hidden;
  border-bottom: 0;
  display: ${(props) => (props.show ? "flex" : "none")};
  width: ${(props) => props.theme.actionSidePane.width}px;
  margin-top: 10px;
  /* margin-left: var(--ads-v2-spaces-7); */
`;

export const SegmentedControlContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  padding-top: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
`;
