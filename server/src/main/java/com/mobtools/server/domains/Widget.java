package com.mobtools.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@SequenceGenerator(initialValue = 1, name = "widget_gen", sequenceName = "widget_gen")
public class Widget extends BaseDomain {


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "widget_gen")
    @Column(nullable = false, updatable = false)
    private Long id;

    @Column
    private String name;

    @Column
    private WidgetType type;

    @Column
    private PricingPlan pricingPlan;

}
