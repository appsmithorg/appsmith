package com.appsmith.external.models;


import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;
import java.util.Set;

/*
    TODO: Create a PolicyTemplate that will store all complex policies like "publishApp" which requires multiple permissions
 */
@Getter
@Setter
@ToString
@Builder
@EqualsAndHashCode
public class Policy implements Serializable {

    String permission;

    Set<String> users;

    Set<String> groups;
}
