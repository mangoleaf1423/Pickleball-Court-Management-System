package vn.pickleball.apigateway.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;

import java.util.Optional;

public class WebExchangeUtils {

    public static String getUserIdFromWebExchange(ServerWebExchange exchange) {
        String userId = Optional.ofNullable(exchange.getRequest())
            .map(ServerHttpRequest::getHeaders)
            .map(headers -> headers.get(HttpHeaders.AUTHORIZATION))
            .map(header -> header.get(0))
            .map(bearerToken -> bearerToken.split(" ")[1]).orElse(null);

        return userId;
    }

    private static String getNullIfRequestcomeFromFileStorage( ServerWebExchange exchange) {
        String path = exchange.getRequest().getPath().value();
        System.out.println("DEBUG111:" + path);
        if(path.matches("/files")) {
            return null;
        } else {
            throw new RuntimeException();
        }
 
    }

}
