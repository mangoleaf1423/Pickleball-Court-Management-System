package vn.pickleball.courtservice.Utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

public class SecurityContextUtil {

    public static Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public static String getUid(){
        return getClaim("uid");
    }

    public static boolean isAdmin(){
        Authentication authentication = getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    }

    public static boolean isManager(){
        Authentication authentication = getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_MANAGER"));
    }


    public static boolean isStaff(){
        Authentication authentication = getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_STAFF"));
    }

    public static String getUsername() {
        Authentication authentication = getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getClaimAsString("sub");
        }
        return null;
    }

    public static Map<String, Object> getClaims() {
        Authentication authentication = getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getClaims();
        }
        return null;
    }

    public static Collection<String> getAuthorities() {
        Authentication authentication = getAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities()
                    .stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
        }
        return null;
    }

    public static String getClaim(String claimName) {
        Map<String, Object> claims = getClaims();
        if (claims != null) {
            return claims.get(claimName).toString();
        }
        return null;
    }
}

