package com.appsmith.server.domains.ce;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.helpers.CollectionUtils;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.gson.TypeAdapter;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@MappedSuperclass
@FieldNameConstants
public class CustomJSLibCE extends BranchAwareDomain {
    /* Library name */
    @JsonView({Views.Public.class, Git.class})
    String name;

    /**
     * This string is used to uniquely identify a given library. We expect this to be universally unique for a given
     * JS library
     */
    @JsonView({Views.Public.class, Git.class})
    @Column(columnDefinition = "text")
    String uidString;

    /**
     * These are the namespaces under which the library functions reside. User would access lib methods like
     * `accessor.method`
     */
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView({Views.Public.class, Git.class})
    Set<String> accessor;

    /* Library UMD src url */
    @Column(columnDefinition = "text")
    @JsonView({Views.Public.class, Git.class})
    String url;

    /* Library documentation page URL */
    @JsonView({Views.Public.class, Git.class})
    String docsUrl;

    /* Library version */
    @JsonView({Views.Public.class, Git.class})
    String version;

    /* `Tern` tool definitions - it defines the methods exposed by the library. It helps us with auto-complete
    feature i.e. the function name showing up as suggestion when user has partially typed it. */
    @Column(columnDefinition = "text")
    @JsonView({Views.Public.class, Git.class})
    @JsonSerialize(using = DefsSerializerForJackson.class)
    @JsonAdapter(DefsAdapterForGson.class)
    byte[] defs;

    public static class DefsSerializerForJackson extends JsonSerializer<byte[]> {
        @Override
        public void serialize(byte[] value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeString(new String(value, StandardCharsets.UTF_8));
        }
    }

    public static class DefsAdapterForGson extends TypeAdapter<byte[]> {
        @Override
        public void write(JsonWriter out, byte[] value) throws IOException {
            out.value(new String(value, StandardCharsets.UTF_8));
        }

        @Override
        public byte[] read(JsonReader in) throws IOException {
            return in.nextString().getBytes(StandardCharsets.UTF_8);
        }
    }

    public CustomJSLibCE(String name, Set<String> accessor, String url, String docsUrl, String version, byte[] defs) {
        setName(name);
        setAccessor(accessor);
        setUrl(url);
        setDocsUrl(docsUrl);
        setDefs(defs);
        setVersion(version);
    }

    public void setAccessor(Set<String> value) {
        accessor = value;
        recomputeUid();
    }

    public void setUrl(String value) {
        url = value;
        recomputeUid();
    }

    private void recomputeUid() {
        final List<String> items = new ArrayList<>();

        // Add all accessor items, sorted.
        if (!CollectionUtils.isNullOrEmpty(accessor)) {
            items.addAll(accessor);
            Collections.sort(items);
        }

        // Add URL to the end of sorted accessors list.
        items.add(url);

        setUidString(String.join("_", items));
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

    public static class Fields extends BranchAwareDomain.Fields {}
}
