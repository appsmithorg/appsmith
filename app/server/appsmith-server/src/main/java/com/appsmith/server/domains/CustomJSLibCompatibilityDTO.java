package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.server.constants.FieldName;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomJSLibCompatibilityDTO extends BranchAwareDomain {

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
    public CustomJSLibCompatibilityDTO(
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

    public CustomJSLibCompatibilityDTO(CustomJSLib customJSLib) {
        this.setId(customJSLib.getId());
        this.setAccessor(transformAccessor(customJSLib.getAccessor(), FieldName.MODIFIED_ACCESSOR_KEY));
        this.setName(customJSLib.getName());
        this.setUidString(customJSLib.getUidString());
        this.setUrl(customJSLib.getUrl());
        this.setVersion(customJSLib.getVersion());
        this.setDocsUrl(customJSLib.getDocsUrl());
        this.setDefs(customJSLib.getDefs());
        this.setCreatedAt(customJSLib.getCreatedAt());
        this.setUpdatedAt(customJSLib.getUpdatedAt());
        this.setPolicies(customJSLib.getPolicies());
        this.setDefaultResources(customJSLib.getDefaultResources());
    }

    /**
     * extracts string from the map and returns a new set which contains extracted key
     * @param accessorMapSet : Set of accessor maps
     * @param accessorKey : the key which is used to extract value from the map
     * @return  Set of Maps of String, String
     */
    public static Set<String> transformAccessor(Set<Map<String, String>> accessorMapSet, String accessorKey) {
        Set<String> transformedAccessor = new HashSet<>();
        for (Map<String, String> accessorMap : accessorMapSet) {
            transformedAccessor.add(accessorMap.get(accessorKey));
        }
        return transformedAccessor;
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
        if (!(o instanceof CustomJSLib)) {
            return false;
        }

        /**
         * We check the equality using the uidString since this is supposed to be unique for a given library.
         */
        return ((CustomJSLib) o).getUidString().equals(this.uidString);
    }

    @Override
    public int hashCode() {
        return this.uidString.hashCode();
    }
}
