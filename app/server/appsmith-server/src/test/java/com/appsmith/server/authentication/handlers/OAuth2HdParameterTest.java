package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomServerOAuth2AuthorizationRequestResolverCE;
import com.appsmith.server.authentication.oauth2clientrepositories.CustomOauth2ClientRepositoryManager;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.RedirectHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.web.server.ServerWebExchange;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Test class to verify OAuth2 hd parameter handling for Spring Boot 3.3.13+ compatibility.
 *
 * This test ensures that:
 * - OAuth2 authorization requests contain at most one hd parameter
 * - Domain selection works correctly for single and multiple domain configurations
 * - The implementation is robust across different TLDs and domain patterns
 * - Fallback behavior works when no domain match is found
 */
@ExtendWith(MockitoExtension.class)
class OAuth2HdParameterTest {

    @Mock
    private ReactiveClientRegistrationRepository clientRegistrationRepository;

    @Mock
    private CommonConfig commonConfig;

    @Mock
    private RedirectHelper redirectHelper;

    @Mock
    private CustomOauth2ClientRepositoryManager oauth2ClientManager;

    private CustomServerOAuth2AuthorizationRequestResolverCE resolver;
    private ClientRegistration clientRegistration;

    @BeforeEach
    void setUp() {
        resolver = new CustomServerOAuth2AuthorizationRequestResolverCE(
                clientRegistrationRepository, commonConfig, redirectHelper, oauth2ClientManager);

        // Create a mock Google OAuth client registration
        clientRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("test-client-id")
                .clientSecret("test-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .scope(OidcScopes.OPENID, OidcScopes.EMAIL, OidcScopes.PROFILE)
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("email")
                .clientName("Google")
                .build();
    }

    @Test
    void testSingleDomainConfiguration() throws Exception {
        // Arrange
        List<String> singleDomain = Arrays.asList("company.com");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(singleDomain);

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://app.appsmith.com/oauth2/authorization/google"));

        // Act
        Map<String, Object> attributes = new HashMap<>();
        Map<String, Object> additionalParameters = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange, attributes, additionalParameters);

        // Assert
        assertTrue(additionalParameters.containsKey("hd"), "hd parameter should be present for single domain");
        assertEquals("company.com", additionalParameters.get("hd"), "hd should be the single configured domain");
        assertFalse(additionalParameters.get("hd") instanceof List, "hd should not be a List");
    }

    @Test
    void testMultipleDomainsWithMatchingSubdomain() throws Exception {
        // Arrange
        List<String> multipleDomains = Arrays.asList("company.com", "partner.org");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(multipleDomains);

        // Request from company.appsmith.com should derive "company" subdomain
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://company.appsmith.com/oauth2/authorization/google"));

        // Act
        Map<String, Object> attributes = new HashMap<>();
        Map<String, Object> additionalParameters = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange, attributes, additionalParameters);

        // Assert
        assertTrue(additionalParameters.containsKey("hd"), "hd parameter should be present when domain matches");
        assertEquals("company.com", additionalParameters.get("hd"), "hd should be the matching derived domain");
        assertFalse(additionalParameters.get("hd") instanceof List, "hd should not be a List");
    }

    @Test
    void testMultipleDomainsWithNonMatchingSubdomain() throws Exception {
        // Arrange
        List<String> multipleDomains = Arrays.asList("company.com", "partner.org");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(multipleDomains);

        // Request from demo.appsmith.com should derive "demo" subdomain which doesn't match
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://demo.appsmith.com/oauth2/authorization/google"));

        // Act
        Map<String, Object> attributes = new HashMap<>();
        Map<String, Object> additionalParameters = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange, attributes, additionalParameters);

        // Assert - should fallback to first domain when no match found
        assertTrue(
                additionalParameters.containsKey("hd"),
                "hd parameter should be present, falling back to first domain when derived domain doesn't match");
        assertEquals(
                "company.com",
                additionalParameters.get("hd"),
                "hd should fallback to the first allowed domain when no match is found");
        assertFalse(additionalParameters.get("hd") instanceof List, "hd should not be a List");
    }

    @Test
    void testEmptyDomainConfiguration() throws Exception {
        // Arrange
        List<String> emptyDomains = Arrays.asList();
        when(commonConfig.getOauthAllowedDomains()).thenReturn(emptyDomains);

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://app.appsmith.com/oauth2/authorization/google"));

        // Act
        Map<String, Object> attributes = new HashMap<>();
        Map<String, Object> additionalParameters = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange, attributes, additionalParameters);

        // Assert
        assertFalse(
                additionalParameters.containsKey("hd"),
                "hd parameter should not be present when no domains configured");
    }

    @Test
    void testSpringBoot3_3_13Compatibility() throws Exception {
        // Arrange - setup the scenario that would cause the original error
        List<String> multipleDomains = Arrays.asList("example.com", "test.com", "demo.org");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(multipleDomains);

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://demo.appsmith.com/oauth2/authorization/google"));

        // Act
        Map<String, Object> attributes = new HashMap<>();
        Map<String, Object> additionalParameters = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange, attributes, additionalParameters);

        // Assert - verify all OAuth2 parameters are single-valued
        for (Map.Entry<String, Object> entry : additionalParameters.entrySet()) {
            Object value = entry.getValue();

            // The critical assertion: no parameter should be a List, Set, or array
            assertFalse(
                    value instanceof List,
                    "OAuth2 parameter '" + entry.getKey() + "' cannot be a List - this would cause "
                            + "'OAuth 2 parameters can only have a single value: " + entry.getKey()
                            + "' error in Spring Boot 3.3.13+");

            assertFalse(value instanceof java.util.Set, "OAuth2 parameter '" + entry.getKey() + "' cannot be a Set");

            assertFalse(value instanceof Object[], "OAuth2 parameter '" + entry.getKey() + "' cannot be an array");

            // If present, must be a single value (String, etc.)
            if ("hd".equals(entry.getKey())) {
                assertTrue(value instanceof String, "hd parameter must be a String when present");
            }
        }
    }

    @Test
    void testRobustDomainMatching() throws Exception {
        // Test domain matching with various TLDs and multi-level subdomains
        List<String> multipleDomains = Arrays.asList("acme.com", "widgets.org", "example.net");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(multipleDomains);

        // Test 1: Exact domain match
        ServerWebExchange exchange1 =
                MockServerWebExchange.from(MockServerHttpRequest.get("https://acme.com/oauth2/authorization/google"));

        Map<String, Object> attributes1 = new HashMap<>();
        Map<String, Object> additionalParameters1 = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange1, attributes1, additionalParameters1);

        assertTrue(additionalParameters1.containsKey("hd"), "hd parameter should be present for exact domain match");
        assertEquals("acme.com", additionalParameters1.get("hd"), "Should match acme.com exactly");

        // Test 2: Subdomain match with .org TLD
        ServerWebExchange exchange2 = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://tools.widgets.org/oauth2/authorization/google"));

        Map<String, Object> attributes2 = new HashMap<>();
        Map<String, Object> additionalParameters2 = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange2, attributes2, additionalParameters2);

        assertTrue(additionalParameters2.containsKey("hd"), "hd parameter should be present for subdomain match");
        assertEquals("widgets.org", additionalParameters2.get("hd"), "Should match widgets.org by suffix");

        // Test 3: Most specific match (longest domain wins)
        List<String> specificDomains = Arrays.asList("example.com", "app.example.com");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(specificDomains);

        ServerWebExchange exchange3 = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://admin.app.example.com/oauth2/authorization/google"));

        Map<String, Object> attributes3 = new HashMap<>();
        Map<String, Object> additionalParameters3 = new HashMap<>();
        invokeAddAttributesAndAdditionalParameters(exchange3, attributes3, additionalParameters3);

        assertTrue(additionalParameters3.containsKey("hd"), "hd parameter should be present for most specific match");
        assertEquals(
                "app.example.com", additionalParameters3.get("hd"), "Should pick the most specific (longest) domain");
    }

    @Test
    void testDomainDerivationLogic() throws Exception {
        // Test the domain derivation method directly with realistic scenarios
        List<String> allowedDomains = Arrays.asList("acme.com", "widgets.org", "example.net");
        when(commonConfig.getOauthAllowedDomains()).thenReturn(allowedDomains);

        // Test case 1: Exact domain match - acme.com should match acme.com
        ServerWebExchange exchange1 =
                MockServerWebExchange.from(MockServerHttpRequest.get("https://acme.com/oauth2/authorization/google"));
        String derived1 = invokeDeriveFromRequest(exchange1);
        assertEquals("acme.com", derived1, "Should match acme.com exactly");

        // Test case 2: Subdomain match - api.widgets.org should match widgets.org
        ServerWebExchange exchange2 = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://api.widgets.org/oauth2/authorization/google"));
        String derived2 = invokeDeriveFromRequest(exchange2);
        assertEquals("widgets.org", derived2, "Should match widgets.org by subdomain");

        // Test case 3: Multi-level subdomain - admin.api.example.net should match example.net
        ServerWebExchange exchange3 = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://admin.api.example.net/oauth2/authorization/google"));
        String derived3 = invokeDeriveFromRequest(exchange3);
        assertEquals("example.net", derived3, "Should match example.net by multi-level subdomain");

        // Test case 4: No match - unknown.com should return null
        ServerWebExchange exchange4 = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://unknown.com/oauth2/authorization/google"));
        String derived4 = invokeDeriveFromRequest(exchange4);
        assertNull(derived4, "Should return null for unknown domain");

        // Test case 5: Case insensitive match - ACME.COM should match acme.com
        ServerWebExchange exchange5 =
                MockServerWebExchange.from(MockServerHttpRequest.get("https://ACME.COM/oauth2/authorization/google"));
        String derived5 = invokeDeriveFromRequest(exchange5);
        assertEquals("acme.com", derived5, "Should match acme.com case-insensitively");
    }

    /**
     * Uses reflection to invoke the protected addAttributesAndAdditionalParameters method.
     */
    private void invokeAddAttributesAndAdditionalParameters(
            ServerWebExchange exchange, Map<String, Object> attributes, Map<String, Object> additionalParameters)
            throws Exception {
        Method method = CustomServerOAuth2AuthorizationRequestResolverCE.class.getDeclaredMethod(
                "addAttributesAndAdditionalParameters",
                ServerWebExchange.class,
                ClientRegistration.class,
                Map.class,
                Map.class);
        method.setAccessible(true);
        method.invoke(resolver, exchange, clientRegistration, attributes, additionalParameters);
    }

    /**
     * Uses reflection to invoke the protected deriveDomainFromRequest method.
     */
    private String invokeDeriveFromRequest(ServerWebExchange exchange) throws Exception {
        Method method = CustomServerOAuth2AuthorizationRequestResolverCE.class.getDeclaredMethod(
                "deriveDomainFromRequest", ServerWebExchange.class);
        method.setAccessible(true);
        return (String) method.invoke(resolver, exchange);
    }
}
