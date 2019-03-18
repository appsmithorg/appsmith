package com.mobtools.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;

@Entity
// Specially adding the table name here because the keyword "User" is reserved in Postgres
@Table(name = "users")
@Getter
@Setter
@ToString
@NoArgsConstructor
@SequenceGenerator(initialValue = 1, name = "user_gen", sequenceName = "user_gen")
public class User extends BaseDomain {

    @Id
    @Column(nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_gen")
    private Long id;

    @Column
    private String name;

    @Column
    private String email;
}
