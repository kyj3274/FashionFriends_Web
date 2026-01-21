package com.example.fashionfriends.repository;

import com.example.fashionfriends.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClothesRepository extends JpaRepository<Clothes, Long> {
    // 특정 사용자의 옷만 다 가져오기
    List<Clothes> findByMemberId(Long memberId);
}