import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { Icon, IconSize, Text, TextType } from "design-system";
import { CarouselProps } from "./types";

const CarouselContainer = styled.div`
  flex-grow: 1;
  gap: 64px;
  margin-bottom: 86px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 542px;

  & .carousel-left {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    gap: 20px;
    justify-content: center;
    align-items: center;
    width: 50%;

    & .carousel-trigger {
      padding: 16px;
      width: 384px;
      height: 56px;
      cursor: pointer;

      &.active {
        height: max-content;
        min-height: 152px;
        box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
          0 4px 8px -2px rgba(0, 0, 0, 0.1);

        background-color: var(--ads-color-black-0);

        & .icon-container .cs-icon svg {
          fill: var(--ads-color-orange-500);
        }
      }

      & .trigger {
        display: flex;
        gap: 16px;
        align-items: flex-start;

        & .trigger-content {
          display: flex;
          gap: 16px;
          flex-direction: column;
          align-content: flex-start;

          & .trigger-heading {
            /* This is a hack to bring text up,
             * and thus meet the design expectations.
             */
            margin-top: -2px;
          }

          & .trigger-details-container {
            width: 290px;
          }
        }
      }
    }
  }

  & .carousel-right {
    width: 680px;
    height: 472px;
    display: flex;
    justify-content: center;
    align-items: center;

    & img {
      height: inherit;
      width: inherit;
    }
  }
`;

export function CarouselComponent(props: CarouselProps) {
  const [active, setActive] = useState(0);
  const [rightContent, setRightContent] = useState(null);
  const { targets, triggers } = props;
  useEffect(() => {
    setRightContent(targets[active]);
  }, [active]);

  const isActive = (i: number) => i === active;

  return (
    <CarouselContainer
      className="upgrade-page-carousel-container"
      data-testid="t--upgrade-page-carousel-container"
    >
      <div className="carousel-left" data-testid="t--carousel-left">
        {triggers.map((d, i) => {
          return (
            <div
              className={`carousel-item-container carousel-trigger ${
                isActive(i) ? "active" : ""
              }`}
              key={`carousel-item-${i}`}
              onClick={() => setActive(i)}
              role="button"
            >
              <div className={"trigger"}>
                <div className="icon-container">
                  <Icon name={d.icon} size={IconSize.XXXXL} />
                </div>
                <div className="trigger-content">
                  <div className="trigger-heading">
                    <Text type={TextType.H1}>{d.heading}</Text>
                  </div>
                  {isActive(i) && (
                    <div className="trigger-details-container">
                      {d.details.map((detail, di) => {
                        return (
                          <div
                            className={"expanded"}
                            key={`trigger-detail-${di}`}
                          >
                            <Text type={TextType.P1}>{detail}</Text>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="carousel-right" data-testid="t--carousel-right">
        {rightContent}
      </div>
    </CarouselContainer>
  );
}
