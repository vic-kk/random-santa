import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const CSVPaths = `_local/SANTA.csv`;

// Функция для генерации случайной даты в заданном диапазоне
function generateRandomDate() {
  const start = new Date(2025, 11, 1); // 1 декабря 2025
  const end = new Date(2025, 11, 31); // 31 декабря 2025
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  // Форматирование даты в нужный формат
  const options = {
    timeZone: 'Asia/Bangkok', // GMT+7
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
}

// Функция для генерации случайного номера (6 цифр) - гарантирует уникальность
function generateRandomNumber(existingNumbers) {
  let number;
  do {
    number = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingNumbers.has(number));
  
  existingNumbers.add(number);
  return number;
}

// Функция для генерации случайного гендера
function generateRandomGender() {
  const genders = ['Дивчина', 'МУЖИК'];
  return genders[Math.floor(Math.random() * genders.length)];
}

// Функция для генерации случайного пожелания (может быть пустым)
function generateRandomWish() {
  const wishes = [
    // 40% - пустые или короткие
    '', '', '', '', '', '',
    'Нет пожеланий',
    'Как есть',
    'Любой подарок',
    'На ваше усмотрение',

    // 30% - обычные пожелания
    'Пожалуйста без сладкого 🚫🍬',
    'Люблю сладкое! 🍫',
    'Что-нибудь полезное 🥦',
    'Чай или кофе ☕',
    'Книгу 📚',
    'Для дома 🏠',
    'Средства для ухода 🧴',

    // 20% - подробные пожелания
    'Пожалуйста, без сладкого и соленого. Предпочту что-то полезное или для дома 🌿',
    'Обожаю сладости, особенно шоколад и печенье! Чем слаще, тем лучше 🍪😋',
    'Хотелось бы книгу или что-то для творчества. Ручная работа приветствуется 🎨',
    'Что-нибудь для уюта в доме: свечи, декор или комнатное растение 🕯️🌱',
    'Только натуральная косметика или средства для ухода за кожей, пожалуйста 🌸',

    // 10% - эмоциональные/с эмодзи
    'Сюрприз! Главное - внимание и забота 🥰💖',
    'Делайте как знаете, доверяю вашему вкусу! ✨🎁',
    'Что угодно, лишь бы не носки! 😄🧦❌',
    'Подарок от сердца - лучший подарок ❤️🤗',
    'Экологичные и локальные продукты поддержу 🌍🛒'
  ];
  return wishes[Math.floor(Math.random() * wishes.length)];
}

// Функция для генерации случайного адреса
function generateRandomAddress(city = null) {
  const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону'];
  const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Советская', 'Мира', 'Центральная', 'Молодежная', 'Школьная', 'Садовая', 'Набережная'];
  
  const selectedCity = city || cities[Math.floor(Math.random() * cities.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const building = Math.floor(Math.random() * 200) + 1;
  const corpus = Math.random() > 0.7 ? ` корпус ${Math.floor(Math.random() * 5) + 1}` : '';
  
  return `${selectedCity}, улица ${street} ${building}${corpus}`;
}

// Функция для генерации одной строки данных (теперь принимает existingNumbers)
function generateDataRow(index, existingNumbers) {
  const timestamp = generateRandomDate();
  const uniqueNumber = generateRandomNumber(existingNumbers);
  const gender = generateRandomGender();
  const wish = generateRandomWish();
  
  // Генерируем город для согласованности адресов
  const city = Math.random() > 0.5 ? null : 'Москва';
  const ozonAddress = generateRandomAddress(city);
  
  // Для WB адрес иногда немного отличается
  let wbAddress;
  if (Math.random() > 0.8) {
    // 20% случаев адреса разные
    const newCity = city || (Math.random() > 0.5 ? 'Москва' : 'Санкт-Петербург');
    wbAddress = generateRandomAddress(newCity);
  } else {
    // 80% случаев адреса одинаковые или почти одинаковые
    if (Math.random() > 0.5) {
      wbAddress = ozonAddress;
    } else {
      // Немного изменяем адрес (например, другой корпус)
      wbAddress = ozonAddress.replace(/корпус \d+/, `корпус ${Math.floor(Math.random() * 5) + 2}`) || ozonAddress;
    }
  }
  
  return [
    `"${timestamp}"`,
    `"${uniqueNumber}"`,
    `"${gender}"`,
    `"${wish}"`,
    `"${ozonAddress}"`,
    `"${wbAddress}"`
  ].join(',');
}

// Функция для проверки уникальности номеров (для отладки)
function validateUniqueNumbers(rows) {
  const numbers = new Set();
  const duplicates = [];
  
  for (let i = 1; i < rows.length; i++) { // Пропускаем заголовок
    const columns = rows[i].split(',');
    const number = columns[1]?.replace(/"/g, ''); // Извлекаем номер (вторая колонка)
    
    if (numbers.has(number)) {
      duplicates.push(number);
    } else {
      numbers.add(number);
    }
  }
  
  return {
    isValid: duplicates.length === 0,
    duplicates,
    totalNumbers: numbers.size
  };
}

// Функция для создания CSV файла
export function createCSVFile(filename, rowCount = 100) {
  // Заголовки
  const headers = [
    '"Отметка времени"',
    '"Укажи уникальный номер, расположенный на сайте"',
    '"Укажи свой гендер"',
    '"Укажи свои пожелания, если хочешь. Что хотелось/не хотелось бы получить."',
    '"ОЗОН Адрес"',
    '"ВБ Адрес"'
  ].join(',');
  
  // Генерируем строки данных
  const rows = [headers];
  const existingNumbers = new Set(); // Множество для отслеживания уникальных номеров
  
  for (let i = 0; i < rowCount; i++) {
    rows.push(generateDataRow(i, existingNumbers));
  }
  
  // Объединяем все строки
  const csvContent = rows.join('\n');
  
  // Записываем в файл
  writeFileSync(filename, csvContent, 'utf8');
  console.log(`✅ Файл ${filename} успешно создан с ${rowCount} строками данных.`);
  
  // Проверяем уникальность номеров
  const validation = validateUniqueNumbers(rows);
  if (validation.isValid) {
    console.log(`✅ Все ${validation.totalNumbers} номеров уникальны.`);
  } else {
    console.log(`❌ Найдены дубликаты: ${validation.duplicates.join(', ')}`);
  }
  
  // Выводим первые 3 строки для проверки
  console.log('\n📋 Первые 3 строки файла:');
  console.log(rows.slice(0, 4).join('\n'));
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  let rowCount = 15; // По умолчанию 15 строк
  
  // Парсим аргументы командной строки
  if (args.length > 0) {
    const count = parseInt(args[0]);
    if (!isNaN(count) && count > 0) {
      rowCount = count;
    }
  }
  
  try {
    createCSVFile(CSVPaths, rowCount);
  } catch (error) {
    console.error('❌ Ошибка при создании файла:', error.message);
    process.exit(1);
  }
}

// Запускаем скрипт, если он вызван напрямую
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}