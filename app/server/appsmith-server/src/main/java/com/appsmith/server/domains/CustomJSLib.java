package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.server.dtos.CustomJSLibCompatibilityDTO;
import com.appsmith.server.helpers.CollectionUtils;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.MODIFIED_ACCESSOR_KEY;
import static com.appsmith.server.constants.ce.FieldNameCE.ORIGINAL_ACCESSOR_KEY;
import static com.appsmith.server.constants.ce.FieldNameCE.PARSER;
import static com.appsmith.server.constants.ce.FieldNameCE.XML_PARSER;
import static com.appsmith.server.dtos.CustomJSLibCompatibilityDTO.transformAccessorToSetOfStrings;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class CustomJSLib extends BranchAwareDomain {
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
    Set<Map<String, String>> accessor;

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
    public CustomJSLib(
            @JsonProperty("name") String name,
            @JsonProperty("accessor") Set<Map<String, String>> accessor,
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

    public CustomJSLib(CustomJSLibCompatibilityDTO customJSLibCompatibilityDTO) {
        this.setId(customJSLibCompatibilityDTO.getId());

        this.setAccessor(transformAccessorToSetOfMaps(customJSLibCompatibilityDTO.getAccessor()));
        this.setName(customJSLibCompatibilityDTO.getName());
        this.setUrl(customJSLibCompatibilityDTO.getUrl());
        this.setVersion(customJSLibCompatibilityDTO.getVersion());
        this.setDocsUrl(customJSLibCompatibilityDTO.getDocsUrl());
        this.setDefs(customJSLibCompatibilityDTO.getDefs());

        // base domain
        this.setCreatedAt(customJSLibCompatibilityDTO.getCreatedAt());
        this.setUpdatedAt(customJSLibCompatibilityDTO.getUpdatedAt());
        this.setPolicies(customJSLibCompatibilityDTO.getPolicies());

        // branch aware domain
        this.setDefaultResources(customJSLibCompatibilityDTO.getDefaultResources());
        this.modifyAccessorValueForXMLParser();
        this.setUidString();
    }

    public Set<Map<String, String>> transformAccessorToSetOfMaps(Set<String> accessorSet) {
        Set<Map<String, String>> transformedAccessor = new HashSet<>();
        for (String accessorValue : accessorSet) {
            Map<String, String> accessorMap = new HashMap<>();
            accessorMap.put(ORIGINAL_ACCESSOR_KEY, accessorValue);
            accessorMap.put(MODIFIED_ACCESSOR_KEY, accessorValue);
            transformedAccessor.add(accessorMap);
        }

        return transformedAccessor;
    }

    /**
     * This method changes the value associated with <String>modified</String> key of map to <String>xmlParser</String>,
     * if the <String>original</String> key is named as <String>parser</String>
     */
    public void modifyAccessorValueForXMLParser() {
        if (CollectionUtils.isNullOrEmpty(this.getAccessor())) {
            return;
        }

        for (Map<String, String> accessorMap : this.accessor) {
            if (!accessorMap.get(ORIGINAL_ACCESSOR_KEY).equals(PARSER)) {
                continue;
            }

            accessorMap.put(MODIFIED_ACCESSOR_KEY, XML_PARSER);
        }
    }

    public void setUidString() {
        List<String> accessorList =
                new ArrayList(transformAccessorToSetOfStrings(this.accessor, MODIFIED_ACCESSOR_KEY));
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
