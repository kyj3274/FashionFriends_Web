package com.example.fashionfriends.repository;
import com.example.fashionfriends.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface HeartRepository extends JpaRepository<Heart, Long> {
    boolean existsByMemberIdAndOotdLogId(Long memberId, Long ootdLogId);
    void deleteByMemberIdAndOotdLogId(Long memberId, Long ootdLogId);
}