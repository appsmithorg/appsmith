package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
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

    public Policy(Policy other) {
        this.permission = other.permission;
        this.users = new HashSet<>(other.users);
        this.groups = new HashSet<>(other.groups);
        this.permissionGroups = new HashSet<>(other.permissionGroups);
    }
}
