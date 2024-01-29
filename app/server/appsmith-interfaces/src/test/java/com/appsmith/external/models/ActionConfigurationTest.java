package com.appsmith.external.models;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import reactor.netty.http.HttpProtocol;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;

class A {

    @Test
    void testSetTimeoutInMillisecond() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("Timeout In Millisecond");
        assertEquals(60000, actionConfiguration.timeoutInMillisecond.intValue());
    }

    @Test
    void testSetTimeoutInMillisecond2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("42");
        assertEquals(42, actionConfiguration.timeoutInMillisecond.intValue());
    }

    @Test
    void testGetTimeoutInMillisecond() {
        assertEquals(
            10000, (new ActionConfiguration()).getTimeoutInMillisecond().intValue());
    }

    @Test
    void testGetTimeoutInMillisecond2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Not all who wander are lost");
        actionConfiguration.setBodyFormData(new ArrayList<>());
        actionConfiguration.setEncodeParamsToggle(true);
        actionConfiguration.setFormData(new HashMap<>());
        actionConfiguration.setHeaders(new ArrayList<>());
        actionConfiguration.setHttpMethod(HttpMethod.valueOf("https://example.org/example"));
        actionConfiguration.setHttpVersion(HttpProtocol.HTTP11);
        actionConfiguration.setIsAsync(true);
        actionConfiguration.setIsValid(true);
        actionConfiguration.setJsArguments(new ArrayList<>());
        actionConfiguration.setNext("Next");
        actionConfiguration.setPaginationType(PaginationType.NONE);
        actionConfiguration.setPath("Path");
        actionConfiguration.setPluginSpecifiedTemplates(new ArrayList<>());
        actionConfiguration.setPrev("Prev");
        actionConfiguration.setQueryParameters(new ArrayList<>());
        actionConfiguration.setRouteParameters(new ArrayList<>());
        actionConfiguration.setSelfReferencingDataPaths(new HashSet<>());
        actionConfiguration.setTemplateName("Template Name");
        actionConfiguration.setTimeoutInMillisecond(null);
        assertEquals(60000, actionConfiguration.getTimeoutInMillisecond().intValue());
    }
}
