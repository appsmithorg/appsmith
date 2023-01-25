package com.appsmith.external.models;


import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@Builder
@EqualsAndHashCode
public class Policy implements Serializable {

    @JsonView(Views.Api.class)
    String permission;

    @Deprecated
    @Builder.Default
    @JsonView(Views.Api.class)
    Set<String> users = new HashSet<>();

    @Deprecated
    @Builder.Default
    @JsonView(Views.Api.class)
    Set<String> groups = new HashSet<>();

    @Builder.Default
    @JsonView(Views.Api.class)
    Set<String> permissionGroups = new HashSet<>();
}
