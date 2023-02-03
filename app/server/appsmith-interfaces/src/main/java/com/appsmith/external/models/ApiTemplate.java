package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ApiTemplate extends BaseDomain {

    // ApiTemplate fields below :
    @JsonView(Views.Public.class)
    String name; //API name here

    @JsonView(Views.Public.class)
    String providerId; //Providers, e.g. Salesforce should exist in the db and its id should come here.

    @JsonView(Views.Public.class)
    String publisher; //e.g. RapidAPI

    @JsonView(Views.Public.class)
    String packageName; //Plugin package name used to execute the final action created by this template

    @JsonView(Views.Public.class)
    String versionId;

    @JsonView(Views.Public.class)
    ApiTemplateConfiguration apiTemplateConfiguration;

    @JsonView(Views.Public.class)
    ActionConfiguration actionConfiguration;

    @JsonView(Views.Public.class)
    DatasourceConfiguration datasourceConfiguration;

    @JsonView(Views.Public.class)
    String hashValue;

    @JsonView(Views.Public.class)
    String scraperId;
}
