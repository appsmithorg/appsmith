package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * This test is written based on the inspiration from the tutorial: https://www.baeldung.com/spring-mocking-webclient
 */
@ExtendWith(SpringExtension.class)
public class ApplicationTemplateServiceUnitTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static MockWebServer mockCloudServices;
    ApplicationTemplateService applicationTemplateService;

    @MockBean
    ApplicationPermission applicationPermission;

    @MockBean
    private UserDataService userDataService;

    @MockBean
    private CloudServicesConfig cloudServicesConfig;

    @MockBean
    private ReleaseNotesService releaseNotesService;

    @MockBean
    private ImportApplicationService importApplicationService;

    @MockBean
    private ExportApplicationService exportApplicationService;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private ResponseUtils responseUtils;

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

        // mock the cloud services config so that it returns mock server url as cloud service base url
        Mockito.when(cloudServicesConfig.getBaseUrl()).thenReturn(baseUrl);

        applicationTemplateService = new ApplicationTemplateServiceImpl(
                cloudServicesConfig,
                releaseNotesService,
                importApplicationService,
                exportApplicationService,
                analyticsService,
                userDataService,
                applicationService,
                responseUtils,
                applicationPermission,
                objectMapper);
    }

    private ApplicationTemplate create(String id, String title) {
        ApplicationTemplate applicationTemplate = new ApplicationTemplate();
        applicationTemplate.setId(id);
        applicationTemplate.setTitle(title);
        return applicationTemplate;
    }

    @Test
    public void getActiveTemplates_WhenRecentlyUsedExists_RecentOnesComesFirst() throws JsonProcessingException {
        ApplicationTemplate templateOne = create("id-one", "First template");
        ApplicationTemplate templateTwo = create("id-two", "Seonds template");
        ApplicationTemplate templateThree = create("id-three", "Third template");

        // mock the server to return the above three templates
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(templateOne, templateTwo, templateThree)))
                .addHeader("Content-Type", "application/json"));

        // mock the user data to set second template as recently used
        UserData mockUserData = new UserData();
        mockUserData.setRecentlyUsedTemplateIds(List.of("id-two"));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(mockUserData));

        Mono<List<ApplicationTemplate>> templateListMono = applicationTemplateService.getActiveTemplates(null);

        StepVerifier.create(templateListMono)
                .assertNext(applicationTemplates -> {
                    assertThat(applicationTemplates.size()).isEqualTo(3);
                    assertThat(applicationTemplates.get(0).getId()).isEqualTo("id-two"); // second one should come first
                })
                .verifyComplete();
    }

    @Test
    public void getRecentlyUsedTemplates_WhenNoRecentTemplate_ReturnsEmpty() {
        // mock the user data to that has no recent template
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(new UserData()));

        StepVerifier.create(applicationTemplateService.getRecentlyUsedTemplates())
                .verifyComplete();
    }

    @Test
    public void getRecentlyUsedTemplates_WhenRecentTemplatesExist_ReturnsTemplates()
            throws InterruptedException, JsonProcessingException {
        // mock the user data to set recently used template ids
        UserData mockUserData = new UserData();
        mockUserData.setRecentlyUsedTemplateIds(List.of("id-one", "id-two"));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(mockUserData));

        // mock the server to return a template when it's called
        mockCloudServices.enqueue(new MockResponse()
                .setBody(objectMapper.writeValueAsString(List.of(create("id-one", "First template"))))
                .addHeader("Content-Type", "application/json"));

        // make sure we've received the response returned by the mockCloudServices
        StepVerifier.create(applicationTemplateService.getRecentlyUsedTemplates())
                .assertNext(
                        applicationTemplates -> assertThat(applicationTemplates).hasSize(1))
                .verifyComplete();

        // verify that mockCloudServices was called with the query param id i.e. id=id-one&id=id-two
        RecordedRequest recordedRequest = mockCloudServices.takeRequest();
        assert recordedRequest.getRequestUrl() != null;
        List<String> queryParameterValues = recordedRequest.getRequestUrl().queryParameterValues("id");
        assertThat(queryParameterValues).containsExactly("id-one", "id-two");
    }

    @Test
    public void get_WhenPageMetaDataExists_PageMetaDataParsedProperly() throws JsonProcessingException {
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

        // mock the server to return a template when it's called
        mockCloudServices.enqueue(
                new MockResponse().setBody(templates.toString()).addHeader("Content-Type", "application/json"));

        // mock the user data to set recently used template ids
        UserData mockUserData = new UserData();
        mockUserData.setRecentlyUsedTemplateIds(List.of());
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(mockUserData));

        // make sure we've received the response returned by the mockCloudServices
        StepVerifier.create(applicationTemplateService.getActiveTemplates(null))
                .assertNext(applicationTemplates -> {
                    assertThat(applicationTemplates.size()).isEqualTo(1);
                    ApplicationTemplate applicationTemplate = applicationTemplates.get(0);
                    assertThat(applicationTemplate.getPages()).hasSize(1);
                    PageNameIdDTO pageNameIdDTO = applicationTemplate.getPages().get(0);
                    assertThat(pageNameIdDTO.getId()).isEqualTo("1234567890");
                    assertThat(pageNameIdDTO.getName()).isEqualTo("My Page");
                    assertThat(pageNameIdDTO.getIcon()).isEqualTo("flight");
                    assertThat(pageNameIdDTO.getIsDefault()).isTrue();
                })
                .verifyComplete();
    }
}
