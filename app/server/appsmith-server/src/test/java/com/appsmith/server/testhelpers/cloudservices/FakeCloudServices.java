package com.appsmith.server.testhelpers.cloudservices;

import lombok.extern.slf4j.Slf4j;
import mockwebserver3.Dispatcher;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;

/**
 * A local stand-in for Appsmith cloud-services. One server runs per test JVM and every Spring test context
 * shares it: {@link FakeCloudServicesContextCustomizerFactory} points {@code appsmith.cloud_services.base_url}
 * at it. No server test reaches a live cloud-services, in CI or on a developer machine.
 *
 * <p>Responses come from {@link FakeCloudServicesRoutes}. A request with no route gets a 404 and an error log
 * that names the path. The call never leaves the machine, but a caller that swallows errors still passes, so
 * search the test log for "no route for" after adding a cloud-services call.
 */
@Slf4j
public final class FakeCloudServices {

    private static MockWebServer server;

    private FakeCloudServices() {}

    /**
     * Starts the server on first use and returns its base URL, for example {@code http://127.0.0.1:53124}.
     */
    public static synchronized String baseUrl() {
        if (server == null) {
            MockWebServer started = new MockWebServer();
            started.setDispatcher(dispatcher(new FakeCloudServicesRoutes()));
            try {
                started.start(InetAddress.getLoopbackAddress(), 0);
            } catch (IOException e) {
                throw new UncheckedIOException("Could not start the fake cloud-services", e);
            }
            server = started;
        }
        return "http://" + server.getHostName() + ":" + server.getPort();
    }

    static Dispatcher dispatcher(FakeCloudServicesRoutesCE routes) {
        return new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                String method = request.getMethod();
                String path = request.getRequestUrl().encodedPath();
                return routes.route(method, path).orElseGet(() -> {
                    log.error(
                            "The fake cloud-services has no route for {} {}. Add one to FakeCloudServicesRoutesCE,"
                                    + " or mock the caller in the test.",
                            method,
                            path);
                    return new MockResponse()
                            .setResponseCode(404)
                            .setHeader("Content-Type", "application/json")
                            .setBody("{\"responseMeta\":{\"status\":404,\"success\":false,"
                                    + "\"error\":{\"message\":\"No fake cloud-services route for " + method + " "
                                    + path + "\"}}}");
                });
            }
        };
    }
}
