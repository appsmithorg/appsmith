package com.appsmith.server.configurations;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class OAuth2ClientRegistrationRepository implements ReactiveClientRegistrationRepository {

    public static final String GOOGLE_REGISTRATION_ID = "google";

    public static final String GITHUB_REGISTRATION_ID = "github";

    @Value("${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Value("${APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET:}")
    private String googleClientSecret;

    @Value("${APPSMITH_OAUTH2_GITHUB_CLIENT_ID:}")
    private String githubClientId;

    @Value("${APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET:}")
    private String githubClientSecret;

    private Map<String, ClientRegistration> registrations = new HashMap<>();

    @PostConstruct
    void init() {
        recreateGoogleClientRegistration();
        recreateGithubClientRegistration();
    }

    @Override
    public Mono<ClientRegistration> findByRegistrationId(String registrationId) {
        return Mono.justOrEmpty(registrations.get(registrationId));
    }

    private void recreateGoogleClientRegistration() {
        if (StringUtils.isEmpty(googleClientId)) {
            registrations.remove(GOOGLE_REGISTRATION_ID);
        } else {
            registrations.put(
                GOOGLE_REGISTRATION_ID,
                CommonOAuth2Provider.GOOGLE.getBuilder(GOOGLE_REGISTRATION_ID)
                    .clientId(googleClientId)
                    .clientSecret(googleClientSecret)
                    .userNameAttributeName("email")
                    .build()
            );
        }
    }

    private void recreateGithubClientRegistration() {
        if (StringUtils.isEmpty(githubClientId)) {
            registrations.remove(GITHUB_REGISTRATION_ID);
        } else {
            registrations.put(
                GITHUB_REGISTRATION_ID,
                CommonOAuth2Provider.GITHUB.getBuilder(GITHUB_REGISTRATION_ID)
                    .clientId(githubClientId)
                    .clientSecret(githubClientSecret)
                    .userNameAttributeName("login")
                    .build()
            );
        }
    }

    public void setGoogleClientId(String googleClientId) {
        this.googleClientId = googleClientId;
        recreateGoogleClientRegistration();
    }

    public void setGoogleClientSecret(String googleClientSecret) {
        this.googleClientSecret = googleClientSecret;
        recreateGoogleClientRegistration();
    }

    public void setGithubClientId(String githubClientId) {
        this.githubClientId = githubClientId;
        recreateGithubClientRegistration();
    }

    public void setGithubClientSecret(String githubClientSecret) {
        this.githubClientSecret = githubClientSecret;
        recreateGithubClientRegistration();
    }

    public Set<String> getAvailableClientIds() {
        // Note, this is a live-set. If the underlying map gets a key added or removed, it'll be reflected in this Set.
        return registrations.keySet();
    }

}
