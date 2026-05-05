import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs/promises';
import {
  parseCSVLine,
  normalizeCyrillicRecord,
  parseCSV,
  parseCyrillicCSV,
  stringifyCyrillicCSV,
  stringifyCSV,
  CYRILLIC_COLUMNS
} from '../csv-parser.js';
import type { RawParticipant } from '../types.js';

vi.mock('fs/promises');

describe('csv-parser', () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseCSVLine', () => {
    it('правильно парсит простую строку без кавычек', () => {
      const result = parseCSVLine('один,два,три,четыре');
      expect(result).toEqual(['один', 'два', 'три', 'четыре']);
    });

    it('правильно парсит строку с пробелами вокруг значений', () => {
      const result = parseCSVLine('  первый  ,  второй  ,  третий  ');
      expect(result).toEqual(['первый', 'второй', 'третий']);
    });

    it('правильно парсит значения в кавычках', () => {
      const result = parseCSVLine('"значение 1","значение, с запятой","значение с пробелами"');
      expect(result).toEqual(['значение 1', 'значение, с запятой', 'значение с пробелами']);
    });

    it('правильно обрабатывает экранированные кавычки RFC 4180', () => {
      const result = parseCSVLine('"значение с ""кавычками"" внутри"');
      expect(result).toEqual(['значение с "кавычками" внутри']);
    });

    it('правильно обрабатывает пустые значения', () => {
      const result = parseCSVLine(',один,,три,');
      expect(result).toEqual(['', 'один', '', 'три', '']);
    });

    it('правильно обрабатывает смешанный формат с кавычками и без', () => {
      const result = parseCSVLine('без кавычек,"с кавычками",опять без');
      expect(result).toEqual(['без кавычек', 'с кавычками', 'опять без']);
    });

    it('правильно парсит строку из реальной Google Forms', () => {
      const result = parseCSVLine('"11.05.2026 18:32:12","123456","мужской","Хочу хороший подарок","ул Ленина 12 кв 45","ул Ленина 12 кв 45"');
      expect(result).toHaveLength(6);
    });
  });

  describe('normalizeCyrillicRecord', () => {
    it('правильно преобразует запись с русскими заголовками', () => {
      const record = {
        [CYRILLIC_COLUMNS.id]: '777888',
        [CYRILLIC_COLUMNS.gender]: 'женский',
        [CYRILLIC_COLUMNS.wishes]: 'Люблю конфеты',
        [CYRILLIC_COLUMNS.ozon_address]: 'Озон адрес',
        [CYRILLIC_COLUMNS.wb_address]: 'ВБ адрес',
        [CYRILLIC_COLUMNS.timestamp]: '12.05.2026 10:00:00'
      };

      const result = normalizeCyrillicRecord(record);

      expect(result.id).toBe('777888');
      expect(result.gender).toBe('женский');
      expect(result.wishes).toBe('Люблю конфеты');
      expect(result.ozon_address).toBe('Озон адрес');
      expect(result.wb_address).toBe('ВБ адрес');
      expect(result.timestamp).toBe('12.05.2026 10:00:00');
    });

    it('возвращает пустые строки для отсутствующих полей', () => {
      const result = normalizeCyrillicRecord({});
      expect(result.id).toBe('');
      expect(result.gender).toBe('');
      expect(result.wishes).toBe('');
    });
  });

  describe('parseCSV', () => {
    it('правильно парсит полный CSV файл', async () => {
      const testCSV = `
имя,возраст,город
Алексей,30,Москва
Мария,25,Санкт-Петербург
Иван,35,Новосибирск
      `.trim();

      vi.mocked(fs.readFile).mockResolvedValue(testCSV);

      const result = await parseCSV('test.csv');

      expect(result.rowCount).toBe(3);
      expect(result.headers).toEqual(['имя', 'возраст', 'город']);
      expect(result.data[0].имя).toBe('Алексей');
      expect(result.data[1].возраст).toBe('25');
    });

    it('выбрасывает ошибку для пустого файла', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('');
      await expect(parseCSV('empty.csv')).rejects.toThrow('CSV файл пуст или содержит только заголовок');
    });

    it('применяет mapper функцию к каждой записи', async () => {
      const testCSV = `id,имя
1,Алексей
2,Мария
      `.trim();

      vi.mocked(fs.readFile).mockResolvedValue(testCSV);

      const result = await parseCSV('test.csv', record => ({
        id: Number(record.id),
        name: record.имя
      }));

      expect(result.data[0].id).toBeTypeOf('number');
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].name).toBe('Алексей');
    });
  });

  describe('parseCyrillicCSV', () => {
    it('правильно парсит CSV из Google Forms', async () => {
      const headerRow = Object.values(CYRILLIC_COLUMNS).map(h => `"${h}"`).join(',');

      const testCSV = `
${headerRow}
"01.01.2026 12:00:00","111111","мужской","Подарок","Озон 1","ВБ 1"
"02.01.2026 13:00:00","222222","женский","","Озон 2","ВБ 2"
      `.trim();

      vi.mocked(fs.readFile).mockResolvedValue(testCSV);

      const result = await parseCyrillicCSV('test.csv');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('111111');
      expect(result[1].gender).toBe('женский');
    });
  });

  describe('stringifyCyrillicCSV', () => {
    it('правильно сериализует участников в CSV', () => {
      const participants: RawParticipant[] = [
        {
          id: '123456',
          gender: 'мужской',
          wishes: 'Хочу игровую приставку',
          ozon_address: 'ул Пушкина 1',
          wb_address: 'ул Пушкина 1',
          timestamp: '05.05.2026 20:00:00'
        }
      ];

      const csv = stringifyCyrillicCSV(participants);
      const lines = csv.split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0]).toContain(CYRILLIC_COLUMNS.id);
      expect(lines[1]).toContain('123456');
    });

    it('правильно экранирует кавычки', () => {
      const participants: RawParticipant[] = [
        {
          id: '777',
          gender: 'мужской',
          wishes: 'Хочу "крутой" подарок',
          ozon_address: 'адрес',
          wb_address: 'адрес',
          timestamp: 'дата'
        }
      ];

      const csv = stringifyCyrillicCSV(participants);
      expect(csv).toContain('"Хочу ""крутой"" подарок"');
    });

    it('возвращает пустую строку для пустого массива', () => {
      expect(stringifyCyrillicCSV([])).toBe('');
    });
  });

  describe('stringifyCSV', () => {
    it('работает с произвольными объектами', () => {
      const data = [
        { a: 1, b: 'текст', c: true },
        { a: 2, b: 'другой текст', c: false }
      ];

      const csv = stringifyCSV(data);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('"a","b","c"');
    });

    it('правильно обрабатывает null и undefined', () => {
      const data = [
        { a: null, b: undefined, c: 'значение' }
      ];

      const csv = stringifyCSV(data);
      expect(csv).toContain('""');
    });
  });

  describe('циклический тест парсер → сериализатор', () => {
    it('данные не меняются при последовательном парсинге и сериализации', () => {
      const original: RawParticipant[] = [
        { id: '111', gender: 'мужской', wishes: 'подарок 1', ozon_address: 'адрес 1', wb_address: 'адрес 1', timestamp: 'дата 1' },
        { id: '222', gender: 'женский', wishes: 'подарок 2', ozon_address: 'адрес 2', wb_address: 'адрес 2', timestamp: 'дата 2' },
      ];

      const csv = stringifyCyrillicCSV(original);
      const lines = csv.split('\n').filter(l => l.trim());

      const headers = parseCSVLine(lines[0]);
      const result: RawParticipant[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const record: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
          record[headers[j]] = values[j];
        }
        result.push(normalizeCyrillicRecord(record));
      }

      expect(result).toEqual(original);
    });
  });
});