package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class WidgetSectionProperty {
    WidgetSectionName sectionName;
    String id;
    List<WidgetChildProperty> children;
}
