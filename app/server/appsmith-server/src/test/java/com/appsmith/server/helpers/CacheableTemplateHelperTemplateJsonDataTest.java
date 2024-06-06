package com.appsmith.server.helpers;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

/**
 * This test is written based on the inspiration from the tutorial:
 * https://www.baeldung.com/spring-mocking-webclient
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class CacheableTemplateHelperTemplateJsonDataTest {
    //    private static final ObjectMapper objectMapper = new ObjectMapper();
    //    private static MockWebServer mockCloudServices;
    //
    //    @MockBean
    //    ApplicationPermission applicationPermission;
    //
    //    @MockBean
    //    private CloudServicesConfig cloudServicesConfig;
    //
    //    @Autowired
    //    CacheableTemplateHelper cacheableTemplateHelper;
    //
    //    @SpyBean
    //    CacheableTemplateHelper spyCacheableTemplateHelper;
    //
    //    @BeforeAll
    //    public static void setUp() throws IOException {
    //        mockCloudServices = new MockWebServer();
    //        mockCloudServices.start();
    //    }
    //
    //    @AfterAll
    //    public static void tearDown() throws IOException {
    //        mockCloudServices.shutdown();
    //    }
    //
    //    @BeforeEach
    //    public void initialize() {
    //        String baseUrl = String.format("http://localhost:%s", mockCloudServices.getPort());
    //
    //        // mock the cloud services config so that it returns mock server url as cloud
    //        // service base url
    //        Mockito.when(cloudServicesConfig.getBaseUrl()).thenReturn(baseUrl);
    //    }
    //
    //    private ApplicationTemplate create(String id, String title) {
    //        ApplicationTemplate applicationTemplate = new ApplicationTemplate();
    //        applicationTemplate.setId(id);
    //        applicationTemplate.setTitle(title);
    //        return applicationTemplate;
    //    }
    //
    //    /* Scenarios covered via this test:
    //     * 1. CacheableTemplateHelper doesn't have the POJO or has an empty POJO.
    //     * 2. Fetch the templates via the normal flow by mocking CS.
    //     * 3. Check if the CacheableTemplateHelper.getApplicationTemplateList() is the same as the object returned by
    // the normal flow function. This will ensure that the cache is being set correctly.
    //     * 4. From the above steps we now have the cache set.
    //     * 5. Fetch the templates again, verify the data is the same as the one fetched in step 2.
    //     * 6. Verify the cache is used and not the mock. This is done by asserting the lastUpdated time of the cache.
    //     */
    //    @Test
    //    public void getApplicationJson_cacheIsEmpty_VerifyDataSavedInCache() throws JsonProcessingException {
    //        ApplicationJson applicationJson = new ApplicationJson();
    //        applicationJson.setArtifactJsonType(ArtifactType.APPLICATION);
    //        applicationJson.setExportedApplication(new Application());
    //
    //        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
    //                .isEqualTo(0);
    //
    //        // mock the server to return a template when it's called
    //        mockCloudServices.enqueue(new MockResponse()
    //                .setBody(objectMapper.writeValueAsString(applicationJson))
    //                .addHeader("Content-Type", "application/json"));
    //
    //        Mono<CacheableApplicationJson> templateListMono =
    //                cacheableTemplateHelper.getApplicationByTemplateId("templateId",
    // cloudServicesConfig.getBaseUrl());
    //
    //        final Instant[] timeFromCache = {Instant.now()};
    //        // make sure we've received the response returned by the mockCloudServices
    //        StepVerifier.create(templateListMono)
    //                .assertNext(cacheableApplicationJson1 -> {
    //                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
    //                    timeFromCache[0] = cacheableApplicationJson1.getCacheExpiryTime();
    //                })
    //                .verifyComplete();
    //
    //        // Fetch the same application json again and verify the time stamp to confirm value is coming from POJO
    //        StepVerifier.create(cacheableTemplateHelper.getApplicationByTemplateId(
    //                        "templateId", cloudServicesConfig.getBaseUrl()))
    //                .assertNext(cacheableApplicationJson1 -> {
    //                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
    //                    assertThat(cacheableApplicationJson1.getCacheExpiryTime()).isEqualTo(timeFromCache[0]);
    //                })
    //                .verifyComplete();
    //        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
    //                .isEqualTo(1);
    //    }
    //
    //    /* Scenarios covered via this test:
    //     * 1. Mock the cache isCacheValid to return false, so the cache is invalidated
    //     * 2. Fetch the templates again, verify the data is from the mock and not from the cache.
    //     */
    //    @Test
    //    public void getApplicationJson_cacheIsDirty_verifyDataIsFetchedFromSource() {
    //        ApplicationJson applicationJson = new ApplicationJson();
    //        Application test = new Application();
    //        test.setName("New Application");
    //        applicationJson.setArtifactJsonType(ArtifactType.APPLICATION);
    //        applicationJson.setExportedApplication(test);
    //
    //        // mock the server to return the above three templates
    //        mockCloudServices.enqueue(new MockResponse()
    //                .setBody(new Gson().toJson(applicationJson))
    //                .addHeader("Content-Type", "application/json"));
    //
    //        Mockito.doReturn(false).when(spyCacheableTemplateHelper).isCacheValid(any());
    //
    //        // make sure we've received the response returned by the mock
    //        StepVerifier.create(spyCacheableTemplateHelper.getApplicationByTemplateId(
    //                        "templateId", cloudServicesConfig.getBaseUrl()))
    //                .assertNext(cacheableApplicationJson1 -> {
    //                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
    //                    assertThat(cacheableApplicationJson1
    //                                    .getApplicationJson()
    //                                    .getExportedApplication()
    //                                    .getName())
    //                            .isEqualTo("New Application");
    //                })
    //                .verifyComplete();
    //    }
    //
    //    @Test
    //    public void getApplicationJson_cacheKeyIsMissing_verifyDataIsFetchedFromSource() {
    //        ApplicationJson applicationJson1 = new ApplicationJson();
    //        Application application = new Application();
    //        application.setName("Test Application");
    //        applicationJson1.setArtifactJsonType(ArtifactType.APPLICATION);
    //        applicationJson1.setExportedApplication(application);
    //
    //        assertThat(cacheableTemplateHelper.getCacheableApplicationJsonMap().size())
    //                .isEqualTo(1);
    //
    //        mockCloudServices.enqueue(new MockResponse()
    //                .setBody(new Gson().toJson(applicationJson1))
    //                .addHeader("Content-Type", "application/json"));
    //
    //        // make sure we've received the response returned by the mock
    //        StepVerifier.create(cacheableTemplateHelper.getApplicationByTemplateId(
    //                        "templateId1", cloudServicesConfig.getBaseUrl()))
    //                .assertNext(cacheableApplicationJson1 -> {
    //                    assertThat(cacheableApplicationJson1.getApplicationJson()).isNotNull();
    //                    assertThat(cacheableApplicationJson1
    //                                    .getApplicationJson()
    //                                    .getExportedApplication()
    //                                    .getName())
    //                            .isEqualTo("Test Application");
    //                })
    //                .verifyComplete();
    //    }
}
