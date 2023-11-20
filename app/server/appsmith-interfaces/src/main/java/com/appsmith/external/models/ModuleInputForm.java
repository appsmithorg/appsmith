package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class ModuleInputForm {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String sectionName;

    @JsonView(Views.Public.class)
    List<ModuleInput> children;
}
