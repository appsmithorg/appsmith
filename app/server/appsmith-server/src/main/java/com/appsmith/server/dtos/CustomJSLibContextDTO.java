package com.appsmith.server.dtos;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ce.CustomJSLibContextCE_DTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomJSLibContextDTO extends CustomJSLibContextCE_DTO {

    public static CustomJSLibContextDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibContextDTO customJSLibContextDTO = new CustomJSLibContextDTO();
        customJSLibContextDTO.setUidString(jsLib.getUidString());
        return customJSLibContextDTO;
    }
}
