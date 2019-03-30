package com.mobtools.server.domains;

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
public class Widget extends BaseDomain {

    private String name;

    private WidgetType type;

    private PricingPlan pricingPlan;
}
