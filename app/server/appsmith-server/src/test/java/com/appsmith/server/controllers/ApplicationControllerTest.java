package com.appsmith.server.controllers;

import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ApplicationForkingService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.io.IOException;

@RunWith(SpringRunner.class)
@WebFluxTest(ApplicationController.class)
@Import(SecurityTestConfig.class)
public class ApplicationControllerTest {
    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    ApplicationPageService applicationPageService;

    @MockBean
    ApplicationFetcher applicationFetcher;

    @MockBean
    ApplicationForkingService applicationForkingService;

    @MockBean
    ImportExportApplicationService importExportApplicationService;

    @MockBean
    ThemeService themeService;

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
                .part("file", new ClassPathResource("test_assets/ImportExportServiceTest/invalid-json-without-app.json").getFile(), MediaType.APPLICATION_JSON)
                .header("Content-Disposition", "form-data; name=\"file\"; filename=" + fileName)
                .header("Content-Type", "application/json");
        return bodyBuilder;
    }

    @Test
    @WithMockUser
    public void whenFileUploadedWithLongHeader_thenVerifyErrorStatus() throws IOException {

        Mockito.when(importExportApplicationService.extractFileAndSaveApplication(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new Application()));

        final String fileName = getFileName(130 * 1024);
        MultipartBodyBuilder bodyBuilder = createBodyBuilder(fileName);

        webTestClient.post()
                .uri(Url.APPLICATION_URL + "/import/orgId")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .exchange()
                .expectStatus()
                .isEqualTo(500)
                .expectBody()
                .json("{\n" +
                        "    \"responseMeta\": {\n" +
                        "        \"status\": 500,\n" +
                        "        \"success\": false,\n" +
                        "        \"error\": {\n" +
                        "            \"code\": 5017,\n" +
                        "            \"message\": \"Failed to upload file with error: Part headers exceeded the memory usage limit of 131072 bytes\"\n" +
                        "        }\n" +
                        "    }\n" +
                        "}");
    }

    @Test
    @WithMockUser
    public void whenFileUploadedWithShortHeader_thenVerifySuccessStatus() throws IOException {

        Mockito.when(importExportApplicationService.extractFileAndSaveApplication(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new Application()));

        final String fileName = getFileName(2 * 1024);
        MultipartBodyBuilder bodyBuilder = createBodyBuilder(fileName);

        webTestClient.post()
                .uri(Url.APPLICATION_URL + "/import/orgId")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .exchange()
                .expectStatus()
                .isEqualTo(200);
    }
}
