package com.appsmith.server.configurations;

import com.appsmith.server.filters.MDCFilter;
import com.appsmith.server.helpers.LogHelper;
import jakarta.annotation.PostConstruct;
import org.reactivestreams.Subscription;
import org.slf4j.MDC;
import org.springframework.context.annotation.Configuration;
import reactor.core.CoreSubscriber;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Operators;
import reactor.util.context.Context;

import jakarta.annotation.PreDestroy;
import java.util.Map;

@Configuration
public class MDCConfig {

    private static final String MDC_CONTEXT_REACTOR_KEY = "MDCConfig";

    @PostConstruct
    void contextOperatorHook() {
        Hooks.onEachOperator(MDC_CONTEXT_REACTOR_KEY, Operators.lift((sc, subscriber) -> new MdcContextLifter<>(subscriber)));
    }

    @PreDestroy
    void cleanupHook() {
        Hooks.resetOnEachOperator(MDC_CONTEXT_REACTOR_KEY);
    }


    /**
     * Helper that copies the state of Reactor [Context] to MDC on the #onNext function.
     */
    static class MdcContextLifter<T> implements CoreSubscriber<T> {

        private final CoreSubscriber<T> coreSubscriber;

        public MdcContextLifter(CoreSubscriber<T> coreSubscriber) {
            this.coreSubscriber = coreSubscriber;
        }

        @Override
        public void onSubscribe(Subscription s) {
            this.copyToMdc(coreSubscriber.currentContext());
            coreSubscriber.onSubscribe(s);
        }

        @Override
        public void onNext(T t) {
            this.copyToMdc(coreSubscriber.currentContext());
            coreSubscriber.onNext(t);
        }

        @Override
        public void onError(Throwable throwable) {
            coreSubscriber.onError(throwable);
        }

        @Override
        public void onComplete() {
            coreSubscriber.onComplete();
        }

        @Override
        public Context currentContext() {
            return coreSubscriber.currentContext();
        }

        /**
         * Extension function for the Reactor [Context]. Copies the current context to the MDC, if context is empty clears the MDC.
         * State of the MDC after calling this method should be same as Reactor [Context] state.
         * One thread-local access only.
         */
        private void copyToMdc(Context context) {
            if (!context.isEmpty() && context.hasKey(LogHelper.CONTEXT_MAP)) {
                Map<String, String> map = context.get(LogHelper.CONTEXT_MAP);

                map.put(MDCFilter.THREAD, Thread.currentThread().getName());
                MDC.setContextMap(map);
            } else {
                MDC.clear();
            }
        }
    }
}
