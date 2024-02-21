package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ExecutionMetricRequestDTO {

    Boolean viewMode = false;

    int executionTimeInMs;
}
