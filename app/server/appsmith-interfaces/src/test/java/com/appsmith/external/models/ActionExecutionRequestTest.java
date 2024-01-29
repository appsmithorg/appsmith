package com.appsmith.external.models;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActionExecutionRequestTest {

    @Test
    void testGetRequestedAtInEpochMilliseconds() {
        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setRequestedAt(
            LocalDate.of(1970, 1, 1).atStartOfDay().atZone(ZoneOffset.UTC).toInstant());
        assertEquals(0L, actionExecutionRequest.getRequestedAtInEpochMilliseconds());
    }
}
