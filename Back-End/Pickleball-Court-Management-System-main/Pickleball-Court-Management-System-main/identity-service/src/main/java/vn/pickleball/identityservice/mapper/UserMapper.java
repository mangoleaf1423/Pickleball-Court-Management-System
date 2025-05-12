package vn.pickleball.identityservice.mapper;

import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import vn.pickleball.identityservice.client.CourtClient;
import vn.pickleball.identityservice.dto.request.CourtMap;
import vn.pickleball.identityservice.dto.request.UserCreationRequest;
import vn.pickleball.identityservice.dto.request.UserUpdateRequest;
import vn.pickleball.identityservice.dto.response.UserResponse;
import vn.pickleball.identityservice.entity.CourtStaff;
import vn.pickleball.identityservice.entity.User;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, builder = @Builder(disableBuilder = true), imports = {String.class, Collectors.class, CourtStaff.class})
public abstract class UserMapper {

    @Autowired
    private CourtClient courtClient;

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "courtStaffs", ignore = true)
    public abstract User toUserEntity(UserCreationRequest request);

    @Mapping(target = "courtNames", source = "courtStaffs", qualifiedByName = "mapCourtStaffsToCourtNames")
    public abstract UserResponse toUserResponse(User user);

    @Mapping(target = "courtNames", source = "courtStaffs", qualifiedByName = "mapCourtStaffsToCourtNames")
    public abstract List<UserResponse> toUsersResponses(List<User> users);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "phoneNumber", ignore = true)
    @Mapping(target = "active", ignore = true)
    public abstract void updateUser(@MappingTarget User user, UserUpdateRequest request);

    @Named("mapCourtStaffsToCourtNames")
    protected List<String> mapCourtStaffsToCourtNames(Set<CourtStaff> courtStaffs) {
        if (courtStaffs == null || courtStaffs.isEmpty()) {
            return List.of();
        }

        // Lấy danh sách courtIds từ courtStaffs
        List<String> courtIds = courtStaffs.stream()
                .map(CourtStaff::getCourtId)
                .collect(Collectors.toList());

        // Gọi CourtClient để lấy danh sách CourtMap
        List<CourtMap> courtMaps = courtClient.getAllCourts().getBody();

        // Tạo map từ courtId sang courtName
        Map<String, String> courtIdToNameMap = courtMaps.stream()
                .collect(Collectors.toMap(CourtMap::getId, CourtMap::getName));

        // Ánh xạ courtIds sang courtNames
        return courtIds.stream()
                .map(courtId -> courtIdToNameMap.getOrDefault(courtId, "Unknown"))
                .collect(Collectors.toList());
    }
}
