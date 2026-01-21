package com.example.fashionfriends.service;

import com.example.fashionfriends.domain.Clothes;
import com.example.fashionfriends.repository.ClothesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClosetService {

    @Autowired
    private ClothesRepository clothesRepository;

    public Clothes addClothes(Clothes clothes) {
        return clothesRepository.save(clothes);
    }

    public List<Clothes> getMyCloset(Long memberId) {
        return clothesRepository.findByMemberId(memberId);
    }

    public void deleteClothes(Long id) {
        clothesRepository.deleteById(id);
    }

    @Transactional
    public Clothes updateClothes(Long id, String newCategory) {
        Clothes clothes = clothesRepository.findById(id).orElse(null);
        if (clothes != null) {
            clothes.setCategory(newCategory);
            return clothesRepository.save(clothes);
        }
        return null;
    }
}