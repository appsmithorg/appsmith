# Global Function docs

Global functions in Appsmith are available through the right-hand pane and in the JS editor. They allow users to perform different tasks throughout the Appsmith application.

#### Here are some pull requests you can use as an example:

1. Post message API - https://github.com/appsmithorg/appsmith/pull/12551/files
2. SetInterval and ClearInterval API - https://github.com/appsmithorg/appsmith/pull/8158
3. Geolocation API - https://github.com/appsmithorg/appsmith/pull/9295

#### Follow these steps to add a new global function to Appsmith:

1. Go to the [ActionCreator/Fields.tsx](https://github.com/appsmithorg/appsmith/blob/release/app/client/src/components/editorComponents/ActionCreator/Fields.tsx) file. This file contains the parameters and their types that will be the input to the global function. This file also includes the type of field that will accept the value for these parameters, eg., if the input is a dropdown list of items or a text field, etc.,
    1. Create a new entry in the *`ActionType` object.* This is the name of the function.
    2. Define new fields in the `Fieldtype` object. These are the field names for each argument the function accepts.
    3. Update `fieldConfigs` with your field’s getter, setting, and view. The getter is the setting used to extract the field value from the function. the setter is used to set the value in function when the field is updated. The view is the component used to edit the field value
    4. Update the `renderField` function to change things like field label etc.,
2. Go to the [ActionCreator/index.tsx](https://github.com/appsmithorg/appsmith/blob/release/app/client/src/components/editorComponents/ActionCreator/index.tsx) file.
    1. Add the new action entry and its text in the `baseOptions` array (you will need to add a constant for the message in the `constants/messages.ts`) - This will show up as a message when you hover over the function.

![https://paper-attachments.dropbox.com/s_275F1BFE81CAEFA1A98D1AAB74D7D93E3258CDB4EC3F13B6904439E92AA6CF3F_1652893496513_Screenshot+2022-05-18+at+10.34.47+PM.png](https://paper-attachments.dropbox.com/s_275F1BFE81CAEFA1A98D1AAB74D7D93E3258CDB4EC3F13B6904439E92AA6CF3F_1652893496513_Screenshot+2022-05-18+at+10.34.47+PM.png)

3. Attach fields to the new action in the `getFieldFromValue` function (Look at the setInterval code example for guidance). After following these 3 steps, you should be able to view your global function listed on the right hand pane, along with the fields to enter parameters.

```jsx
if (value.indexOf("setInterval") !== -1) {
  fields.push(
    {
	field: FieldType.CALLBACK_FUNCTION_FIELD,
    },
    {
	field: FieldType.DELAY_FIELD,
    },
    {
	field: FieldType.ID_FIELD,
    },
  );
}
```

4. Go to the [Datatree/actionTriggers.ts](https://github.com/appsmithorg/appsmith/blob/release/app/client/src/entities/DataTree/actionTriggers.ts) file:
    1. Add a new entry in the `ActionTriggerType` enum
    2. Add a new entry to the `ActionTriggerFunctionNames` datatype (Look at the code example for guidance)

```jsx
[ActionTriggerType.*SET_INTERVAL*]: "setInterval",
```

5. You will also need to add an entry containing the description of the global function, which will contain the type and the payload containing all the parameters and their types

```jsx
export type SetIntervalDescription = {
  type: ActionTriggerType.SET_INTERVAL;
  payload: {
    callback: string;
    interval: number;
    id?: string;
  };
};
```

6. Finally add this global function description to the `ActionDescription` data structure.

7. Go to the [sagas/ActionExecution](https://github.com/appsmithorg/appsmith/tree/b778b83ac45cd0d77421125106a483a4e723f2ca/app/client/src/sagas/ActionExecution) folder:
    1. Add a new saga here for your global function. This will contain the logic used to implement your global function. Use this example to implement your global function

```jsx
import {
  ClearIntervalDescription,
  SetIntervalDescription,
} from "entities/DataTree/actionTriggers";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { call, delay, spawn } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";

const TIMER_WITHOUT_ID_KEY = "timerWithoutId";

const activeTimers: Record<string, true | string> = {
  [TIMER_WITHOUT_ID_KEY]: true,
};

export function* setIntervalSaga(
  payload: SetIntervalDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (payload.id) {
    activeTimers[payload.id] = payload.callback;
  }

  yield spawn(executeInIntervals, payload, eventType, triggerMeta);
}

function* executeInIntervals(
  payload: SetIntervalDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const { callback, id = TIMER_WITHOUT_ID_KEY, interval } = payload;
  while (
    // only execute if the id exists in the activeTimers obj
    id in activeTimers &&
    /*
     While editing the callback can change for the same id.
     At that time we want only execute the new callback
     so end the loop if the callback is not the same as the one this
     saga was started

     But if no id is provided, it will always run
    */
    (activeTimers[id] === callback || id === TIMER_WITHOUT_ID_KEY)
  ) {
    // Even if there is an error, the set interval should still keep
    // running. This is according to the spec of setInterval
    try {
      yield call(executeAppAction, {
        dynamicString: `{{${callback}}}`,
        // pass empty object to execute it as a callback function
        callbackData: [{}],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    } catch (e) {
      logActionExecutionError(
        e.message,
        triggerMeta.source,
        triggerMeta.triggerPropertyName,
      );
    }
    yield delay(interval);
  }
}

export function* clearIntervalSaga(
  payload: ClearIntervalDescription["payload"],
) {
  if (!(payload.id in activeTimers)) {
    throw new TriggerFailureError(
      `Failed to clear interval. No timer active with id "${payload.id}"`,
    );
  }
  delete activeTimers[payload.id];
}
```

8. Add an entry to the [sagas/ActionCreator/ActionExecutionSagas.ts](https://github.com/appsmithorg/appsmith/blob/b778b83ac45cd0d77421125106a483a4e723f2ca/app/client/src/sagas/ActionExecution/ActionExecutionSagas.ts) file’s `executeActionTriggers` function. Use this example for guidance

    ```jsx
    case ActionTriggerType.SET_INTERVAL:
        yield call(setIntervalSaga, trigger.payload, eventType, triggerMeta);
        break;
    ```

9. In the [workers/Actions.ts](https://github.com/appsmithorg/appsmith/blob/b778b83ac45cd0d77421125106a483a4e723f2ca/app/client/src/workers/Actions.ts) file - This file has all the global functions listed in this file. Add the entry for the global function you have created, using this example as a guide:

```jsx
setInterval: function(callback: Function, interval: number, id?: string) {
    return {
      type: ActionTriggerType.SET_INTERVAL,
      payload: {
        callback: callback.toString(),
        interval,
        id,
      },
      executionType: ExecutionType.TRIGGER,
    };
  }
```

10. Lastly, add the global functions metadata to the [autocomplete/EntityDefinitions.ts](https://github.com/appsmithorg/appsmith/blob/release/app/client/src/utils/autocomplete/EntityDefinitions.ts) so the data shows up for auto-complete. Use this code sample as guidance:
```jsx
setInterval: {
    "!doc": "Execute triggers at a given interval",
    "!type": "fn(callback: fn, interval: number, id?: string) -> void",
  },
```
