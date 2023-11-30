package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomJSLibApplicationCE_DTO {
    /**
     * This string is used to uniquely identify a given library. We expect this to be universally unique for a given
     * JS library
     */
    String uidString;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof CustomJSLibApplicationCE_DTO)) {
            return false;
        }

        /**
         * We check the equality using the uidString since this is supposed to be unique for a given library.
         */
        return ((CustomJSLibApplicationCE_DTO) o).getUidString().equals(this.uidString);
    }

    @Override
    public int hashCode() {
        return this.uidString.hashCode();
    }

    public static CustomJSLibApplicationDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibApplicationDTO customJSLibApplicationDTO = new CustomJSLibApplicationDTO();
        customJSLibApplicationDTO.setUidString(jsLib.getUidString());

        return customJSLibApplicationDTO;
    }
}
