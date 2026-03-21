// node_scripts/core/csv-parser.ts

import fs from 'fs/promises';

export interface ParseResult<T> {
  data: T[];
  headers: string[];
  rowCount: number;
}

/**
 * Парсит строку CSV с учётом кавычек
 */
function parseCSVLine(line: string): string[] {
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
 * Конвертирует массив объектов в CSV строку
 */
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