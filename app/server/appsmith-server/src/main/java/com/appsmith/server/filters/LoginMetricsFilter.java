package com.appsmith.server.filters;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.spans.LoginSpan.LOGIN_ATTEMPT;
import static com.appsmith.external.constants.spans.LoginSpan.LOGIN_FAILURE;

@Slf4j
public class LoginMetricsFilter implements WebFilter {

    private final MeterRegistry meterRegistry;

    public LoginMetricsFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return Mono.defer(() -> {
            Timer.Sample sample = Timer.start(meterRegistry);
            return chain.filter(exchange)
                    .doOnSuccess(aVoid -> {
                        sample.stop(Timer.builder(LOGIN_ATTEMPT).register(meterRegistry));
                    })
                    .doOnError(throwable -> {
                        sample.stop(Timer.builder(LOGIN_ATTEMPT)
                                .tag("message", throwable.getMessage())
                                .register(meterRegistry));

                        meterRegistry
                                .counter(
                                        LOGIN_FAILURE,
                                        "source",
                                        "form_login",
                                        "errorCode",
                                        "AuthenticationFailed",
                                        "message",
                                        throwable.getMessage())
                                .increment();
                    });
        });
    }
}
