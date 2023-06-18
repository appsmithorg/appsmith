package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class AuthenticationConfigurationDTO {

    Boolean isEnabled;

    String importFromUrl;

    String importFromXml;

    Map<String, Object> configuration;

    // Stores the idp custom claim to appsmith user attribute mapping
    Map<String, String> claims;

}
