package vn.pickleball.apigateway.exception;

public class TokenIntrospectFailedException extends RuntimeException {

    public TokenIntrospectFailedException(String message) {
        super(message);
    }

}
