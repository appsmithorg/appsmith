package com.appsmith.server.domains;


import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;
import java.util.Set;

/*
    TODO: Create a PolicyTemplate that will store all complex policies like "publishApp" which requires mulitple permissions
 */
@Getter
@Setter
@ToString
public class Policy implements Serializable {

    Set<String> permissions;

    Set<String> entities;
}
