package com.appsmith.server.authentication.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.Environment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Customizes OAuth2 client properties to handle empty client IDs.
 * This component runs early in the Spring initialization process and replaces
 * empty client ID values with "missing_value_sentinel" to trigger default values.
 *
 * Handles any OAuth provider registered using the standard Spring Security OAuth2 properties.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class OAuth2PropertiesCustomizer implements BeanFactoryPostProcessor, EnvironmentAware, ApplicationContextAware {

    private static final String MISSING_VALUE_SENTINEL = "missing_value_sentinel";

    // Spring OAuth2 client property patterns
    private static final String OAUTH_CLIENT_ID_PREFIX = "spring.security.oauth2.client.registration.";
    private static final String OAUTH_CLIENT_ID_SUFFIX = ".client-id";
    private static final Pattern CLIENT_ID_PATTERN =
            Pattern.compile(OAUTH_CLIENT_ID_PREFIX + "(.*?)" + OAUTH_CLIENT_ID_SUFFIX);

    private Environment environment;
    private ApplicationContext applicationContext;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        log.info("OAuth2PropertiesCustomizer: Processing OAuth2 properties early in application startup");

        if (!(environment instanceof ConfigurableEnvironment)) {
            log.warn("Environment is not a ConfigurableEnvironment, skipping OAuth2 property customization");
            return;
        }

        ConfigurableEnvironment configurableEnvironment = (ConfigurableEnvironment) environment;

        // Find all OAuth client registration properties
        Set<String> clientIdProperties = findAllOAuthClientIdProperties(configurableEnvironment);

        if (clientIdProperties.isEmpty()) {
            log.debug("No OAuth client ID properties found in environment");
            return;
        }

        // Create a map to collect all overrides
        Map<String, Object> allOverrides = new HashMap<>();

        // Process each client ID property
        for (String propertyName : clientIdProperties) {
            String value = configurableEnvironment.getProperty(propertyName);

            if (value != null && value.isEmpty()) {
                // Extract provider name from the property name
                String provider = extractProviderName(propertyName);

                log.info("Replacing empty client ID for OAuth provider: {}", provider);
                allOverrides.put(propertyName, MISSING_VALUE_SENTINEL);
            }
        }

        // If we have overrides to apply, add them as a high priority property source
        if (!allOverrides.isEmpty()) {
            log.info("Adding property overrides for {} OAuth providers with empty client IDs", allOverrides.size());

            MutablePropertySources propertySources = configurableEnvironment.getPropertySources();
            PropertySource<?> oauthOverrides = new MapPropertySource("oauthClientIdOverrides", allOverrides);
            propertySources.addFirst(oauthOverrides);
        }
    }

    /**
     * Find all OAuth client ID properties in the environment.
     */
    private Set<String> findAllOAuthClientIdProperties(ConfigurableEnvironment environment) {
        Set<String> properties = new HashSet<>();

        for (PropertySource<?> propertySource : environment.getPropertySources()) {
            if (propertySource instanceof EnumerablePropertySource) {
                EnumerablePropertySource<?> enumerableSource = (EnumerablePropertySource<?>) propertySource;
                for (String name : enumerableSource.getPropertyNames()) {
                    if (name.startsWith(OAUTH_CLIENT_ID_PREFIX) && name.endsWith(OAUTH_CLIENT_ID_SUFFIX)) {
                        properties.add(name);
                    }
                }
            }
        }

        log.debug("Found OAuth client ID properties: {}", properties);
        return properties;
    }

    /**
     * Extract the provider name from a client ID property.
     * For example, from "spring.security.oauth2.client.registration.github.client-id"
     * this will extract "github".
     */
    private String extractProviderName(String propertyName) {
        Matcher matcher = CLIENT_ID_PATTERN.matcher(propertyName);
        if (matcher.matches() && matcher.groupCount() >= 1) {
            return matcher.group(1);
        }

        // Fallback if regex fails
        String withoutPrefix = propertyName.substring(OAUTH_CLIENT_ID_PREFIX.length());
        return withoutPrefix.substring(0, withoutPrefix.indexOf('.'));
    }
}
