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
public class WidgetChildProperty {
    String id;
    String propertyName;
    String label;
    String controlType;
    String placeholderText;
    List<WidgetOption> options;
    String inputType;
}
