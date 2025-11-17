/**
 * Утилиты для форматирования данных в Git модуле
 */

/**
 * Форматирует размер в байтах в читаемый формат
 *
 * @param bytes - размер в байтах
 * @returns отформатированная строка (например, "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Форматирует дату в относительный формат (например, "2 часа назад")
 *
 * @param date - дата в ISO формате или Date объект
 * @returns отформатированная строка
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'только что';
  } else if (diffMin < 60) {
    return `${diffMin} ${pluralize(diffMin, 'минуту', 'минуты', 'минут')} назад`;
  } else if (diffHour < 24) {
    return `${diffHour} ${pluralize(diffHour, 'час', 'часа', 'часов')} назад`;
  } else if (diffDay < 30) {
    return `${diffDay} ${pluralize(diffDay, 'день', 'дня', 'дней')} назад`;
  } else if (diffMonth < 12) {
    return `${diffMonth} ${pluralize(diffMonth, 'месяц', 'месяца', 'месяцев')} назад`;
  } else {
    return `${diffYear} ${pluralize(diffYear, 'год', 'года', 'лет')} назад`;
  }
}

/**
 * Форматирует дату в читаемый формат
 *
 * @param date - дата в ISO формате или Date объект
 * @returns отформатированная строка (например, "17 ноября 2025, 19:30")
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return dateObj.toLocaleString('ru-RU', options);
}

/**
 * Укорачивает SHA до первых 7 символов
 *
 * @param sha - полный SHA коммита
 * @returns короткий SHA (7 символов)
 */
export function shortenSha(sha: string): string {
  return sha.substring(0, 7);
}

/**
 * Вспомогательная функция для правильной формы множественного числа в русском языке
 *
 * @param num - число
 * @param one - форма для 1 (например, "минута")
 * @param few - форма для 2-4 (например, "минуты")
 * @param many - форма для 5+ (например, "минут")
 * @returns правильная форма слова
 */
function pluralize(num: number, one: string, few: string, many: string): string {
  const mod10 = num % 10;
  const mod100 = num % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  } else {
    return many;
  }
}
