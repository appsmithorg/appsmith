import React, { useCallback, useEffect } from "react";
import { Collapse, Icon } from "@blueprintjs/core";
import styled from "styled-components";
import type { IconName } from "design-system-old";
import { Icon as AdsIcon, IconSize } from "design-system-old";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDatasourceCollapsibleState } from "selectors/ui";
import { setDatasourceCollapsible } from "actions/datasourceActions";
import isUndefined from "lodash/isUndefined";

const SectionLabel = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.17px;
  color: #4e5d78;
  display: flex;
  .cs-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 240px;
  cursor: pointer;
  margin-bottom: 5;
`;

const TopBorder = styled.div`
  height: 1px;
  background-color: ${Colors.ALTO};
  margin-top: 24px;
  margin-bottom: 24px;
`;

interface ComponentProps {
  children: any;
  title: string;
  defaultIsOpen?: boolean;
  // header icon props of collapse header
  headerIcon?: {
    name: IconName;
    color?: string;
  };
  showTopBorder?: boolean;
  showSection?: boolean;
}

type Props = ComponentProps;

function Collapsible(props: Props) {
  const {
    children,
    defaultIsOpen,
    headerIcon,
    showSection = true,
    showTopBorder = true,
    title,
  } = props;
  const dispatch = useDispatch();
  const isOpen = useSelector((state: AppState) =>
    getDatasourceCollapsibleState(state, title),
  );

  const setIsOpen = useCallback((open) => {
    dispatch(setDatasourceCollapsible(title, open));
  }, []);

  useEffect(() => {
    // We set the default value only when there is no state stored yet for the same
    if (defaultIsOpen && isUndefined(isOpen)) {
      setIsOpen(defaultIsOpen);
    }
  }, [defaultIsOpen, isOpen]);

  return (
    <section data-cy={`section-${title}`} data-replay-id={`section-${title}`}>
      {showTopBorder && <TopBorder className="t--collapse-top-border" />}
      {showSection && (
        <SectionContainer
          className="t--collapse-section-container"
          onClick={() => setIsOpen(!isOpen)}
        >
          <SectionLabel>
            {title}
            {headerIcon && (
              <AdsIcon
                fillColor={headerIcon.color}
                name={headerIcon.name}
                size={IconSize.MEDIUM}
              />
            )}
          </SectionLabel>
          <Icon
            icon={isOpen ? "chevron-up" : "chevron-down"}
            iconSize={16}
            style={{ color: "#2E3D49" }}
          />
        </SectionContainer>
      )}

      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </section>
  );
}

export default Collapsible;
