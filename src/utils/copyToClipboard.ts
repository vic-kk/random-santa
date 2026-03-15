import { toast, ToastOptions } from 'react-toastify';

interface CopyOptions {
  /** Текст для уведомления об успехе */
  successMessage?: string;
  /** Текст для уведомления об ошибке */
  errorMessage?: string;
  /** Показывать ли уведомления */
  showNotification?: boolean;
  /** Опции для toast уведомлений (если используете react-toastify) */
  toastOptions?: ToastOptions;
  /** Колбэк при успехе */
  onSuccess?: (text: string) => void;
  /** Колбэк при ошибке */
  onError?: (text: string, error: Error) => void;
  /** Использовать ли fallback с prompt на мобильных устройствах */
  useFallbackPrompt?: boolean;
}

/**
 * Универсальная функция копирования текста в буфер обмена
 * с обработкой ошибок и уведомлениями
 */
export async function copyToClipboard(
  text: string,
  options: CopyOptions = {}
): Promise<boolean> {
  const {
    successMessage = '✅ Текст скопирован в буфер обмена',
    errorMessage = '❌ Не удалось скопировать текст',
    showNotification = true,
    // toastOptions = {},
    onSuccess,
    onError,
    useFallbackPrompt = true,
  } = options;

  // Проверка входных данных
  if (!text || typeof text !== 'string') {
    const error = new Error('Текст для копирования отсутствует или не является строкой');
    handleError(error, errorMessage, showNotification, onError, text);
    return false;
  }

  // Обрезаем текст для безопасного отображения
  const displayText = text.length > 100 ? text.substring(0, 100) + '...' : text;

  try {
    // 1. Пробуем современный Clipboard API (предпочтительный способ)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      handleSuccess(successMessage, showNotification, onSuccess, text);
      return true;
    }

    // 2. Fallback метод для старых браузеров и HTTP
    const result = await copyWithFallback(text);
    
    if (result) {
      handleSuccess(successMessage, showNotification, onSuccess, text);
      return true;
    }

    // 3. Если все методы не сработали, пробуем fallback с prompt
    if (useFallbackPrompt) {
      return await showFallbackPrompt(text, displayText, {
        successMessage,
        showNotification,
        onSuccess,
        onError,
      });
    }

    throw new Error('Все методы копирования не сработали');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    handleError(err, errorMessage, showNotification, onError, text);
    return false;
  }
}

/**
 * Fallback метод копирования для старых браузеров
 */
async function copyWithFallback(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Создаем временный textarea элемент
      const textArea = document.createElement('textarea');
      
      // Устанавливаем стили для скрытия элемента
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.userSelect = 'text';
      
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      // Для мобильных устройств
      if (isMobileDevice()) {
        textArea.contentEditable = 'true';
        textArea.focus();
        
        const range = document.createRange();
        range.selectNodeContents(textArea);
        
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          textArea.setSelectionRange(0, 99999);
        }
      } else {
        textArea.select();
      }
      
      // Пытаемся скопировать
      const successful = document.execCommand('copy');
      
      // Удаляем элемент
      document.body.removeChild(textArea);
      
      resolve(successful);
    } catch (error) {
      console.warn('Fallback метод не сработал:', error);
      resolve(false);
    }
  });
}

/**
 * Показывает fallback prompt для ручного копирования
 */
async function showFallbackPrompt(
  originalText: string,
  displayText: string,
  options: {
    successMessage: string;
    showNotification: boolean;
    onSuccess?: (text: string) => void;
    onError?: (text: string, error: Error) => void;
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Создаем модальное окно для ручного копирования
      const modal = document.createElement('div');
      modal.style.cssText = 
        "position: fixed;"+
        "top: 0;"+
        "left: 0;"+
        "right: 0;"+
        "bottom: 0;"+
        "background: rgba(0, 0, 0, 0.7);"+
        "display: flex;"+
        "align-items: center;"+
        "justify-content: center;"+
        "z-index: 9999;"
      ;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = 
        "background: white;"+
        "padding: 24px;"+
        "border-radius: 12px;"+
        "max-width: 500px;"+
        "width: 90%;"+
        "max-height: 80vh;"+
        "overflow-y: auto;"+
        "box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);"
      ;

      const title = document.createElement('h3');
      title.textContent = 'Копирование текста';
      title.style.cssText = 
        "margin: 0 0 16px 0;"+
        "color: #333;"+
        "font-size: 18px;"
      ;

      const textArea = document.createElement('textarea');
      textArea.value = originalText || displayText;
      textArea.style.cssText = 
        "width: 100%;"+
        "height: 120px;"+
        "padding: 12px;"+
        "border: 2px solid #e0e0e0;"+
        "border-radius: 8px;"+
        "font-family: monospace;"+
        "font-size: 14px;"+
        "resize: vertical;"+
        "margin-bottom: 16px;"+
        "box-sizing: border-box;"
      ;
      textArea.readOnly = true;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 
        "display: flex;"+
        "gap: 12px;"+
        "justify-content: flex-end;"
      ;

      const copyButton = document.createElement('button');
      copyButton.textContent = 'Выделить и скопировать';
      copyButton.style.cssText = 
        "padding: 10px 20px;"+
        "background: #007bff;"+
        "color: white;"+
        "border: none;"+
        "border-radius: 6px;"+
        "cursor: pointer;"+
        "font-size: 14px;"+
        "transition: background 0.2s;"
      ;
      copyButton.onmouseover = () => copyButton.style.background = '#0056b3';
      copyButton.onmouseout = () => copyButton.style.background = '#007bff';

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Закрыть';
      closeButton.style.cssText = 
        "padding: 10px 20px;"+
        "background: #6c757d;"+
        "color: white;"+
        "border: none;"+
        "border-radius: 6px;"+
        "cursor: pointer;"+
        "font-size: 14px;"+
        "transition: background 0.2s;"
      ;
      closeButton.onmouseover = () => closeButton.style.background = '#545b62';
      closeButton.onmouseout = () => closeButton.style.background = '#6c757d';

      copyButton.onclick = () => {
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        
        // Показываем сообщение об успехе
        handleSuccess(options.successMessage, options.showNotification, options.onSuccess, originalText);
        
        modal.remove();
        resolve(true);
      };

      closeButton.onclick = () => {
        modal.remove();
        resolve(false);
      };

      modalContent.appendChild(title);
      modalContent.appendChild(textArea);
      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(closeButton);
      modalContent.appendChild(buttonContainer);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Закрытие по клику на фон
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };

      // Автоматически выделяем текст
      setTimeout(() => {
        textArea.select();
        textArea.setSelectionRange(0, 99999);
      }, 100);
    } catch (error) {
      console.error('Ошибка при показе fallback prompt:', error);
      resolve(false);
    }
  });
}

/**
 * Обработка успешного копирования
 */
function handleSuccess(
  message: string,
  showNotification: boolean,
  onSuccess?: (text: string) => void,
  text?: string
) {
  if (showNotification) {
    showToast(message, 'success');
  }
  
  if (onSuccess && text) {
    onSuccess(text);
  }
}

/**
 * Обработка ошибки копирования
 */
function handleError(
  error: Error,
  errorMessage: string,
  showNotification: boolean,
  onError?: (text: string, error: Error) => void,
  text?: string
) {
  console.error('Ошибка при копировании:', error);
  
  if (showNotification) {
    showToast(errorMessage, 'error');
  }
  
  if (onError && text) {
    onError(text, error);
  }
}

/**
 * Вспомогательная функция для показа уведомлений
 * Можно заменить на вашу систему уведомлений
 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Вариант 1: Использование react-toastify
  if (typeof toast !== 'undefined') {
    const options: ToastOptions = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };
    
    if (type === 'success') {
      toast.success(message, options);
    } else {
      toast.error(message, options);
    }
    return;
  }
  
  // Вариант 2: Нативное уведомление
  try {
    // Пробуем Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message);
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(message);
        }
      });
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Если Notification API не доступен, создаем свой попап
    createNativeNotification(message, type);
  }
}

/**
 * Создание нативного попапа уведомления
 */
function createNativeNotification(message: string, type: 'success' | 'error') {
  const notification = document.createElement('div');
  const backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
  
  notification.style.cssText = 
    "position: fixed;"+
    "top: 20px;"+
    "right: 20px;"+
    "padding: 16px 24px;"+
    `background: ${backgroundColor};`+
    "color: white;"+
    "border-radius: 8px;"+
    "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"+
    "z-index: 9999;"+
    "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"+
    "font-size: 14px;"+
    "max-width: 350px;"+
    "animation: slideIn 0.3s ease-out;"
  ;
  
  // Добавляем стили для анимации
  const style = document.createElement('style');
  style.textContent = 
    "@keyframes slideIn {"+
      "from {"+
        "transform: translateX(100%);"+
        "opacity: 0;"+
      "}"+
      "to {"+
        "transform: translateX(0);"+
        "opacity: 1;"+
      "}"+
    "}"+
    "@keyframes fadeOut {"+
      "from { opacity: 1; }"+
      "to { opacity: 0; }"+
    "}"
  ;
  document.head.appendChild(style);
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 300);
  }, 3000);
}

/**
 * Проверка на мобильное устройство
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Экспортируем функцию
export default copyToClipboard;