package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ce.CustomJSLibApplicationCE_DTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomJSLibApplicationDTO extends CustomJSLibApplicationCE_DTO {

    Boolean isHidden;

    @JsonView(Views.Internal.class)
    String contextId;

    @JsonView(Views.Internal.class)
    CreatorContextType contextType;

    public static CustomJSLibApplicationDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibApplicationDTO customJSLibApplicationDTO = new CustomJSLibApplicationDTO();
        customJSLibApplicationDTO.setUidString(jsLib.getUidString());
        customJSLibApplicationDTO.setIsHidden(jsLib.getIsHidden());
        customJSLibApplicationDTO.setContextId(jsLib.getContextId());
        customJSLibApplicationDTO.setContextType(jsLib.getContextType());

        return customJSLibApplicationDTO;
    }
}
