package com.appsmith.server.helpers;

import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.CacheableApplicationTemplate;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
public class CacheableTemplateHelperTemplateMetadataTest {

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
    public void getTemplateData_cacheIsEmpty_VerifyDataSavedInCache() throws JsonProcessingException {
        ApplicationTemplate templateOne = create("id-one", "First template");
        ApplicationTemplate templateTwo = create("id-two", "Seconds template");
        ApplicationTemplate templateThree = create("id-three", "Third template");

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateOne, templateTwo, templateThree)))
                .addHeader("Content-Type", "application/json"));

        Mono<CacheableApplicationTemplate> templateListMono =
                cacheableTemplateHelper.getTemplates("recently-used", baseUrl);

        final Instant[] timeFromCache = {Instant.now()};
        StepVerifier.create(templateListMono)
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-one", "id-two", "id-three");
                    });
                    timeFromCache[0] = cacheableApplicationTemplate1.getCacheExpiryTime();
                })
                .verifyComplete();

        // Fetch again and verify the time stamp to confirm value is coming from POJO
        StepVerifier.create(cacheableTemplateHelper.getTemplates("recently-used", baseUrl))
                .assertNext(cacheableApplicationTemplate1 -> {
                    assertThat(cacheableApplicationTemplate1.getApplicationTemplateList())
                            .hasSize(3);
                    cacheableApplicationTemplate1.getApplicationTemplateList().forEach(applicationTemplate -> {
                        assertThat(applicationTemplate.getId()).isIn("id-one", "id-two", "id-three");
                    });
                    assertThat(cacheableApplicationTemplate1.getCacheExpiryTime())
                            .isEqualTo(timeFromCache[0]);
                })
                .verifyComplete();

        /* Scenarios covered via this test:
         * 1. Mock the cache isCacheValid to return false, so the cache is invalidated
         * 2. Fetch the templates again, verify the data is from the mock and not from the cache.
         */
        ApplicationTemplate templateFour = create("id-four", "Fourth template");
        ApplicationTemplate templateFive = create("id-five", "Fifth template");
        ApplicationTemplate templateSix = create("id-six", "Sixth template");

        Mockito.doReturn(false).when(spyCacheableTemplateHelper).isCacheValid(any());

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateFour, templateFive, templateSix)))
                .addHeader("Content-Type", "application/json"));

        StepVerifier.create(spyCacheableTemplateHelper.getTemplates("recently-used", baseUrl))
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
}
