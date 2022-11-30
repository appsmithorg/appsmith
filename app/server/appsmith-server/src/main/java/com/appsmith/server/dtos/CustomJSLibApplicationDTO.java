package com.appsmith.server.dtos;

import com.appsmith.server.domains.CustomJSLib;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomJSLibApplicationDTO {
    /* This holds the ObjectId of corresponding object in CustomJSLib collection */
    String id;

    /**
     * This string is used to uniquely identify a given library. We expect this to be universally unique for a given
     * JS library
     */
    String uidString;

    @Override
    public boolean equals(Object o) {
        if (! (o instanceof CustomJSLibApplicationDTO)) {
            return false;
        }

        /**
         * TODO: add comment
         */
        return ((CustomJSLibApplicationDTO) o).getUidString().equals(this.uidString);
    }

    @Override
    public int hashCode() {
        return this.uidString.hashCode();
    }

    public static CustomJSLibApplicationDTO getDTOFromCustomJSLib(CustomJSLib jsLib) {
        CustomJSLibApplicationDTO customJSLibApplicationDTO = new CustomJSLibApplicationDTO();
        customJSLibApplicationDTO.setId(jsLib.getId());
        customJSLibApplicationDTO.setUidString(jsLib.getUidString());

        return customJSLibApplicationDTO;
    }
}
