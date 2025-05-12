package vn.pickleball.identityservice.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import vn.pickleball.identityservice.dto.request.RoleRequest;
import vn.pickleball.identityservice.dto.response.RoleResponse;
import vn.pickleball.identityservice.entity.Role;
import vn.pickleball.identityservice.exception.ApiException;
import vn.pickleball.identityservice.mapper.RoleMapper;
import vn.pickleball.identityservice.repository.RoleRepository;
import vn.pickleball.identityservice.utils.SecurityContextUtil;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);

        role = roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }
    public List<Role> getRolesWithoutAdmin() {
        return roleRepository.findRolesWithoutAdmin("ADMIN");
    }

    public RoleResponse updateRole(RoleRequest request) {
        Role role = roleRepository.findById(request.getName())
                .orElseThrow(() -> new ApiException("Role not found", "ENTITY_NOTFOUND"));


        role.setDescription(request.getDescription());
        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<RoleResponse> getAll() {
        List<Role> roles = roleRepository.findRolesWithoutAdmin("ADMIN");
        // Nếu là MANAGER thì lọc bỏ role MANAGER
        if (SecurityContextUtil.isManager()) {
            roles = roles.stream()
                    .filter(role -> !role.getName().equals("MANAGER"))
                    .collect(Collectors.toList());
        }

        return roles.stream()
                .map(roleMapper::toRoleResponse)
                .collect(Collectors.toList());
    }

    public void delete(String role) {

        if(roleRepository.existsUserWithRoleName(role)){
            throw new ApiException("Role is assign to user", "CANNOT_DELETE");
        }
        roleRepository.deleteById(role);
    }



    public HashSet<Role> getRole(String role){
        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(role).ifPresent(roles::add);

        return roles;
    }

    public List<Role> getAllByIds (List<String> roles){
        return roleRepository.findAllById(roles);
    }
}
