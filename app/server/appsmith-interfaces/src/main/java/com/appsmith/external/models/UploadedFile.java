package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Base64;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFile implements AppsmithDomain {

    private static final String BASE64_DELIMITER = ";base64,";

    String name;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String base64Content;

    @JsonIgnore
    public byte[] getDecodedContent() {
        if (base64Content == null) {
            return null;
        }

        if (base64Content.contains(BASE64_DELIMITER)) {
            return Base64.getDecoder().decode(base64Content.split(BASE64_DELIMITER)[1]);
        }

        return Base64.getDecoder().decode(base64Content);
    }

}
