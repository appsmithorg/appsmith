package com.appsmith.server.helpers;

import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.EnglishSequenceData;
import org.passay.IllegalSequenceRule;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.RepeatCharacterRegexRule;
import org.passay.RuleResult;
import org.springframework.stereotype.Component;

@Component
public class PasswordUtils {

    private PasswordValidator passwordValidator = new PasswordValidator(
        new LengthRule(8, 2147483647),
        new CharacterRule(EnglishCharacterData.UpperCase, 1),
        new CharacterRule(EnglishCharacterData.LowerCase, 1),
        new CharacterRule(EnglishCharacterData.Digit, 1),
        new IllegalSequenceRule(EnglishSequenceData.Alphabetical, 5, false),
        new IllegalSequenceRule(EnglishSequenceData.Numerical, 5, false),
        new IllegalSequenceRule(EnglishSequenceData.USQwerty, 5, false),
        new RepeatCharacterRegexRule(5));

    public boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }

        RuleResult ruleResult = passwordValidator.validate(new PasswordData(password));

        return ruleResult.isValid();
    }

}
