package vn.pickleball.apigateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;


@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(TokenIntrospectFailedException.class)
    public ResponseEntity<Object> handleTokenIntrospectFailedException(
            TokenIntrospectFailedException ex, WebRequest request) {

        log.error("Handling TokenIntrospectFailedException: ", ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", ZonedDateTime.now().toString());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        body.put("errorCode", "401");
        body.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

}

