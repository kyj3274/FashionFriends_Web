// NotificationRepository.java (Fetch Join 적용 필요)
package com.example.fashionfriends.repository;
import com.example.fashionfriends.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n JOIN FETCH n.sender WHERE n.receiver.id = :receiverId ORDER BY n.createdAt DESC")
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
}