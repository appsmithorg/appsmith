import { setPageOrder } from "actions/pageActions";
import { Page } from "ce/constants/ReduxActionConstants";
import { ControlIcons, DraggableList } from "design-system";
import { ThemePropertyPane } from "pages/Editor/ThemePropertyPane";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { selectAllPages } from "selectors/entitiesSelector";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings";
import SectionHeader, { SectionHeaderProps } from "./SectionHeader";

enum Tabs {
  General,
  Theme,
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

const SectionContent = styled.div`
  box-shadow: -1px 0 0 0 #e0dede;
`;

const TabHeaderText = styled.div`
  height: 48px;
`;

const ThemeTabContentWrapper = styled.div`
  height: calc(100% - 48px);
  overflow-y: overlay;
`;

function AppSettings() {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState(Tabs.General);
  const applicationId = useSelector(getCurrentApplicationId);
  const pages: Page[] = useSelector(selectAllPages);

  const DragIcon = ControlIcons.DRAG_CONTROL;

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      icon: "settings-2-line",
      isSelected: selectedTab === Tabs.General,
      name: "General",
      onClick: () => {
        setSelectedTab(Tabs.General);
      },
      subText: "App name, icon , share",
    },
    {
      icon: "edit-line",
      isSelected: selectedTab === Tabs.Theme,
      name: "Theme",
      onClick: () => {
        setSelectedTab(Tabs.Theme);
      },
      subText: "Set theme, color and font",
    },
  ];

  const setPageOrderCallback = useCallback(
    (pageId: string, newOrder: number) => {
      dispatch(setPageOrder(applicationId, pageId, newOrder));
    },
    [dispatch, applicationId],
  );

  return (
    <Wrapper className="flex flex-row">
      <div className="w-1/2">
        {SectionHeadersConfig.map((config) => (
          <SectionHeader key={config.name} {...config} />
        ))}
        <div className="border-t-[1px] border-[#d7d7d7]" />
        <DraggableList
          ItemRenderer={({ item }: { item: Page }) => (
            <div className="cursor-pointer">
              <DragIcon color="black" height={20} width={20} />
              {item.pageName}
            </div>
          )}
          itemHeight={70}
          items={pages}
          keyAccessor={"pageId"}
          onUpdate={(
            newOrder: any,
            originalIndex: number,
            newIndex: number,
          ) => {
            setPageOrderCallback(pages[originalIndex].pageId, newIndex);
          }}
          shouldReRender={false}
        />
      </div>
      <SectionContent className="w-1/2">
        {(() => {
          switch (selectedTab) {
            case Tabs.General:
              return (
                <div className="px-4">
                  <TabHeaderText className="leading-[3rem] font-medium">
                    General settings
                  </TabHeaderText>
                  <GeneralSettings />
                </div>
              );
            case Tabs.Theme:
              return (
                <>
                  <div className="px-4">
                    <TabHeaderText className="leading-[3rem] font-medium">
                      Theme settings
                    </TabHeaderText>
                  </div>
                  <ThemeTabContentWrapper>
                    <ThemePropertyPane />
                  </ThemeTabContentWrapper>
                </>
              );
          }
        })()}
      </SectionContent>
    </Wrapper>
  );
}

export default AppSettings;
