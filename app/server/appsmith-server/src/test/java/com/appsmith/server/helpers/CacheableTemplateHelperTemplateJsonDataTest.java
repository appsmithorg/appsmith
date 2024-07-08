package com.appsmith.server.helpers;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CacheableApplicationJson;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * This test is written based on the inspiration from the tutorial:
 * https://www.baeldung.com/spring-mocking-webclient
 */
@SpringBootTest
public class CacheableTemplateHelperTemplateJsonDataTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static MockWebServer mockCloudServices;

    @MockBean
    ApplicationPermission applicationPermission;

    @Autowired
    CacheableTemplateHelper cacheableTemplateHelper;

    @SpyBean
    CacheableTemplateHelper spyCacheableTemplateHelper;

    String baseUrl;

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
        baseUrl = String.format("http://localhost:%s", mockCloudServices.getPort());
    }

    /* Scenarios covered via this test:
        * 1. CacheableTemplateHelper doesn't have the POJO or has an empty POJO.
        * 2. Fetch the templates via the normal flow by mocking CS.
        * 3. Check if the CacheableTemplateHelper.getApplicationTemplateList() is the same as the object returned by
    the normal flow function. This will ensure that the cache is being set correctly.
        * 4. From the above steps we now have the cache set.
        * 5. Fetch the templates again, verify the data is the same as the one fetched in step 2.
        * 6. Verify the cache is used and not the mock. This is done by asserting the lastUpdated time of the cache.
        */
    @Test
    public void getApplicationJson_cacheIsEmpty_VerifyDataSavedInCache() throws JsonProcessingException {
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setArtifactJsonType(ArtifactType.APPLICATION);
        applicationJson.setExportedApplication(new Application());

        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
                .isEqualTo(0);

        // mock the server to return a template when it's called
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(applicationJson))
                .addHeader("Content-Type", "application/json"));

        Mono<CacheableApplicationJson> templateListMono =
                cacheableTemplateHelper.getApplicationByTemplateId("templateId", baseUrl);

        final Instant[] timeFromCache = {Instant.now()};
        // make sure we've received the response returned by the mockCloudServices
        StepVerifier.create(templateListMono)
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    timeFromCache[0] = cacheableApplicationJson1.getCacheExpiryTime();
                })
                .verifyComplete();

        // Fetch the same application json again and verify the time stamp to confirm value is coming from POJO
        StepVerifier.create(cacheableTemplateHelper.getApplicationByTemplateId("templateId", baseUrl))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1.getCacheExpiryTime()).isEqualTo(timeFromCache[0]);
                })
                .verifyComplete();
        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
                .isEqualTo(1);
    }

    /* Scenarios covered via this test:
     * 1. Mock the cache isCacheValid to return false, so the cache is invalidated
     * 2. Fetch the templates again, verify the data is from the mock and not from the cache.
     */
    @Test
    public void getApplicationJson_cacheIsDirty_verifyDataIsFetchedFromSource() {
        ApplicationJson applicationJson = new ApplicationJson();
        Application test = new Application();
        test.setName("New Application");
        applicationJson.setArtifactJsonType(ArtifactType.APPLICATION);
        applicationJson.setExportedApplication(test);

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(new Gson().toJson(applicationJson))
                .addHeader("Content-Type", "application/json"));

        Mockito.doReturn(false).when(spyCacheableTemplateHelper).isCacheValid(any());

        // make sure we've received the response returned by the mock
        StepVerifier.create(spyCacheableTemplateHelper.getApplicationByTemplateId("templateId", baseUrl))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1
                                    .getApplicationJson()
                                    .getExportedApplication()
                                    .getName())
                            .isEqualTo("New Application");
                })
                .verifyComplete();
    }

    @Test
    public void getApplicationJson_cacheKeyIsMissing_verifyDataIsFetchedFromSource() {
        ApplicationJson applicationJson1 = new ApplicationJson();
        Application application = new Application();
        application.setName("Test Application");
        applicationJson1.setArtifactJsonType(ArtifactType.APPLICATION);
        applicationJson1.setExportedApplication(application);

        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
                .isEqualTo(1);

        mockCloudServices.enqueue(new MockResponse()
                .setBody(new Gson().toJson(applicationJson1))
                .addHeader("Content-Type", "application/json"));

        // make sure we've received the response returned by the mock
        StepVerifier.create(cacheableTemplateHelper.getApplicationByTemplateId("templateId1", baseUrl))
                .assertNext(cacheableApplicationJson1 -> {
                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
                    assertThat(cacheableApplicationJson1
                                    .getApplicationJson()
                                    .getExportedApplication()
                                    .getName())
                            .isEqualTo("Test Application");
                })
                .verifyComplete();
    }
}
