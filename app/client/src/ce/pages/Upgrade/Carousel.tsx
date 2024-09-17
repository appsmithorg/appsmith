import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { Icon, Text } from "@appsmith/ads";
import type { CarouselProps } from "./types";

const CarouselContainer = styled.div`
  display: flex;
  flex: 1 1;
  gap: 64px;
  justify-content: center;
  align-items: flex-start;
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
      height: max-content;
      cursor: pointer;

      .icon-container {
        margin-top: 4px;
        svg path {
          fill: var(--ads-v2-color-fg-emphasis);
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
            span {
              color: var(--ads-v2-color-fg-muted);
            }
          }

          & .trigger-details-container {
            .detail-content {
              color: var(--ads-v2-color-fg);

              span {
                color: var(--ads-v2-color-fg-brand);
                font-weight: 500;
              }
            }
          }
        }
      }

      &.active {
        height: max-content;
        box-shadow:
          0 2px 4px -2px rgba(0, 0, 0, 0.06),
          0 4px 8px -2px rgba(0, 0, 0, 0.1);

        background-color: var(--ads-v2-color-bg);
        border-radius: var(--ads-v2-border-radius);

        & .icon-container svg path {
          fill: var(--ads-v2-color-fg-brand);
        }

        & .trigger {
          & .trigger-content {
            & .trigger-heading {
              span {
                color: var(--ads-v2-color-fg-emphasis);
              }
            }
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
                <Icon name={d.icon} size="lg" />
              </div>
              <div className="trigger-content">
                <div className="trigger-heading">
                  <Text
                    color="var(--ads-v2-color-fg-emphasis)"
                    kind="heading-m"
                    renderAs="h1"
                  >
                    {d.heading}
                  </Text>
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
                            <span
                              className="detail-content"
                              dangerouslySetInnerHTML={{ __html: detail }}
                            />
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
