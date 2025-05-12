package vn.pickleball.identityservice.configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FcmConfiguration {
    @PostConstruct
    public void initializeFirebase() throws IOException {
        try (InputStream serviceAccount = getClass().getResourceAsStream("/pickleball-3f901-firebase-adminsdk-fbsvc-70d5ec2fc7.json")) {
            if (serviceAccount == null) {
                throw new IllegalStateException("Firebase service account key file not found");
            }
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
        }
    }
}
