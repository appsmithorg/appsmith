package com.appsmith.server.configurations;

import com.appsmith.server.constants.Url;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

@SpringBootTest
public class CsrfTest {
    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    @ParameterizedTest
    @MethodSource("testParams")
    void testCsrf(TestParams t) {
        final String tokenValue = UUID.randomUUID().toString();

        final WebTestClient.RequestBodySpec spec = webTestClient
                .post()
                .uri(t.url)
                .header(HttpHeaders.ORIGIN, "localhost")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

        final BodyInserters.FormInserter<String> body =
                BodyInserters.fromFormData("username", "user@example.com").with("password", "password");
        if (t.formParam != null) {
            body.with(t.formParam, tokenValue);
        }

        if (t.cookieName != null) {
            spec.cookie(t.cookieName, tokenValue);
        }

        final WebTestClient.ResponseSpec response = spec.body(body).exchange();

        if ("_csrf".equals(t.formParam) && "XSRF-TOKEN".equals(t.cookieName)) {
            // Redirects to error because the username/password are incorrect, and that's okay. The fact that it
            // attempted a login is test enough here.
            response.expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueMatches(HttpHeaders.LOCATION, ".*\\?error=.*");
        } else {
            response.expectStatus().isForbidden();
        }
    }

    private record TestParams(String url, String formParam, String cookieName) {}

    private static Stream<Arguments> testParams() {
        final List<String> urls = List.of(Url.LOGIN_URL, Url.USER_URL, Url.USER_URL + "/super");

        final List<String> formParams = new ArrayList<>(List.of("_csrf", "_wrong_csrf"));
        formParams.add(null);

        final List<String> cookieNames = new ArrayList<>(List.of("XSRF-TOKEN", "SOMETHING-ELSE"));
        cookieNames.add(null);

        List<Arguments> args = new ArrayList<>();

        for (final String url : urls) {
            for (final String formParam : formParams) {
                for (final String cookieName : cookieNames) {
                    args.add(Arguments.of(new TestParams(url, formParam, cookieName)));
                }
            }
        }

        return args.stream();
    }
}
