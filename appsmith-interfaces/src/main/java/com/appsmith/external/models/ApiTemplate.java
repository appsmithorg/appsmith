package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ApiTemplate extends BaseDomain {

    // ApiTemplate fields below :
    String name; //API name here
    String providerId; //Providers, e.g. Salesforce should exist in the db and its id should come here.
    String publisher; //e.g. RapidAPI
    String packageName; //Plugin package name used to execute the final action created by this template
    String versionId;
    ApiTemplateConfiguration apiTemplateConfiguration;
    ActionConfiguration actionConfiguration;
    DatasourceConfiguration datasourceConfiguration;
    String hashValue;
    String scraperId;
}
