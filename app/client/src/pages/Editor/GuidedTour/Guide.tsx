import {
  addOnboardingWidget,
  markStepComplete,
  setCurrentStep,
  setIndicatorLocation,
  setUpTourApp,
  tableWidgetWasSelected,
  toggleLoader,
} from "actions/onboardingActions";
import Button from "components/ads/Button";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { get, set, isArray } from "lodash";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-tick-mark.json";
import {
  containerWidgetAdded,
  doesButtonWidgetHaveText,
  getCurrentStep,
  getGuidedTourDatasource,
  getHadReachedStep,
  getQueryAction,
  getQueryName,
  getTableName,
  getTableWidget,
  isButtonWidgetPresent,
  isCountryInputBound,
  isEmailInputBound,
  isExploringSelector,
  isImageWidgetBound,
  isQueryExecutionSuccessful,
  isQueryLimitUpdated,
  isTableWidgetSelected,
  loading,
  showSuccessMessage,
  tableWidgetHasBinding,
} from "selectors/onboardingSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Dispatch } from "redux";
import { onboardingContainerBlueprint } from "./constants";

const Wrapper = styled.div`
  display: inline-flex;
  gap: 2px;
  height: 5px;
  width: 100%;
`;

const ProgressBar = styled.div<{ done: boolean }>`
  flex: 1;
  height: 100%;
  background-color: #e8e8e8;
  background: linear-gradient(to left, #e8e8e8 50%, #f86a2b 50%) right;
  background-size: 200% 100%;
  transition: 0.3s ease-out;

  ${(props) => props.done && `background-position: left`}
`;

const GuideWrapper = styled.div`
  margin-top: 17px;
  margin-left: 36px;
  margin-right: 36px;
  margin-bottom: 10px;

  &.query-page {
    margin-left: 20px;
    margin-right: 20px;
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border: 1px solid #f0f0f0;
  border-top-width: 0px;
  box-shadow: 0px 0px 16px -4px rgba(16, 24, 40, 0.1),
    0px 0px 6px -2px rgba(16, 24, 40, 0.05);
  flex-direction: column;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.24px;
  line-height: 20px;
  color: #000000;
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 16px;
  line-height: 19px;
  letter-spacing: -0.24px;
  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0px")};
  margin-top: 13px;
  flex: 1;
  display: flex;
`;

const UpperContent = styled.div`
  padding: 19px 24px 16px 15px;
  flex-direction: column;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 50px;
  align-items: center;
`;

const GuideButton = styled(Button)`
  padding: ${(props) => props.theme.spaces[0]}px
    ${(props) => props.theme.spaces[6]}px;
  height: 30px;
  ${(props) => getTypographyByKey(props, "btnMedium")};
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const IconWrapper = styled.div<{ backgroundColor?: string }>`
  background-color: ${(props) =>
    props.backgroundColor ? props.backgroundColor : "#ffffff"};
  padding: 8px;
  border-radius: 4px;
  align-self: baseline;
`;

const Hint = styled.div`
  background-color: #feede5;
  padding: 17px 15px;
  margin-top: 18px;
  display: flex;
  align-items: center;

  .align-vertical {
    flex-direction: column;
  }

  .inner-wrapper {
    display: flex;
    flex-direction: row;
  }

  .hint-text {
    padding-left: 15px;
    font-size: 16px;
  }

  .hint-button {
    margin-top: 14px;
  }

  .hint-steps {
    display: flex;
    margin-top: 12px;
  }

  .strike {
    text-decoration: line-through;
  }

  .hint-steps-text {
    margin-left: 10px;
  }
`;

const SuccessMessageWrapper = styled.div`
  display: flex;
  align-items: center;
  .lottie-wrapper {
    height: 77px;
    weight: 77px;
  }
  .title-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }
  .info {
    padding-left: 15px;
    display: block;
    padding-right: 65px;
    margin-top: 0px;
  }
`;

function StatusBar(props: any) {
  return (
    <Wrapper>
      <ProgressBar done={props.currentStep > 1} />
      <ProgressBar done={props.currentStep > 2} />
      <ProgressBar done={props.currentStep > 3} />
      <ProgressBar done={props.currentStep > 4} />
      <ProgressBar done={props.currentStep > 5} />
      <ProgressBar done={props.currentStep > 6} />
      <ProgressBar done={props.currentStep > 7} />
    </Wrapper>
  );
}

type Step = {
  title: string;
  description?: string;
  hints: {
    icon: IconName;
    text: ReactNode;
    button?: {
      text: string;
    };
    steps?: string[];
  }[];
  success?: {
    text: string;
    onClick: (dispatch: Dispatch<any>) => void;
  };
  info?: {
    icon: IconName;
    text: ReactNode;
    onClick: (dispatch: Dispatch<any>) => void;
  };
};
type StepsType = Record<number, Step>;
const Steps: StepsType = {
  1: {
    title: `1. Edit & Run the <query> query to fetch customers data`,
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            Edit the <b>limit</b> {"100"} with {"10"} and then Hit <b>Run</b>{" "}
            button to see response
          </>
        ),
      },
    ],
  },
  2: {
    title: "2. Go to the <table> table to connect it to the customers data",
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            <b>Click on the table</b> on the left in the explorer
          </>
        ),
      },
    ],
  },
  3: {
    title: "3. Connect the Table with Customers data",
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            Replace the whole <b>Table Data</b> property with{" "}
            <b>
              &#123;&#123;
              {"getCustomers.data"}&#125;&#125;
            </b>{" "}
            on the right pane
          </>
        ),
      },
    ],
    success: {
      text: "Great! The table widget is now connected with the customers data",
      onClick: () => null,
    },
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          You can witness the pane on right called <b>Property Pane</b>, which
          not only contains Table Data but many other properties for respective
          widgets.
        </>
      ),
      onClick: (dispatch) => {
        dispatch(setCurrentStep(4));
        dispatch(
          addOnboardingWidget({
            type: "CONTAINER_WIDGET",
            widgetName: "CustomersInfo",
            props: {
              blueprint: onboardingContainerBlueprint,
            },
            bottomRow: 100,
            rightColumn: 64,
            columns: 30,
            leftColumn: 34,
            topRow: 7,
            parentColumnSpace: 18,
            parentRowSpace: 0,
          }),
        );
      },
    },
  },
  4: {
    title:
      "4. Connect all the input fields in the customer update form with the table",
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            On <b>selection of any row</b> in the table, the input fields in the
            form should show the selected {"row's"} name, email, country and
            image.
            <br />
            <b>NameInput</b> below is already connected with the selected row by
            replacing default text with{" "}
            <b>&#123;&#123;CustomersTable.selectedRow.name&#125;&#125;</b>
          </>
        ),
        button: {
          text: "START CONNECTING OTHER INPUT",
        },
      },
      {
        icon: "edit-box-line",
        text: (
          <>
            In the Property pane replace the value of <b>Default Text</b>{" "}
            property for
          </>
        ),
        steps: [
          "For Email, with {{CustomersTable.selectedRow.email}}",
          "For Country, with {{CustomersTable.selectedRow.country}}",
          "For Image, with {{CustomersTable.selectedRow.image}}",
        ],
      },
    ],
    success: {
      text: "There you go! All inputs are connected with the selected row",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(5));
      },
    },
  },
  5: {
    title: "5. Create Update button to update the customer inputs",
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            <b>Drag {"&"} Drop</b> a Button widget into the left bottom of
            container, below the image. Update the label of the button to{" "}
            <i>Click to update info</i>
          </>
        ),
      },
    ],
    success: {
      text: "Perfect! Your update button is created and ready to go",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(6));
      },
    },
  },
  6: {
    title: "6. Trigger updateCustomer query by binding to the button widget",
    hints: [
      {
        icon: "edit-box-line",
        text: (
          <>
            From onClick dropdown, select <b>Execute a query</b> {"&"} then
            select
            <b>updateCustomer</b> query
          </>
        ),
      },
    ],
  },
};

function InitialContent() {
  const dispatch = useDispatch();
  const isLoading = useSelector(loading);

  const setupFirstStep = () => {
    dispatch(toggleLoader(true));
    dispatch(setUpTourApp());
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Title>Let’s Build a Customer Support App</Title>
          <Description>
            Below is the customer support app that we will end up building
            through this welcome tour. Check it out and play with it before we
            start the tour.
          </Description>
        </SubContentWrapper>
        <GuideButton
          isLoading={isLoading}
          onClick={setupFirstStep}
          tag="button"
          text="Start Building"
        />
      </ContentWrapper>
      <Hint>
        <IconWrapper>
          <Icon
            fillColor="#F86A2B"
            name="database-2-line"
            size={IconSize.XXL}
          />
        </IconWrapper>
        <span className="hint-text">
          Don’t worry about the Database, We got you. The app is connected to
          Mock DB by default.
        </span>
      </Hint>
    </div>
  );
}

function replacePlaceholders(
  step: number,
  fields: string[],
  substitutionMap: Record<string, string>,
) {
  const stepContent = { ...Steps[step] };
  const re = new RegExp(Object.keys(substitutionMap).join("|"), "gi");

  fields.map((field: string) => {
    let str = get(stepContent, field);
    if (str && typeof str === "string") {
      str = str.replace(re, function(matched) {
        return substitutionMap[matched];
      });

      set(stepContent, field, str);
    }
  });

  return stepContent;
}

function useUpdateName(step: number): Step {
  const queryName = useSelector(getQueryName);
  const tableName = useSelector(getTableName);

  const substitutionMap = {
    "<query>": queryName,
    "<table>": tableName,
  };

  return replacePlaceholders(step, ["title"], substitutionMap);
}

function useComputeCurrentStep(isExploring: boolean) {
  let step = 1;
  const completedSubSteps = [];
  const dispatch = useDispatch();
  const datasource = useSelector(getGuidedTourDatasource);
  const query = useSelector(getQueryAction);
  const tableWidget = useSelector(getTableWidget);
  const hadReachedStep = useSelector(getHadReachedStep);
  // 1
  const queryLimitUpdated = useSelector(isQueryLimitUpdated);
  const queryExecutedSuccessfully = useSelector(isQueryExecutionSuccessful);
  // 2
  const tableWidgetSelected = useSelector(isTableWidgetSelected);
  // 3
  const isTableWidgetBound = useSelector(tableWidgetHasBinding);
  // 4
  const isContainerWidgetPreset = useSelector(containerWidgetAdded);
  const countryInputBound = useSelector(isCountryInputBound);
  const emailInputBound = useSelector(isEmailInputBound);
  const imageWidgetBound = useSelector(isImageWidgetBound);
  // 5
  const buttonWidgetPresent = useSelector(isButtonWidgetPresent);
  const buttonWidgetHasText = useSelector(doesButtonWidgetHaveText);

  if (step === 1) {
    if (queryExecutedSuccessfully) {
      step = 2;
    }
  }

  if (step === 2) {
    if (tableWidgetSelected) {
      step = 3;
    }
  }

  if (step === 3) {
    if (isContainerWidgetPreset && hadReachedStep > 3) {
      step = 4;
    }
  }

  if (step === 4) {
    if (emailInputBound) {
      completedSubSteps.push(0);
    }
    if (countryInputBound) {
      completedSubSteps.push(1);
    }
    if (imageWidgetBound) {
      completedSubSteps.push(2);
    }

    if (completedSubSteps.length === 3 && hadReachedStep > 4) {
      step = 5;
    }
  }

  if (step === 5) {
    if (buttonWidgetPresent && hadReachedStep > 5) {
      step = 6;
    }
  }

  useEffect(() => {
    if (datasource?.id) {
      dispatch({
        type: "SET_DATASOURCE_ID",
        payload: datasource.id,
      });
    }
  }, [datasource]);

  useEffect(() => {
    if (query) {
      dispatch({
        type: "SET_QUERY_ID",
        payload: query.config.id,
      });
    }
  }, [query]);

  useEffect(() => {
    if (tableWidget) {
      dispatch({
        type: "SET_TABLE_WIDGET_ID",
        payload: tableWidget?.widgetId,
      });
    }
  }, [tableWidget]);

  useEffect(() => {
    if (!isExploring) {
      dispatch({
        type: "SET_CURRENT_STEP",
        payload: step,
      });
    }
  }, [isExploring, step]);
  useEffect(() => {
    if (step === 1) {
      // if (queryLimitUpdated) {
      //   dispatch({
      //     type: "SET_INDICATOR_LOCATION",
      //     payload: "RUN_QUERY",
      //   });
      // } else {
      //   dispatch(setIndicatorLocation("QUERY_EDITOR"));
      // }
    }
  }, [queryLimitUpdated, step]);

  useEffect(() => {
    if (tableWidgetSelected) {
      dispatch(tableWidgetWasSelected(true));
    }
  }, [tableWidgetSelected]);

  useEffect(() => {
    if (isTableWidgetBound && step === 3) {
      dispatch(markStepComplete());
    }
  }, [isTableWidgetBound, step]);

  useEffect(() => {
    if (step === 4 && completedSubSteps.length === 3) {
      dispatch(markStepComplete());
    }
  }, [step, completedSubSteps.length]);

  useEffect(() => {
    if (step === 5) {
      if (buttonWidgetPresent) {
        if (buttonWidgetHasText) {
          dispatch(markStepComplete());
        }
      }
    }
  }, [step, buttonWidgetPresent, buttonWidgetHasText]);

  return completedSubSteps;
}

function GuideStepsContent(props: {
  currentStep: number;
  completedSubSteps: number[];
}) {
  const content = useUpdateName(props.currentStep);
  const [hintCount, setHintCount] = useState(0);
  const currentHint = content.hints[hintCount]
    ? content.hints[hintCount]
    : content.hints[0];

  useEffect(() => {
    setHintCount(0);
  }, [props.currentStep]);

  const hintSteps = currentHint.steps;

  const hintButtonOnClick = () => {
    setHintCount((count) => count + 1);
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Title>{content.title}</Title>
          {content.description && (
            <Description>{content.description}</Description>
          )}
        </SubContentWrapper>
      </ContentWrapper>
      <Hint>
        <IconWrapper>
          <Icon
            fillColor="#F86A2B"
            name={currentHint.icon}
            size={IconSize.XXL}
          />
        </IconWrapper>
        <div className="hint-text">
          <span>{currentHint.text}</span>

          {isArray(hintSteps) &&
            hintSteps.length &&
            hintSteps.map((step, index) => {
              const completed = props.completedSubSteps.includes(index);
              const className = "hint-steps" + (completed ? " strike" : "");

              return (
                <div className={className} key={step}>
                  <Icon
                    fillColor={completed ? "#03B365" : "#716E6E"}
                    name={completed ? "oval-check-fill" : "oval-check"}
                    size={IconSize.XXL}
                  />
                  <span className="hint-steps-text">{hintSteps[index]}</span>
                </div>
              );
            })}
          {currentHint.button && (
            <GuideButton
              className="hint-button"
              onClick={hintButtonOnClick}
              tag="button"
              text={currentHint.button?.text}
            />
          )}
        </div>
      </Hint>
    </div>
  );
}

type CompletionContentProps = {
  step: number;
};

function CompletionContent(props: CompletionContentProps) {
  const [showSuccess, setShowSuccess] = useState(true);
  const info = Steps[props.step].info;
  const success = Steps[props.step].success;
  const dispatch = useDispatch();

  const tickMarkRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: AnimationItem;
    if (showSuccess) {
      anim = lottie.loadAnimation({
        animationData: indicator,
        autoplay: true,
        container: tickMarkRef?.current as HTMLDivElement,
        renderer: "svg",
        loop: false,
      });
    }

    return () => {
      anim?.destroy();
    };
  }, [tickMarkRef?.current, showSuccess]);

  const onSuccessButtonClick = () => {
    setShowSuccess(false);
    success?.onClick(dispatch);
  };

  const onInfoButtonClick = () => {
    info?.onClick(dispatch);
  };

  if (showSuccess) {
    return (
      <SuccessMessageWrapper>
        <div className="lottie-wrapper" ref={tickMarkRef} />
        <div className="title-wrapper">
          <Title>{Steps[props.step].success?.text}</Title>
          <GuideButton
            onClick={onSuccessButtonClick}
            tag="button"
            text={info ? "CONTINUE" : "PROCEED TO NEXT STEP"}
          />
        </div>
      </SuccessMessageWrapper>
    );
  } else {
    return (
      <SuccessMessageWrapper>
        <IconWrapper backgroundColor="#FEEDE5">
          <Icon fillColor="#F86A2B" name={info?.icon} size={IconSize.XXL} />
        </IconWrapper>
        <Description className="info">{info?.text}</Description>
        <GuideButton
          onClick={onInfoButtonClick}
          tag="button"
          text="PROCEED TO NEXT STEP"
        />
      </SuccessMessageWrapper>
    );
  }
}

type GuideBody = {
  exploring: boolean;
  step: number;
  completedSubSteps: number[];
};

function GuideBody(props: GuideBody) {
  const successMessage = useSelector(showSuccessMessage);

  if (props.exploring) {
    return <InitialContent />;
  } else if (successMessage) {
    return <CompletionContent step={props.step} />;
  } else {
    return (
      <GuideStepsContent
        completedSubSteps={props.completedSubSteps}
        currentStep={props.step}
      />
    );
  }
}

type GuideProps = {
  className?: string;
};
// Guided tour steps
function Guide(props: GuideProps) {
  const exploring = useSelector(isExploringSelector);
  const completedSubSteps = useComputeCurrentStep(exploring);
  const step = useSelector(getCurrentStep);

  return (
    <GuideWrapper className={props.className}>
      <CardWrapper>
        {!exploring && <StatusBar currentStep={step} totalSteps={6} />}
        <UpperContent>
          <GuideBody
            completedSubSteps={completedSubSteps}
            exploring={exploring}
            step={step}
          />
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
