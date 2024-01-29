package com.appsmith.external.models;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.fasterxml.jackson.databind.node.MissingNode;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActionExecutionResultTest {

    @Test
    void testPluginErrorDetailsConstructor() {
        BasePluginError error = mock(BasePluginError.class);
        when(error.getAppErrorCode()).thenReturn("An error occurred");
        when(error.getDownstreamErrorCode((Object[]) any())).thenReturn("An error occurred");
        when(error.getDownstreamErrorMessage((Object[]) any())).thenReturn("An error occurred");
        when(error.getErrorType()).thenReturn("An error occurred");
        when(error.getMessage((Object[]) any())).thenReturn("An error occurred");
        when(error.getTitle()).thenReturn("Dr");
        AppsmithPluginException appsmithPluginException = new AppsmithPluginException(error, "Args");

        ActionExecutionResult.PluginErrorDetails pluginErrorDetails =
            (new ActionExecutionResult()).new PluginErrorDetails(appsmithPluginException);

        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setBody("Body");
        actionExecutionResult.setDataTypes(new ArrayList<>());
        actionExecutionResult.setErrorType("An error occurred");
        actionExecutionResult.setHeaders(MissingNode.getInstance());
        actionExecutionResult.setIsExecutionSuccess(true);
        actionExecutionResult.setMessages(new HashSet<>());
        actionExecutionResult.setPluginErrorDetails(pluginErrorDetails);
        actionExecutionResult.setReadableError("An error occurred");
        actionExecutionResult.setRequest(new ActionExecutionRequest());
        actionExecutionResult.setStatusCode("Status Code");
        actionExecutionResult.setSuggestedWidgets(new ArrayList<>());
        actionExecutionResult.setTitle("Dr");
        BasePluginError error2 = mock(BasePluginError.class);
        when(error2.getAppErrorCode()).thenReturn("An error occurred");
        when(error2.getDownstreamErrorCode((Object[]) any())).thenReturn("An error occurred");
        when(error2.getDownstreamErrorMessage((Object[]) any())).thenReturn("An error occurred");
        when(error2.getErrorType()).thenReturn("An error occurred");
        when(error2.getMessage((Object[]) any())).thenReturn("An error occurred");
        when(error2.getTitle()).thenReturn("Dr");
        ActionExecutionResult.PluginErrorDetails actualPluginErrorDetails =
            actionExecutionResult.new PluginErrorDetails(new AppsmithPluginException(error2, "Args"));

        verify(error).getAppErrorCode();
        verify(error2).getAppErrorCode();
        verify(error).getDownstreamErrorCode((Object[]) any());
        verify(error2).getDownstreamErrorCode((Object[]) any());
        verify(error).getDownstreamErrorMessage((Object[]) any());
        verify(error2).getDownstreamErrorMessage((Object[]) any());
        verify(error).getErrorType();
        verify(error2).getErrorType();
        verify(error, atLeast(1)).getMessage((Object[]) any());
        verify(error2, atLeast(1)).getMessage((Object[]) any());
        verify(error).getTitle();
        verify(error2).getTitle();
        assertEquals("An error occurred", actualPluginErrorDetails.getAppsmithErrorCode());
        assertEquals("An error occurred", actualPluginErrorDetails.getAppsmithErrorMessage());
        assertEquals("An error occurred", actualPluginErrorDetails.getDownstreamErrorCode());
        assertEquals("An error occurred", actualPluginErrorDetails.getDownstreamErrorMessage());
        assertEquals("An error occurred", actualPluginErrorDetails.getErrorType());
        assertEquals("Dr", actualPluginErrorDetails.getTitle());
    }

    @Test
    void testSetErrorInfo() {
        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setErrorInfo(new Throwable());
        assertNull(actionExecutionResult.getBody());
    }

    @Test
    void testSetErrorInfo2() {
        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setErrorInfo(new Throwable("foo", new Throwable()));
        assertNull(actionExecutionResult.getBody());
    }

    @Test
    void testSetErrorInfo3() {
        BasePluginError error = mock(BasePluginError.class);
        when(error.getAppErrorCode()).thenReturn("An error occurred");
        when(error.getDownstreamErrorCode((Object[]) any())).thenReturn("An error occurred");
        when(error.getDownstreamErrorMessage((Object[]) any())).thenReturn("An error occurred");
        when(error.getErrorType()).thenReturn("An error occurred");
        when(error.getMessage((Object[]) any())).thenReturn("An error occurred");
        when(error.getTitle()).thenReturn("Dr");
        AppsmithPluginException appsmithPluginException = new AppsmithPluginException(error, "Args");

        ActionExecutionResult.PluginErrorDetails pluginErrorDetails =
            (new ActionExecutionResult()).new PluginErrorDetails(appsmithPluginException);

        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setPluginErrorDetails(pluginErrorDetails);
        actionExecutionResult.setErrorInfo(new Throwable());
        verify(error).getAppErrorCode();
        verify(error).getDownstreamErrorCode((Object[]) any());
        verify(error).getDownstreamErrorMessage((Object[]) any());
        verify(error).getErrorType();
        verify(error, atLeast(1)).getMessage((Object[]) any());
        verify(error).getTitle();
        assertNull(actionExecutionResult.getBody());
    }

    @Test
    void testSetErrorInfo4() {
        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setErrorInfo(new Throwable(), mock(AppsmithPluginErrorUtils.class));
        assertNull(actionExecutionResult.getBody());
    }
}
