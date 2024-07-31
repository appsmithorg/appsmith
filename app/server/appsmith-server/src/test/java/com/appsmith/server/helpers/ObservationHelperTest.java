package com.appsmith.server.helpers;

import com.appsmith.external.helpers.ObservationHelper;
import io.micrometer.tracing.Span;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static com.appsmith.external.constants.MDCConstants.SPAN_ID;
import static com.appsmith.external.constants.MDCConstants.TRACE_ID;

@SpringBootTest
class ObservationHelperTest {

    @Autowired
    ObservationHelper observationHelper;

    @Test
    void testCreateSpan_withNoMDC_returnsNOOP() {
        try (var mockStatic = Mockito.mockStatic(MDC.class)) {
            mockStatic.when(MDC::getCopyOfContextMap).thenReturn(null);

            Span span = observationHelper.createSpan("span_withNoMDC");

            Assertions.assertThat(span.isNoop()).isTrue();
        }
    }

    @Test
    void testCreateSpan_withNoTraceIdInMDC_returnsNOOP() {
        try (var mockStatic = Mockito.mockStatic(MDC.class)) {
            mockStatic.when(MDC::getCopyOfContextMap).thenReturn(Map.of(SPAN_ID, "testSpanId"));

            Span span = observationHelper.createSpan("span_withNoTraceIdInMDC");

            Assertions.assertThat(span.isNoop()).isTrue();
        }
    }

    @Test
    void testCreateSpan_withNoSpanIdInMDC_returnsNOOP() {
        try (var mockStatic = Mockito.mockStatic(MDC.class)) {
            mockStatic.when(MDC::getCopyOfContextMap).thenReturn(Map.of(TRACE_ID, "testTraceId"));

            Span span = observationHelper.createSpan("span_withNoSpanIdInMDC");

            Assertions.assertThat(span.isNoop()).isTrue();
        }
    }
}
