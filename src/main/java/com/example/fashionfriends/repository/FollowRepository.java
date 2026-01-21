package com.example.fashionfriends.repository;
import com.example.fashionfriends.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface FollowRepository extends JpaRepository<Follow, Long> {
    // 팔로워(Mates) 수
    long countByReceiverAndStatus(Member receiver, FollowStatus status);
    // 팔로잉(Refs) 수
    long countBySenderAndStatus(Member sender, FollowStatus status);

    // 관계 확인 (이미 팔로우 중인지)
    Follow findBySenderAndReceiver(Member sender, Member receiver);

    // 나를 팔로우한 사람들 찾기 (새 글 알림용)
    List<Follow> findByReceiverAndStatus(Member receiver, FollowStatus status);
}