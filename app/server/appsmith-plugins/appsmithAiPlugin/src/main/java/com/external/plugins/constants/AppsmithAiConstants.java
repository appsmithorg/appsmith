package com.external.plugins.constants;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

public class AppsmithAiConstants {
    public static final String USECASE = "usecase";
    public static final String AI_SERVER_HOST = "https://ai.appsmith.com/api/v1";
    public static final String ASSISTANT_PATH = "/assistant";
    public static final String QUERY_PATH = ASSISTANT_PATH + "/query";
    public static final String INPUT = "input";
    public static final String DATA = "data";
    public static final String LABELS = "labels";
    public static final String INSTRUCTIONS = "instructions";
    public static final String IMAGE_FORMAT = "imageFormat";
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();
}
