package com.appsmith.server.helpers;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
public class BeanCopyUtilsTest {

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    static class Person {
        private String name;
        private Integer age;
        private Boolean isApproved;
        private LocalDate joinDate;
        private Person mentor = null;
    }

    @Test
    public void copyProperties() {
        Person source = new Person();
        source.setAge(30);

        Person target = new Person(
                "Luke",
                25,
                true,
                LocalDate.of(2000, 1, 1),
                null
        );

        BeanCopyUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getAge()).isEqualTo(30);
        assertThat(target.getIsApproved()).isEqualTo(true);
        assertThat(target.getJoinDate()).isEqualTo(LocalDate.of(2000, 1, 1));
    }

    @Test
    public void copyNestedProperty() {
        Person source = new Person(), mentor = new Person();
        mentor.setName("The new mentor name");
        source.setMentor(mentor);

        Person target = new Person(
                "Luke",
                25,
                true,
                LocalDate.of(2000, 1, 1),
                new Person(
                        "Leia",
                        25,
                        true,
                        LocalDate.of(2000, 1, 1),
                        null
                )
        );

        BeanCopyUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getMentor().getName()).isEqualTo("The new mentor name");
        assertThat(target.getMentor().getAge()).isEqualTo(25);
    }

    @Test
    public void copyNestedPropertyWithTargetNull() {
        Person source = new Person(), mentor = new Person();
        mentor.setName("The new mentor name");
        source.setMentor(mentor);

        Person target = new Person(
                "Luke",
                25,
                true,
                LocalDate.of(2000, 1, 1),
                null
        );

        BeanCopyUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getMentor().getName()).isEqualTo("The new mentor name");
    }

}
