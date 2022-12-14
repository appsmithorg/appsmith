import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { Icon, IconSize, Text, TextType } from "design-system";
import { CarouselProps } from "./types";

const CarouselContainer = styled.div`
  display: flex;
  flex: 1 1;
  gap: 64px;
  justify-content: center;
  align-items: center;
  padding: 16px 52px;

  & .carousel-triggers {
    display: flex;
    flex-direction: column;
    gap: 20px;
    justify-content: center;
    align-items: center;
    width: 50%;
    max-width: 420px;

    & .carousel-trigger {
      padding: 16px;
      width: 100%;
      height: 56px;
      cursor: pointer;

      &.active {
        height: max-content;
        min-height: 156px;
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
        }
      }
    }

    & .carousel-targets {
      width: auto;
      height: auto;
    }
  }

  & .carousel-targets {
    width: 600px;
    min-height: 400px;
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
  const [targetContent, setTargetContent] = useState(null);
  const { design, targets, triggers } = props;
  useEffect(() => {
    setTargetContent(targets[active]);
  }, [active]);

  const isActive = (i: number) => i === active;
  const targetsComponent = (
    <div
      className={`carousel-targets ${design}`}
      data-testid="t--carousel-targets"
    >
      {targetContent}
    </div>
  );
  const triggersComponent = (
    <div
      className={`carousel-triggers ${design}`}
      data-testid="t--carousel-triggers"
    >
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
                  <>
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
                    {design === "trigger-contains-target" && (
                      <div>{targetsComponent}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  let display = (
    <>
      {triggersComponent}
      {targetsComponent}
    </>
  );
  switch (design) {
    case "no-target":
      display = triggersComponent;
      break;
    case "trigger-contains-target":
      display = triggersComponent;
      break;
    case "split-right-trigger":
      display = (
        <>
          {targetsComponent}
          {triggersComponent}
        </>
      );
      break;
  }

  return (
    <CarouselContainer
      className="upgrade-page-carousel-container"
      data-testid="t--upgrade-page-carousel-container"
    >
      {display}
    </CarouselContainer>
  );
}
