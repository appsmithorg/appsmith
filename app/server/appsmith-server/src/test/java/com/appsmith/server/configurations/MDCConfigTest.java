package com.appsmith.server.configurations;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.filters.MDCFilter;
import com.appsmith.server.helpers.LogHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.BaseSubscriber;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@SpringBootTest
class MDCConfigTest {

    HashMap<String, String> initialMap;

    @BeforeEach
    public void setUpEach() {
        initialMap = new HashMap<>();
        initialMap.put(MDCFilter.THREAD, "mockThread");
        initialMap.put("constantKey", "constantValue");
    }

    @Test
    public void testReactiveContextSwitch_forSingleMono_retainsThreadAcrossSignals() {
        Mono.fromSupplier(() -> "testString")
                .doOnNext((value) -> {
                    final String currentThread = MDC.get(MDCFilter.THREAD);
                    log.debug("Current thread {}", currentThread);
                    Assertions.assertFalse(MDC.getCopyOfContextMap().isEmpty());
                    Assertions.assertNotEquals(currentThread, "mockThread");
                    Assertions.assertEquals(currentThread, "main");
                    Assertions.assertEquals(MDC.get("constantKey"), "constantValue");
                })
                .subscribe(new BaseSubscriber<>() {
                    @Override
                    public Context currentContext() {
                        return Context.empty().put(LogHelper.CONTEXT_MAP, initialMap);
                    }
                });
    }

    @Test
    public void testReactiveContextSwitch_forScheduledMono_switchesThreadAcrossSignals() {
        Mono.fromSupplier(() -> "testString")
                .flatMap((firstValue) -> {
                    final String firstThread = MDC.get(MDCFilter.THREAD);
                    log.debug(
                            "First thread -> {} ; Context thread -> {}",
                            Thread.currentThread().getName(),
                            firstThread);
                    Assertions.assertFalse(MDC.getCopyOfContextMap().isEmpty());
                    Assertions.assertEquals(firstThread, "main");
                    Assertions.assertEquals(firstThread, Thread.currentThread().getName());
                    Assertions.assertEquals(MDC.get("constantKey"), "constantValue");

                    return Mono.fromSupplier(() -> "secondString")
                            .doOnEach((secondValue) -> {
                                final String secondThread = MDC.get(MDCFilter.THREAD);
                                log.debug(
                                        "Second thread -> {} ; Context thread -> {} ; on signal {}",
                                        Thread.currentThread().getName(),
                                        secondThread,
                                        secondValue.getType());
                                Assertions.assertFalse(MDC.getCopyOfContextMap().isEmpty());
                                Assertions.assertNotEquals(secondThread, "main");
                                Assertions.assertEquals(
                                        secondThread, Thread.currentThread().getName());
                                Assertions.assertEquals(MDC.get("constantKey"), "constantValue");
                            })
                            .subscribeOn(Schedulers.boundedElastic());
                })
                .subscribe(new BaseSubscriber<>() {
                    @Override
                    public Context currentContext() {
                        return Context.empty().put(LogHelper.CONTEXT_MAP, initialMap);
                    }
                });
    }

    @Test
    public void testReactiveContextSwitch_forScheduledErrorSignal_switchesThreadAcrossSignals() {
        Mono.fromSupplier(() -> "testString")
                .flatMap((firstValue) -> {
                    final String firstThread = MDC.get(MDCFilter.THREAD);
                    log.debug(
                            "First thread -> {} ; Context thread -> {}",
                            Thread.currentThread().getName(),
                            firstThread);
                    Assertions.assertFalse(MDC.getCopyOfContextMap().isEmpty());
                    Assertions.assertEquals(firstThread, "main");
                    Assertions.assertEquals(firstThread, Thread.currentThread().getName());
                    Assertions.assertEquals(MDC.get("constantKey"), "constantValue");

                    return Mono.error(() -> new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR))
                            .doOnEach((errorValue) -> {
                                final String secondThread = MDC.get(MDCFilter.THREAD);
                                log.debug(
                                        "Error thread -> {} ; Context thread -> {} ; on signal {}",
                                        Thread.currentThread().getName(),
                                        secondThread,
                                        errorValue.getType());
                                Assertions.assertFalse(MDC.getCopyOfContextMap().isEmpty());
                                Assertions.assertNotEquals(secondThread, "main");
                                Assertions.assertEquals(
                                        secondThread, Thread.currentThread().getName());
                                Assertions.assertEquals(MDC.get("constantKey"), "constantValue");

                                Assertions.assertEquals(errorValue.getType(), SignalType.ON_ERROR);

                                final Map<String, String> contextMap =
                                        ((BaseException) errorValue.get()).getContextMap();
                                Assertions.assertEquals(contextMap.get("constantKey"), "constantValue");
                                Assertions.assertEquals(contextMap.get(MDCFilter.THREAD), secondThread);
                            })
                            .subscribeOn(Schedulers.boundedElastic());
                })
                .subscribe(new BaseSubscriber<>() {
                    @Override
                    public Context currentContext() {
                        return Context.empty().put(LogHelper.CONTEXT_MAP, initialMap);
                    }
                });
    }
}
