package com.appsmith.external.models;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Policy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    String permission;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Deprecated
    private Set<String> users;

    // @Type(JsonBinaryType.class)
    // @Deprecated
    // private Set<String> groups;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Set<String> permissionGroups;
}
