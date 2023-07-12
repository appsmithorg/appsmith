package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class OAuth2ResponseDTO {
    DatasourceStorage datasource;
    String token;
    String projectID;
}
