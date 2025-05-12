package vn.pickleball.apigateway.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    //@Value("${spring.security.oauth2.resourceserver.jwk-uri}")
    //private String jwkUri;

    private Algorithm algorithm = null;

    public String getUserIdFromAccessToken(String accessToken) {
        DecodedJWT jwt = JWT.decode(accessToken);
        //validateToken(jwt);

        return this.getUserId(jwt);
    }

    private String getUserId(DecodedJWT jwt) {
        String subject = jwt.getSubject();
        return subject.substring(subject.lastIndexOf(":") + 1);
    }


}
