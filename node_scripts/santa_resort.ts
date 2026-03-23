#!/usr/bin/env node

// node_scripts/santa_resort.ts

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RawParticipant, AssignedParticipant } from './core/types.ts';
import { TaskManager } from './core/logger.ts';
import { parseCyrillicCSV } from './core/csv-parser.ts';
import { reSortNoShift } from './core/draw-algorithm.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  csv: path.resolve(__dirname, '../_local/SANTA.csv'),
  parsed: path.resolve(__dirname, '../_local/parced/data.js'),
  addresses: path.resolve(__dirname, '../src/data/addresses.ts'),
  backupDir: path.resolve(__dirname, '../_local/backups'),
};

// ============================================
// 1. РЕЗЕРВНОЕ КОПИРОВАНИЕ
// ============================================
async function createBackup(): Promise<{ details: string }> {
  try {
    await fs.access(PATHS.addresses);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
    const backupPath = path.join(PATHS.backupDir, `addresses_${timestamp}.ts`);

    await fs.mkdir(PATHS.backupDir, { recursive: true });
    await fs.copyFile(PATHS.addresses, backupPath);
    return { details: `\n\t📁 ${path.basename(backupPath)}` };
  } catch {
    return { details: '\n\tℹ️  первый запуск' };
  }
}

// ============================================
// 2. СОХРАНЕНИЕ PARSED ФАЙЛА
// ============================================
async function generateParsedFile(
  participants: RawParticipant[],
  assignments: Map<string, string>
): Promise<{ details: string }> {
  await fs.mkdir(path.dirname(PATHS.parsed), { recursive: true });

  const content = `// 🎅 ДАННЫЕ ТАЙНОГО САНТЫ (RAW PARSED DATA)
// Сгенерировано автоматически ${new Date().toLocaleString()}

export const INIT_ADDRESSES = [
${participants.map(p => `  {
    id: "${p.id}",
    gender: "${p.gender}",
    wishes: ${JSON.stringify(p.wishes)},
    ozon_address: ${JSON.stringify(p.ozon_address)},
    wb_address: ${JSON.stringify(p.wb_address)},
    timestamp: "${p.timestamp}"
  }`).join(',\n')}
];

export const SANTA_ASSIGNMENTS = {
${Array.from(assignments.entries()).map(([santa, giftee]) => {
  const santaData = participants.find(p => p.id === santa);
  return `  "${santa}": { // ${santaData?.gender || 'unknown'}
    giftee: "${giftee}",
  }`;
}).join(',\n')}
};`;

  await fs.writeFile(PATHS.parsed, content, 'utf8');
  return { details: `\n\t📁 ${path.relative(process.cwd(), PATHS.parsed)}` };
}

// ============================================
// 3. СОХРАНЕНИЕ ФАЙЛА addresses.ts
// ============================================
async function generateAddressesFile(
  participants: RawParticipant[],
  participantsWithGiftee: AssignedParticipant[],
  assignments: Map<string, string>
): Promise<{ details: string }> {
  const previewEntries = Array.from(assignments.entries()).slice(0, 20);
  const preview = previewEntries.map(([santa, giftee]) => {
    const santaData = participants.find(p => p.id === santa);
    const gifteeData = participantsWithGiftee.find(p => p.id === giftee);
    return `  ${santa} → ${giftee} (${santaData?.gender} → ${gifteeData?.gender})`;
  }).join('\n');

  const content = `// 🎅 ДАННЫЕ ТАЙНОГО САНТЫ
// Сгенерировано автоматически ${new Date().toLocaleString()}
// НЕ РЕДАКТИРУЙТЕ ВРУЧНУЮ!

// 🎲 РЕЗУЛЬТАТЫ ЖЕРЕБЬЁВКИ (Map<string, string>)
// Формат: ID Санты → ID Получателя
/*
${preview}
${assignments.size > 20 ? `  ... и ещё ${assignments.size - 20} пар` : ''}
*/

export type DeliveryDataKeys = "gender" | "wishes" | "ozon_address" | "wb_address";
export type DeliveryDataValue = string;
export type DeliveryData = Record<DeliveryDataKeys, DeliveryDataValue>;

export const DELIVERY_DATA = new Map<string, DeliveryData>([
${participantsWithGiftee.map(p => `  [ "${p.id_santa}", {
    gender: "${p.gender}",
    wishes: ${JSON.stringify(p.wishes)},
    ozon_address: ${JSON.stringify(p.ozon_address)},
    wb_address: ${JSON.stringify(p.wb_address)}
  }]`).join(',\n')}
]);`;

  await fs.writeFile(PATHS.addresses, content, 'utf8');
  return { details: `\n\t📁 ${path.basename(PATHS.addresses)}` };
}

// ============================================
// 4. MAIN
// ============================================
async function main() {
  const manager = new TaskManager([
    '📁 Резервное копирование',
    '📊 Чтение и парсинг CSV',
    '🎲 Жеребьёвка участников',
    '📄 Сохранение распарсенных данных',
    '📝 Генерация финального файла',
    '🔍 Превью результатов'
  ]);

  try {
    // Шаг 1: Бэкап
    await manager.runTask(0, async () => {
      return await createBackup();
    });

    // Шаг 2: Парсинг CSV
    const parsedData = await manager.runTask(1, async () => {
      const data = await parseCyrillicCSV(PATHS.csv);
      if (data.length === 0) {
        throw new Error('❌ CSV файл пуст');
      }
      // Проверка на пустые ID
      const emptyIds = data.filter(p => !p.id);
      if (emptyIds.length > 0) {
        throw new Error(`❌ Найдены участники без ID: ${emptyIds.length} записей`);
      }
      return { 
        parsedData: data,
        details: `\n\t📦 ${data.length} записей`
      };
    });

    // Шаг 3: Жеребьёвка
    const drawResult = await manager.runTask(2, async () => {
      const result = reSortNoShift(parsedData.parsedData);
      return { 
        ...result,
        details: `\n\t⚡ ${result.duration.toFixed(2)} мс 🎲 попыток: ${result.attempts}`
      };
    });

    // Шаг 4: Сохранение parsed файла
    await manager.runTask(3, async () => {
      return await generateParsedFile(parsedData.parsedData, drawResult.assignments);
    });

    // Шаг 5: Генерация addresses.ts
    await manager.runTask(4, async () => {
      return await generateAddressesFile(
        parsedData.parsedData, 
        drawResult.participantsWithGiftee, 
        drawResult.assignments
      );
    });

    // Шаг 6: Превью
    await manager.runTask(5, async () => {
      const previewCount = Math.min(3, parsedData.parsedData.length);
      let previewText = `\n\t🎁 Участников обработано: \x1b[32m${parsedData.parsedData.length}\x1b[0m\n`;

      for (let i = 0; i < previewCount; i++) {
        const p = drawResult.participantsWithGiftee[i];
        const santaData = parsedData.parsedData.find(d => d.id === p.id_santa);
        const gifteeData = parsedData.parsedData.find(d => d.id === drawResult.assignments.get(p.id_santa));
        previewText += `\t${p.id_santa} → ${gifteeData?.id} (${santaData?.gender} → ${gifteeData?.gender})\n`;
      }

      if (drawResult.assignments.size > previewCount) {
        previewText += `\t... + ${drawResult.assignments.size - previewCount} пар`;
      }

      return { details: previewText };
    });

    manager.complete();

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();