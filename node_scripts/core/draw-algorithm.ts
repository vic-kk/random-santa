// node_scripts/core/draw-algorithm.ts

import type { RawParticipant, AssignedParticipant } from './types.js';

export interface ReSortResult {
  assignments: Map<string, string>;
  participantsWithGiftee: AssignedParticipant[];
  attempts: number;
  duration: number;
}

/**
 * Классический алгоритм (random + check)
 * 
 * Идея: случайно перемешиваем получателей, пока никто не дарит себе
 * 
 * Сложность: O(n × attempts) по времени
 * Рандом: идеальный (все derangements равновероятны)
 * 
 * Для n=150: 1-3 попытки, < 5 мс
 * Для n=90,000: ~2.7 попытки, но каждая попытка O(n) → ~0.5 сек
 */
export function reSortNoShift(participants: RawParticipant[], maxAttempts: number = 1000): ReSortResult {
  const startTime = performance.now();
  const n = participants.length;
  
  if (n < 2) {
    throw new Error('❌ Для жеребьёвки нужно минимум 2 участника');
  }

  const ids = participants.map(p => p.id);
  const participantsMap = new Map(participants.map(p => [p.id, p]));
  
  // Проверка дубликатов ID
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`❌ Найден дубликат ID: ${id}`);
    }
    seen.add(id);
  }

  // Создаём копию массива получателей
  const receivers = [...ids];
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Перемешиваем массив получателей (Fisher-Yates)
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (i !== j) {
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
      }
    }
    
    // Проверяем, что никто не дарит сам себе
    let valid = true;
    for (let i = 0; i < n; i++) {
      if (ids[i] === receivers[i]) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      // Создаём результат
      const assignments = new Map<string, string>();
      const result: AssignedParticipant[] = new Array(n);
      
      for (let i = 0; i < n; i++) {
        const santaId = ids[i];
        const gifteeId = receivers[i];
        assignments.set(santaId, gifteeId);
        
        const gifteeData = participantsMap.get(gifteeId);
        if (!gifteeData) {
          throw new Error(`❌ Не найден получатель с ID: ${gifteeId}`);
        }
        
        result[i] = {
          ...gifteeData,
          id_santa: santaId
        };
      }
      
      return {
        assignments,
        participantsWithGiftee: result,
        attempts: attempt + 1,
        duration: performance.now() - startTime
      };
    }
  }
  
  throw new Error(`❌ Не удалось найти корректное распределение за ${maxAttempts} попыток`);
}