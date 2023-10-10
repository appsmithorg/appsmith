package com.appsmith.server.services;

import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Component;

@Component
public class ChatServiceFactory {
    private final JsCodeGeneratorServiceImpl jsCodeGeneratorService;
    private final SqlGeneratorServiceImpl sqlGeneratorService;

    public ChatServiceFactory(
            JsCodeGeneratorServiceImpl jsCodeGeneratorService, SqlGeneratorServiceImpl sqlGeneratorService) {
        this.jsCodeGeneratorService = jsCodeGeneratorService;
        this.sqlGeneratorService = sqlGeneratorService;
    }

    public CodeGeneratorService codeGeneratorService(ChatGenerationType type) {
        if (type == ChatGenerationType.SQL) {
            return sqlGeneratorService;
        } else if (type == ChatGenerationType.JS_EXPR) {
            return jsCodeGeneratorService;
        }
        throw new AppsmithException(
                AppsmithError.NO_IMPLEMENTATION_ERROR, "No implementation found for chat generation type - " + type);
    }
}
