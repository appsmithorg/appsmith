package com.appsmith.server.testhelpers.cloudservices;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

class FakeCloudServicesTest {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void should_returnGitRepoLimitInResponseEnvelope_when_pathHasRoute() throws Exception {
        // Given
        URI uri = URI.create(FakeCloudServices.baseUrl() + "/api/v1/git/limit/instance-id?ignored=1");

        // When
        HttpResponse<String> response = get(uri);

        // Then
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .isEqualTo("{\"responseMeta\": {\"status\": 200, \"success\": true}, \"data\": "
                        + FakeCloudServicesRoutesCE.GIT_PRIVATE_REPO_LIMIT + "}");
    }

    @Test
    void should_return404NamingThePath_when_pathHasNoRoute() throws Exception {
        // Given
        URI uri = URI.create(FakeCloudServices.baseUrl() + "/api/v1/not-a-route");

        // When
        HttpResponse<String> response = get(uri);

        // Then
        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(response.body()).contains("No fake cloud-services route for GET /api/v1/not-a-route");
    }

    private HttpResponse<String> get(URI uri) throws Exception {
        return httpClient.send(HttpRequest.newBuilder(uri).GET().build(), HttpResponse.BodyHandlers.ofString());
    }
}
