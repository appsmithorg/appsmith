import {
  addOnboardingWidget,
  enableGuidedTour,
  markStepComplete,
  setCurrentStep,
  setIndicatorLocation,
  setUpTourApp,
  tableWidgetWasSelected,
  toggleLoader,
} from "actions/onboardingActions";
import Button from "components/ads/Button";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { isArray } from "lodash";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-tick-mark.json";
import {
  buttonWidgetHasOnClickBinding,
  buttonWidgetHasOnSuccessBinding,
  containerWidgetAdded,
  doesButtonWidgetHaveText,
  getCurrentStep,
  getGuidedTourDatasource,
  getHadReachedStep,
  getQueryAction,
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
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
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
  margin-bottom: 10px;
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border-bottom: 1px solid #eeeeee;
  flex-direction: column;
  background: #fafafa;
`;

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.24px;
  line-height: 20px;
  color: #000000;
`;

const StepCount = styled.div`
  background: #090707;
  color: white;
  ${(props) => getTypographyByKey(props, "h5")};
  height: 24px;
  width: 24px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 16px;
  line-height: 19px;

  letter-spacing: -0.24px;
  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0px")};
  margin-top: 9px;
  flex: 1;
  display: flex;
`;

const UpperContent = styled.div`
  padding: 20px 16px;
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
  height: 38px;
  ${(props) => getTypographyByKey(props, "btnMedium")};
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Hint = styled.div`
  background: #ffffff;
  padding: 19px 24px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  border: 1px solid #716e6e;
  box-shadow: 0px 0px 24px -4px rgba(16, 24, 40, 0.1),
    0px 8px 8px -4px rgba(16, 24, 40, 0.04);

  .align-vertical {
    flex-direction: column;
  }

  .inner-wrapper {
    display: flex;
    flex-direction: row;
  }

  .hint-text {
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
    opacity: 0.5;
  }

  .hint-steps-text {
    margin-left: 10px;
  }
`;

const SuccessMessageWrapper = styled.div`
  display: flex;
  padding: 26px 19px;
  background: white;
  border: 1px solid #716e6e;
  box-shadow: 0px 0px 24px -4px rgba(16, 24, 40, 0.1),
    0px 8px 8px -4px rgba(16, 24, 40, 0.04);
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
    line-height: 24px;
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
    text: ReactNode;
    button?: {
      text: string;
    };
    steps?: ReactNode[];
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
    title: `First step is querying the database. Here we are querying a Postgres database populated with customers data.`,
    hints: [
      {
        text: (
          <>
            <b>Edit</b> the getCustomers query below to fetch data. Replace the{" "}
            <b>limit</b> {`"20"`} with {`"10"`}.
          </>
        ),
      },
      {
        text: (
          <>
            Now hit the <b>RUN</b> button to see the response.
          </>
        ),
      },
    ],
  },
  2: {
    title:
      "Let’s display this response in a table. Select the table widget we’ve added for you.",
    hints: [
      {
        text: (
          <>
            <b>Click</b> and <b>select the CustomersTable</b> in the entity
            explorer.
          </>
        ),
      },
    ],
  },
  3: {
    title: "Display response of a query in a table.",
    hints: [
      {
        text: (
          <>
            Bind the response by typing{" "}
            <b>
              &#123;&#123;
              {"getCustomers.data"}&#125;&#125;
            </b>{" "}
            in the Table Data input field on the right pane.
          </>
        ),
      },
    ],
    success: {
      text:
        "Great job! The table is now displaying the response of a query. You can use {{ }} in any input field to bind data to widgets.",
      onClick: () => null,
    },
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          The pane on the right is called the <b>Property Pane</b>. Here you can
          modify properties, data, or styling for every widget.
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
    title: "Let’s build a form to update a customer record ",
    hints: [
      {
        text: (
          <>
            We{"'"}ll{" "}
            <b>
              display the data from a table{"'"}s selected row inside an input
              field.
            </b>
            <br /> This will let us see the data before we update it.
          </>
        ),
        button: {
          text: "START CONNECTING OTHER INPUT",
        },
      },
      {
        text: (
          <>
            In the property pane of Name input, Replace the whole{" "}
            <b>Default Text</b> property with{" "}
            <b>&#123;&#123;CustomersTable.selectedrow.name&#125;&#125;</b>
          </>
        ),
      },
    ],
  },
  5: {
    title: "Connect all input fields in the Customer Update Form with table",
    hints: [
      {
        text: (
          <>
            Now let{"'"}s connect rest of widgets in the container to Table{"'"}
            s selected row
          </>
        ),
        steps: [
          <>
            Connect <b>{`"Email Input"`}</b>
            {"'"}s Default Text Property to
            &#123;&#123;CustomersTable.selectedrow.email&#125;&#125;
          </>,
          <>
            Connect <b>{`"Country Input"`}</b>
            {"'"}s Default Text Property to
            &#123;&#123;CustomersTable.selectedrow.country&#125;&#125;
          </>,
          <>
            Connect <b>{`"Display Image"`}</b>
            {"'"}s Image Property to
            &#123;&#123;CustomersTable.selectedrow.image&#125;&#125;
          </>,
        ],
      },
    ],
    success: {
      text:
        "Awesome! You connected the input widget to table’s selected row. The input will always show the data from the selected row.",
      onClick: () => null,
    },
  },
  6: {
    title: "Add an update button to trigger an update query",
    hints: [
      {
        text: (
          <>
            Switch to the widget pane and then <b>Drag {"&"} Drop</b> a Button
            widget into the left bottom of container, below the image. Update
            the label of the button to <i>Update info</i>
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
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          To <b>update the customers</b> through the button, we created
          <b>updateCustomerInfo query</b> for you which is ready to use
        </>
      ),
      onClick: () => null,
    },
  },
  7: {
    title: "Trigger updateCustomerInfo query by binding to the button widget",
    hints: [
      {
        text: (
          <>
            Select the button widget to see the properties in the propety pane.
            From the onClick dropdown, select <b>Execute a query</b> {"&"} then
            select <b>updateCustomer</b> query
          </>
        ),
      },
    ],
  },
  8: {
    title:
      "After successfully triggering the update query, fetch the updated customer data. ",
    hints: [
      {
        text: (
          <>
            Click the onSuccess dropdown, select <b>Execute a query</b> {"&"}{" "}
            then choose <b>getCustomers</b> Query
          </>
        ),
      },
    ],
    success: {
      text:
        "Exceptional work! You’ve now built a way to see customer data and update it.",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(8));
      },
    },
  },
  9: {
    title: "Final step: Test & deploy your app",
    hints: [
      {
        text: (
          <>
            Test your app and ensure there are no errors. When you are ready,
            click <b>Deploy</b> to deploy this app to a URL.
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
          <Title>
            In this tutorial we’ll build a tool to display customer information
          </Title>
          <Description>
            This tool has a table that displays customer data and a form to
            update a particular customer record. Try out the tool below before
            you start building this.
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
        <span className="hint-text">
          The app is connected to a Postgres database with customers data called{" "}
          <b>Customers DB</b>.
        </span>
      </Hint>
    </div>
  );
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
  // 6
  const buttonWidgetonClickBinding = useSelector(buttonWidgetHasOnClickBinding);
  // 7
  const buttonWidgetSuccessBinding = useSelector(
    buttonWidgetHasOnSuccessBinding,
  );
  // 8
  const isDeployed = useSelector(getApplicationLastDeployedAt);

  if (step === 1) {
    if (queryLimitUpdated && queryExecutedSuccessfully) {
      step = 2;
    }
  }

  if (step === 2) {
    if (tableWidgetSelected) {
      step = 3;
    }
  }

  if (step === 3) {
    if (isTableWidgetBound && isContainerWidgetPreset && hadReachedStep > 3) {
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
    if (buttonWidgetPresent && buttonWidgetHasText && hadReachedStep > 5) {
      step = 6;
    }
  }

  if (step === 6) {
    if (buttonWidgetonClickBinding) {
      step = 7;
    }
  }

  if (step === 7) {
    if (buttonWidgetSuccessBinding && hadReachedStep > 7) {
      step = 8;
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
    if (step === 1 && hadReachedStep <= 1) {
      if (!queryLimitUpdated) {
        dispatch(setIndicatorLocation("QUERY_EDITOR"));
      } else if (queryExecutedSuccessfully) {
        dispatch(setIndicatorLocation("NONE"));
      } else {
        dispatch(setIndicatorLocation("RUN_QUERY"));
      }
    }
  }, [queryExecutedSuccessfully, queryLimitUpdated, step, hadReachedStep]);

  useEffect(() => {
    if (tableWidgetSelected && step === 3 && hadReachedStep <= 3) {
      dispatch(tableWidgetWasSelected(true));
      dispatch(setIndicatorLocation("PROPERTY_CONTROL"));
    }
  }, [step, tableWidgetSelected]);

  useEffect(() => {
    if (isTableWidgetBound && step === 3 && hadReachedStep <= 3) {
      dispatch(setIndicatorLocation("NONE"));
      dispatch(markStepComplete());
    }
  }, [isTableWidgetBound, step, hadReachedStep]);

  useEffect(() => {
    if (step === 4 && completedSubSteps.length === 3) {
      dispatch(markStepComplete());
    }
  }, [step, completedSubSteps.length]);

  useEffect(() => {
    if (step === 5 && hadReachedStep <= 5) {
      if (buttonWidgetPresent) {
        dispatch(setIndicatorLocation("NONE"));
        if (buttonWidgetHasText) {
          dispatch(markStepComplete());
        }
      }
    }
  }, [step, buttonWidgetPresent, buttonWidgetHasText]);

  useEffect(() => {
    if (step === 6 && hadReachedStep <= 6) {
      if (buttonWidgetonClickBinding) {
        dispatch(setIndicatorLocation("ACTION_CREATOR"));
      }
    }
  }, [step, buttonWidgetonClickBinding, hadReachedStep]);

  useEffect(() => {
    if (step === 7) {
      if (buttonWidgetSuccessBinding) {
        dispatch(markStepComplete());
        dispatch(setIndicatorLocation("NONE"));
      }
    }
  }, [step, buttonWidgetSuccessBinding]);

  useEffect(() => {
    if (step === 8) {
      if (isDeployed) {
        dispatch(enableGuidedTour(false));
      }
    }
  }, [step, isDeployed]);

  return completedSubSteps;
}

function GuideStepsContent(props: {
  currentStep: number;
  completedSubSteps: number[];
}) {
  const content = Steps[props.currentStep];
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
          <TitleWrapper>
            <StepCount>{props.currentStep}</StepCount>
            <Title>{content.title}</Title>
          </TitleWrapper>
          {content.description && (
            <Description>{content.description}</Description>
          )}
        </SubContentWrapper>
      </ContentWrapper>
      <Hint>
        <div className="hint-text">
          <span>{currentHint.text}</span>

          {isArray(hintSteps) &&
            hintSteps.length &&
            hintSteps.map((step, index) => {
              const completed = props.completedSubSteps.includes(index);
              const className = "hint-steps" + (completed ? " strike" : "");

              return (
                <div className={className} key={step?.toString()}>
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
            text={"CONTINUE"}
          />
        </div>
      </SuccessMessageWrapper>
    );
  } else {
    return (
      <SuccessMessageWrapper>
        <Icon fillColor="#F86A2B" name={info?.icon} size={IconSize.XXXXL} />

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
