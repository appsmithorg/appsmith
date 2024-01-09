package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.models.Feature;
import com.external.plugins.services.features.ImageCaptioningServiceImpl;
import com.external.plugins.services.features.ImageClassificationServiceImpl;
import com.external.plugins.services.features.ImageEntityExtractionServiceImpl;
import com.external.plugins.services.features.TextClassificationServiceImpl;
import com.external.plugins.services.features.TextEntityExtractionServiceImpl;
import com.external.plugins.services.features.TextGenerationServiceImpl;
import com.external.plugins.services.features.TextSummarizationServiceImpl;

public class AiFeatureServiceFactory {
    public static AiFeatureService getAiFeatureService(Feature feature) {
        switch (feature) {
            case TEXT_GENERATE -> {
                return new TextGenerationServiceImpl();
            }
            case TEXT_CLASSIFY -> {
                return new TextClassificationServiceImpl();
            }
            case TEXT_SUMMARY -> {
                return new TextSummarizationServiceImpl();
            }
            case TEXT_ENTITY_EXTRACT -> {
                return new TextEntityExtractionServiceImpl();
            }
            case IMAGE_CLASSIFY -> {
                return new ImageClassificationServiceImpl();
            }
            case IMAGE_ENTITY_EXTRACT -> {
                return new ImageEntityExtractionServiceImpl();
            }
            case IMAGE_CAPTION -> {
                return new ImageCaptioningServiceImpl();
            }
        }
        throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported feature: " + feature);
    }
}
