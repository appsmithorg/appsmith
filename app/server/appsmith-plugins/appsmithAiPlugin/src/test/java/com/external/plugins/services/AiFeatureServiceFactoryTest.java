package com.external.plugins.services;

import com.external.plugins.models.Feature;
import com.external.plugins.services.features.ImageCaptioningServiceImpl;
import com.external.plugins.services.features.ImageClassificationServiceImpl;
import com.external.plugins.services.features.ImageEntityExtractionServiceImpl;
import com.external.plugins.services.features.TextClassificationServiceImpl;
import com.external.plugins.services.features.TextEntityExtractionServiceImpl;
import com.external.plugins.services.features.TextGenerationServiceImpl;
import com.external.plugins.services.features.TextSummarizationServiceImpl;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AiFeatureServiceFactoryTest {

    @Test
    void testGetAiFeatureService_TextGenerate() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.TEXT_GENERATE);
        assertTrue(service instanceof TextGenerationServiceImpl);
    }

    @Test
    void testGetAiFeatureService_TextClassify() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.TEXT_CLASSIFY);
        assertTrue(service instanceof TextClassificationServiceImpl);
    }

    @Test
    void testGetAiFeatureService_TextSummary() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.TEXT_SUMMARY);
        assertTrue(service instanceof TextSummarizationServiceImpl);
    }

    @Test
    void testGetAiFeatureService_TextEntityExtract() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.TEXT_ENTITY_EXTRACT);
        assertTrue(service instanceof TextEntityExtractionServiceImpl);
    }

    @Test
    void testGetAiFeatureService_ImageClassify() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.IMAGE_CLASSIFY);
        assertTrue(service instanceof ImageClassificationServiceImpl);
    }

    @Test
    void testGetAiFeatureService_ImageEntityExtract() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.IMAGE_ENTITY_EXTRACT);
        assertTrue(service instanceof ImageEntityExtractionServiceImpl);
    }

    @Test
    void testGetAiFeatureService_ImageCaption() {
        AiFeatureService service = AiFeatureServiceFactory.getAiFeatureService(Feature.IMAGE_CAPTION);
        assertTrue(service instanceof ImageCaptioningServiceImpl);
    }
}
