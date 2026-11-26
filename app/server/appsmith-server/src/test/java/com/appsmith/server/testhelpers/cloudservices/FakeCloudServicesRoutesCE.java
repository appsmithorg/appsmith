package com.appsmith.server.testhelpers.cloudservices;

import mockwebserver3.MockResponse;

import java.util.Optional;

/**
 * The cloud-services endpoints that server tests reach through Spring beans, with fixed responses.
 * Tests that check a specific cloud-services response or error still start their own {@code MockWebServer}.
 */
public class FakeCloudServicesRoutesCE {

    /** The private-repo limit cloud-services returns for a Community Edition instance. */
    public static final int GIT_PRIVATE_REPO_LIMIT = 3;

    /**
     * The mock datasets that cloud-services offers. Names, plugins, database names and usernames match the
     * live service, because tests assert on them. Hosts and passwords are placeholders: no test connects.
     */
    static final String MOCK_DATA_SETS =
            """
            {
              "name": "template-mockdb",
              "mockdbs": [
                {"name": "Movies", "pluginType": "db", "packageName": "mongo-plugin",
                 "description": "This contains a standard movies collection"},
                {"name": "Users", "pluginType": "db", "packageName": "postgres-plugin",
                 "description": "This contains a standard users information"}
              ],
              "credentials": [
                {"dbname": "movies", "username": "mockdb-admin", "password": "fake-password",
                 "host": "mongodb+srv://mockdb-admin:fake-password@mockdb.invalid/movies", "port": 27017},
                {"dbname": "users", "username": "users", "password": "fake-password",
                 "host": "mockdb.invalid", "port": 5432}
              ]
            }
            """;

    /**
     * Returns the response for a request, or empty when this fake has no route for it.
     *
     * @param method the HTTP method, for example {@code GET}
     * @param path   the request path without the query string
     */
    public Optional<MockResponse> route(String method, String path) {
        // InstanceConfigHelper registers the instance each time a Spring context starts.
        if ("POST".equals(method) && "/api/v1/installations".equals(path)) {
            return Optional.of(ok("\"fake-registered-instance\""));
        }
        // CacheablePylonHelperCEImpl accepts only responses signed by cloud-services, which this fake cannot
        // sign. Answer with an error, so the caller takes its documented fallback.
        if ("POST".equals(method) && "/api/v1/pylon/email-hash".equals(path)) {
            return Optional.of(new MockResponse().setResponseCode(503));
        }
        if (!"GET".equals(method)) {
            return Optional.empty();
        }
        if (path.startsWith("/api/v1/git/limit/")) {
            return Optional.of(ok(String.valueOf(GIT_PRIVATE_REPO_LIMIT)));
        }
        return switch (path) {
            case "/api/v1/ip" -> Optional.of(ok("\"127.0.0.1\""));
            case "/api/v1/mocks" -> Optional.of(ok(MOCK_DATA_SETS));
            case "/api/v1/releases" -> Optional.of(ok("{\"totalCount\": 0, \"nodes\": []}"));
            case "/api/v1/plugins" -> Optional.of(ok("[]"));
            default -> Optional.empty();
        };
    }

    /** Wraps {@code dataJson} in the {@code ResponseDTO} envelope that cloud-services returns. */
    protected static MockResponse ok(String dataJson) {
        return new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"responseMeta\": {\"status\": 200, \"success\": true}, \"data\": " + dataJson + "}");
    }
}
