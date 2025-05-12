package vn.pickleball.identityservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.pickleball.identityservice.dto.request.RoleRequest;
import vn.pickleball.identityservice.dto.response.RoleResponse;
import vn.pickleball.identityservice.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
