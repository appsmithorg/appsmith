package com.appsmith.server.controllers;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.exports.internal.PartialExportService;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.imports.internal.PartialImportService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.io.IOException;

@ExtendWith(SpringExtension.class)
@WebFluxTest(ApplicationController.class)
@Import({SecurityTestConfig.class, RedisUtils.class, RedisTestContainerConfig.class})
public class ApplicationControllerTest {
    @MockBean
    ApplicationService applicationService;

    @MockBean
    ApplicationPageService applicationPageService;

    @MockBean
    ApplicationFetcher applicationFetcher;

    @MockBean
    ApplicationForkingService applicationForkingService;

    @MockBean
    ImportApplicationService importApplicationService;

    @MockBean
    ExportApplicationService exportApplicationService;

    @MockBean
    ApplicationSnapshotService applicationSnapshotService;

    @MockBean
    ThemeService themeService;

    @MockBean
    UserDataService userDataService;

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    AnalyticsService analyticsService;

    @MockBean
    GitFileUtils gitFileUtils;

    @MockBean
    SessionUserService sessionUserService;

    @MockBean
    PartialExportService partialExportService;

    @MockBean
    PartialImportService partialImportService;

    private String getFileName(int length) {
        StringBuilder fileName = new StringBuilder();
        for (int count = 0; count < length; count++) {
            fileName.append("i");
        }
        fileName.append(".json");
        return fileName.toString();
    }

    private MultipartBodyBuilder createBodyBuilder(String fileName) throws IOException {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();

        bodyBuilder
                .part(
                        "file",
                        new ClassPathResource("test_assets/ImportExportServiceTest/invalid-json-without-app.json")
                                .getFile(),
                        MediaType.APPLICATION_JSON)
                .header("Content-Disposition", "form-data; name=\"file\"; filename=" + fileName)
                .header("Content-Type", "application/json");
        return bodyBuilder;
    }

    @Test
    @WithMockUser
    public void whenFileUploadedWithLongHeader_thenVerifyErrorStatus() throws IOException {

        Mockito.when(importApplicationService.extractFileAndSaveApplication(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ApplicationImportDTO()));

        final String fileName = getFileName(130 * 1024);
        MultipartBodyBuilder bodyBuilder = createBodyBuilder(fileName);

        webTestClient
                .post()
                .uri(Url.APPLICATION_URL + "/import/orgId")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .exchange()
                .expectStatus()
                .isEqualTo(500)
                .expectBody()
                .json("{\n" + "    \"responseMeta\": {\n"
                        + "        \"status\": 500,\n"
                        + "        \"success\": false,\n"
                        + "        \"error\": {\n"
                        + "            \"code\": "
                        + AppsmithErrorCode.FILE_PART_DATA_BUFFER_ERROR.getCode() + ",\n"
                        + "            \"message\": \"Failed to upload file with error: Part headers exceeded the memory usage limit of 131072 bytes\"\n"
                        + "        }\n"
                        + "    }\n"
                        + "}");
    }

    @Test
    @WithMockUser
    public void whenFileUploadedWithShortHeader_thenVerifySuccessStatus() throws IOException {

        Mockito.when(importApplicationService.extractFileAndSaveApplication(
                        Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ApplicationImportDTO()));

        final String fileName = getFileName(2 * 1024);
        MultipartBodyBuilder bodyBuilder = createBodyBuilder(fileName);

        webTestClient
                .post()
                .uri(Url.APPLICATION_URL + "/import/orgId")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .exchange()
                .expectStatus()
                .isEqualTo(200);
    }
}
