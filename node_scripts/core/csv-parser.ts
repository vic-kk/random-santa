// node_scripts/core/csv-parser.ts

import fs from 'fs/promises';
import type { RawParticipant } from './types.ts';

export interface ParseResult<T> {
  data: T[];
  headers: string[];
  rowCount: number;
}

// Русские заголовки колонок (единый источник правды)
export const CYRILLIC_COLUMNS = {
  timestamp: 'Отметка времени',
  id: 'Укажи уникальный номер, расположенный на сайте',
  gender: 'Укажи свой гендер',
  wishes: 'Укажи свои пожелания, если хочешь. Что хотелось/не хотелось бы получить.',
  ozon_address: 'ОЗОН Адрес',
  wb_address: 'ВБ Адрес'
} as const;

// Порядок колонок для генерации CSV (автоматически из порядка ключей CYRILLIC_COLUMNS)
export const CYRILLIC_COLUMNS_ORDER = Object.values(CYRILLIC_COLUMNS);

/**
 * Преобразует запись с русскими ключами в RawParticipant
 */
export function normalizeCyrillicRecord(record: Record<string, string>): RawParticipant {
  return {
    id: record[CYRILLIC_COLUMNS.id] || '',
    gender: record[CYRILLIC_COLUMNS.gender] || '',
    wishes: record[CYRILLIC_COLUMNS.wishes] || '',
    ozon_address: record[CYRILLIC_COLUMNS.ozon_address] || '',
    wb_address: record[CYRILLIC_COLUMNS.wb_address] || '',
    timestamp: record[CYRILLIC_COLUMNS.timestamp] || ''
  };
}

/**
 * Парсит строку CSV с учётом кавычек (RFC 4180)
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Парсит CSV файл в массив объектов
 * @param filePath путь к файлу
 * @param mapper опциональная функция преобразования записи
 */
export async function parseCSV<T = Record<string, string>>(
  filePath: string, 
  mapper?: (record: Record<string, string>) => T
): Promise<ParseResult<T>> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV файл пуст или содержит только заголовок');
  }

  const headers = parseCSVLine(lines[0]);
  const records: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || '';
    }

    records.push(mapper ? mapper(record) : record as unknown as T);
  }

  return {
    data: records,
    headers,
    rowCount: records.length
  };
}

/**
 * Парсит русский CSV (из Google Forms) и сразу возвращает RawParticipant[]
 * Умеет работать как с RFC 4180 (Forms), так и со смешанным форматом (Sheets)
 */
export async function parseCyrillicCSV(filePath: string): Promise<RawParticipant[]> {
  const { data } = await parseCSV<Record<string, string>>(filePath);
  return data.map(normalizeCyrillicRecord);
}

/**
 * Конвертирует массив RawParticipant в CSV строку с русскими заголовками (RFC 4180)
 */
export function stringifyCyrillicCSV(participants: RawParticipant[]): string {
  if (participants.length === 0) return '';

  // Заголовки с кавычками (RFC 4180)
  const headerRow = CYRILLIC_COLUMNS_ORDER.map(header => `"${header}"`).join(',');
  
  const rows = participants.map(participant => {
    const values = [
      participant.timestamp,
      participant.id,
      participant.gender,
      participant.wishes,
      participant.ozon_address,
      participant.wb_address
    ];
    
    return values.map(value => {
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

// Сохраняем старую функцию для обратной совместимости (если нужно)
export function stringifyCSV<T extends object>(
  data: T[],
  headers?: (keyof T)[]
): string {
  if (data.length === 0) return '';

  const keys = (headers || Object.keys(data[0])) as (keyof T)[];

  const headerRow = keys.map(key => `"${String(key)}"`).join(',');
  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      if (value === undefined || value === null) return '""';
      // Преобразуем в строку любое значение
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
}