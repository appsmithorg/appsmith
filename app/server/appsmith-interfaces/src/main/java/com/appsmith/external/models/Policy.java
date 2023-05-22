/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.models;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@ToString
@Builder
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class Policy implements Serializable {

String permission;

@Deprecated @Builder.Default Set<String> users = new HashSet<>();

@Deprecated @Builder.Default Set<String> groups = new HashSet<>();

@Builder.Default Set<String> permissionGroups = new HashSet<>();
}
