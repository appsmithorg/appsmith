package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomJSLib extends BaseDomain {
    String name;
    String accessor;
    String url;
    String docsUrl;
    String version;
    Map<String, Object> defs;

    /**
     * The equality operator has been overridden here so that when two custom JS library objects are compared, they
     * are compared based on their name and version as opposed to Java object reference. At the moment this check
     * helps us to identify which JS library needs to be removed from the list of installed libraries when a user
     * chooses to uninstall a library.
     * @param o
     * @return
     */
    @Override
    public boolean equals(Object o) {
        if (! (o instanceof CustomJSLib)) {
            return false;
        }

        return ((CustomJSLib) o).getName().equals(this.name) && ((CustomJSLib) o).getVersion().equals(this.version);
    }
}
