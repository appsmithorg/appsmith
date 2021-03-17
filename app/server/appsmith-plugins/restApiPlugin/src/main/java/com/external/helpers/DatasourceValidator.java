package com.external.helpers;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Set;

public class DatasourceValidator {

    public static Set<String> validateAuthentication(AuthenticationDTO authenticationDTO) {

        if (authenticationDTO instanceof OAuth2) {
            if (OAuth2.Type.CLIENT_CREDENTIALS.equals(((OAuth2) authenticationDTO).getGrantType())) {
                return validateClientCredentials((OAuth2) authenticationDTO);
            } else if (OAuth2.Type.AUTHORIZATION_CODE.equals(((OAuth2) authenticationDTO).getGrantType())) {
                return validateAuthorizationCode((OAuth2) authenticationDTO);
            } else {
                return Set.of();
            }
        } else {
            return Set.of();
        }
    }

    private static Set<String> validateClientCredentials(OAuth2 authenticationDTO) {
        Set<String> invalids = new HashSet<>();
        if (StringUtils.isEmpty(authenticationDTO.getClientId())) {
            invalids.add("Missing Client ID");
        }
        if (StringUtils.isEmpty(authenticationDTO.getClientSecret())) {
            invalids.add("Missing Client Secret");
        }
        if (StringUtils.isEmpty(authenticationDTO.getAccessTokenUrl())) {
            invalids.add("Missing Access Token URL");
        }

        return invalids;
    }

    private static Set<String> validateAuthorizationCode(OAuth2 authenticationDTO) {
        Set<String> invalids = validateClientCredentials(authenticationDTO);

        if (StringUtils.isEmpty(authenticationDTO.getAuthorizationUrl())) {
            invalids.add("Missing Authorization URL");
        }

        return invalids;
    }
}
