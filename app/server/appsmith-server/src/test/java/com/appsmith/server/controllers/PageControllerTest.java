package com.appsmith.server.controllers;

import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest
@AutoConfigureWebTestClient
@Import({SecurityTestConfig.class})
public class PageControllerTest {

    @Autowired
    private WebTestClient client;

    @MockBean
    private ApplicationPageService applicationPageService;

    @MockBean
    private NewPageService newPageService;

    @Test
    @WithMockUser
    void noBody() {
        client.post().uri("/api/v1/pages").exchange().expectStatus().isBadRequest();
        client.put().uri("/api/v1/pages/abcdef").exchange().expectStatus().isBadRequest();
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "../mal",
                "..\\mal",
                "/mal",
                "C:\\mal",
                "mal/",
                "/mal/",
                "\\mal",
                "mal\\",
                "\\mal\\",
                ":mal",
                ":mal/",
                ":mal\\",
                "",
                " ",
                "\t",
                "<",
                ">",
                "\"",
                "|",
                "?",
                "*",
                "\0",
                "\1",
                "\2",
                "\3",
                "\4",
                "\5",
                "\6",
                "\7",
                "\10",
                "\11",
                "\12",
                "\13",
                "\14",
                "\15",
                "\16",
                "\17",
                "\20",
                "\21",
                "\22",
                "\23",
                "\24",
                "\25",
                "\26",
                "\27",
                "\30",
                "\31",
                "\32",
                "\33",
                "\34",
                "\35",
                "\36",
                "\37",
                "CON",
                "PRN",
                "AUX",
                "NUL",
                "COM1",
                "COM2",
                "COM3",
                "COM4",
                "COM5",
                "COM6",
                "COM7",
                "COM8",
                "COM9",
                "LPT1",
                "LPT2",
                "LPT3",
                "LPT4",
                "LPT5",
                "LPT6",
                "LPT7",
                "LPT8",
                "LPT9",
                "CON.txt",
                "PRN.txt",
                "AUX.txt",
                "NUL.txt",
                "COM1.txt",
                "COM2.txt",
                "COM3.txt",
                "COM4.txt",
                "COM5.txt",
                "COM6.txt",
                "COM7.txt",
                "COM8.txt",
                "COM9.txt",
                "LPT1.txt",
                "LPT2.txt",
                "LPT3.txt",
                "LPT4.txt",
                "LPT5.txt",
                "LPT6.txt",
                "LPT7.txt",
                "LPT8.txt",
                "LPT9.txt",
            })
    @WithMockUser
    void invalidName(String name) {
        client.post()
                .uri("/api/v1/pages")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of("name", name)))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errorDisplay")
                .value(s -> assertThat((String) s).contains("Validation Failure"));

        verifyNoInteractions(applicationPageService);

        client.put()
                .uri("/api/v1/pages/abcdef")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of("name", name)))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errorDisplay")
                .value(s -> assertThat((String) s).contains("Validation Failure"));

        verifyNoInteractions(newPageService);
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "../mal",
                "..\\mal",
                "/mal",
                "C:\\mal",
                "mal/",
                "/mal/",
                "\\mal",
                "mal\\",
                "\\mal\\",
                ":mal",
                ":mal/",
                ":mal\\",
                "spaced content",
                "newline\ncontent",
                "  untrimmed  ",
            })
    @WithMockUser
    void invalidCustomSlug(String slug) {
        client.put()
                .uri("/api/v1/pages/abcdef")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of("customSlug", slug)))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errorDisplay")
                .value(s -> assertThat((String) s).contains("Validation Failure"));

        verifyNoInteractions(newPageService);
    }

    @Test
    @WithMockUser
    void emptyCustomSlugShouldBeOkay() {
        doReturn(Mono.just(new PageDTO())).when(newPageService).updatePage(anyString(), any());

        client.put()
                .uri("/api/v1/pages/abcdef")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of("customSlug", "")))
                .exchange();

        verify(newPageService, times(1)).updatePage(eq("abcdef"), any());
    }
}
