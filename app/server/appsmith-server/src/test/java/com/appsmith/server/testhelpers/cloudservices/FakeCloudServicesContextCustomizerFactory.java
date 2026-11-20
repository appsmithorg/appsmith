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
 * <p>The property overrides {@code APPSMITH_CLOUD_SERVICES_BASE_URL} from the environment. Without it, an empty
 * value makes {@code CloudServicesConfigCE} fall back to the production cloud-services.
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
            TestPropertyValues.of("appsmith.cloud_services.base_url=" + FakeCloudServices.baseUrl())
                    .applyTo(context);
        }
    }
}
