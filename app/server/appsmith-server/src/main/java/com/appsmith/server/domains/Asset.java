package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Asset extends BaseDomain {

    public Asset(MediaType mediaType, byte[] data) {
        this(mediaType == null ? null : mediaType.toString(), data);
    }

    String contentType;

    byte[] data;
}
