package com.appsmith.external.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Where;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Entity
@Where(clause = "deleted_at IS NULL")
public class Endpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String host;

    Long port;

    public Endpoint(String host, Long port) {
        this.host = host;
        this.port = port;
    }
}
