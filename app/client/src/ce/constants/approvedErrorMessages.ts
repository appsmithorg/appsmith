import { createMessage, DEFAULT_ERROR_MESSAGE, 
    ERROR_401,
    FORM_VALIDATION_EMPTY_PASSWORD,
    FORM_VALIDATION_INVALID_EMAIL,
    VERIFY_ERROR_ALREADY_VERIFIED_TITLE,
    VERIFY_ERROR_EXPIRED_TITLE,
    VERIFY_ERROR_MISMATCH_TITLE,
    FORM_VALIDATION_EMPTY_EMAIL,
    AUTH_LOGIN_TOO_MANY_ATTEMPTS,
    AUTH_INVALID_CREDENTIALS,
    AUTH_UNAUTHORIZED,
    AUTH_NOT_LOGGED_IN,
    AUTH_RESET_PASSWORD_REQUEST_INVALID,
    AUTH_LOGIN_METHOD_NOT_SUPPORTED,
    AUTH_ACCOUNT_LOCKED,
    AUTH_SESSION_INVALID,
    EMAIL_VERIFICATION_NOT_ENABLED,
    GOOGLE_RECAPTCHA_FAILED,
    PASSWORD_INSUFFICIENT_STRENGTH,
    LOGIN_PAGE_INVALID_CREDS_ERROR,
    FORM_VALIDATION_PASSWORD_RULE,
    FORM_VALIDATION_INVALID_PASSWORD,
    RESET_PASSWORD_EXPIRED_TOKEN,
    RESET_PASSWORD_INVALID_TOKEN,
    FORGOT_PASSWORD_PAGE_SUBTITLE,
    SIGNUP_PAGE_SUCCESS,
    RESET_PASSWORD_RESET_SUCCESS,
    CREATE_PASSWORD_RESET_SUCCESS,
    WELCOME_FORM_PASSWORDS_NOT_MATCHING_ERROR_MESSAGE,
    WELCOME_FORM_STRONG_PASSWORD_ERROR_MESSAGE,
} from "./messages";

// List of approved static error messages that can be shown to users
export const APPROVED_ERROR_MESSAGES = {
    // Static messages that are exact matches
    static: [
        // Authentication & Authorization
        ERROR_401,
        AUTH_LOGIN_TOO_MANY_ATTEMPTS,
        AUTH_INVALID_CREDENTIALS,
        AUTH_UNAUTHORIZED,
        AUTH_NOT_LOGGED_IN,
        AUTH_RESET_PASSWORD_REQUEST_INVALID,
        AUTH_LOGIN_METHOD_NOT_SUPPORTED,
        AUTH_ACCOUNT_LOCKED,
        AUTH_SESSION_INVALID,
        LOGIN_PAGE_INVALID_CREDS_ERROR,
        FORM_VALIDATION_PASSWORD_RULE,
        FORM_VALIDATION_INVALID_PASSWORD,
        FORM_VALIDATION_EMPTY_PASSWORD,
        FORM_VALIDATION_EMPTY_EMAIL,
        FORM_VALIDATION_INVALID_EMAIL,
        RESET_PASSWORD_EXPIRED_TOKEN,
        RESET_PASSWORD_INVALID_TOKEN,
        FORGOT_PASSWORD_PAGE_SUBTITLE,
        SIGNUP_PAGE_SUCCESS,
        RESET_PASSWORD_RESET_SUCCESS,
        CREATE_PASSWORD_RESET_SUCCESS,
        WELCOME_FORM_PASSWORDS_NOT_MATCHING_ERROR_MESSAGE,
        WELCOME_FORM_STRONG_PASSWORD_ERROR_MESSAGE,
        
        // Signup Specific
        VERIFY_ERROR_ALREADY_VERIFIED_TITLE,
        VERIFY_ERROR_EXPIRED_TITLE,
        EMAIL_VERIFICATION_NOT_ENABLED,
        VERIFY_ERROR_MISMATCH_TITLE,
        GOOGLE_RECAPTCHA_FAILED,
        PASSWORD_INSUFFICIENT_STRENGTH,
    ],

    // Patterns for dynamic messages that are allowed
    patterns: [
        // Authentication patterns
        /^Please use .+ authentication to login to Appsmith$/,
        /^Authentication failed with error: .+$/,
        /^Invalid email domain .+ used for sign in\/sign up\. Please contact the administrator to configure this domain if this is unexpected\.$/,
        /^Password length should be between .+ and .+$/,
        /^Unable to find user with email .+$/,
        /^Please enter a valid parameter .+\.$/,
        /^There is already an account registered with this email .+\. Please sign in instead\.$/,
        /^Cannot find an outstanding reset password request for this email\. Please initiate a request via "forgot password" button to reset your password$/,
        /^A password reset link has been sent to your email address .+ registered with Appsmith\.$/,
        /^Password must be .+-.+ characters long and include at least one uppercase letter, one lowercase letter, one number, one symbol, and no whitespaces\.$/,
        /^Signup is restricted on this instance of Appsmith\. Please contact the administrator to get an invite for user .+\.$/,
        /^The user .+ has already been added to the workspace with role .+\. To change the role, please navigate to `Manage users` page\.$/,
    ]
};

/**
 * Checks if an error message is in the approved list
 * @param message The error message to validate
 * @returns boolean indicating if message is approved
 */
export function isApprovedErrorMessage(message: string): boolean {
    // First check static messages
    if (APPROVED_ERROR_MESSAGES.static.some(msg => 
        typeof msg === 'function' ? msg() === message : msg === message
    )) {
        return true;
    }
    
    // Then check regex patterns
    return APPROVED_ERROR_MESSAGES.patterns.some(pattern => pattern.test(message));
}

/**
 * Returns either the approved message or a default error message
 * @param message The error message to validate
 * @returns The original message if approved, or a default message
 */
export function getSafeErrorMessage(message: string): string {
    const isApproved = isApprovedErrorMessage(message);
    if (!isApproved) {
        return createMessage(DEFAULT_ERROR_MESSAGE);
    }

    // If it's a static message, find and return it wrapped in createMessage
    const staticMessage = APPROVED_ERROR_MESSAGES.static.find(msg => 
        typeof msg === 'function' ? msg() === message : msg === message
    );
    if (staticMessage) {
        return typeof staticMessage === 'function' 
            ? createMessage(staticMessage) 
            : staticMessage;
    }

    // For pattern matches, return the original message wrapped in createMessage
    return createMessage(() => message);
}