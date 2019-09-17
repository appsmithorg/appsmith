package com.appsmith.server.domains;

import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;


@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Widget extends BaseDomain {

    @Indexed(unique = true)
    private String name;

    private WidgetType type;

    private PricingPlan pricingPlan;

    private List<Property> properties;
}
