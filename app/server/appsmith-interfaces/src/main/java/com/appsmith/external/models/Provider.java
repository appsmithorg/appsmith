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
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class Provider extends BaseDomain {

    @Indexed(unique = true)
    String name; // Provider name here

    String description; // Provider company's description here

    String url;

    String imageUrl;

    String documentationUrl; // URL which points to the homepage of the documentations here

    String credentialSteps; // How to generate/get the credentials to run the APIs which belong to this provider

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<String> categories; // Category names here

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    Statistics statistics; // Cumulative statistics for all the APIs for this provider

    @OneToOne
    DatasourceConfiguration datasourceConfiguration;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<PricingPlan> pricingPlans;

    String planSubscribed;

    /**
     * TODO : Once the marketplace is up, remove the default values from here. Let the Marketplace handle the defaults.
     */
    Boolean isVisible = true;

    Integer sortOrder = 1000;
}
