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
  isNameInputBoundSelector,
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
import TableData from "./table-data.png";

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

const RunButton = styled.div`
  background-color: #f86a2b;
  padding: 5px 15px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
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

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
  }
  .count {
    font-size: 14px;
    font-weight: 600;
    width: 105px;

    .complete {
      font-weight: 400;
    }
  }
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
    flex: 1;
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

const HintTextWrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SuccessMessageWrapper = styled.div`
  display: flex;
  background: white;
  flex-direction: column;
  border: 1px solid #716e6e;
  box-shadow: 0px 0px 24px -4px rgba(16, 24, 40, 0.1),
    0px 8px 8px -4px rgba(16, 24, 40, 0.04);

  .wrapper {
    padding: 6px 24px;
    display: flex;
  }
  .info-wrapper {
    padding: 26px 36px;
    align-items: center;
  }

  .lottie-wrapper {
    height: 59px;
    weight: 59px;
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

const ProgressBar = styled.div`
  height: 7px;
  position: relative;
  background: #e5edfd;
  width: 100%;
  .progress {
    height: 100%;
    width: 100%;
    background-color: #5a92f9;
    animation: progressBar 5s linear;
  }

  @keyframes progressBar {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
`;

type Step = {
  title: string;
  description?: string;
  hints: {
    text: ReactNode;
    image?: string;
    button?: {
      text: string;
    };
    steps?: ReactNode[];
  }[];
  success?: {
    text: string;
    onClick?: (dispatch: Dispatch<any>) => void;
    timed?: boolean;
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
            Now hit the <RunButton>RUN</RunButton> button to see the response.
          </>
        ),
      },
    ],
    success: {
      text:
        "Excellent! You successfully queried the database and you can see the response of the query below. ",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(2));
      },
    },
  },
  2: {
    title:
      "Let’s display this response in a table. Select the table widget we’ve added for you.",
    hints: [
      {
        text: (
          <>
            <b>Click on the CustomersTable widget</b> in the explorer on the
            left.
          </>
        ),
      },
    ],
  },
  3: {
    title: "Display the response of the query in a table.",
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
        image: TableData,
      },
    ],
    success: {
      text:
        "Great job! The table is now displaying the response of a query. You can use {{ }} in any input field to bind data to widgets.",
      onClick: () => null,
      timed: true,
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
          text: "PROCEED TO NEXT STEP",
        },
        image: TableData,
      },
      {
        text: (
          <>
            In the property pane of Name input, add the{" "}
            <b>&#123;&#123;CustomersTable.selectedrow.name&#125;&#125;</b>{" "}
            binding to the <b>Default Text</b> property
          </>
        ),
      },
    ],
    success: {
      text:
        "Awesome! You connected the input widget to table’s selected row. The input will always show the data from the selected row.",
      timed: true,
      onClick: (dispatch) => {
        dispatch(setCurrentStep(5));
      },
    },
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
        "Great work! All inputs are now connected to the  table’s selected row",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(6));
      },
    },
  },
  6: {
    title: "Add an update button to trigger an update query",
    hints: [
      {
        text: (
          <>
            Switch to the widget pane and then <b>Drag {"&"} Drop</b> a{" "}
            <b>Button</b> widget into the left bottom of container, below the
            image. Update the label of the button to <i>Update info</i>
          </>
        ),
      },
    ],
    success: {
      text: "Perfect! Your update button is ready to trigger an update query.",
      timed: true,
    },
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          To <b>update the customers</b> through the button, we created an{" "}
          <b>updateCustomerInfo query</b> for you which is ready to use
        </>
      ),
      onClick: (dispatch) => {
        dispatch(setCurrentStep(7));
      },
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
        dispatch(setCurrentStep(9));
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
  const meta = {
    completedSubSteps: [] as number[],
    hintCount: 0,
  };
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
  const isNameInputBound = useSelector(isNameInputBoundSelector);
  // 5
  const countryInputBound = useSelector(isCountryInputBound);
  const emailInputBound = useSelector(isEmailInputBound);
  const imageWidgetBound = useSelector(isImageWidgetBound);
  // 6
  const buttonWidgetPresent = useSelector(isButtonWidgetPresent);
  const buttonWidgetHasText = useSelector(doesButtonWidgetHaveText);
  // 7
  const buttonWidgetonClickBinding = useSelector(buttonWidgetHasOnClickBinding);
  // 8
  const buttonWidgetSuccessBinding = useSelector(
    buttonWidgetHasOnSuccessBinding,
  );
  // 9
  const isDeployed = useSelector(getApplicationLastDeployedAt);

  if (step === 1) {
    if (queryLimitUpdated) {
      meta.hintCount += 1;

      if (queryExecutedSuccessfully && hadReachedStep > 1) {
        step = 2;
      }
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
    if (isNameInputBound && hadReachedStep > 4) {
      step = 5;
    }
  }

  if (step === 5) {
    if (emailInputBound) {
      meta.completedSubSteps.push(0);
    }
    if (countryInputBound) {
      meta.completedSubSteps.push(1);
    }
    if (imageWidgetBound) {
      meta.completedSubSteps.push(2);
    }

    if (meta.completedSubSteps.length === 3 && hadReachedStep > 5) {
      step = 6;
    }
  }

  if (step === 6) {
    if (buttonWidgetPresent && buttonWidgetHasText && hadReachedStep > 6) {
      step = 7;
    }
  }

  if (step === 7) {
    if (buttonWidgetonClickBinding) {
      step = 8;
    }
  }

  if (step === 8) {
    if (buttonWidgetSuccessBinding && hadReachedStep > 8) {
      step = 9;
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
        dispatch(markStepComplete());
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
    if (isNameInputBound && step === 4 && hadReachedStep <= 4) {
      dispatch(markStepComplete());
    }
  }, [isNameInputBound, step, hadReachedStep]);

  useEffect(() => {
    if (
      step === 5 &&
      meta.completedSubSteps.length === 3 &&
      hadReachedStep <= 5
    ) {
      dispatch(markStepComplete());
    }
  }, [step, meta.completedSubSteps.length, hadReachedStep]);

  useEffect(() => {
    if (step === 6 && hadReachedStep <= 6) {
      if (buttonWidgetPresent) {
        dispatch(setIndicatorLocation("NONE"));
        if (buttonWidgetHasText) {
          dispatch(markStepComplete());
        }
      }
    }
  }, [step, buttonWidgetPresent, buttonWidgetHasText]);

  useEffect(() => {
    if (step === 7 && hadReachedStep <= 7) {
      if (buttonWidgetonClickBinding) {
        dispatch(setIndicatorLocation("ACTION_CREATOR"));
      }
    }
  }, [step, buttonWidgetonClickBinding, hadReachedStep]);

  useEffect(() => {
    if (step === 8) {
      if (buttonWidgetSuccessBinding) {
        dispatch(markStepComplete());
        dispatch(setIndicatorLocation("NONE"));
      }
    }
  }, [step, buttonWidgetSuccessBinding]);

  useEffect(() => {
    if (step === 9) {
      if (isDeployed) {
        dispatch(enableGuidedTour(false));
      }
    }
  }, [step, isDeployed]);

  return meta;
}

function GuideStepsContent(props: {
  currentStep: number;
  meta: GuideBody["meta"];
}) {
  const content = Steps[props.currentStep];
  const [hintCount, setHintCount] = useState(0);
  const currentHint = content.hints[hintCount]
    ? content.hints[hintCount]
    : content.hints[0];

  useEffect(() => {
    setHintCount(0);
  }, [props.currentStep]);

  useEffect(() => {
    setHintCount(props.meta.hintCount);
  }, [props.meta.hintCount]);

  const hintSteps = currentHint.steps;

  const hintButtonOnClick = () => {
    setHintCount((count) => count + 1);
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <div className="header">
            <TitleWrapper>
              <StepCount>{props.currentStep}</StepCount>
              <Title>{content.title}</Title>
            </TitleWrapper>
            <div className="count">
              {props.currentStep - 1}/9{" "}
              <span className="complete">COMPLETE</span>
            </div>
          </div>
          {content.description && (
            <Description>{content.description}</Description>
          )}
        </SubContentWrapper>
      </ContentWrapper>
      <Hint>
        <div className="inner-wrapper hint-text">
          <HintTextWrapper>
            <div>{currentHint.text}</div>
            {currentHint.image && <img src={currentHint.image} />}
          </HintTextWrapper>
          {isArray(hintSteps) &&
            hintSteps.length &&
            hintSteps.map((step, index) => {
              const completed = props.meta.completedSubSteps.includes(index);
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
    success?.onClick && success?.onClick(dispatch);
  };

  useEffect(() => {
    if (success?.timed) {
      setTimeout(() => {
        onSuccessButtonClick();
      }, 5000);
    }
  }, [success?.timed]);

  const onInfoButtonClick = () => {
    info?.onClick(dispatch);
  };

  if (showSuccess) {
    return (
      <SuccessMessageWrapper>
        {success?.timed && (
          <ProgressBar>
            <div className="progress" />
          </ProgressBar>
        )}
        <div className="wrapper">
          <div className="lottie-wrapper" ref={tickMarkRef} />
          <div className="title-wrapper">
            <Title>{Steps[props.step].success?.text}</Title>
            {!success?.timed && (
              <GuideButton
                onClick={onSuccessButtonClick}
                tag="button"
                text={"CONTINUE"}
              />
            )}
          </div>
        </div>
      </SuccessMessageWrapper>
    );
  } else {
    return (
      <SuccessMessageWrapper>
        <div className="wrapper info-wrapper">
          <Icon fillColor="#F86A2B" name={info?.icon} size={IconSize.XXXXL} />

          <Description className="info">{info?.text}</Description>
          <GuideButton
            onClick={onInfoButtonClick}
            tag="button"
            text="PROCEED TO NEXT STEP"
          />
        </div>
      </SuccessMessageWrapper>
    );
  }
}

type GuideBody = {
  exploring: boolean;
  step: number;
  meta: {
    completedSubSteps: number[];
    hintCount: number;
  };
};

function GuideBody(props: GuideBody) {
  const successMessage = useSelector(showSuccessMessage);

  if (props.exploring) {
    return <InitialContent />;
  } else if (successMessage) {
    return <CompletionContent step={props.step} />;
  } else {
    return <GuideStepsContent currentStep={props.step} meta={props.meta} />;
  }
}

type GuideProps = {
  className?: string;
};
// Guided tour steps
function Guide(props: GuideProps) {
  const exploring = useSelector(isExploringSelector);
  const meta = useComputeCurrentStep(exploring);
  const step = useSelector(getCurrentStep);

  return (
    <GuideWrapper className={props.className}>
      <CardWrapper>
        <UpperContent>
          <GuideBody exploring={exploring} meta={meta} step={step} />
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
