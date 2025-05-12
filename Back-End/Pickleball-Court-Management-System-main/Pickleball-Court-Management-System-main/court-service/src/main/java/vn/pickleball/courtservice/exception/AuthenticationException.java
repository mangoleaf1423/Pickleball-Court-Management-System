package vn.pickleball.courtservice.exception;

import jakarta.servlet.ServletException;

public class AuthenticationException extends ServletException {

    public AuthenticationException(String message) {
        super(message);
    }
}
