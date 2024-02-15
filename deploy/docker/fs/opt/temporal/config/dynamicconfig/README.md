Use `development-*.yaml` file to override the default dynamic config value (they are specified
when creating the service config).

Each key can have zero or more values and each value can have zero or more
constraints. There are only three types of constraint:
    1. namespace: string
    2. taskQueueName: string
    3. taskType: int (1:Workflow, 2:Activity)
A value will be selected and returned if all its has exactly the same constraints
as the ones specified in query filters (including the number of constraints).

Please use the following format:
```
testGetBoolPropertyKey:
  - value: false
  - value: true
    constraints:
      namespace: "global-samples-namespace"
  - value: false
    constraints:
      namespace: "samples-namespace"
testGetDurationPropertyKey:
  - value: "1m"
    constraints:
      namespace: "samples-namespace"
      taskQueueName: "longIdleTimeTaskqueue"
testGetFloat64PropertyKey:
  - value: 12.0
    constraints:
      namespace: "samples-namespace"
testGetMapPropertyKey:
  - value:
      key1: 1
      key2: "value 2"
      key3:
        - false
        - key4: true
          key5: 2.0
```
