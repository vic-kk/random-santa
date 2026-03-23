#!/usr/bin/env node

// node_scripts/generate-mock-csv.ts

import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TaskManager, logger } from './core/logger.ts';
import { stringifyCyrillicCSV } from './core/csv-parser.ts';
import type { RawParticipant } from './core/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../_local/SANTA.csv');

// Конфигурация
const CONFIG = {
  defaultCount: 15,
  batchSize: 1000,
  cities: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'],
  streets: ['Ленина', 'Пушкина', 'Гагарина', 'Советская', 'Мира'],
  wishes: [
    '', '', '', '', '', '',
    'Нет пожеланий',
    'Как есть',
    'Любой подарок',
    'На ваше усмотрение',
    'Пожалуйста без сладкого 🚫🍬',
    'Люблю сладкое! 🍫',
    'Что-нибудь полезное 🥦',
  ],
  genders: ['Дивчина', 'МУЖИК'],
};

// Утилиты
const formatNumber = (num: number): string => 
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const generateRandomDate = (): string => {
  const start = new Date(2025, 11, 1);
  const end = new Date(2025, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const dateStr = date.toLocaleString('en-US', options);
  return `${dateStr.replace(',', '')} GMT+7`;
};

const generateRandomNumber = (existingNumbers: Set<string>): string => {
  let number: string;
  do {
    number = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingNumbers.has(number));
  existingNumbers.add(number);
  return number;
};

const generateRandomAddress = (city: string | null = null): string => {
  const selectedCity = city || CONFIG.cities[Math.floor(Math.random() * CONFIG.cities.length)];
  const street = CONFIG.streets[Math.floor(Math.random() * CONFIG.streets.length)];
  const building = Math.floor(Math.random() * 200) + 1;
  const corpus = Math.random() > 0.7 ? ` корпус ${Math.floor(Math.random() * 5) + 1}` : '';

  return `${selectedCity}, улица ${street} ${building}${corpus}`;
};

const generateParticipant = (
  existingNumbers: Set<string>
): RawParticipant => {
  const timestamp = generateRandomDate();
  const id = generateRandomNumber(existingNumbers);
  const gender = CONFIG.genders[Math.floor(Math.random() * CONFIG.genders.length)];
  const wish = CONFIG.wishes[Math.floor(Math.random() * CONFIG.wishes.length)];

  const city = Math.random() > 0.5 ? null : 'Москва';
  const ozon_address = generateRandomAddress(city);

  let wb_address: string;
  if (Math.random() > 0.8) {
    const newCity = city || (Math.random() > 0.5 ? 'Москва' : 'Санкт-Петербург');
    wb_address = generateRandomAddress(newCity);
  } else {
    if (Math.random() > 0.5) {
      wb_address = ozon_address;
    } else {
      wb_address = ozon_address.replace(/корпус \d+/, `корпус ${Math.floor(Math.random() * 5) + 2}`) || ozon_address;
    }
  }

  return {
    id,
    gender,
    wishes: wish,
    ozon_address,
    wb_address,
    timestamp
  };
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const rowCount = args.length > 0 ? parseInt(args[0]) || CONFIG.defaultCount : CONFIG.defaultCount;

  const manager = new TaskManager([
    '📁 Подготовка',
    '📊 Генерация',
    '✅ Проверка',
    '📝 Сохранение',
    '🔍 Превью'
  ]);

  try {
    // Шаг 1: Подготовка
    await manager.runTask(0, async () => {
      return { details: `🎯 ${formatNumber(rowCount)} записей` };
    });

    // Шаг 2: Генерация
    const startTime = Date.now();
    const participants: RawParticipant[] = [];
    const existingNumbers = new Set<string>();

    for (let i = 0; i < rowCount; i++) {
      participants.push(generateParticipant(existingNumbers));

      if ((i + 1) % CONFIG.batchSize === 0 || i === rowCount - 1) {
        const percent = Math.round(((i + 1) / rowCount) * 100);
        manager.updateDetails(1, `📊 ${formatNumber(i + 1)}/${formatNumber(rowCount)} (${percent}%)`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    await manager.runTask(1, async () => {
      return { details: `⚡ ${duration}с` };
    });

    // Шаг 3: Проверка уникальности
    await manager.runTask(2, async () => {
      const uniqueCount = existingNumbers.size;
      const isValid = uniqueCount === participants.length;
      return { 
        details: isValid 
          ? `✅ Все ${formatNumber(uniqueCount)} номеров уникальны` 
          : `❌ Найдены дубликаты!`
      };
    });

    // Шаг 4: Сохранение в кириллическом формате RFC 4180
    const csvContent = stringifyCyrillicCSV(participants);
    writeFileSync(CSV_PATH, csvContent, 'utf8');

    await manager.runTask(3, async () => {
      return { details: `📁 ${path.basename(CSV_PATH)}` };
    });

    // Шаг 5: Превью
    await manager.runTask(4, async () => {
      const preview = participants.slice(0, 3).map(p => 
        `${p.id} | ${p.gender} | ${p.wishes.slice(0, 30)}...`
      ).join('\n');

      return { details: `\n📋 Первые 3:\n${preview}` };
    });

    manager.complete();
    logger.success(`Генерация завершена: ${formatNumber(rowCount)} записей`);

  } catch (error) {
    logger.error('Ошибка:', error);
    process.exit(1);
  }
}

main();