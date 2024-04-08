package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.models.OAuth2;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Map;

public class OAuth2Utils {
    public static Instant getAuthenticationExpiresAt(OAuth2 oAuth2, Map<String, Object> response, Instant issuedAt) {
        Instant expiresAt = null;
        String expiresIn = oAuth2.getExpiresIn();
        // If expires_in property in datasource form is left blank when creating ds,
        // We expect at least one of the following to be present
        if (StringUtils.isEmpty(expiresIn)) {
            Object expiresAtResponse = response.get(Authentication.EXPIRES_AT);
            Object expiresInResponse = response.get(Authentication.EXPIRES_IN);
            if (expiresAtResponse != null) {
                expiresAt = Instant.ofEpochSecond(Long.parseLong(String.valueOf(expiresAtResponse)));
            } else if (expiresInResponse != null) {
                expiresAt = issuedAt.plusSeconds(Long.parseLong(String.valueOf(expiresInResponse)));
            }
        } else {
            // we have expires_in field from datasource config, we will always use that
            expiresAt = issuedAt.plusSeconds(Long.parseLong(expiresIn));
        }
        return expiresAt;
    }
}
