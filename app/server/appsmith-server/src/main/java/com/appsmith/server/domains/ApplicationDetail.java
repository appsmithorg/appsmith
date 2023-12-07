package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.ApplicationDetailCE;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

@Getter
@Setter
@ToString
@EqualsAndHashCode(callSuper = true)
public class ApplicationDetail extends ApplicationDetailCE {

    @JsonView(Views.Public.class)
    Set<CustomJSLibContextDTO> hiddenJSLibs;

    public ApplicationDetail() {
        super();
    }
}
