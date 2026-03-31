import { describe, it, expect } from 'vitest';
import { reSortNoShift } from '../draw-algorithm.js';
import type { RawParticipant } from '../types.js';

/**
 * Хелпер для создания мок-участника
 */
function createParticipant(id: string): RawParticipant {
  return {
    id,
    gender: 'male',
    wishes: 'Test wish',
    ozon_address: 'Test address',
    wb_address: 'Test address',
    timestamp: new Date().toISOString(),
  };
}

describe('reSortNoShift', () => {
  describe('валидация входных данных', () => {
    it('выбрасывает ошибку при пустом массиве', () => {
      expect(() => reSortNoShift([])).toThrow('минимум 2 участника');
    });

    it('выбрасывает ошибку при одном участнике', () => {
      const participants = [createParticipant('1')];
      expect(() => reSortNoShift(participants)).toThrow('минимум 2 участника');
    });

    it('выбрасывает ошибку при дубликатах ID', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('1'),
      ];
      expect(() => reSortNoShift(participants)).toThrow('дубликат ID');
    });
  });

  describe('корректность алгоритма', () => {
    it('корректно распределяет 2 участников', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('2'),
      ];

      const result = reSortNoShift(participants);

      // Проверяем, что никто не дарит сам себе
      for (const [santaId, gifteeId] of result.assignments) {
        expect(santaId).not.toBe(gifteeId);
      }

      // Проверяем количество назначений
      expect(result.assignments.size).toBe(2);
      expect(result.participantsWithGiftee.length).toBe(2);
    });

    it('корректно распределяет 500 участников', () => {
      const users = 500
      const participants = Array.from({ length: users }, (_, i) =>
        createParticipant(String(i + 1))
      );

      const result = reSortNoShift(participants);

      // Проверяем, что никто не дарит сам себе
      for (const [santaId, gifteeId] of result.assignments) {
        expect(santaId).not.toBe(gifteeId);
      }

      // Проверяем количество назначений
      expect(result.assignments.size).toBe(users);
      expect(result.participantsWithGiftee.length).toBe(users);
    });

    it('корректно распределяет 10000 участников', () => {
      const users = 10000
      const participants = Array.from({ length: users }, (_, i) =>
        createParticipant(String(i + 1))
      );

      const result = reSortNoShift(participants);

      // Проверяем, что никто не дарит сам себе
      for (const [santaId, gifteeId] of result.assignments) {
        expect(santaId).not.toBe(gifteeId);
      }

      // Проверяем количество назначений
      expect(result.assignments.size).toBe(users);
      expect(result.participantsWithGiftee.length).toBe(users);
    });

    it('каждый участник получает ровно одного получателя', () => {
      const participants = Array.from({ length: 5 }, (_, i) =>
        createParticipant(String(i + 1))
      );

      const result = reSortNoShift(participants);

      // Собираем всех получателей
      const gifteeIds = Array.from(result.assignments.values());

      // Проверяем, что каждый ID встречается ровно один раз
      const uniqueGifteeIds = new Set(gifteeIds);
      expect(uniqueGifteeIds.size).toBe(participants.length);
    });

    it('все участники из входных данных присутствуют в результате', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('2'),
        createParticipant('3'),
      ];

      const result = reSortNoShift(participants);

      // Проверяем, что все участники есть в assignments
      for (const participant of participants) {
        expect(result.assignments.has(participant.id)).toBe(true);
      }

      // Проверяем, что все участники есть в participantsWithGiftee
      const santaIds = result.participantsWithGiftee.map((p) => p.id_santa);
      for (const participant of participants) {
        expect(santaIds).toContain(participant.id);
      }
    });
  });

  describe('структура результата', () => {
    it('возвращает корректную структуру ReSortResult', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('2'),
        createParticipant('3'),
      ];

      const result = reSortNoShift(participants);

      // Проверяем наличие всех полей
      expect(result).toHaveProperty('assignments');
      expect(result).toHaveProperty('participantsWithGiftee');
      expect(result).toHaveProperty('attempts');
      expect(result).toHaveProperty('duration');

      // Проверяем типы
      expect(result.assignments).toBeInstanceOf(Map);
      expect(Array.isArray(result.participantsWithGiftee)).toBe(true);
      expect(typeof result.attempts).toBe('number');
      expect(typeof result.duration).toBe('number');

      // Проверяем значения
      expect(result.attempts).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('participantsWithGiftee содержит корректные AssignedParticipant', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('2'),
      ];

      const result = reSortNoShift(participants);

      for (const assigned of result.participantsWithGiftee) {
        // Проверяем наличие всех полей RawParticipant
        expect(assigned).toHaveProperty('id');
        expect(assigned).toHaveProperty('gender');
        expect(assigned).toHaveProperty('wishes');
        expect(assigned).toHaveProperty('ozon_address');
        expect(assigned).toHaveProperty('wb_address');
        expect(assigned).toHaveProperty('timestamp');

        // Проверяем наличие поля id_santa
        expect(assigned).toHaveProperty('id_santa');

        // Проверяем, что id_santa не равен id (никто не дарит сам себе)
        expect(assigned.id).not.toBe(assigned.id_santa);
      }
    });
  });

  describe('граничные случаи', () => {
    it('выбрасывает ошибку при исчерпании попыток', () => {
      const participants = [
        createParticipant('1'),
        createParticipant('2'),
      ];

      // Для 2 участников вероятность неудачи 50%,
      // но с maxAttempts = 0 должно выбросить ошибку
      expect(() => reSortNoShift(participants, 0)).toThrow(
        'Не удалось найти корректное распределение'
      );
    });
  });
});