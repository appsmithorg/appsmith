package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomJSLibCE extends BranchAwareDomain {
    /* Library name */
    String name;

    /**
     * This string is used to uniquely identify a given library. We expect this to be universally unique for a given
     * JS library
     */
    String uidString;

    /**
     * These are the namespaces under which the library functions reside. User would access lib methods like
     * `accessor.method`
     */
    Set<String> accessor;

    /* Library UMD src url */
    String url;

    /* Library documentation page URL */
    String docsUrl;

    /* Library version */
    String version;

    /* `Tern` tool definitions - it defines the methods exposed by the library. It helps us with auto-complete
    feature i.e. the function name showing up as suggestion when user has partially typed it. */
    String defs;

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public CustomJSLibCE(
            @JsonProperty("name") String name,
            @JsonProperty("accessor") Set<String> accessor,
            @JsonProperty("url") String url,
            @JsonProperty("docsUrl") String docsUrl,
            @JsonProperty("version") String version,
            @JsonProperty("defs") String defs) {
        this.name = name;
        this.accessor = accessor;
        this.url = url;
        this.docsUrl = docsUrl;
        this.defs = defs;
        this.version = version;
        setUidString();
    }

    public void setUidString() {
        List<String> accessorList = new ArrayList(this.accessor);
        Collections.sort(accessorList);
        this.uidString = String.join("_", accessorList) + "_" + this.url;
    }

    /**
     * The equality operator has been overridden here so that when two custom JS library objects are compared, they
     * are compared based on their name and version as opposed to Java object reference. At the moment this check
     * helps us to identify which JS library needs to be removed from the list of installed libraries when a user
     * chooses to uninstall a library. It also helps us to identify if a library has already been added.
     * Please note that this comment may have to be updated once the following issue is closed:
     * https://github.com/appsmithorg/appsmith/issues/18226
     */
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof CustomJSLibCE)) {
            return false;
        }

        /**
         * We check the equality using the uidString since this is supposed to be unique for a given library.
         */
        return ((CustomJSLibCE) o).getUidString().equals(this.uidString);
    }

    @Override
    public int hashCode() {
        return this.uidString.hashCode();
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setId(null);
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
    }
}
