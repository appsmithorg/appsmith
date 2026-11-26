package com.appsmith.server.testhelpers.cloudservices;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ContextConfigurationAttributes;
import org.springframework.test.context.ContextCustomizer;
import org.springframework.test.context.ContextCustomizerFactory;
import org.springframework.test.context.MergedContextConfiguration;

import java.util.List;

/**
 * Points every Spring test context at {@link FakeCloudServices}. Registered in
 * {@code src/test/resources/META-INF/spring.factories}, so it applies without any annotation on the test.
 *
 * <p>It sets the base URL to the fake and blanks the signature base URL, so signed calls fall back to the fake
 * too. Both override the environment ({@code APPSMITH_CLOUD_SERVICES_BASE_URL},
 * {@code APPSMITH_CLOUD_SERVICES_SIGNATURE_BASE_URL}). Without them, an empty base URL makes
 * {@code CloudServicesConfigCE} fall back to the production cloud-services.
 *
 * <p>The override also wins over {@code @SpringBootTest(properties = ...)} and {@code @TestPropertySource}. A test
 * that needs its own server sets it on the {@code CloudServicesConfig} bean and restores it afterwards.
 */
public class FakeCloudServicesContextCustomizerFactory implements ContextCustomizerFactory {

    @Override
    public ContextCustomizer createContextCustomizer(
            Class<?> testClass, List<ContextConfigurationAttributes> configAttributes) {
        return new FakeCloudServicesContextCustomizer();
    }

    /**
     * Has no fields, so all instances are equal and Spring's context cache treats every test class the same.
     */
    private record FakeCloudServicesContextCustomizer() implements ContextCustomizer {

        @Override
        public void customizeContext(ConfigurableApplicationContext context, MergedContextConfiguration mergedConfig) {
            TestPropertyValues.of(
                            "appsmith.cloud_services.base_url=" + FakeCloudServices.baseUrl(),
                            "appsmith.cloud_services.signature_base_url=")
                    .applyTo(context);
        }
    }
}
