package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;

public class ActionExecutionMetric extends BaseDomain {
    String actionId;
    String hash;
    String executionTimeInMs;
}
