package com.appsmith.server.dtos;

import com.appsmith.server.domains.CustomJSLib;
import lombok.Getter;
import lombok.Setter;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Getter
@Setter
public class CustomJSLibApplicationDTO {
    String id;
    String accessorString;

    @Override
    public boolean equals(Object o) {
        if (! (o instanceof CustomJSLibApplicationDTO)) {
            return false;
        }

        /**
         * TODO: add comment
         */
        if (!isBlank(((CustomJSLibApplicationDTO) o).getId()) && !isBlank(this.id)) {
            return ((CustomJSLibApplicationDTO) o).getId().equals(this.id);
        }

        return ((CustomJSLibApplicationDTO) o).getAccessorString().equals(this.accessorString);
    }

    public static CustomJSLibApplicationDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibApplicationDTO customJSLibApplicationDTO = new CustomJSLibApplicationDTO();
        customJSLibApplicationDTO.setId(jsLib.getId());
        customJSLibApplicationDTO.setAccessorString(jsLib.getAccessorString());

        return customJSLibApplicationDTO;
    }
}
