package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ce.CustomJSLibContextCE_DTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomJSLibContextDTO extends CustomJSLibContextCE_DTO {
    Boolean isHidden;

    @JsonView(Views.Internal.class)
    String contextId;

    @JsonView(Views.Internal.class)
    CreatorContextType contextType;

    public static CustomJSLibContextDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibContextDTO customJSLibContextDTO = new CustomJSLibContextDTO();
        customJSLibContextDTO.setUidString(jsLib.getUidString());
        customJSLibContextDTO.setIsHidden(jsLib.getIsHidden());
        customJSLibContextDTO.setContextId(jsLib.getContextId());
        customJSLibContextDTO.setContextType(jsLib.getContextType());

        return customJSLibContextDTO;
    }
}
