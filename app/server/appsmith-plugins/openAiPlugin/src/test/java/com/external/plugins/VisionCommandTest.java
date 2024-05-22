package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.VisionCommand;
import com.external.plugins.models.QueryType;
import com.external.plugins.models.UserQuery;
import com.external.plugins.models.VisionRequestDTO;
import com.google.gson.Gson;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CONTENT;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.MAX_TOKENS;
import static com.external.plugins.constants.OpenAIConstants.SYSTEM_MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.TEMPERATURE;
import static com.external.plugins.constants.OpenAIConstants.USER_MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.VISION_MODEL_SELECTOR;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class VisionCommandTest {
    private static final Gson gson = new Gson();
    private VisionCommand visionCommand;

    @BeforeEach
    public void setup() {
        visionCommand = new VisionCommand(gson);
    }

    @Test
    public void testCreateTriggerUri() {
        URI uri = visionCommand.createTriggerUri();
        assertEquals("/v1/models", uri.getPath());
    }

    @Test
    public void testCreateExecutionUri() {
        URI uri = visionCommand.createExecutionUri();

        assertEquals("/v1/chat/completions", uri.getPath());
    }

    @Test
    public void testMakeRequestBody_withValidData() {
        Map<String, Object> formData = new HashMap<>();
        formData.put(VISION_MODEL_SELECTOR, Map.of(DATA, "gpt-4-vision-preview"));
        formData.put(TEMPERATURE, "0.1");
        formData.put(MAX_TOKENS, "1000");

        formData.put(
                SYSTEM_MESSAGES,
                Map.of("data", List.of(Map.of(CONTENT, "Assistant Helper 1"), Map.of(CONTENT, "Assistant Helper 2"))));

        UserQuery userQuery1 = new UserQuery();
        userQuery1.setContent("What's in this image?");
        userQuery1.setType(QueryType.TEXT);

        UserQuery userQuery2 = new UserQuery();
        userQuery2.setType(QueryType.IMAGE);
        userQuery2.setContent("https://docs.appsmith.com/img/imagetable.gif");

        formData.put(USER_MESSAGES, Map.of("data", List.of(userQuery1, userQuery2)));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        VisionRequestDTO request = (VisionRequestDTO) visionCommand.makeRequestBody(actionConfiguration);

        assertEquals("gpt-4-vision-preview", request.getModel());
        assertEquals(0.1f, request.getTemperature());
        assertEquals(1000, request.getMaxTokens());
        assertNotNull(request.getMessages());
        assertEquals(3, request.getMessages().size());
    }

    @Test
    public void testModelFilter() {
        List<String> models = List.of(
                "text-search-babbage-doc-001",
                "gpt-3.5-turbo-16k-0613",
                "curie-search-query",
                "gpt-3.5-turbo-16k",
                "text-search-babbage-query-001",
                "babbage",
                "babbage-search-query",
                "text-babbage-001",
                "whisper-1",
                "text-similarity-davinci-001",
                "davinci-similarity",
                "code-davinci-edit-001",
                "curie-similarity",
                "babbage-search-document",
                "curie-instruct-beta",
                "text-search-ada-doc-001",
                "davinci-instruct-beta",
                "gpt-3.5-turbo-0613",
                "text-similarity-babbage-001",
                "text-search-davinci-doc-001",
                "gpt-4-0314",
                "gpt-4-0613",
                "gpt-4",
                "babbage-similarity",
                "text-embedding-ada-002",
                "davinci-search-query",
                "text-similarity-curie-001",
                "text-davinci-001",
                "text-search-davinci-query-001",
                "ada-search-document",
                "ada-code-search-code",
                "babbage-002",
                "davinci-002",
                "davinci-search-document",
                "curie-search-document",
                "babbage-code-search-code",
                "text-search-ada-query-001",
                "code-search-ada-text-001",
                "babbage-code-search-text",
                "code-search-babbage-code-001",
                "ada-search-query",
                "ada-code-search-text",
                "text-search-curie-query-001",
                "text-davinci-002",
                "text-davinci-edit-001",
                "code-search-babbage-text-001",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-instruct-0914",
                "ada",
                "text-ada-001",
                "ada-similarity",
                "code-search-ada-code-001",
                "text-similarity-ada-001",
                "gpt-3.5-turbo-0301",
                "gpt-3.5-turbo-instruct",
                "text-search-curie-doc-001",
                "text-davinci-003",
                "text-curie-001",
                "curie",
                "davinci",
                "gpt-4-vision-preview",
                "gpt-4o");
        int counter = 0;
        for (String model : models) {
            JSONObject jsonObject = new JSONObject(String.format("{\"%s\": \"%s\" }", ID, model));
            if (visionCommand.isModelCompatible(jsonObject)) {
                counter += 1;
            }
        }
        assertEquals(counter, 2);
    }
}
