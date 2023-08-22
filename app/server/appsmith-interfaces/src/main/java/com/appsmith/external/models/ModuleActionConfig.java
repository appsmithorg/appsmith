package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ModuleActionConfig {
    @JsonView(Views.Public.class)
    Boolean confirmBeforeExecute = false;

    @JsonView(Views.Public.class)
    Boolean executeOnLoad = false;
}
