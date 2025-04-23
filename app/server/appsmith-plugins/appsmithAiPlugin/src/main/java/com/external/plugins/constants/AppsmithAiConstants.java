package com.external.plugins.constants;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

public class AppsmithAiConstants {
    public static final String USECASE = "usecase";
    public static final String AI_SERVER_HOST = "https://cs.appsmith.com/api/v1/proxy";
    public static final String ASSISTANT_PATH = "/assistant";
    public static final String QUERY_PATH = ASSISTANT_PATH + "/query";
    public static final String ASSOCIATE_PATH = ASSISTANT_PATH + "/files/datasource";
    public static final String FILES_STATUS_PATH = ASSISTANT_PATH + "/files/status";
    public static final String FILE_PATH = ASSISTANT_PATH + "/files";

    // Action paths
    public static final String TEXT_SUMMARY = "textSummary";
    public static final String TEXT_GENERATION = "textGeneration";
    public static final String TEXT_ENTITY_EXTRACTION = "textEntity";
    public static final String TEXT_CLASSIFICATION = "textClassify";
    public static final String IMAGE_ENTITY_EXTRACTION = "imageEntity";
    public static final String IMAGE_CLASSIFICATION = "imageClassify";
    public static final String IMAGE_CAPTIONING = "imageCaption";

    // Field names
    public static final String INPUT = "input";
    public static final String DATA = "data";
    public static final String LABELS = "labels";
    public static final String LABEL = "label";
    public static final String DISABLED = "disabled";
    public static final String INSTRUCTIONS = "instructions";
    public static final String IMAGE_FORMAT = "imageFormat";
    public static final String DATASOURCE_ID = "datasourceId";
    public static final String ACTION_ID = "actionId";
    public static final String WORKSPACE_ID = "workspaceId";
    public static final String INSTANCE_ID = "instanceId";
    public static final String ORGANIZATION_ID = "tenantId";
    public static final String SOURCE_DETAILS = "sourceDetail";

    public static final String PERIOD_DELIMITER = ".";
    // Action properties
    public static final String TEXT_SUMMARY_INPUT = TEXT_SUMMARY + PERIOD_DELIMITER + INPUT;
    public static final String TEXT_SUMMARY_INSTRUCTIONS = TEXT_SUMMARY + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String TEXT_GENERATION_INPUT = TEXT_GENERATION + PERIOD_DELIMITER + INPUT;
    public static final String TEXT_GENERATION_INSTRUCTIONS = TEXT_GENERATION + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String TEXT_ENTITY_INPUT = TEXT_ENTITY_EXTRACTION + PERIOD_DELIMITER + INPUT;
    public static final String TEXT_ENTITY_LABELS = TEXT_ENTITY_EXTRACTION + PERIOD_DELIMITER + LABELS;
    public static final String TEXT_ENTITY_INSTRUCTIONS = TEXT_ENTITY_EXTRACTION + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String TEXT_CLASSIFY_INPUT = TEXT_CLASSIFICATION + PERIOD_DELIMITER + INPUT;
    public static final String TEXT_CLASSIFY_LABELS = TEXT_CLASSIFICATION + PERIOD_DELIMITER + LABELS;
    public static final String TEXT_CLASSIFY_INSTRUCTIONS = TEXT_CLASSIFICATION + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String IMAGE_ENTITY_INPUT = IMAGE_ENTITY_EXTRACTION + PERIOD_DELIMITER + INPUT;
    public static final String IMAGE_ENTITY_LABELS = IMAGE_ENTITY_EXTRACTION + PERIOD_DELIMITER + LABELS;
    public static final String IMAGE_ENTITY_INSTRUCTIONS = IMAGE_ENTITY_EXTRACTION + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String IMAGE_CLASSIFY_INPUT = IMAGE_CLASSIFICATION + PERIOD_DELIMITER + INPUT;
    public static final String IMAGE_CLASSIFY_LABELS = IMAGE_CLASSIFICATION + PERIOD_DELIMITER + LABELS;
    public static final String IMAGE_CLASSIFY_INSTRUCTIONS = IMAGE_CLASSIFICATION + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String IMAGE_CAPTION_INPUT = IMAGE_CAPTIONING + PERIOD_DELIMITER + INPUT;
    public static final String IMAGE_CAPTION_INSTRUCTIONS = IMAGE_CAPTIONING + PERIOD_DELIMITER + INSTRUCTIONS;
    public static final String UPLOAD_FILES = "UPLOAD_FILES";
    public static final String FILES = "files";
    public static final String LIST_FILES = "LIST_FILES";
    public static final String FILE_IDS = "fileIds";

    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 150MB */ 150 * 1024 * 1024))
            .build();
}
