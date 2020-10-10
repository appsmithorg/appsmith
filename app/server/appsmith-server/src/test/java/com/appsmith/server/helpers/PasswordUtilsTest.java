package com.appsmith.server.helpers;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;

@RunWith(SpringRunner.class)
@SpringBootTest
public class PasswordUtilsTest {

    @Autowired
    private PasswordUtils passwordUtils;

    @Test
    public void validatePasswords() {
        assertThat(Arrays.asList("&72k?Qq5", "Q8T5YnTb", "C<7JhbDP"))
            .allSatisfy(password ->
                assertThat(passwordUtils.isValidPassword(password)).isTrue());

        assertThat(Arrays.asList("a1n2", "password", "abcde!za", "12345678", "qwertylzl"))
            .allSatisfy(password ->
                assertThat(passwordUtils.isValidPassword(password)).isFalse());
    }

}
