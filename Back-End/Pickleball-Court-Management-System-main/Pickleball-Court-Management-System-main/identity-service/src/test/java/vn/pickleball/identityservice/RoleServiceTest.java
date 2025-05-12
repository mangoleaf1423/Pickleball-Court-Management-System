package vn.pickleball.identityservice;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.OngoingStubbing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import vn.pickleball.identityservice.dto.request.RoleRequest;
import vn.pickleball.identityservice.dto.response.RoleResponse;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.RoleMapper;
import vn.pickleball.identityservice.repository.RoleRepository;
import vn.pickleball.identityservice.service.RoleService;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @InjectMocks
    private RoleService roleService;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        // Set up SecurityContextHolder with minimal configuration
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void create_validRequest_success() {
        // Arrange
        RoleRequest request = new RoleRequest("USER", "User role");
        Role role = new Role();
        role.setName("USER");
        role.setDescription("User role");
        RoleResponse response = new RoleResponse("USER", "User role");

        when(roleMapper.toRole(request)).thenReturn(role);
        when(roleRepository.save(role)).thenReturn(role);
        when(roleMapper.toRoleResponse(role)).thenReturn(response);

        // Act
        RoleResponse result = roleService.create(request);

        // Assert
        assertNotNull(result);
        assertEquals("USER", result.getName());
        assertEquals("User role", result.getDescription());
        verify(roleMapper).toRole(request);
        verify(roleRepository).save(role);
        verify(roleMapper).toRoleResponse(role);
    }

    @Test
    void getRolesWithoutAdmin_success() {
        // Arrange
        List<Role> roles = Arrays.asList(
                new Role("USER", "User role"),
                new Role("STAFF", "Staff role")
        );
        when(roleRepository.findRolesWithoutAdmin("ADMIN")).thenReturn(roles);

        // Act
        List<Role> result = roleService.getRolesWithoutAdmin();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("USER", result.get(0).getName());
        assertEquals("STAFF", result.get(1).getName());
        verify(roleRepository).findRolesWithoutAdmin("ADMIN");
    }

    @Test
    void updateRole_validRequest_success() {
        // Arrange
        RoleRequest request = new RoleRequest("USER", "Updated user role");
        Role role = new Role("USER", "User role");
        RoleResponse response = new RoleResponse("USER", "Updated user role");

        when(roleRepository.findById("USER")).thenReturn(Optional.of(role));
        when(roleRepository.save(role)).thenReturn(role);
        when(roleMapper.toRoleResponse(any(Role.class))).thenAnswer(invocation -> {
            Role r = invocation.getArgument(0);
            return new RoleResponse(r.getName(), r.getDescription());
        });

        // Act
        RoleResponse result = roleService.updateRole(request);

        // Assert
        assertNotNull(result);
        assertEquals("USER", result.getName());
        assertEquals("Updated user role", result.getDescription());
        verify(roleRepository).findById("USER");
        verify(roleRepository).save(role);
        verify(roleMapper).toRoleResponse(any(Role.class));
    }


    @Test
    void updateRole_nonExistentRole_throwsException() {
        // Arrange
        RoleRequest request = new RoleRequest("USER", "Updated user role");
        when(roleRepository.findById("USER")).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> roleService.updateRole(request));
        assertEquals("ENTITY_NOTFOUND", exception.getErrorCode());
        assertEquals("Role not found", exception.getMessage());
        verify(roleRepository).findById("USER");
        verifyNoMoreInteractions(roleRepository, roleMapper);
    }

//    @Test
//    void getAll_adminRole_success() {
//        // Arrange
//        List<Role> roles = Arrays.asList(
//                new Role("USER", "User role"),
//                new Role("STAFF", "Staff role")
//        );
//        when(roleRepository.findRolesWithoutAdmin("ADMIN")).thenReturn(roles);
//        when(securityContext.getAuthentication()).thenReturn(authentication);
//        when(authentication.getPrincipal()).thenReturn(jwt);
//        Collection<GrantedAuthority> adminAuthorities = List.of(
//                new SimpleGrantedAuthority("ROLE_ADMIN")
//        );
//        when(authentication.getAuthorities()).thenReturn();
//        when(roleMapper.toRoleResponse(any(Role.class))).thenAnswer(invocation -> {
//            Role role = invocation.getArgument(0);
//            return new RoleResponse(role.getName(), role.getDescription());
//        });
//
//        // Act
//        List<RoleResponse> result = roleService.getAll();
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(2, result.size());
//        assertEquals("USER", result.get(0).getName());
//        assertEquals("STAFF", result.get(1).getName());
//        verify(roleRepository).findRolesWithoutAdmin("ADMIN");
//        verify(roleMapper, times(2)).toRoleResponse(any(Role.class));
//    }
//
//    @Test
//    void getAll_managerRole_filtersManager() {
//        // Arrange
//        List<Role> roles = Arrays.asList(
//                new Role("USER", "User role"),
//                new Role("STAFF", "Staff role"),
//                new Role("MANAGER", "Manager role")
//        );
//        when(roleRepository.findRolesWithoutAdmin("ADMIN")).thenReturn(roles);
//        when(securityContext.getAuthentication()).thenReturn(authentication);
//        when(authentication.getPrincipal()).thenReturn(jwt);
//        Collection<GrantedAuthority> managerAuthorities = List.of(
//                new SimpleGrantedAuthority("ROLE_MANAGER")
//        );
//        when(authentication.getAuthorities()).thenReturn(managerAuthorities);
//        when(roleMapper.toRoleResponse(any(Role.class))).thenAnswer(invocation -> {
//            Role role = invocation.getArgument(0);
//            return new RoleResponse(role.getName(), role.getDescription());
//        });
//
//        // Act
//        List<RoleResponse> result = roleService.getAll();
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(2, result.size());
//        assertEquals("USER", result.get(0).getName());
//        assertEquals("STAFF", result.get(1).getName());
//        verify(roleRepository).findRolesWithoutAdmin("ADMIN");
//        verify(roleMapper, times(2)).toRoleResponse(any(Role.class));
//    }
//
//    @Test
//    void getAll_unauthorizedRole_throwsAccessDenied() {
//        // Arrange
//        when(securityContext.getAuthentication()).thenReturn(authentication);
//        when(authentication.getPrincipal()).thenReturn(jwt);
//        when(authentication.getAuthorities()).thenReturn(List.of(
//                new SimpleGrantedAuthority("ROLE_USER")
//        ));
//
//        // Act & Assert
//        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> roleService.getAll());
//        verifyNoInteractions(roleRepository, roleMapper);
//    }
}