package vn.pickleball.courtservice.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

@Service
public class FirebaseStorageService {
    private Storage storage;
    private final String bucketName = "techwash-56d5a.appspot.com";

    @PostConstruct
    public void init() throws IOException {
        storage = StorageOptions.newBuilder()
                .setCredentials(GoogleCredentials.fromStream(new ClassPathResource("firebase-service-account.json").getInputStream()))
                .build()
                .getService();
    }

    public String uploadFile(MultipartFile file, String path) throws IOException {
        String fileName = path + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .setAcl(java.util.List.of(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER))) // 🔹 Set quyền Public
                .build();

        storage.create(blobInfo, file.getBytes());

        return "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + fileName.replace("/", "%2F") + "?alt=media";
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        // Lấy phần sau bucket name
        String fileName;
        if (fileUrl.contains("firebasestorage.googleapis.com")) {
            fileName = fileUrl.substring(fileUrl.indexOf("/o/") + 3, fileUrl.indexOf("?alt=media"));
            fileName = fileName.replace("%2F", "/"); // 🔹 Decode URL
        } else {
            fileName = fileUrl.replace("https://storage.googleapis.com/" + bucketName + "/", "");
        }

        BlobId blobId = BlobId.of(bucketName, fileName);
        boolean deleted = storage.delete(blobId);

        if (!deleted) {
            throw new RuntimeException("Failed to delete file: " + fileUrl);
        }
    }

}
