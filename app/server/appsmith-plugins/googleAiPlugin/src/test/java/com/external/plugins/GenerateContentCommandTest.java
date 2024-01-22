package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.GenerateContentCommand;
import com.external.plugins.models.GoogleAIRequestDTO;
import com.external.plugins.models.Role;
import com.external.plugins.models.Type;
import com.google.gson.Gson;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.GoogleAIConstants.CONTENT;
import static com.external.plugins.constants.GoogleAIConstants.DATA;
import static com.external.plugins.constants.GoogleAIConstants.GENERATE_CONTENT_MODEL;
import static com.external.plugins.constants.GoogleAIConstants.MESSAGES;
import static com.external.plugins.constants.GoogleAIConstants.ROLE;
import static com.external.plugins.constants.GoogleAIConstants.TYPE;

public class GenerateContentCommandTest {
    GenerateContentCommand generateContentCommand = new GenerateContentCommand();

    @Test
    public void testCreateTriggerUri() {
        Assertions.assertEquals(URI.create(""), generateContentCommand.createTriggerUri());
    }

    @Test
    public void testCreateExecutionUri() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(Map.of(GENERATE_CONTENT_MODEL, Map.of(DATA, "gemini-pro")));
        URI uri = generateContentCommand.createExecutionUri(actionConfiguration);
        Assertions.assertEquals(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", uri.toString());
    }

    @Test
    public void testMakeRequestBody_withValidData() {
        // Test with valid form data
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        Map<String, Object> message = new HashMap<>();
        message.put(ROLE, Role.USER.toString());
        message.put(TYPE, Type.TEXT.toString());
        message.put(CONTENT, "Hello Gemini");
        formData.put(MESSAGES, Map.of(DATA, List.of(message)));
        actionConfiguration.setFormData(formData);
        GoogleAIRequestDTO googleAIRequestDTO = generateContentCommand.makeRequestBody(actionConfiguration);
        Assertions.assertEquals(
                "{\"contents\":[{\"role\":\"USER\",\"parts\":[{\"text\":\"Hello Gemini\"}]}]}",
                new Gson().toJson(googleAIRequestDTO));
    }
}
