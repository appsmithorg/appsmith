package com.appsmith.server.dtos;

import com.appsmith.server.domains.Layout;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
public class PageDTO {

    @Transient
    private String id;

    String name;

    @Transient
    String applicationId;

    List<Layout> layouts;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

    Instant deletedAt = null;

}
