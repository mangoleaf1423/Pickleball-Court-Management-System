package vn.pickleball.identityservice.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import vn.pickleball.identityservice.dto.request.NotiData;
import vn.pickleball.identityservice.dto.request.NotificationRequest;
import vn.pickleball.identityservice.entity.Notification;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface NotificationMapper {

    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mapping(target = "notificationData", source = "notificationData", qualifiedByName = "mapNotiDataToString")
    Notification toEntity(NotificationRequest request);

    @Mapping(target = "notificationData", source = "notificationData", qualifiedByName = "mapStringToNotiData")
    NotificationRequest toDto(Notification entity);

    List<NotificationRequest> toDtoList(List<Notification> entities);

    @Named("mapNotiDataToString")
    public static String mapNotiDataToString(NotiData notiData) {
        if (notiData == null) {
            return null; // Nếu giá trị null, không cần map
        }
        try {
            return objectMapper.writeValueAsString(notiData);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return null; // Xử lý lỗi JSON nếu cần
        }
    }

    @Named("mapStringToNotiData")
    public static NotiData mapStringToNotiData(String notiData) {
        if (notiData == null || notiData.isEmpty()) {
            return null; // Nếu giá trị null hoặc rỗng, không cần map
        }
        try {
            return objectMapper.readValue(notiData, NotiData.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return null;
        }
    }
}
