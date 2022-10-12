import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from "graphql";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { EmbeddedApiAction } from "entities/Action";
import {
  getAction,
  getIsFetchingDatasourceStructure,
} from "selectors/entitiesSelector";

export type ExplorerFieldDef =
  | GraphQLField<any, any, any>
  | GraphQLInputField
  | GraphQLArgument;

export type ExplorerStackItem = {
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The definition object of the item, this can be a named type, a field, an
   * input field or an argument.
   */
  def?: GraphQLNamedType | ExplorerFieldDef;
};

export type ExplorerStack = Array<ExplorerStackItem>;

export type ExplorerContextType = {
  /**
   * A stack of navigation items. The last item in the list is the current one.
   * This list always contains at least one item.
   */
  stack: ExplorerStack;
  /**
   * Push an item to the navigation stack.
   * @param item The item that should be pushed to the stack.
   */
  push(item: ExplorerStackItem): void;
  /**
   * Pop the last item from the navigation stack.
   */
  pop(): void;
  /**
   * Reset the navigation stack to its initial state, this will remove all but
   * the initial stack item.
   */
  reset(): void;
};

const INITIAL_STACK_ITEM: ExplorerStackItem = { name: "Docs" };

const ExplorerContext = createContext<ExplorerContextType | null>(null);
ExplorerContext.displayName = "ExplorerContext";

type ExplorerContextProvider = {
  children: ReactNode;
  schema?: any;
  isFetching: boolean;
};

const ExplorerContextProvider = (props: ExplorerContextProvider) => {
  const [navStack, setNavStack] = useState<ExplorerStack>([INITIAL_STACK_ITEM]);
  const push = useCallback((item: ExplorerStackItem) => {
    setNavStack((currentState: ExplorerStack) => {
      const lastItem = currentState[currentState.length - 1];
      return lastItem.def === item.def
        ? // Avoid pushing duplicate items
          currentState
        : [...currentState, item];
    });
  }, []);

  const pop = useCallback(() => {
    setNavStack((currentState: ExplorerStack) =>
      currentState.length > 1
        ? (currentState.slice(0, -1) as ExplorerStack)
        : currentState,
    );
  }, []);

  const reset = useCallback(() => {
    setNavStack((currentState: ExplorerStack) =>
      currentState.length === 1 ? currentState : [INITIAL_STACK_ITEM],
    );
  }, []);

  useEffect(() => {
    if (props.isFetching) {
      reset();
    }
  }, [props.isFetching, reset]);

  const value = useMemo<ExplorerContextType>(
    () => ({ stack: navStack, push, pop, reset }),
    [navStack, push, pop, reset],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {props.children}
    </ExplorerContext.Provider>
  );
};

export default connect(
  (state: AppState, props: { actionId: string; datasourceId?: string }) => {
    let isFetching = false;
    if (props.datasourceId) {
      isFetching = getIsFetchingDatasourceStructure(state);
    } else {
      const action = getAction(state, props.actionId);
      isFetching = !!(action as EmbeddedApiAction).structure?.isFetching;
    }

    return {
      isFetching,
    };
  },
)(ExplorerContextProvider);

export { ExplorerContext };
