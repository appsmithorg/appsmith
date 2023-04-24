package com.appsmith.external.models;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Data
@ToString
@Builder
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class Policy implements Serializable {

    String permission;

    @Deprecated
    @Builder.Default
    Set<String> users = new HashSet<>();

    @Deprecated
    @Builder.Default
    Set<String> groups = new HashSet<>();

    @Builder.Default
    Set<String> permissionGroups = new HashSet<>();
}
