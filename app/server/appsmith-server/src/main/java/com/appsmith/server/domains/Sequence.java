package com.appsmith.server.domains;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Sequence {

    @Id
    private String name;

    private Long nextNumber;
}
