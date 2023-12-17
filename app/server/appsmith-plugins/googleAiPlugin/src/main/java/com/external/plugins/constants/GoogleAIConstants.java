package com.external.plugins.constants;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

import java.util.List;

public class GoogleAIConstants {
    public static final String GOOGLE_AI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
    public static final String MODELS = "/models";
    public static final String GENERATE_CONTENT_MODELS = "GENERATE_CONTENT_MODELS";
    public static final String GENERATE_CONTENT = "GENERATE_CONTENT";
    public static final String GENERATE_CONTENT_MODEL = "generateContentModel";
    public static final String GENERATE_CONTENT_ACTION = ":generateContent";
    public static final String COMMAND = "command";
    public static final String DATA = "data";
    public static final String VIEW_TYPE = "viewType";
    public static final String COMPONENT_DATA = "componentData";
    public static final String BODY = "body";
    public static final String ROLE = "role";
    public static final String TYPE = "type";
    public static final String CONTENT = "content";
    public static final String KEY = "key";
    public static final String MESSAGES = "messages";
    public static final String LABEL = "label";
    public static final String VALUE = "value";
    public static final List<String> GOOGLE_AI_MODELS = List.of("gemini-pro");
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();
    public static final String JSON = "json";
    public static final String COMPONENT = "component";
}
