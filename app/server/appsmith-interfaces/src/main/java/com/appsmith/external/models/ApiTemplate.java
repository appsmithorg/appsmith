package com.appsmith.external.models;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class ApiTemplate extends BaseDomain {

    // ApiTemplate fields below :
    String name; // API name here
    String providerId; // Providers, e.g. Salesforce should exist in the db and its id should come here.
    String publisher; // e.g. RapidAPI
    String packageName; // Plugin package name used to execute the final action created by this template
    String versionId;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    ApiTemplateConfiguration apiTemplateConfiguration;

    @OneToOne
    ActionConfiguration actionConfiguration;

    @OneToOne
    DatasourceConfiguration datasourceConfiguration;

    String hashValue;
    String scraperId;
}
