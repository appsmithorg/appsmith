package com.appsmith.server.testhelpers.cloudservices;

import com.appsmith.server.configurations.CloudServicesConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Fails if {@link FakeCloudServicesContextCustomizerFactory} drops out of {@code META-INF/spring.factories}, for
 * example in a CE to EE merge. Without it, the suite silently calls the production cloud-services.
 *
 * <p>Both URLs start with non-empty values, as if the environment set them. So each assertion fails when the
 * customizer stops overriding that URL.
 */
@SpringBootTest(
        properties = {
            "appsmith.cloud_services.base_url=http://cloud-services-from-env.invalid",
            "appsmith.cloud_services.signature_base_url=http://signature-cloud-services-from-env.invalid"
        })
class FakeCloudServicesWiringTest {

    @Autowired
    private CloudServicesConfig cloudServicesConfig;

    @Test
    void should_pointCloudServicesAtFake_when_springTestContextStarts() {
        // Given
        String fakeBaseUrl = FakeCloudServices.baseUrl();

        // When
        String baseUrl = cloudServicesConfig.getBaseUrl();
        String signatureBaseUrl = cloudServicesConfig.getBaseUrlWithSignatureVerification();

        // Then
        assertThat(baseUrl).isEqualTo(fakeBaseUrl);
        assertThat(signatureBaseUrl).isEqualTo(fakeBaseUrl);
    }
}
