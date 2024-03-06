package com.appsmith.server.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Configuration
public class OAuthPostLogoutConfiguration {

    @Value("${additional.oauth.to.logout}")
    private String[] additionalOauthToLogout;

    @Value("${default.oauth.to.logout}")
    private String[] defaultOauthToLogout;

    private Set<String> oauthToLogoutSet = null;

    public boolean shouldLogoutOfOAuth(String client) {
        if (Objects.isNull(oauthToLogoutSet)) {
            fillOauthToLogoutSet();
        }
        return oauthToLogoutSet.contains(client);
    }

    private void fillOauthToLogoutSet() {
        oauthToLogoutSet = new HashSet<>();
        oauthToLogoutSet.addAll(Arrays.asList(defaultOauthToLogout));
        oauthToLogoutSet.addAll(Arrays.asList(additionalOauthToLogout));
    }
}
