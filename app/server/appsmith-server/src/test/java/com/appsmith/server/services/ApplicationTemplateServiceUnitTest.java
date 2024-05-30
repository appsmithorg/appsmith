package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.CacheableApplicationJson;
import com.appsmith.server.dtos.CacheableApplicationTemplate;
import com.appsmith.server.helpers.CacheableTemplateHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * This test is written based on the inspiration from the tutorial:
 * https://www.baeldung.com/spring-mocking-webclient
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class ApplicationTemplateServiceUnitTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static MockWebServer mockCloudServices;

    @MockBean
    ApplicationPermission applicationPermission;

    @MockBean
    private CloudServicesConfig cloudServicesConfig;

    @BeforeAll
    public static void setUp() throws IOException {
        mockCloudServices = new MockWebServer();
        mockCloudServices.start();
    }

    @AfterAll
    public static void tearDown() throws IOException {
        mockCloudServices.shutdown();
    }

    @BeforeEach
    public void initialize() {
        String baseUrl = String.format("http://localhost:%s", mockCloudServices.getPort());

        // mock the cloud services config so that it returns mock server url as cloud
        // service base url
        Mockito.when(cloudServicesConfig.getBaseUrl()).thenReturn(baseUrl);
    }

    private ApplicationTemplate create(String id, String title) {
        ApplicationTemplate applicationTemplate = new ApplicationTemplate();
        applicationTemplate.setId(id);
        applicationTemplate.setTitle(title);
        return applicationTemplate;
    }

    /* Scenarios covered via this test:
     * 1. CacheableTemplateHelper doesn't have the POJO or has an empty POJO.
     * 2. Fetch the templates via the normal flow by mocking CS.
     * 3. Check if the CacheableTemplateHelper.getApplicationTemplateList() is the same as the object returned by the normal flow function. This will ensure that the cache is being set correctly.
     * 4. From the above steps we now have the cache set.
     * 5. Fetch the templates again, verify the data is the same as the one fetched in step 2.
     * 6. Verify the cache is used and not the mock. This is done by asserting the lastUpdated time of the cache.
     * 7. Set the cache time to 1 day before the current time.
     * 8. Fetch the templates again, verify the data is from the mock and not from the cache.
     */
    @Test
    public void getTemplateData_cacheIsEmpty_VerifyDataSavedInCache()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        ApplicationTemplate templateOne = create("id-one", "First template");
        ApplicationTemplate templateTwo = create("id-two", "Seconds template");
        ApplicationTemplate templateThree = create("id-three", "Third template");

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateOne, templateTwo, templateThree)))
                .addHeader("Content-Type", "application/json"));

        // Set cache value as null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("applicationTemplateList");
        cacheField.setAccessible(true);
        cacheField.set(null, new CacheableApplicationTemplate());

        Mono<CacheableApplicationTemplate> templateListMono =
                CacheableTemplateHelper.getTemplates("recently-used", cloudServicesConfig.getBaseUrl());

        final Instant[] timeFromCache = {Instant.now()};
        StepVerifier.create(templateListMono)
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-one", "id-two", "id-three");
                    });
                    timeFromCache[0] = cacheableApplicationTemplate1.getLastUpdated();
                })
                .verifyComplete();

        // Fetch again and verify the time stamp to confirm value is coming from POJO
        StepVerifier.create(CacheableTemplateHelper.getTemplates("recently-used", cloudServicesConfig.getBaseUrl()))
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-one", "id-two", "id-three");
                    });
                    assertThat(cacheableApplicationTemplate1.getLastUpdated()).isEqualTo(timeFromCache[0]);
                })
                .verifyComplete();
    }

    /* Scenarios covered via this test:
     * 1. Set the cache time to 1 day before the current time.
     * 2. Fetch the templates again, verify the data is from the mock and not from the cache.
     */
    @Test
    public void getTemplateData_CacheIsDirty_verifyDataIsFetchedFromSource()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        ApplicationTemplate templateOne = create("id-one", "First template");
        ApplicationTemplate templateTwo = create("id-two", "Seconds template");
        ApplicationTemplate templateThree = create("id-three", "Third template");

        CacheableApplicationTemplate cacheableApplicationTemplate = new CacheableApplicationTemplate();
        cacheableApplicationTemplate.setApplicationTemplateList(List.of(templateOne, templateTwo, templateThree));
        cacheableApplicationTemplate.setLastUpdated(Instant.now().minusSeconds(86600));

        // Set cache value as null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("applicationTemplateList");
        cacheField.setAccessible(true);
        cacheField.set(null, cacheableApplicationTemplate);

        ApplicationTemplate templateFour = create("id-four", "Fourth template");
        ApplicationTemplate templateFive = create("id-five", "Fifth template");
        ApplicationTemplate templateSix = create("id-six", "Sixth template");

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateFour, templateFive, templateSix)))
                .addHeader("Content-Type", "application/json"));

        StepVerifier.create(CacheableTemplateHelper.getTemplates("recently-used", cloudServicesConfig.getBaseUrl()))
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-four", "id-five", "id-six");
                        assertThat(applicationTemplate.getTitle())
                                .isIn("Fourth template", "Fifth template", "Sixth template");
                    });
                })
                .verifyComplete();
    }

    @Test
    public void getTemplateData_cacheIsNull_verifyDataIsFetchedFromSource()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        ApplicationTemplate templateOne = create("id-one", "First template");
        ApplicationTemplate templateTwo = create("id-two", "Seconds template");
        ApplicationTemplate templateThree = create("id-three", "Third template");

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateOne, templateTwo, templateThree)))
                .addHeader("Content-Type", "application/json"));

        // Set cache value as null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("applicationTemplateList");
        cacheField.setAccessible(true);
        cacheField.set(null, null);

        Mono<CacheableApplicationTemplate> templateListMono =
                CacheableTemplateHelper.getTemplates("recently-used", cloudServicesConfig.getBaseUrl());

        StepVerifier.create(templateListMono)
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-one", "id-two", "id-three");
                    });
                })
                .verifyComplete();
    }

    /* Scenarios covered via this test:
     * 1. CacheableTemplateHelper doesn't have the POJO or has an empty POJO.
     * 2. Fetch the templates via the normal flow by mocking CS.
     * 3. Check if the CacheableTemplateHelper.getApplicationTemplateList() is the same as the object returned by the normal flow function. This will ensure that the cache is being set correctly.
     * 4. From the above steps we now have the cache set.
     * 5. Fetch the templates again, verify the data is the same as the one fetched in step 2.
     * 6. Verify the cache is used and not the mock. This is done by asserting the lastUpdated time of the cache.
     */
    @Test
    public void getApplicationJson_cacheIsEmpty_VerifyDataSavedInCache()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", "1234567890");
        jsonObject.put("name", "My Page");
        jsonObject.put("icon", "flight");
        jsonObject.put("isDefault", true);
        JSONArray pages = new JSONArray();
        pages.put(jsonObject);

        JSONObject templateObj = new JSONObject();
        templateObj.put("title", "My Template");
        templateObj.put("pages", pages);

        JSONArray templates = new JSONArray();
        templates.put(templateObj);

        // Set Cache to null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("cacheableApplicationJsonMap");
        cacheField.setAccessible(true);
        cacheField.set(null, new HashMap<>());

        // mock the server to return a template when it's called
        mockCloudServices.enqueue(
                new MockResponse().setBody(templates.toString()).addHeader("Content-Type", "application/json"));

        Mono<CacheableApplicationJson> templateListMono =
                CacheableTemplateHelper.getApplicationByTemplateId("templateId", cloudServicesConfig.getBaseUrl());

        final Instant[] timeFromCache = {Instant.now()};
        // make sure we've received the response returned by the mockCloudServices
        StepVerifier.create(templateListMono)
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotEmpty();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isEqualTo(templates.toString());
                    timeFromCache[0] = cacheableApplicationJson1.getLastUpdated();
                })
                .verifyComplete();

        // Fetch the same application json again and verify the time stamp to confirm value is coming from POJO
        StepVerifier.create(CacheableTemplateHelper.getApplicationByTemplateId(
                        "templateId", cloudServicesConfig.getBaseUrl()))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotEmpty();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isEqualTo(templates.toString());
                    assertThat(cacheableApplicationJson1.getLastUpdated()).isEqualTo(timeFromCache[0]);
                })
                .verifyComplete();
    }

    /* Scenarios covered via this test:
     * 1. Set the cache time to 1 day before the current time.
     * 2. Fetch the templates again, verify the data is from the mock and not from the cache.
     */
    @Test
    public void getApplicationJson_CacheIsDirty_verifyDataIsFetchedFromSource()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", "1234567890");
        jsonObject.put("name", "My Page");
        jsonObject.put("icon", "flight");
        jsonObject.put("isDefault", true);
        JSONArray pages = new JSONArray();
        pages.put(jsonObject);

        JSONObject templateObj = new JSONObject();
        templateObj.put("title", "My Template");
        templateObj.put("pages", pages);

        JSONArray templates = new JSONArray();
        templates.put(templateObj);

        CacheableApplicationJson cacheableApplicationJson = new CacheableApplicationJson();
        cacheableApplicationJson.setApplicationJson(templates.toString());
        cacheableApplicationJson.setLastUpdated(Instant.now().minusSeconds(86600));

        Map<String, CacheableApplicationJson> cacheableApplicationJsonMap = new HashMap<>();
        cacheableApplicationJsonMap.put("templateId", cacheableApplicationJson);

        // Set Cache to null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("cacheableApplicationJsonMap");
        cacheField.setAccessible(true);
        cacheField.set(null, cacheableApplicationJsonMap);

        JSONObject jsonObject1 = new JSONObject();
        jsonObject1.put("id", "abc");
        jsonObject1.put("name", "New Page");
        jsonObject1.put("icon", "ship");
        jsonObject1.put("isDefault", true);
        JSONArray pages1 = new JSONArray();
        pages.put(jsonObject1);

        JSONObject templateObj1 = new JSONObject();
        templateObj.put("title", "New Template");
        templateObj.put("pages", pages);

        JSONArray templates1 = new JSONArray();
        templates.put(templateObj1);
        // mock the server to return a template when it's called
        mockCloudServices.enqueue(
                new MockResponse().setBody(templates1.toString()).addHeader("Content-Type", "application/json"));

        // make sure we've received the response returned by the mock
        StepVerifier.create(CacheableTemplateHelper.getApplicationByTemplateId(
                        "templateId", cloudServicesConfig.getBaseUrl()))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotEmpty();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotEqualTo(templates.toString());
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isEqualTo(templates1.toString());
                })
                .verifyComplete();
    }

    @Test
    public void getApplicationJson_cacheIsNull_verifyDataIsFetchedFromSource()
            throws JsonProcessingException, NoSuchFieldException, IllegalAccessException {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", "1234567890");
        jsonObject.put("name", "My Page");
        jsonObject.put("icon", "flight");
        jsonObject.put("isDefault", true);
        JSONArray pages = new JSONArray();
        pages.put(jsonObject);

        JSONObject templateObj = new JSONObject();
        templateObj.put("title", "My Template");
        templateObj.put("pages", pages);

        JSONArray templates = new JSONArray();
        templates.put(templateObj);

        // Set Cache to null
        Field cacheField = CacheableTemplateHelper.class.getDeclaredField("cacheableApplicationJsonMap");
        cacheField.setAccessible(true);
        cacheField.set(null, new HashMap<>());

        mockCloudServices.enqueue(
                new MockResponse().setBody(templates.toString()).addHeader("Content-Type", "application/json"));

        // make sure we've received the response returned by the mock
        StepVerifier.create(CacheableTemplateHelper.getApplicationByTemplateId(
                        "templateId", cloudServicesConfig.getBaseUrl()))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotEmpty();
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isEqualTo(templates.toString());
                })
                .verifyComplete();
    }
}
