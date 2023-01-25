package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Provider extends BaseDomain {

    @Indexed(unique = true)
    @JsonView(Views.Api.class)
    String name; //Provider name here

    @JsonView(Views.Api.class)
    String description; //Provider company's description here

    @JsonView(Views.Api.class)
    String url;

    @JsonView(Views.Api.class)
    String imageUrl;

    @JsonView(Views.Api.class)
    String documentationUrl; //URL which points to the homepage of the documentations here

    @JsonView(Views.Api.class)
    String credentialSteps; //How to generate/get the credentials to run the APIs which belong to this provider

    @JsonView(Views.Api.class)
    List<String> categories; //Category names here

    @JsonView(Views.Api.class)
    Statistics statistics; //Cumulative statistics for all the APIs for this provider

    @JsonView(Views.Api.class)
    DatasourceConfiguration datasourceConfiguration;

    @JsonView(Views.Api.class)
    List<PricingPlan> pricingPlans;

    @JsonView(Views.Api.class)
    String planSubscribed;

    /**
     * TODO : Once the marketplace is up, remove the default values from here. Let the Marketplace handle the defaults.
     */
    @JsonView(Views.Api.class)
    Boolean isVisible = true;

    @JsonView(Views.Api.class)
    Integer sortOrder = 1000;

}
