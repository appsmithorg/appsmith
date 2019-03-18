package com.mobtools.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@SequenceGenerator(initialValue = 1, name = "tenant_gen", sequenceName = "tenant_gen")
public class Tenant extends BaseDomain {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tenant_gen")
    @Column(nullable = false, updatable = false)
    private Long id;

    private String domain;

    private String name;

    private String website;

}
