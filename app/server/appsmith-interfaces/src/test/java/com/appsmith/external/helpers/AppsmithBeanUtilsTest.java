package com.appsmith.external.helpers;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
public class AppsmithBeanUtilsTest {

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    static class Person {
        private String name;
        private Integer age;
        private Boolean isApproved;
        private LocalDate joinDate;
        private Gender gender;
        private Person mentor = null;
    }

    enum Gender {
        Male, Female
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
                Gender.Male,
                null
        );

        AppsmithBeanUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getAge()).isEqualTo(30);
        assertThat(target.getIsApproved()).isEqualTo(true);
        assertThat(target.getJoinDate()).isEqualTo(LocalDate.of(2000, 1, 1));
        assertThat(target.getGender()).isEqualTo(Gender.Male);
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
                Gender.Male,
                new Person(
                        "Leia",
                        25,
                        true,
                        LocalDate.of(2000, 1, 1),
                        Gender.Male,
                        null
                )
        );

        AppsmithBeanUtils.copyNestedNonNullProperties(source, target);
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
                Gender.Male,
                null
        );

        AppsmithBeanUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getMentor().getName()).isEqualTo("The new mentor name");
    }

    @Test
    public void copyEnumValue() {
        Person source = new Person();
        source.setGender(Gender.Female);

        Person target = new Person(
                "Luke",
                25,
                true,
                LocalDate.of(2000, 1, 1),
                Gender.Male,
                null
        );

        AppsmithBeanUtils.copyNestedNonNullProperties(source, target);
        assertThat(target.getName()).isEqualTo("Luke");
        assertThat(target.getAge()).isEqualTo(25);
        assertThat(target.getIsApproved()).isEqualTo(true);
        assertThat(target.getJoinDate()).isEqualTo(LocalDate.of(2000, 1, 1));
        assertThat(target.getGender()).isEqualTo(Gender.Female);
    }

}
