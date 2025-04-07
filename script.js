// --- Constantes Globales ---
// --- API Keys and Configuration ---
// Consider moving API keys to environment variables or a configuration file for security.
const GEMINI_API_KEY = 'AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI'; // ¡¡¡ IMPORTANTE: REEMPLAZAR CON TU API KEY REAL !!!
const GEMINI_API_KEY_WARNING = "TU_API_KEY_DE_GOOGLE_GEMINI"; // Referencia para la advertencia
const TAVILY_API_KEY = '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'; // Provided Tavily Key
const GOOGLE_SEARCH_API_KEY = 'AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI'; // Provided Google Search Key
const GOOGLE_SEARCH_CX = '933054f4e5ea543ab'; // Provided Google CX

// --- Model Names ---
const CHAT_MODEL_NAME = 'gemini-2.5-pro-exp-03-25'; // Use latest Pro model
const FLASH_MODEL_NAME = 'gemini-2.0-flash'; // Use latest Flash model

// --- API URLs ---
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TAVILY_API_URL = 'https://api.tavily.com/search';
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

// --- Configuration ---
const MAX_FILE_UPLOAD_COUNT = 10;
const MAX_FILE_SIZE_MB = 20;
const API_TIMEOUT_MS = 45000;
const MAX_CHAT_HISTORY_TURNS = 10;
const ERROR_MESSAGE_TIMEOUT_MS = 7000;
const ERROR_MESSAGE_FADEOUT_MS = 300;
const TAB_TRANSITION_MS = 400; // Incrementado para animaciones más suaves
const REFERENCES_PANEL_TRANSITION_MS = 500; // Incrementado para animaciones más suaves

// --- Supported MIME Types & Extensions ---
// Grouping related constants improves readability.
const SUPPORTED_TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml', 'application/rtf', 'text/tsv', 'application/yaml', 'text/x-python', 'text/x-java-source'];
const SUPPORTED_TEXT_EXTENSIONS = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'yaml', 'rtf', 'tsv'];
const SUPPORTED_WORD_MIME_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const SUPPORTED_WORD_EXTENSIONS = ['doc', 'docx'];
const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image.heic', 'image/heif'];
const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']; // Added common extensions
const SUPPORTED_PDF_MIME_TYPE = 'application/pdf';
const SUPPORTED_PDF_EXTENSIONS = ['pdf'];

// --- Helper Functions (Moved outside DOMContentLoaded for better organization) ---

/**
 * Displays an error message to the user.
 * @param {string} message The error message text.
 * @param {HTMLElement} targetElement The DOM element to display the error in.
 * @param {number} duration How long the message should be visible (ms).
 */
function showGeneralError(message, targetElement, duration = ERROR_MESSAGE_TIMEOUT_MS) {
  if (!targetElement) {
    console.error(`Error: Target element for error message not found. Message:`, message);
    alert("Error interno: " + message); // Fallback alert
    return;
  }

  targetElement.textContent = message;
  targetElement.style.display = 'block';
  // Use requestAnimationFrame for smoother fade-in
  requestAnimationFrame(() => {
    targetElement.style.opacity = '1';
  });

  // Automatically hide non-critical errors after a duration
  if (!message || !message.toLowerCase().includes("api key")) {
    setTimeout(() => {
      if (targetElement) {
        targetElement.style.opacity = '0';
        // Wait for fade-out transition before hiding
        setTimeout(() => {
          if (targetElement.style.opacity === '0') {
            targetElement.style.display = 'none';
          }
        }, ERROR_MESSAGE_FADEOUT_MS);
      }
    }, duration);
  }
}

/**
 * Formats Markdown text to basic HTML with improved table and code handling.
 * @param {string} text The Markdown text.
 * @returns {string} The formatted HTML string.
 */
function formatMarkdownToHtml(text) {
  if (!text) return "<p>(Respuesta vacía)</p>";

  // --- Pre-processing and Escaping ---
  // Basic HTML escaping (do this first)
  let escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // --- Code Block Handling (before other Markdown) ---
  // Store code blocks temporarily and replace with placeholders
  const codeBlocks = {};
  let codeBlockIndex = 0;
  escapedText = escapedText.replace(/```(\w*\n?)([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODEBLOCK_${codeBlockIndex}__`;
    const languageClass = `language-${(lang || 'plaintext').trim().toLowerCase()}`;
    // Re-escape angle brackets inside the code block *after* initial escape
    const safeCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    codeBlocks[placeholder] = `<pre><code class="${languageClass}">${safeCode.trim()}</code></pre>`;
    codeBlockIndex++;
    return placeholder;
  });

  // --- Table Handling (before paragraphs) ---
  escapedText = escapedText.replace(/^\|(.+)\|\s*\n\|([\s:-]+)\|\s*\n((?:\|.*\|\s*\n?)*)/gm, (match, headerLine, separatorLine, bodyLines) => {
    // Determine alignments
    const alignments = separatorLine.split('|').slice(1, -1).map(cell => {
      cell = cell.trim();
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
      if (cell.endsWith(':')) return 'right';
      if (cell.startsWith(':')) return 'left'; // Default to left
      return 'left';
    });

    // Process header
    const headers = headerLine.split('|').slice(1, -1).map((cell, i) =>
      `<th style="text-align: ${alignments[i] || 'left'};">${cell.trim()}</th>`
    ).join('');

    // Process body rows
    const body = bodyLines.split('\n').filter(line => line.trim().startsWith('|')).map(rowLine => {
      const cells = rowLine.split('|').slice(1, -1).map((cell, i) =>
        `<td style="text-align: ${alignments[i] || 'left'};">${cell.trim()}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
  });


  // --- Other Markdown Conversions ---
  let formattedMessage = escapedText
    // Bold and Italic (apply after code blocks are removed)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code (apply after code blocks are removed)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^####\s+(.*)/gm, '<h6>$1</h6>')
    .replace(/^###\s+(.*)/gm, '<h5>$1</h5>')
    .replace(/^##\s+(.*)/gm, '<h4>$1</h4>')
    .replace(/^#\s+(.*)/gm, '<h3>$1</3>')
    // Horizontal Rule
    .replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists (Basic handling - might need refinement for nested lists)
    .replace(/^(\s*)(\*|\-|\+)\s+(.*)/gm, '$1<li>$3</li>') // Unordered
    .replace(/^(\s*)(\d+\.)\s+(.*)/gm, '$1<li>$3</li>') // Ordered (marker handled by CSS)
    // Wrap adjacent list items
    .replace(/^(<li>.*<\/li>\s*)+/gm, (match) => {
      // Determine list type based on the original markdown if possible (difficult here)
      // Defaulting to UL, CSS handles OL numbering
      return `<ul>\n${match.replace(/^\s*/gm, '')}</ul>`;
    })
    .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent ULs
    // Paragraphs (handle line breaks carefully)
    .replace(/\n\n+/g, '\n<p>') // Use single newline as separator for paragraph logic
    .replace(/\n/g, '<br>'); // Convert remaining newlines to <br>

  // --- Post-processing ---
  // Wrap content in <p> tags if it doesn't start with a block element
  if (!formattedMessage.trim().match(/^<(p|h[1-6]|ul|ol|pre|li|blockquote|div|table|hr)/)) {
    formattedMessage = `<p>${formattedMessage}`;
  } else {
    // Remove leading <br> if it starts with a block element
    formattedMessage = formattedMessage.replace(/^<br>/, '');
  }
  // Ensure the message ends correctly, potentially adding closing </p>
  if (!formattedMessage.trim().match(/<\/(p|h[1-6]|ul|ol|pre|li|blockquote|div|table|hr)>$/) && formattedMessage.includes('<p>')) {
    formattedMessage += '</p>';
  }

  // Clean up potential empty paragraphs or excessive breaks
  formattedMessage = formattedMessage
    .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    .replace(/<p><br>/g, '<p>')
    .replace(/<br><\/p>/g, '</p>')
    .replace(/(<br>\s*){2,}/g, '<br><br>') // Collapse multiple breaks to max 2
    .replace(/<br>\s*<(ul|ol|pre|table|h[1-6]|hr|blockquote)/g, '<$1') // Remove breaks before blocks
    .replace(/<\/(ul|ol|pre|table|h[1-6]|hr|blockquote)>\s*<br>/g, '</$1>'); // Remove breaks after blocks

  // Restore code blocks
  formattedMessage = formattedMessage.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[match] || match; // Restore from stored blocks
  });

  return formattedMessage.trim();
}

/**
 * Makes all links within a container open in a new tab.
 * @param {HTMLElement} container The container element.
 */
function makeLinksOpenInNewTab(container) {
  if (!container) return;
  const links = container.querySelectorAll('a');
  links.forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
  });
}

/**
 * Reads a File object as a Data URL.
 * @param {File} file The file to read.
 * @returns {Promise<string>} A promise that resolves with the Data URL string.
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error(`Error reading ${file.name} as Data URL: ${e.target.error}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the base64 data part from a Data URL.
 * @param {string} dataUrl The Data URL string.
 * @returns {string|null} The base64 data or null if invalid.
 */
function getDataFromDataUrl(dataUrl) {
  if (typeof dataUrl === 'string' && dataUrl.includes(',')) {
    return dataUrl.split(',')[1];
  }
  console.error("Invalid Data URL format:", dataUrl);
  return null;
}

/**
 * Sets the loading state and message for a target element.
 * @param {boolean} isLoading Whether to show the loading indicator.
 * @param {string} message The message to display.
 * @param {HTMLElement} targetElement The element to update.
 */
function setLoadingState(isLoading, message = 'Procesando...', targetElement) {
  if (!targetElement) {
    console.warn("setLoadingState: Target element not provided.");
    return;
  }
  targetElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
  targetElement.style.display = isLoading ? 'block' : 'none';
}

// Message handling and UI utilities
class MessageHandler {  constructor() {
    this.messageContainer = document.getElementById('chat-messages');
  }

  async appendMessage(content, type = 'assistant', streaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} ${streaming ? 'streaming' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'assistant' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    this.messageContainer.appendChild(messageDiv);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

    if (streaming) {
      return { contentDiv, messageDiv };
    } else {
      await this.setMessageContent(contentDiv, content);
    }
  }
  async setMessageContent(contentDiv, content) {
    if (this.isJSON(content)) {
      contentDiv.innerHTML = this.formatJSON(JSON.parse(content));
      contentDiv.classList.add('json-content');
    } else {
      const htmlContent = marked.parse(content);
      contentDiv.innerHTML = htmlContent;
      contentDiv.classList.add('markdown-content');
      this.highlightCode(contentDiv);
    }
  }

  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  formatJSON(obj, level = 0) {
    const indent = '  '.repeat(level);

    if (typeof obj !== 'object' || obj === null) {
      return this.formatJSONValue(obj);
    }

    const isArray = Array.isArray(obj);
    const brackets = isArray ? '[]' : '{}';
    const items = Object.entries(obj).map(([key, value]) => {
      const formattedValue = this.formatJSON(value, level + 1);
      return isArray ? formattedValue :
        `<span class="json-key">"${key}"</span>: ${formattedValue}`;
    });

    if (items.length === 0) return brackets;

    return `${brackets[0]}\n${indent}  ${items.join(',\n' + indent + '  ')}\n${indent}${brackets[1]}`;
  }

  formatJSONValue(value) {
    if (typeof value === 'string') return `<span class="json-string">"${value}"</span>`;
    if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
    if (typeof value === 'boolean') return `<span class="json-boolean">${value}</span>`;
    if (value === null) return `<span class="json-null">null</span>`;
    return value;
  }

  highlightCode(container) {
    container.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  async streamResponse(content, speed = 'normal') {
    const { contentDiv, messageDiv } = await this.appendMessage('', 'assistant', true);
    let currentContent = '';
    const words = content.split(' ');

    const delays = {
      fast: 20,
      normal: 35,
      slow: 50
    };

    const delay = delays[speed] || delays.normal;

    for (const word of words) {
      currentContent += word + ' ';
      await this.setMessageContent(contentDiv, currentContent);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    messageDiv.classList.remove('streaming');
  }
}

// Dark mode handler
class ThemeHandler {
  constructor() {
    this.darkModeToggle = document.getElementById('dark-mode-toggle');
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';

    this.initialize();
  }

  initialize() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode');
    this.darkModeToggle.innerHTML = this.isDarkMode ?
      '<i class="fas fa-sun"></i>' :
      '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', this.isDarkMode);
  }
}

// Chat UI manager
const chatUI = {
  messageContainer: document.getElementById('chat-messages'),

  async addMessage(content, isUser = false, type = 'text') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `<i class="fas fa-${isUser ? 'user' : 'robot'}"></i>`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    this.messageContainer.appendChild(messageDiv);

    if (isUser) {
      messageContent.textContent = content;
    } else {
      const formattedContent = await messageHandler.formatMessage(content, type);
      if (type === 'markdown' || type === 'json') {
        messageContent.innerHTML = formattedContent;
      } else {
        await messageHandler.streamMessage(content, messageContent);
      }
    }

    this.scrollToBottom();
  },

  scrollToBottom() {
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }
};

// Theme management
const themeManager = {
  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  },

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeButton(newTheme);
  },

  updateThemeButton(theme) {
    const button = document.getElementById('dark-mode-toggle');
    if (button) {
      button.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
    }
  }
};

// Message formatting and streaming
const messageHandler = {
  async formatMessage(content, type = 'text') {
    if (type === 'markdown') {
      return marked(content, {
        gfm: true,
        breaks: true,
        highlight: (code, lang) => {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        }
      });
    } else if (type === 'json') {
      try {
        const parsed = JSON.parse(content);
        return this.formatJSON(parsed);
      } catch {
        return content;
      }
    }
    return content;
  },

  formatJSON(data) {
    return this.syntaxHighlight(JSON.stringify(data, null, 2));
  },

  syntaxHighlight(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  },

  async streamMessage(content, container, speed = 10) {
    container.classList.add('streaming');
    const words = content.split(' ');
    let currentIndex = 0;

    return new Promise(resolve => {
      const streamNextWord = () => {
        if (currentIndex < words.length) {
          container.textContent += (currentIndex > 0 ? ' ' : '') + words[currentIndex];
          currentIndex++;
          setTimeout(streamNextWord, speed);
        } else {
          container.classList.remove('streaming');
          resolve();
        }
      };
      streamNextWord();
    });
  }
};

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
  // Event listeners
  document.getElementById('dark-mode-toggle')?.addEventListener('click', () => themeManager.toggle());

  console.log("DOM Cargado. Inicializando aplicación completa...");

  // --- DOM Element Cache ---
  // Grouping DOM elements by section improves organization.
  const domElements = {
    // General
    body: document.body,
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    // Chat Assistant
    chat: {
      messages: document.getElementById('chat-messages'),
      questionInput: document.getElementById('questionInput'),
      sendButton: document.getElementById('sendButton'),
      loadingIndicator: document.getElementById('loading'),
      errorMessage: document.getElementById('error-message'),
      fileInput: document.getElementById('fileInput'),
      uploadButton: document.getElementById('uploadButton'),
      fileDisplay: document.getElementById('assistant-file-display'),
      fileList: document.getElementById('file-list'),
      toggleFilesButton: document.getElementById('toggle-assistant-files'),
      fileCount: document.getElementById('assistant-file-count'),
      controls: document.querySelector('.chat-controls'), // Specific controls for chat
      toneButtons: document.querySelectorAll('#controls-upload-wrapper .chat-controls [data-tone]'),
      lengthButtons: document.querySelectorAll('#controls-upload-wrapper .chat-controls [data-length]'),
      webSearchButton: document.getElementById('toggle-web-search-button'),
      regenerateButton: document.getElementById('regenerate-button'),
      clearChatButton: document.getElementById('clear-chat-button'),
      referencesButton: document.querySelector('.references-button[data-section="assistant"]'),
    },
    // Maintenance Tips
    tips: {
      content: document.getElementById('maintenance-tips-content'),
      loadingIndicator: document.getElementById('maintenance-tips-loading'),
      errorMessage: document.getElementById('maintenance-tips-error'),
      regenerateButton: document.getElementById('regenerate-tip-button'),
    },
    // Specific Maintenance
    maintenance: {
      section: document.getElementById('equipment-section'),
      nameInput: document.getElementById('equipmentName'),
      brandInput: document.getElementById('equipmentBrand'),
      modelInput: document.getElementById('equipmentModel'),
      typeSelector: document.getElementById('maintenance-type-selector'),
      typeButtons: document.querySelectorAll('#maintenance-type-selector .maintenance-button'),
      questionArea: document.getElementById('equipment-question-area'),
      questionInput: document.getElementById('equipmentQuestionInput'),
      sendButton: document.getElementById('sendEquipmentQuestionButton'),
      loadingIndicator: document.getElementById('equipmentLoading'),
      errorMessage: document.getElementById('equipmentError'),
      responseDisplay: document.getElementById('equipmentResponseDisplay'),
      controlsWrapper: document.querySelector('.equipment-controls-wrapper'),
      toneButtons: document.querySelectorAll('.equipment-controls-wrapper [data-tone]'),
      lengthButtons: document.querySelectorAll('.equipment-controls-wrapper [data-length]'),
      webSearchButton: document.getElementById('eq-toggle-web-search-button'),
      regenerateButton: document.getElementById('eq-regenerate-button'),
      fileInput: document.getElementById('eq-fileInput'),
      uploadButton: document.getElementById('eq-uploadButton'),
      fileDisplay: document.getElementById('equipment-file-display'),
      fileList: document.getElementById('equipment-file-list'), // Corrected ID
      toggleFilesButton: document.getElementById('toggle-equipment-files'),
      fileCount: document.getElementById('equipment-file-count'), // Corrected ID based on HTML pattern
      referencesButton: document.querySelector('.references-button[data-section="maintenance"]'),
    },
    // References Panel
    references: {
      panel: document.getElementById('references-panel'),
      list: document.getElementById('references-list'),
      closeButton: document.getElementById('close-references'),
      title: document.getElementById('references-title'),
      allButtons: document.querySelectorAll('.references-button'),
    },
    sidebar: {
      container: document.querySelector('.sidebar-nav'),
      toggleButton: document.getElementById('toggle-sidebar'),
      buttons: document.querySelectorAll('.sidebar-button'),
    },
  };

  // --- Application State ---
  // Grouping state variables improves clarity.
  const appState = {
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    isStreaming: false,
    chat: {
      uploadedFiles: [], // { id, name, type, content?, data? }
      currentTone: 'neutral',
      currentLength: 'media',
      useWebSearch: false,
      lastUserPromptParts: null,
      lastQuestionText: '',
      history: [],
      references: [],
    },
    maintenance: {
      uploadedFiles: [], // { id, name, type, content?, data? }
      selectedType: null,
      currentTone: 'neutral',
      currentLength: 'media',
      useWebSearch: false,
      lastPromptDetails: null, // { name, brand, model, type, question }
      lastApiResponse: null,
      references: [],
    }
  };

  // --- Core Functions ---

  /**
   * Checks if the primary API key is valid and updates UI accordingly.
   * Disables/enables interactive elements based on key validity.
   */
  function checkApiKey() {
    const keyToCheck = GEMINI_API_KEY;
    const warning = GEMINI_API_KEY_WARNING;
    const isValid = keyToCheck && keyToCheck !== warning;
    const errorMsg = "Error Crítico: Configura tu API Key de Google Gemini en la variable GEMINI_API_KEY del código JavaScript.";

    // Centralized enabling/disabling logic
    const elementsToToggle = [
      domElements.chat.sendButton, domElements.chat.uploadButton, domElements.chat.regenerateButton,
      domElements.chat.clearChatButton, domElements.chat.webSearchButton,
      domElements.tips.regenerateButton,
      domElements.maintenance.sendButton, domElements.maintenance.uploadButton, domElements.maintenance.regenerateButton,
      domElements.maintenance.webSearchButton, domElements.maintenance.questionInput,
      domElements.maintenance.nameInput, domElements.maintenance.brandInput, domElements.maintenance.modelInput,
      ...domElements.chat.toneButtons, ...domElements.chat.lengthButtons,
      ...domElements.maintenance.toneButtons, ...domElements.maintenance.lengthButtons,
      ...domElements.maintenance.typeButtons
    ];

    elementsToToggle.forEach(el => { if (el) el.disabled = !isValid; });

    // Update placeholders and show errors if invalid
    if (!isValid) {
      showGeneralError(errorMsg, domElements.chat.errorMessage);
      if (domElements.tips.errorMessage) showGeneralError("Funcionalidad limitada por falta de API Key.", domElements.tips.errorMessage);
      if (domElements.maintenance.errorMessage) showGeneralError("Funcionalidad limitada por falta de API Key.", domElements.maintenance.errorMessage);
      if (domElements.chat.questionInput) domElements.chat.questionInput.placeholder = "Se requiere API Key...";
      if (domElements.maintenance.questionInput) domElements.maintenance.questionInput.placeholder = "Se requiere API Key...";
    } else {
      // Restore placeholders if valid
      if (domElements.chat.questionInput) domElements.chat.questionInput.placeholder = "Escribe una pregunta o sube un documento...";
      // Placeholder for maintenance input is handled by updateEquipmentUIState
    }

    // Ensure regenerate buttons start disabled even if key is valid
    if (domElements.chat.regenerateButton) domElements.chat.regenerateButton.disabled = true;
    if (domElements.maintenance.regenerateButton) domElements.maintenance.regenerateButton.disabled = true;

    return isValid;
  }

  /**
   * Applies or removes the dark mode class based on the state.
   * @param {boolean} isDark Whether dark mode should be enabled.
   */
  function applyDarkMode(isDark) {
    if (!domElements.body || !domElements.darkModeToggle) return;
    domElements.body.classList.toggle('dark-mode', isDark);
    const icon = domElements.darkModeToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-sun', isDark);
      icon.classList.toggle('fa-moon', !isDark);
    }
    localStorage.setItem('darkMode', isDark); // Persist preference
  }

  /** Toggles the dark mode state and applies it. */
  function toggleDarkModeHandler() {
    appState.isDarkMode = !appState.isDarkMode;
    applyDarkMode(appState.isDarkMode);
  }

  /**
   * Automatically resizes a textarea based on its content.
   * @param {HTMLTextAreaElement} element The textarea element.
   */
  function autoResizeTextarea(element) {
    if (!element) return;
    requestAnimationFrame(() => { // Use rAF for performance
      try {
        const computedStyle = window.getComputedStyle(element);
        const maxHeight = parseInt(computedStyle.maxHeight, 10) || 160; // Default max height
        const minHeight = parseInt(computedStyle.minHeight, 10) || 50; // Default min height

        // Temporarily reset height to calculate scrollHeight accurately
        element.style.height = 'auto';
        element.style.overflowY = 'hidden'; // Hide scrollbar during calculation

        let newHeight = element.scrollHeight;

        if (newHeight > maxHeight) {
          element.style.height = `${maxHeight}px`;
          element.style.overflowY = 'auto'; // Show scrollbar if needed
        } else {
          element.style.height = `${Math.max(newHeight, minHeight)}px`;
          element.style.overflowY = 'hidden'; // Hide scrollbar if not needed
        }
      } catch (error) {
        console.error("Error in autoResizeTextarea:", error);
      }
    });
  }

  /**
   * Displays a message in the specified chat container.
   * @param {HTMLElement} container The chat messages container element.
   * @param {string} sender The sender's name ('Usuario' or 'Asistente').
   * @param {string} message The message content (Markdown).
   * @param {boolean} isUser True if the message is from the user.
   * @param {boolean} isRegenerated True if the message is a regeneration prompt.
   */
  function displayChatMessage(container, sender, message, isUser = false, isRegenerated = false) {
    if (!container) return;
    try {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', isUser ? 'user-turn' : 'assistant-turn');

      // Set initial state for animation
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateY(20px)';

      const senderSpan = document.createElement('span');
      senderSpan.classList.add('sender');
      senderSpan.innerHTML = `<i class="fas ${isUser ? 'fa-user-alt' : 'fa-robot'}"></i> ${sender}${isRegenerated ? ' (Regenerado)' : ''}`;

      const responseSpan = document.createElement('div');
      responseSpan.classList.add('response');
      if (isUser) responseSpan.classList.add('user-message');

      // Format the message using the enhanced function
      const formattedMessage = formatMarkdownToHtml(message);
      responseSpan.innerHTML = formattedMessage;

      // Highlight code blocks
      const codeBlocks = responseSpan.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        block.style.display = 'block';
        block.style.opacity = '0';
        block.style.transform = 'translateY(10px)';
      });

      messageDiv.appendChild(senderSpan);
      messageDiv.appendChild(responseSpan);
      container.appendChild(messageDiv);

      // Animate message appearance
      requestAnimationFrame(() => {
        messageDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';

        // Animate code blocks sequentially
        codeBlocks.forEach((block, index) => {
          setTimeout(() => {
            block.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            block.style.opacity = '1';
            block.style.transform = 'translateY(0)';
          }, 400 + (index * 100)); // Start after message animation
        });
      });

      // Scroll to bottom smoothly
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error("Error in displayChatMessage:", error);
      try {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('message', 'error-display');
        errorDiv.innerHTML = '<p style="color: var(--danger-color)">[Error al mostrar este mensaje. Revisa la consola.]</p>';
        container.appendChild(errorDiv);
        container.scrollTop = container.scrollHeight;
      } catch (displayError) {
        console.error("Error displaying the error message in chat:", displayError);
      }
    }
  }

  /**
   * Displays the maintenance tip.
   * @param {string} tipText The tip text (Markdown).
   */
  function displayMaintenanceTip(tipText) {
    const container = domElements.tips.content;
    if (!container) return;

    container.innerHTML = '';
    const tipDiv = document.createElement('div');
    tipDiv.classList.add('tip-item');

    // Set initial state
    tipDiv.style.opacity = '0';
    tipDiv.style.transform = 'translateX(-20px)';

    tipDiv.innerHTML = formatMarkdownToHtml(tipText);
    makeLinksOpenInNewTab(tipDiv);
    container.appendChild(tipDiv);

    // Trigger animation
    requestAnimationFrame(() => {
      tipDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      tipDiv.style.opacity = '1';
      tipDiv.style.transform = 'translateX(0)';
    });
  }

  /**
   * Displays the specific equipment maintenance response.
   * @param {string} responseText The response text (Markdown).
   */
  function displayEquipmentResponse(responseText) {
    const display = domElements.maintenance.responseDisplay;
    if (!display) return;

    // Set initial state
    display.style.opacity = '0';
    display.style.transform = 'translateY(20px)';
    display.style.display = 'block';

    // Asegurarse de que las tablas tengan el formato correcto
    responseText = responseText.replace(/<table>/g, '<table class="response-table">');

    // Asegurarse de que las listas no tengan estilos por defecto
    responseText = responseText.replace(/<ul style="[^"]*">/g, '<ul>');
    responseText = responseText.replace(/<li style="[^"]*">/g, '<li>');

    display.innerHTML = formatMarkdownToHtml(responseText);
    makeLinksOpenInNewTab(display);

    // Trigger animation
    requestAnimationFrame(() => {
      display.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      display.style.opacity = '1';
      display.style.transform = 'translateY(0)';
    });

    // Scroll into view smoothly
    display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- API Call Functions ---

  /**
   * Calls the Gemini API (non-streaming).
   * @param {string} modelName The model to use (e.g., FLASH_MODEL_NAME).
   * @param {Array<object>} promptParts Array of prompt parts {text: string} or {inlineData: {mimeType, data}}.
   * @returns {Promise<string>} The generated text content.
   */
  async function callGenerativeApi(modelName, promptParts) {
    if (!checkApiKey()) { throw new Error("API Key de Gemini no válida o no configurada."); }
    // Validate promptParts structure
    if (!Array.isArray(promptParts) || promptParts.length === 0 || !promptParts.every(part => part && (typeof part.text === 'string' || (part.inlineData && part.inlineData.mimeType && part.inlineData.data)))) {
      console.error("Invalid promptContents:", promptParts);
      throw new Error("El contenido del prompt es inválido o está vacío.");
    }

    const apiUrl = `${GEMINI_API_BASE_URL}${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    // Define generation config and safety settings (could be parameters if needed)
    const generationConfig = { temperature: 0.8, maxOutputTokens: 4096, topP: 0.95, topK: 40 };
    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ];

    const requestBody = {
      contents: [{ role: "user", parts: promptParts }],
      generationConfig,
      safetySettings
    };

    console.log(`Enviando a API (NO-STREAM) (${modelName}):`, JSON.stringify(requestBody, null, 2)); // Log sensitive data carefully

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseBodyText = await response.text(); // Get text first for logging/parsing
      console.log(`Respuesta API (NO-STREAM) (${response.status}) (${modelName}) (raw):`, responseBodyText);

      if (!response.ok) {
        let parsedError;
        try { parsedError = JSON.parse(responseBodyText); } catch (e) { parsedError = { error: { message: responseBodyText || response.statusText } }; }
        let errorDetail = parsedError.error?.message || `HTTP ${response.status}`;
        let errorCode = parsedError.error?.code || response.status;

        // Handle specific known errors
        if (errorCode === 400 && errorDetail.includes('API key not valid')) {
          errorDetail = "API Key inválida o mal configurada.";
          checkApiKey(); // Re-check to update UI
        } else if (errorCode === 429) {
          errorDetail = "Límite de cuota API alcanzado. Intenta de nuevo más tarde.";
        } else if (errorCode === 500 || errorCode === 503) {
          errorDetail = `Error interno del servidor IA (${errorCode}). Intenta de nuevo más tarde.`;
        }
        throw new Error(`Error API (NO-STREAM) (${modelName}): ${errorDetail} (Code: ${errorCode})`);
      }

      const data = JSON.parse(responseBodyText); // Parse JSON only if response.ok

      // Check for prompt blocking
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Prompt bloqueado (NO-STREAM) (${modelName}): ${data.promptFeedback.blockReason}. Ajusta tu pregunta.`);
      }

      // Process candidates
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        let text = candidate.content?.parts?.[0]?.text || ''; // Default to empty string

        // Handle finish reasons
        if (candidate.finishReason === "MAX_TOKENS") {
          text += "\n\n*[Respuesta truncada por límite de tokens]*";
        } else if (candidate.finishReason === "SAFETY") {
          text += "\n\n*[Respuesta parcial o modificada por motivos de seguridad]*";
          console.warn(`Respuesta (NO-STREAM) (${modelName}) finalizada por SAFETY.`);
        } else if (candidate.finishReason && candidate.finishReason !== "STOP") {
          console.warn(`Respuesta (NO-STREAM) (${modelName}) finalizada por razón inesperada: ${candidate.finishReason}`);
        }

        if (!text && candidate.finishReason === "SAFETY") {
          throw new Error(`Respuesta bloqueada por seguridad (NO-STREAM) (${modelName}).`);
        }
        return text || `(Respuesta inesperada o vacía de ${modelName})`;

      } else {
        console.warn(`Respuesta API (NO-STREAM) (${modelName}) sin candidatos:`, data);
        return `(No se generó contenido válido en ${modelName})`;
      }
    } catch (error) {
      clearTimeout(timeoutId); // Ensure timeout is cleared on error
      console.error(`Error en callGenerativeApi (NO-STREAM) (${modelName}):`, error);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout en la solicitud a IA (NO-STREAM) (${modelName}). La API tardó demasiado en responder.`);
      }
      // Re-throw other errors to be caught by the caller
      throw error;
    }
  }

  /**
   * Calls the Tavily Search API.
   * @param {string} query The search query.
   * @returns {Promise<{results: string[], links: {url: string, title: string}[]}>} Search results and links.
   */
  async function callTavilySearch(query) {
    // Use a separate check for Tavily key if needed, or assume primary key check covers it
    // if (!checkApiKey(TAVILY_API_KEY, "YOUR_TAVILY_KEY_WARNING")) { ... }
    if (!TAVILY_API_KEY || TAVILY_API_KEY === "TU_API_KEY_DE_TAVILY") {
      console.warn("Tavily API Key no configurada o es el valor por defecto.");
      return { results: [], links: [] }; // Return empty results gracefully
    }


    const maxRetries = 2; // Reduce retries slightly
    const retryDelay = 1500; // Slightly shorter delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling Tavily Search (Attempt ${attempt}) for:`, query);
        const response = await fetch(TAVILY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            include_answer: false, // We only need sources
            max_results: 5
          })
        });

        if (!response.ok) {
          // Throw an error to trigger retry or final failure
          throw new Error(`Tavily API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        console.log("Tavily Response:", data);

        // Safely map results, providing defaults if properties are missing
        const results = data.results?.map(r => `[Tavily: ${r.title || 'Sin título'}](${r.url || '#'}) - ${r.content || 'Sin contenido'}`) || [];
        const links = data.results?.map(r => ({ url: r.url || '#', title: r.title || r.url || 'Referencia sin título' })) || [];

        return { results, links };

      } catch (error) {
        console.error(`Error calling Tavily API (Attempt ${attempt}):`, error);
        if (attempt < maxRetries) {
          console.log(`Retrying Tavily search in ${retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // Show error only on final attempt failure
          showGeneralError(`Error en búsqueda Tavily: ${error.message}`, domElements.chat.errorMessage); // Show in main chat error area
          return { results: [], links: [] }; // Return empty on final failure
        }
      }
    }
    return { results: [], links: [] }; // Should be unreachable, but added for safety
  }

  /**
   * Calls the Google Custom Search API.
   * @param {string} query The search query.
   * @returns {Promise<{results: string[], links: {url: string, title: string}[]}>} Search results and links.
   */
  async function callGoogleSearch(query) {
    if (!GOOGLE_SEARCH_API_KEY || GOOGLE_SEARCH_API_KEY === GEMINI_API_KEY_WARNING || !GOOGLE_SEARCH_CX) {
      console.warn("Google Search API Key o CX no configurada o es el valor por defecto.");
      return { results: [], links: [] };
    }

    try {
      console.log("Calling Google Search for:", query);
      const url = `${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&num=5`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Search API Error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      console.log("Google Search Response:", data);

      // Safely map results
      const results = data.items?.map(item => `[Google: ${item.title || 'Sin título'}](${item.link || '#'}) - ${item.snippet || 'Sin descripción'}`) || [];
      const links = data.items?.map(item => ({ url: item.link || '#', title: item.title || item.link || 'Referencia sin título' })) || [];

      return { results, links };
    } catch (error) {
      console.error("Error calling Google Search API:", error);
      showGeneralError(`Error en búsqueda Google: ${error.message}`, domElements.chat.errorMessage); // Show in main chat error area
      return { results: [], links: [] }; // Return empty on error
    }
  }

  /**
   * Calls the Gemini API (Streaming). Handles displaying the response incrementally.
   * @param {Array<object>} promptContents Array of prompt parts for the current user turn.
   * @param {Array<object>} history The conversation history.
   * @param {string} section The section ('chat' or 'maintenance') to update state for.
   */
  async function streamChatResponse(promptContents, history, section = 'chat') { // Default to 'chat'
    if (!checkApiKey()) { throw new Error("API Key de Gemini no válida o no configurada."); }
    if (appState.isStreaming) { throw new Error("Ya se está procesando una respuesta."); }

    appState.isStreaming = true;
    const modelName = CHAT_MODEL_NAME; // Use the main chat model for streaming
    const apiUrl = `${GEMINI_API_BASE_URL}${modelName}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

    // Determine config based on the relevant section's state
    const configState = appState[section]; // Use section directly ('chat' or 'maintenance')
    if (!configState) { // Add a check for safety
      appState.isStreaming = false;
      throw new Error(`Invalid section provided to streamChatResponse: ${section}`);
    }
    let maxOutputTokens;
    let temperature = 0.7; // Default temperature
    let topP = 0.95;
    let topK = 40;

    switch (configState.currentLength) {
      case 'corta': maxOutputTokens = 4096; break; // Adjusted token limits
      case 'larga': maxOutputTokens = 8192; break; // Adjusted token limits (32k might be too large for streaming stability/cost)
      default: maxOutputTokens = 8192; break; // Default to medium/large
    }
    // Adjust temperature based on tone
    if (configState.currentTone === 'formal') temperature = 0.5;
    else if (configState.currentTone === 'conciso') temperature = 0.6; // Slightly lower for conciseness

    const generationConfig = { temperature, maxOutputTokens, topP, topK };
    const safetySettings = [ // Consistent safety settings
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ];

    // Construct the full request contents including history
    const contents = [...history, { role: "user", parts: promptContents }];
    const requestBody = { contents, generationConfig, safetySettings };

    console.log(`Enviando a API (STREAM) (${modelName}):`, JSON.stringify(requestBody, null, 2)); // Log sensitive data carefully

    // --- Create message elements immediately for streaming ---
    const messageContainer = domElements.chat.messages; // Stream only to main chat for now
    if (!messageContainer) {
      appState.isStreaming = false;
      throw new Error("Chat message container not found.");
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'assistant-turn');
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.innerHTML = `<i class="fas fa-robot"></i> Asistente`;
    const responseSpan = document.createElement('div');
    responseSpan.classList.add('response');
    // Add a temporary indicator
    responseSpan.innerHTML = '<span class="streaming-indicator">▍</span>';

    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(responseSpan);
    messageContainer.appendChild(messageDiv);
    requestAnimationFrame(() => { messageContainer.scrollTop = messageContainer.scrollHeight; });
    // --- End message element creation ---

    let accumulatedText = "";
    let finalError = null;
    let finishReason = null;
    let safetyBlocked = false;
    const streamingIndicator = responseSpan.querySelector('.streaming-indicator');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // --- Handle Initial Fetch Errors ---
      if (!response.ok || !response.body) {
        const responseBodyText = await response.text();
        let parsedError;
        try { parsedError = JSON.parse(responseBodyText); } catch (e) { parsedError = { error: { message: responseBodyText || response.statusText } }; }
        let errorDetail = parsedError.error?.message || `HTTP ${response.status}`;
        let errorCode = parsedError.error?.code || response.status;
        if (errorCode === 400 && errorDetail.includes('API key not valid')) { errorDetail = "API Key inválida."; checkApiKey(); }
        else if (errorCode === 429) { errorDetail = "Límite de cuota API."; }
        throw new Error(`Error conexión API (STREAM) (${modelName}): ${errorDetail} (Code: ${errorCode})`);
      }
      // --- End Initial Fetch Errors ---

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      // --- Process Stream ---
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        let lines = buffer.split('\n');
        buffer = lines.pop(); // Keep potential partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunkJson = JSON.parse(line.substring(6));

              // Check for prompt feedback within the stream
              if (chunkJson.promptFeedback?.blockReason) {
                throw new Error(`Prompt bloqueado durante stream: ${chunkJson.promptFeedback.blockReason}`);
              }

              // Process candidates in the chunk
              if (chunkJson.candidates && chunkJson.candidates.length > 0) {
                const candidate = chunkJson.candidates[0];

                // Append text if available
                if (candidate.content?.parts?.[0]?.text) {
                  const chunkText = candidate.content.parts[0].text;
                  accumulatedText += chunkText;
                  // Update UI incrementally - use textContent for performance during stream
                  responseSpan.textContent = accumulatedText + '▍'; // Keep cursor indicator
                  requestAnimationFrame(() => { messageContainer.scrollTop = messageContainer.scrollHeight; });
                }

                // Check for finish reason
                if (candidate.finishReason && candidate.finishReason !== "FINISH_REASON_UNSPECIFIED") {
                  finishReason = candidate.finishReason;
                  if (finishReason === "SAFETY") {
                    safetyBlocked = true;
                    console.warn("Stream posiblemente bloqueado/truncado por seguridad.");
                  }
                  // Potentially break early if needed, but usually let stream finish
                }
              }
            } catch (e) {
              console.warn("Error parseando chunk JSON del stream:", e, "Línea:", line);
              // Continue processing other lines if possible
            }
          }
        }
      }
      // --- End Process Stream ---

    } catch (error) {
      console.error("Error durante streaming:", error);
      finalError = error; // Store error to handle in finally block
    } finally {
      appState.isStreaming = false;
      // --- Final UI Update ---
      // Remove streaming indicator and format final text
      responseSpan.textContent = accumulatedText; // Set final text without indicator
      responseSpan.innerHTML = formatMarkdownToHtml(accumulatedText); // Format as HTML
      makeLinksOpenInNewTab(responseSpan); // Ensure links are correct

      // Append finish reason messages if necessary
      if (finishReason === "MAX_TOKENS") {
        responseSpan.innerHTML += "<p><small>[Respuesta truncada por límite de tokens]</small></p>";
      } else if (safetyBlocked) {
        // Check if text exists, safety might block entire response
        if (!accumulatedText.trim()) {
          responseSpan.innerHTML = "<p><small>[Respuesta bloqueada por motivos de seguridad]</small></p>";
        } else {
          responseSpan.innerHTML += "<p><small>[Respuesta finalizada o modificada por motivos de seguridad]</small></p>";
        }
      } else if (!finalError && !accumulatedText.trim()) {
        responseSpan.innerHTML = "<p><small>(No se recibió contenido)</small></p>";
      }

      requestAnimationFrame(() => { messageContainer.scrollTop = messageContainer.scrollHeight; });
      // --- End Final UI Update ---

      // --- Update History and UI State ---
      const regenerateBtn = domElements.chat.regenerateButton; // Assuming streaming only affects chat regenerate
      const sendBtn = domElements.chat.sendButton;
      const loadingIndicator = domElements.chat.loadingIndicator;

      if (!finalError && accumulatedText.trim()) {
        // Add successful exchange to history
        history.push({ role: "user", parts: promptContents });
        history.push({ role: "model", parts: [{ text: accumulatedText }] });

        // Truncate history if it exceeds the limit
        const maxHistoryLength = MAX_CHAT_HISTORY_TURNS * 2;
        if (history.length > maxHistoryLength) {
          history.splice(0, history.length - maxHistoryLength);
          console.log("Historial de chat truncado.");
        }

        // Enable regenerate button if API key is valid
        if (regenerateBtn && checkApiKey()) regenerateBtn.disabled = false;

      } else {
        // Handle errors or empty responses
        if (finalError) {
          showGeneralError(`Error en respuesta: ${finalError.message}`, domElements.chat.errorMessage);
        }
        // Disable regenerate button on error or empty response
        if (regenerateBtn) regenerateBtn.disabled = true;
      }

      // Re-enable send button if API key is valid
      if (sendBtn && checkApiKey()) sendBtn.disabled = false;
      if (loadingIndicator) setLoadingState(false, '', loadingIndicator); // Hide loading
      // --- End Update History and UI State ---
    }
  }


  // --- Application Logic Functions ---

  /** Clears the chat interface and state. */
  function clearChat() {
    console.log("Limpiando chat...");
    if (domElements.chat.messages) domElements.chat.messages.innerHTML = '';
    appState.chat.history = [];
    appState.chat.lastUserPromptParts = null;
    appState.chat.lastQuestionText = '';
    appState.chat.uploadedFiles = [];
    appState.chat.references = []; // Clear references too

    if (domElements.chat.fileList) renderFileList('assistant'); // Update file list display
    if (domElements.chat.errorMessage) {
      domElements.chat.errorMessage.style.display = 'none';
      domElements.chat.errorMessage.style.opacity = '0';
    }
    if (domElements.chat.regenerateButton) domElements.chat.regenerateButton.disabled = true;
    if (domElements.chat.questionInput) {
      domElements.chat.questionInput.value = '';
      autoResizeTextarea(domElements.chat.questionInput);
    }

    // Display initial welcome message
    displayChatMessage(domElements.chat.messages, 'Asistente', `*¡Hola!* Soy BIAmedial Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas.
    
    Para consultas *muy* específicas de un equipo, usa la sección "Mantenimiento Específico".
    No olvides revisar los "Tips de Mantenimiento".
    
    **Importante:** Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética.
    ¿En qué puedo ayudarte hoy?`);
    console.log("Chat limpiado.");
  }

  /**
   * Builds the prompt parts array for the API call, including instructions,
   * web search results, history, and file data.
   * @param {string} section 'assistant' or 'maintenance'
   * @param {string} userQuestion The current user question text.
   * @param {boolean} includeHistory Whether to include conversation history.
   * @returns {Array<object>} Array of parts for the API request.
   */
  function buildPromptParts(section, userQuestion, includeHistory = true) {
    const state = appState[section];
    const files = state.uploadedFiles;
    const promptParts = [];

    let webSearchResultsText = '';
    // --- Web Search Integration ---
    if (state.useWebSearch && userQuestion) {
      // Note: Web search calls happen *before* calling buildPromptParts in sendMessage/sendEquipmentQuestion
      // Here we just format the results if they exist in the state.
      const combinedResults = state.references // Assuming references store search snippets temporarily
        ?.map(ref => `[${ref.title || 'Fuente'}](${ref.url}) - ${ref.snippet || ''}`) // Example format
        .filter(res => res) || []; // Filter out empty results

      if (combinedResults.length > 0) {
        webSearchResultsText = `**Resultados de Búsqueda Web:**\n${combinedResults.join('\n')}\n\n---\n\n`;
        console.log(`Web search results included for ${section}.`);
      }
    }
    // --- End Web Search ---

    // --- Base Instructions ---
    let instructions = `**Instrucciones Clave:**
1.  **Rol:** Eres un asistente experto en ingeniería biomédica **especializado en el contexto de Panamá.**
2.  **Contexto Panamá:** A menos que se indique explícitamente lo contrario, **todas tus respuestas deben basarse y hacer referencia a normativas, prácticas, proveedores, y situaciones relevantes en Panamá.** Si la información no es específica de Panamá, indícalo claramente.
3.  **Formato:** Responde de forma clara, útil y bien estructurada. **ABSOLUTAMENTE NO incluyas saludos iniciales (como 'Hola', '¡Hola!', etc.) ni despedidas finales (como 'Espero que esto ayude', 'Saludos', etc.).** Ve directo al punto. Usa Markdown para formatear.
4.  **Tono y Longitud:** Tono actual: ${state.currentTone}. Longitud esperada: ${state.currentLength}.
5.  **Búsqueda Web:** ${state.useWebSearch ? `Se ha realizado una búsqueda web. ${webSearchResultsText ? `**Considera estos resultados:**\n${webSearchResultsText}` : '(No se encontraron resultados relevantes)'}` : 'No se realizó búsqueda web.'}
${includeHistory ? '6.  **Historial:** Considera el historial de conversación previo (si existe).' : ''}
${files.length > 0 ? `${includeHistory ? '7' : '6'}.  **Archivos:** Considera los archivos adjuntos proporcionados.` : ''}
${includeHistory ? '8' : '7'}.  **Pregunta Principal:** La consulta del usuario es: "${userQuestion || '(Consulta basada en los archivos adjuntos)'}"`;

    // --- Section-Specific Instructions ---
    if (section === 'maintenance' && state.lastPromptDetails) {
      const { name, brand, model, type } = state.lastPromptDetails;
      instructions += `\n\n**Detalles del Equipo:**
*   **Equipo:** ${name}
*   **Marca:** ${brand}
*   **Modelo:** ${model}
*   **Tipo Mantenimiento Solicitado:** ${type}
*   **Enfoque:** Céntrate en procedimientos prácticos, fallas comunes, herramientas o frecuencia relevantes para el tipo de mantenimiento y la pregunta específica sobre este equipo en Panamá.`;
    }
    // --- End Section-Specific ---

    promptParts.push({ text: instructions });

    // --- Add File Data ---
    if (files.length > 0) {
      console.log(`Adjuntando ${files.length} archivos al prompt de ${section}.`);
      files.forEach(fileData => {
        if (fileData.content) { // Text content
          promptParts.push({ text: `--- Archivo Adjunto (${section}): "${fileData.name}" ---\n${fileData.content}\n--- Fin Archivo: "${fileData.name}" ---` });
        } else if (fileData.data && fileData.type) { // Base64 data (Images, PDF, etc.)
          promptParts.push({ inlineData: { mimeType: fileData.type, data: fileData.data } });
          // Add a text part to indicate the file was included, as inlineData might not be directly visible in logs
          promptParts.push({ text: `(Archivo adjunto (${section}): "${fileData.name}" tipo ${fileData.type})` });
        } else {
          console.warn(`Datos inválidos para archivo ${fileData.name} en sección ${section}, omitiendo.`);
        }
      });
    }
    // --- End File Data ---

    return promptParts;
  }


  /**
   * Sends the user's message or initiates regeneration for the main chat.
   * @param {boolean} isRegeneration Whether this is a regeneration request.
   */
  async function sendChatMessage(isRegeneration = false) {
    const section = 'chat'; // Use 'chat' to match the appState key
    const state = appState.chat;
    const ui = domElements.chat;

    if (appState.isStreaming) {
      showGeneralError("Espera a que la respuesta anterior termine de generarse.", ui.errorMessage);
      return;
    }

    let questionText;
    let currentPromptPartsToSend;

    if (isRegeneration) {
      // Use stored last prompt for regeneration
      if (!state.lastUserPromptParts || (!state.lastQuestionText && state.uploadedFiles.length === 0)) { // Allow regeneration even if only files were sent
        showGeneralError("No hay mensaje anterior válido para regenerar.", ui.errorMessage);
        return;
      }
      questionText = state.lastQuestionText; // Keep track of the text part for display
      currentPromptPartsToSend = state.lastUserPromptParts; // Reuse the exact parts sent previously
      console.log("Regenerando respuesta para:", questionText || "archivos adjuntos");

      // Remove the last user message and the last model response from history
      if (state.history.length >= 2 && state.history[state.history.length - 1].role === 'model' && state.history[state.history.length - 2].role === 'user') {
        state.history.pop(); // Remove model response
        state.history.pop(); // Remove user message
        console.log("Historial revertido para regeneración.");
      } else {
        console.warn("No se pudo revertir el historial para regeneración (historial corto o estructura inesperada).");
        // Proceeding without history modification, might lead to slightly different context for regeneration.
      }
      displayChatMessage(ui.messages, 'Usuario', `(Regenerando para: ${questionText || 'archivos adjuntos'})`, true, true);
    } else {
      // Process new message
      questionText = ui.questionInput.value.trim();
      if (questionText === "" && state.uploadedFiles.length === 0) {
        showGeneralError("Escribe una pregunta o sube un archivo.", ui.errorMessage);
        return; // Don't send empty messages
      }

      state.lastQuestionText = questionText; // Store current question text
      if (ui.questionInput) {
        ui.questionInput.value = ''; // Clear input field
        autoResizeTextarea(ui.questionInput);
      }
      displayChatMessage(ui.messages, 'Usuario', questionText || "(Archivos adjuntos enviados)", true);

      state.references = []; // Clear previous references for this section

      // --- Perform Web Search If Enabled ---
      if (state.useWebSearch && questionText) {
        console.log("Web search activado para Asistente");
        setLoadingState(true, 'Realizando búsqueda web...', ui.loadingIndicator);
        try {
          // Use Promise.allSettled to continue even if one search fails
          const results = await Promise.allSettled([
            callTavilySearch(questionText),
            callGoogleSearch(questionText)
          ]);

          const successfulSearches = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

          const allLinks = successfulSearches.flatMap(search => search.links);

          // Deduplicate links based on URL
          state.references = Array.from(new Map(allLinks.map(link => [link.url, link])).values());
          console.log("Web search completed. References stored:", state.references);

        } catch (searchError) { // Catch potential errors in Promise.allSettled itself (unlikely)
          console.error("Error durante la ejecución de las búsquedas web:", searchError);
          showGeneralError("Error durante la búsqueda web. Continuando sin resultados.", ui.errorMessage);
        } finally {
          setLoadingState(false, '', ui.loadingIndicator); // Turn off specific search loading message
        }
      }
      // --- End Web Search ---

      // Build prompt parts for the new message
      currentPromptPartsToSend = buildPromptParts(section, questionText, true); // Pass 'chat'
      state.lastUserPromptParts = [...currentPromptPartsToSend]; // Store the parts actually sent
    }

    // --- Send to API ---
    setLoadingState(true, 'Procesando...', ui.loadingIndicator); // General loading indicator
    if (ui.errorMessage) { ui.errorMessage.style.display = 'none'; ui.errorMessage.style.opacity = '0'; }
    if (ui.sendButton) ui.sendButton.disabled = true;
    if (ui.regenerateButton) ui.regenerateButton.disabled = true; // Disable regenerate during processing

    try {
      // Call the streaming function
      await streamChatResponse(currentPromptPartsToSend, state.history, section); // Pass 'chat' here too
    } catch (error) {
      // Catch errors from streamChatResponse setup or initial fetch
      showGeneralError(`Error al iniciar la solicitud: ${error.message}`, ui.errorMessage);
      setLoadingState(false, '', ui.loadingIndicator);
      if (ui.sendButton && checkApiKey()) ui.sendButton.disabled = false; // Re-enable send if possible
      appState.isStreaming = false; // Ensure streaming state is reset
    }
    // Note: The finally block inside streamChatResponse handles UI updates after the stream finishes or errors during streaming.
  }


  /** Fetches and displays a random maintenance tip. */
  async function fetchMaintenanceTip() {
    const ui = domElements.tips;
    if (!ui.loadingIndicator || !ui.content || !ui.errorMessage || !ui.regenerateButton) {
      console.error("Faltan elementos DOM para Tips.");
      return;
    }

    setLoadingState(true, 'Cargando tip...', ui.loadingIndicator);
    ui.content.innerHTML = ''; // Clear previous tip
    ui.errorMessage.style.display = 'none'; ui.errorMessage.style.opacity = '0';
    ui.regenerateButton.disabled = true;

    try {
      // Simple prompt for varied tips focused on Panama context
      const tipPromptText = `Genera tres tips prácticos y concisos (máximo 3 frases cortas cada uno) sobre mantenimiento de equipos biomédicos (uno predictivo, uno preventivo, uno correctivo) **aplicables específicamente al entorno hospitalario de Panamá.** Varía los tips en cada solicitud. **ABSOLUTAMENTE NO incluyas saludos ni despedidas, solo los tips directamente.** Formato Markdown.`;
      // Use the faster/cheaper model for tips
      const tipResponse = await callGenerativeApi(FLASH_MODEL_NAME, [{ text: tipPromptText }]);
      displayMaintenanceTip(tipResponse);
    } catch (error) {
      console.error("Error al obtener tip:", error);
      showGeneralError(`Error al cargar tip: ${error.message}`, ui.errorMessage);
    } finally {
      setLoadingState(false, '', ui.loadingIndicator);
      // Re-enable button only if API key is valid
      if (checkApiKey()) {
        ui.regenerateButton.disabled = false;
      }
    }
  }

  /**
   * Sends the specific equipment maintenance question or initiates regeneration.
   * @param {boolean} isRegeneration Whether this is a regeneration request.
   */
  async function sendEquipmentQuestion(isRegeneration = false) {
    const section = 'maintenance';
    const state = appState.maintenance;
    const ui = domElements.maintenance;

    let promptDetails; // { name, brand, model, type, question }
    let promptParts = [];

    if (isRegeneration) {
      if (!state.lastPromptDetails) {
        showGeneralError("No hay información previa para regenerar la consulta del equipo.", ui.errorMessage);
        return;
      }
      promptDetails = state.lastPromptDetails; // Reuse stored details
      console.log("Regenerando información para equipo:", promptDetails.name, promptDetails.brand, promptDetails.model);
      if (ui.responseDisplay) { // Show regeneration message
        ui.responseDisplay.innerHTML = `<p><i>Regenerando información para ${promptDetails.name} ${promptDetails.model}...</i></p>`;
        ui.responseDisplay.style.display = 'block';
        ui.responseDisplay.style.opacity = '1';
      }
    } else {
      // Validate inputs for a new question
      const validationResult = validateEquipmentInputs();
      if (!validationResult) return; // Validation failed, error shown by validator
      promptDetails = validationResult;
      state.lastPromptDetails = { ...promptDetails }; // Store details for potential regeneration
      if (ui.responseDisplay) { // Clear previous response
        ui.responseDisplay.style.display = 'none';
        ui.responseDisplay.style.opacity = '0';
        ui.responseDisplay.innerHTML = '';
      }
    }

    state.references = []; // Clear previous references for this section

    // --- Perform Web Search If Enabled ---
    if (state.useWebSearch && (promptDetails.name || promptDetails.brand || promptDetails.model || promptDetails.question)) {
      console.log("Web search activado para Mantenimiento");
      setLoadingState(true, 'Realizando búsqueda web (Equipo)...', ui.loadingIndicator);
      try {
        const searchQuery = `${promptDetails.name} ${promptDetails.brand} ${promptDetails.model} ${promptDetails.type} maintenance ${promptDetails.question}`.trim();
        const results = await Promise.allSettled([
          callTavilySearch(searchQuery),
          callGoogleSearch(searchQuery)
        ]);

        const successfulSearches = results
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => result.value);

        const allLinks = successfulSearches.flatMap(search => search.links);
        state.references = Array.from(new Map(allLinks.map(link => [link.url, link])).values());
        console.log("Web search (Equipo) completed. References stored:", state.references);

      } catch (searchError) {
        console.error("Error durante la ejecución de las búsquedas web (Equipo):", searchError);
        showGeneralError("Error durante la búsqueda web (Equipo). Continuando sin resultados.", ui.errorMessage);
      } finally {
        setLoadingState(false, '', ui.loadingIndicator);
      }
    }
    // --- End Web Search ---

    // Build prompt parts using the details
    promptParts = buildPromptParts(section, promptDetails.question, false); // No history needed for specific query

    // ---- Disable UI and Call API ----
    setLoadingState(true, 'Buscando información...', ui.loadingIndicator);
    if (ui.errorMessage) { ui.errorMessage.style.display = 'none'; ui.errorMessage.style.opacity = '0'; }

    // Disable controls during request
    const elementsToDisable = [
      ui.sendButton, ui.regenerateButton, ui.uploadButton, ui.webSearchButton,
      ui.nameInput, ui.brandInput, ui.modelInput, ui.questionInput,
      ...ui.toneButtons, ...ui.lengthButtons, ...ui.typeButtons
    ];
    elementsToDisable.forEach(el => { if (el) el.disabled = true; });

    try {
      // Use the faster model for specific, focused queries
      const apiResponse = await callGenerativeApi(CHAT_MODEL_NAME, promptParts);
      state.lastApiResponse = apiResponse; // Store response for potential future use
      displayEquipmentResponse(apiResponse);
      if (ui.regenerateButton && checkApiKey()) ui.regenerateButton.disabled = false; // Enable regenerate on success
    } catch (error) {
      console.error("Error consulta mantenimiento específico:", error);
      showGeneralError(`Error: ${error.message}`, ui.errorMessage);
      state.lastApiResponse = null;
      if (ui.regenerateButton) ui.regenerateButton.disabled = true; // Disable regenerate on error
    } finally {
      setLoadingState(false, '', ui.loadingIndicator);
      // Re-enable controls *only if API key is valid*
      const apiKeyOk = checkApiKey(); // Re-check API key status
      elementsToDisable.forEach(el => {
        // Only re-enable if API key is OK, except for regenerate which is handled above
        if (el && el !== ui.regenerateButton) {
          el.disabled = !apiKeyOk;
        }
      });
      // Always update UI state (e.g., placeholder text) after attempt
      updateEquipmentUIState();
    }
  }

  /** Validates the inputs for the specific equipment maintenance section. */
  function validateEquipmentInputs() {
    const ui = domElements.maintenance;
    if (ui.errorMessage) { ui.errorMessage.style.display = 'none'; ui.errorMessage.style.opacity = '0'; } // Clear previous error

    const name = ui.nameInput?.value.trim();
    const brand = ui.brandInput?.value.trim();
    const model = ui.modelInput?.value.trim();
    const question = ui.questionInput?.value.trim();
    const type = appState.maintenance.selectedType; // Get selected type from state

    let errorMessage = null;
    if (!name) errorMessage = "Falta el Nombre del Equipo.";
    else if (!brand) errorMessage = "Falta la Marca del Equipo.";
    else if (!model) errorMessage = "Falta el Modelo del Equipo.";
    else if (!type) errorMessage = "Selecciona un Tipo de Mantenimiento."; // Check state variable
    else if (!question) errorMessage = "Escribe tu pregunta específica sobre el mantenimiento.";

    if (errorMessage) {
      showGeneralError(errorMessage, ui.errorMessage);
      return false; // Indicate validation failure
    }
    return { name, brand, model, type, question }; // Return validated data
  }

  /** Updates the UI state (placeholders, button disabled status) for the equipment section. */
  function updateEquipmentUIState() {
    const ui = domElements.maintenance;
    const state = appState.maintenance;
    // Ensure critical elements exist
    if (!ui.nameInput || !ui.brandInput || !ui.modelInput || !ui.questionInput || !ui.sendButton || !ui.typeButtons) {
      console.warn("updateEquipmentUIState: Faltan elementos DOM críticos.");
      return;
    }

    const name = ui.nameInput.value.trim();
    const brand = ui.brandInput.value.trim();
    const model = ui.modelInput.value.trim();
    const type = state.selectedType;
    const apiKeyOk = checkApiKey(); // Check API key status

    // Enable/disable type buttons based on API key
    ui.typeButtons.forEach(btn => { btn.disabled = !apiKeyOk; });

    let enableQuestionArea = false;
    let placeholderText = "Completa Nombre, Marca, Modelo y Tipo...";

    if (!apiKeyOk) {
      placeholderText = "Se requiere API Key configurada.";
    } else if (name && brand && model && type) {
      enableQuestionArea = true;
      placeholderText = `Escribe tu pregunta sobre mantenimiento ${type} para ${name} ${model}...`;
    } else if (!name || !brand || !model) {
      placeholderText = "Completa Nombre, Marca y Modelo del equipo...";
    } else if (!type) {
      placeholderText = "Selecciona un tipo de mantenimiento...";
    }

    // Update question input and send button state
    ui.questionInput.disabled = !enableQuestionArea;
    ui.questionInput.placeholder = placeholderText;
    ui.sendButton.disabled = !enableQuestionArea;

    // Resize textarea if it's enabled
    if (enableQuestionArea) {
      autoResizeTextarea(ui.questionInput);
    }
  }


  // --- File Handling Functions ---

  /**
   * Renders the list of uploaded files for a given section with animaciones mejoradas.
   * @param {string} section 'assistant' or 'maintenance'.
   */
  function renderFileList(section) {
    const state = section === 'assistant' ? appState.chat : appState[section];
    const ui = section === 'assistant' ? domElements.chat : domElements[section];

    if (!state || !ui || !ui.fileDisplay || !ui.fileList || !ui.toggleFilesButton || !ui.fileCount) {
      console.warn(`renderFileList: Missing elements for section ${section}`);
      return;
    }

    ui.fileList.innerHTML = '';
    const fileCount = state.uploadedFiles.length;

    if (fileCount === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.innerHTML = `<i class="fas fa-info-circle file-icon"></i> No hay archivos adjuntos${section === 'maintenance' ? ' (Equipo)' : ''}.`;
      emptyMessage.style.opacity = '0';
      emptyMessage.style.transform = 'translateY(-10px)';
      ui.fileList.appendChild(emptyMessage);

      requestAnimationFrame(() => {
        emptyMessage.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        emptyMessage.style.opacity = '1';
        emptyMessage.style.transform = 'translateY(0)';
      });

      ui.fileDisplay.classList.remove('visible');
      ui.toggleFilesButton.style.display = 'none';
    } else {
      state.uploadedFiles.forEach((fileData, index) => {
        if (!fileData || !fileData.id || !fileData.name) return;

        const li = document.createElement('li');
        li.style.opacity = '0';
        li.style.transform = 'translateY(-10px)';

        li.innerHTML = `
          <i class="fas fa-file-alt file-icon"></i>
          <span class="file-name">${fileData.name}</span>
          <button class="remove-file-btn" data-file-id="${fileData.id}" aria-label="Eliminar archivo">
            <i class="fas fa-times"></i>
          </button>
        `;

        ui.fileList.appendChild(li);

        // Animar entrada de cada elemento
        requestAnimationFrame(() => {
          li.style.transition = `all ${REFERENCES_PANEL_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`;
          li.style.opacity = '1';
          li.style.transform = 'translateY(0)';
        });

        // Agregar evento para eliminar archivo
        const removeBtn = li.querySelector('.remove-file-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            li.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            li.style.opacity = '0';
            li.style.transform = 'translateY(-10px)';

            setTimeout(() => {
              removeFileFromList(section, fileData.id);
            }, 300);
          });
        }
      });

      ui.toggleFilesButton.style.display = 'inline-flex';
    }

    // Actualizar contador
    ui.fileCount.textContent = fileCount;
    ui.fileCount.setAttribute('aria-label', `${fileCount} archivos adjuntos`);
  }

  /**
   * Removes a file from the specified section's list and re-renders.
   * @param {string} section 'assistant' or 'maintenance'.
   * @param {string} fileId The ID of the file to remove.
   */
  function removeFileFromList(section, fileId) {
    const state = appState[section];
    if (!state) return;

    state.uploadedFiles = state.uploadedFiles.filter(file => file.id !== fileId);
    console.log(`Archivo ${fileId} eliminado de ${section}. Restantes:`, state.uploadedFiles.length);
    renderFileList(section); // Re-render the list for the specific section
  }

  /**
   * Handles the file input change event for a given section.
   * Processes selected files, reads their content/data, and updates the state.
   * @param {Event} event The file input change event.
   * @param {string} section 'assistant' or 'maintenance'.
   */
  async function handleFileUpload(event, section) {
    const files = event.target.files;
    // Use 'chat' state/UI when section is 'assistant'
    const stateKey = section === 'assistant' ? 'chat' : section;
    const state = appState[stateKey];
    const ui = section === 'assistant' ? domElements.chat : domElements[section];
    // Fallback error display logic remains the same
    const errorDisplay = ui?.errorMessage || domElements.chat.errorMessage;

    // Check if ui object exists before accessing its properties
    // Use stateKey for checking state existence
    if (!files || files.length === 0 || !state || !ui || !errorDisplay) {
      console.warn(`handleFileUpload: Missing elements, state (${stateKey}), or ui object for section ${section}`);
      // Attempt to show error even if some UI parts are missing
      if (errorDisplay) {
        showGeneralError("Error interno al procesar subida de archivos.", errorDisplay);
      }
      // Reset file input if possible
      if (event?.target) {
        event.target.value = null;
      }
      return;
    }
    // Check specifically for fileList existence within the correct ui object
    if (!ui.fileList) {
      console.warn(`handleFileUpload: Missing ui.fileList for section ${section}`);
      showGeneralError("Error interno: No se encontró la lista de archivos.", errorDisplay);
      if (event?.target) {
        event.target.value = null;
      }
      return;
    }


    const readPromises = [];
    let currentFileCount = state.uploadedFiles.length;

    // Indicate processing in the file list
    ui.fileList.innerHTML = `<li><i class="fas fa-spinner fa-spin file-icon"></i> Procesando archivos${section === 'maintenance' ? ' (Equipo)' : ''}...</li>`;
    // Show the display area during processing (check existence)
    if (ui.fileDisplay) {
      ui.fileDisplay.style.display = 'block';
    }


    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${section}-file-${Date.now()}-${i}`; // Unique ID per section
      const fileSizeMB = file.size / 1024 / 1024;

      // --- Validation ---
      if (currentFileCount >= MAX_FILE_UPLOAD_COUNT) {
        showGeneralError(`Límite de ${MAX_FILE_UPLOAD_COUNT} archivos alcanzado. "${file.name}" omitido.`, errorDisplay);
        continue; // Skip this file
      }
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        showGeneralError(`Archivo "${file.name}" (${fileSizeMB.toFixed(2)}MB) excede ${MAX_FILE_SIZE_MB}MB. Omitido.`, errorDisplay);
        continue; // Skip this file
      }

      const fileType = file.type || '';
      const fileName = file.name || 'archivo_desconocido';
      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

      // Determine file category
      const isPlainText = SUPPORTED_TEXT_MIME_TYPES.includes(fileType) || SUPPORTED_TEXT_EXTENSIONS.includes(fileExt);
      const isWord = SUPPORTED_WORD_MIME_TYPES.includes(fileType) || SUPPORTED_WORD_EXTENSIONS.includes(fileExt);
      const isImage = SUPPORTED_IMAGE_MIME_TYPES.includes(fileType) || SUPPORTED_IMAGE_EXTENSIONS.includes(fileExt);
      const isPdf = fileType === SUPPORTED_PDF_MIME_TYPE || fileExt === 'pdf';

      const isSupported = isPlainText || isWord || isImage || isPdf;

      if (!isSupported) {
        showGeneralError(`Tipo de archivo no soportado: "${fileName}" (${fileType || fileExt}). Omitido.`, errorDisplay);
        continue; // Skip this file
      }
      // --- End Validation ---

      currentFileCount++; // Increment count for accepted file

      // --- File Reading Promise ---
      const promise = new Promise(async (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const fileContent = e.target.result; // ArrayBuffer or Text String
            let fileData = {
              id: fileId,
              name: fileName,
              type: fileType || 'application/octet-stream' // Default MIME type
            };

            if (isPlainText) {
              // Ensure it's read as text
              if (typeof fileContent !== 'string') {
                // If read as ArrayBuffer mistakenly, decode it (assuming UTF-8)
                fileData.content = new TextDecoder().decode(fileContent);
                console.warn(`File ${fileName} expected text but got ArrayBuffer, decoded.`);
              } else {
                fileData.content = fileContent;
              }
              fileData.type = fileType || 'text/plain'; // Ensure correct MIME type
            } else if (isWord && typeof mammoth !== 'undefined') {
              try {
                // Mammoth expects ArrayBuffer
                if (!(fileContent instanceof ArrayBuffer)) {
                  throw new Error("Mammoth requires ArrayBuffer input.");
                }
                const result = await mammoth.extractRawText({ arrayBuffer: fileContent });
                fileData.content = result.value; // Store extracted text
                fileData.type = 'text/plain'; // Treat extracted content as plain text for the API
                console.log(`Mammoth extracted text from ${fileName}`);
              } catch (mammothError) {
                console.error(`Error procesando ${fileName} con Mammoth:`, mammothError);
                showGeneralError(`Error al extraer texto de "${fileName}". Adjuntando como blob.`, errorDisplay);
                // Fallback: Read as Data URL and send as blob
                // Ensure readFileAsDataURL is awaited correctly
                try {
                  const dataUrl = await readFileAsDataURL(file);
                  const base64Data = getDataFromDataUrl(dataUrl);
                  if (base64Data) {
                    fileData.data = base64Data;
                    // Use original Word MIME type if available
                    fileData.type = SUPPORTED_WORD_MIME_TYPES.includes(fileType) ? fileType : 'application/octet-stream';
                    delete fileData.content; // Remove empty content field
                  } else {
                    throw new Error("No se pudo leer el archivo como Data URL después del fallo de Mammoth.");
                  }
                } catch (dataUrlError) {
                  console.error(`Error reading file as Data URL during Mammoth fallback for ${fileName}:`, dataUrlError);
                  // Reject the main promise for this file
                  return reject(new Error(`Error I/O (DataURL fallback) ${fileName}`));
                }
              }
            } else if (isImage || isPdf) {
              // For Images/PDF, we need base64 data
              // Ensure readFileAsDataURL is awaited correctly
              try {
                const dataUrl = await readFileAsDataURL(file); // Read specifically as Data URL
                const base64Data = getDataFromDataUrl(dataUrl);
                if (base64Data) {
                  fileData.data = base64Data;
                  fileData.type = fileType || (isPdf ? SUPPORTED_PDF_MIME_TYPE : 'application/octet-stream'); // Ensure correct MIME type
                } else {
                  throw new Error(`No se pudo extraer base64 de ${fileName}`);
                }
              } catch (dataUrlError) {
                console.error(`Error reading file as Data URL for ${fileName}:`, dataUrlError);
                // Reject the main promise for this file
                return reject(new Error(`Error I/O (DataURL) ${fileName}`));
              }
            } else {
              // Should not happen due to isSupported check, but handle defensively
              console.warn(`Tipo de archivo ${fileType || fileExt} pasó el filtro pero no tiene manejo específico. Intentando como blob.`);
              // Ensure readFileAsDataURL is awaited correctly
              try {
                const dataUrl = await readFileAsDataURL(file);
                const base64Data = getDataFromDataUrl(dataUrl);
                if (base64Data) {
                  fileData.data = base64Data;
                  fileData.type = fileType || 'application/octet-stream';
                } else {
                  throw new Error(`No se pudo leer el archivo ${fileName} como Data URL.`);
                }
              } catch (dataUrlError) {
                console.error(`Error reading file as Data URL for fallback ${fileName}:`, dataUrlError);
                // Reject the main promise for this file
                return reject(new Error(`Error I/O (DataURL fallback) ${fileName}`));
              }
            }

            // Add to state only if content or data was successfully processed
            if (fileData.content || fileData.data) {
              state.uploadedFiles.push(fileData);
              resolve(fileData); // Resolve the promise with the processed data
            } else {
              reject(new Error(`No se pudo procesar el contenido de ${fileName}`));
            }

          } catch (readError) {
            console.error(`Error procesando ${file.name} en onload:`, readError);
            showGeneralError(`Error al procesar "${file.name}".`, errorDisplay);
            reject(new Error(`Error procesando ${file.name}`)); // Reject the promise
          }
        };

        reader.onerror = (e) => {
          console.error(`Error leyendo ${fileName}:`, e.target.error);
          showGeneralError(`Error de lectura en "${fileName}".`, errorDisplay);
          reject(new Error(`Error I/O ${fileName}`)); // Reject the promise
        };

        // Choose read method based on type
        if (isPlainText) {
          reader.readAsText(file); // Read directly as text
        } else if (isWord || isImage || isPdf) {
          // Read as ArrayBuffer for Mammoth, or prepare for potential DataURL conversion
          // We'll re-read as DataURL if needed (fallback or direct image/pdf)
          reader.readAsArrayBuffer(file);
        } else {
          // Fallback for unexpected types
          reader.readAsArrayBuffer(file);
        }
      });
      // --- End File Reading Promise ---

      readPromises.push(promise);
    } // End of loop

    try {
      // Wait for all file reading/processing promises to settle
      await Promise.allSettled(readPromises);
      console.log(`Procesamiento de archivos para ${section} completado. Archivos actuales:`, state.uploadedFiles.length);
    } catch (error) {
      // This catch block might not be strictly necessary with allSettled,
      // as individual errors are handled within the promise logic.
      console.error(`Error general durante la lectura de archivos para ${section}:`, error);
      showGeneralError("Ocurrió un error al leer uno o más archivos.", errorDisplay);
    } finally {
      // Always re-render the list after processing is done
      renderFileList(section);
      // Reset the file input value to allow selecting the same file again
      if (event?.target) {
        event.target.value = null;
      }
    }
  }


  // --- UI Setup and Event Listeners ---

  /** Sets up AI control buttons (tone, length, web search, regenerate) for a section. */
  function setupAIControlsForSection(section) {
    // Use 'chat' state/UI when section is 'assistant'
    const state = section === 'assistant' ? appState.chat : appState[section];
    const ui = section === 'assistant' ? domElements.chat : domElements[section];

    // More specific checks
    if (!state) { console.warn(`setupAIControls: Missing state for section ${section}`); return; }
    if (!ui) { console.warn(`setupAIControls: Missing ui object for section ${section}`); return; }
    // Check elements obtained by getElementById or querySelector
    if (!ui.webSearchButton) { console.warn(`setupAIControls: Missing ui.webSearchButton for section ${section} (Expected ID: ${section === 'assistant' ? 'toggle-web-search-button' : 'eq-toggle-web-search-button'})`); return; }
    if (!ui.regenerateButton) { console.warn(`setupAIControls: Missing ui.regenerateButton for section ${section} (Expected ID: ${section === 'assistant' ? 'regenerate-button' : 'eq-regenerate-button'})`); return; }
    // Check NodeLists obtained by querySelectorAll (check if they exist and are not empty)
    if (!ui.toneButtons || ui.toneButtons.length === 0) { console.warn(`setupAIControls: Missing or empty ui.toneButtons for section ${section}`); /* Consider returning if essential */ }
    if (!ui.lengthButtons || ui.lengthButtons.length === 0) { console.warn(`setupAIControls: Missing or empty ui.lengthButtons for section ${section}`); /* Consider returning if essential */ }


    // Set initial active state based on default state values (check if elements exist before accessing classList)
    if (ui.toneButtons) ui.toneButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tone === state.currentTone));
    if (ui.lengthButtons) ui.lengthButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.length === state.currentLength));
    if (ui.webSearchButton) ui.webSearchButton.classList.toggle('active', state.useWebSearch);
    if (ui.regenerateButton) ui.regenerateButton.disabled = true; // Always start disabled

    // Add event listeners (check if elements exist before adding listeners)
    if (ui.toneButtons) {
      ui.toneButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          state.currentTone = button.dataset.tone;
          ui.toneButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          console.log(`${section} Tono:`, state.currentTone);
        });
      });
    }

    if (ui.lengthButtons) {
      ui.lengthButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          state.currentLength = button.dataset.length;
          ui.lengthButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          console.log(`${section} Longitud:`, state.currentLength);
        });
      });
    }

    if (ui.webSearchButton) {
      ui.webSearchButton.addEventListener('click', () => {
        if (ui.webSearchButton.disabled) return;
        state.useWebSearch = !state.useWebSearch;
        ui.webSearchButton.classList.toggle('active', state.useWebSearch);
        console.log(`${section} Web Search:`, state.useWebSearch);
      });
    }

    // Regeneration listener (calls the appropriate send function)
    if (ui.regenerateButton) {
      ui.regenerateButton.addEventListener('click', () => {
        if (!ui.regenerateButton.disabled) {
          if (section === 'assistant') {
            sendChatMessage(true);
          } else if (section === 'maintenance') {
            sendEquipmentQuestion(true);
          }
        }
      });
    }
  }

  /** Sets up tab navigation logic. */
  function setupTabs() {
    const { container: sidebar, toggleButton, buttons } = domElements.sidebar;
    const contents = document.querySelectorAll('.tab-content');
    const mainContainer = document.querySelector('.main-container');

    if (!sidebar || !toggleButton || !buttons || !contents || !mainContainer) {
      console.warn("setupTabs: Missing essential elements");
      return;
    }

    // Toggle sidebar handler con animación mejorada
    toggleButton.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');

      if (!isOpen) {
        sidebar.style.display = 'flex';
        requestAnimationFrame(() => {
          sidebar.classList.add('open');
          mainContainer.classList.add('sidebar-open');
        });
      } else {
        sidebar.classList.remove('open');
        mainContainer.classList.remove('sidebar-open');
        setTimeout(() => {
          if (!sidebar.classList.contains('open')) {
            sidebar.style.display = 'none';
          }
        }, 300); // Coincidir con la duración de la transición CSS
      }

      // Rotate icon when sidebar is open
      const icon = toggleButton.querySelector('i');
      if (icon) {
        icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const target = button.getAttribute('data-tab');

        // Animación mejorada para botones
        buttons.forEach(btn => {
          if (btn !== button) {
            btn.style.transform = '';
          }
        });
        button.style.transform = 'translateX(5px)';

        // Remove active class from all buttons and add to clicked
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Hide all contents with fade
        contents.forEach(content => {
          if (content.getAttribute('data-tab-content') !== target) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';
            setTimeout(() => {
              content.style.display = 'none';
            }, 300);
          }
        });

        // Show target content with fade
        const targetContent = document.querySelector(`[data-tab-content="${target}"]`);
        if (targetContent) {
          setTimeout(() => {
            targetContent.style.display = 'block';
            // Force reflow
            targetContent.offsetHeight;
            targetContent.style.opacity = '1';
            targetContent.style.transform = 'translateY(0)';
          }, 50);
        }

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          mainContainer.classList.remove('sidebar-open');
          const toggleIcon = toggleButton.querySelector('i');
          if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(0deg)';
          }
        }
      });
    });
  }

  /** Sets up the references panel logic with animaciones mejoradas. */
  function setupReferencesPanel() {
    const panel = domElements.references.panel;
    const list = domElements.references.list;
    const title = domElements.references.title;
    const closeBtn = domElements.references.closeButton;
    const allOpenBtns = domElements.references.allButtons;

    if (!panel || !list || !title || !closeBtn || !allOpenBtns) {
      console.warn("References panel elements not found.");
      return;
    }

    allOpenBtns.forEach(button => {
      button.addEventListener('click', () => {
        const sectionAttr = button.getAttribute('data-section');
        const linksToShow = sectionAttr === 'assistant' ? appState.chat.references : appState.maintenance.references;

        const sectionTitle = sectionAttr === 'assistant' ? 'Asistente' : 'Mantenimiento';
        panel.setAttribute('data-section', sectionAttr);
        title.textContent = `Referencias (${sectionTitle})`;

        // Mejorar animación de la lista
        if (linksToShow.length > 0) {
          list.innerHTML = linksToShow.map((ref, index) => `
            <li style="opacity: 0; transform: translateY(20px); transition: all ${REFERENCES_PANEL_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms;">
              <a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title || ref.url}</a>
            </li>
          `).join('');
        } else {
          list.innerHTML = '<li style="opacity: 0; transform: translateY(20px); transition: all ${REFERENCES_PANEL_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)">No se encontraron referencias para esta respuesta.</li>';
        }

        // Mostrar panel
        panel.style.display = 'flex';
        requestAnimationFrame(() => {
          panel.classList.add('open');
          // Animar elementos de la lista
          Array.from(list.children).forEach(li => {
            requestAnimationFrame(() => {
              li.style.opacity = '1';
              li.style.transform = 'translateY(0)';
            });
          });
        });
      });
    });

    // Cerrar panel con animación
    closeBtn.addEventListener('click', () => {
      // Animar salida de los elementos de la lista
      Array.from(list.children).forEach((li, index) => {
        li.style.opacity = '0';
        li.style.transform = 'translateY(20px)';
      });

      panel.classList.remove('open');
      setTimeout(() => {
        panel.style.display = 'none';
        list.innerHTML = ''; // Limpiar lista después de la animación
      }, REFERENCES_PANEL_TRANSITION_MS);
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (event) => {
      if (panel.classList.contains('open') &&
        !panel.contains(event.target) &&
        ![...allOpenBtns].some(btn => btn.contains(event.target))) {
        closeBtn.click(); // Usar el mismo método de cierre
      }
    });
  }


  /** Sets up common event listeners. */
  function setupEventListeners() {
    // Dark Mode Toggle
    if (domElements.darkModeToggle) {
      domElements.darkModeToggle.addEventListener('click', toggleDarkModeHandler);
    }

    // Chat Section Listeners
    if (domElements.chat.sendButton) {
      domElements.chat.sendButton.addEventListener('click', () => sendChatMessage(false));
    }
    if (domElements.chat.questionInput) {
      domElements.chat.questionInput.addEventListener('keydown', (event) => {
        // Send on Enter (not Shift+Enter)
        if (event.key === 'Enter' && !event.shiftKey && !domElements.chat.sendButton?.disabled && !appState.isStreaming) {
          event.preventDefault(); // Prevent newline
          sendChatMessage(false);
        }
        autoResizeTextarea(domElements.chat.questionInput); // Resize on keydown
      });
      domElements.chat.questionInput.addEventListener('input', () => autoResizeTextarea(domElements.chat.questionInput)); // Resize on input/paste
      domElements.chat.questionInput.addEventListener('paste', () => setTimeout(() => autoResizeTextarea(domElements.chat.questionInput), 0)); // Resize after paste
    }
    if (domElements.chat.uploadButton && domElements.chat.fileInput) {
      domElements.chat.uploadButton.addEventListener('click', () => domElements.chat.fileInput.click());
      domElements.chat.fileInput.addEventListener('change', (e) => handleFileUpload(e, 'assistant'));
    }
    if (domElements.chat.clearChatButton) {
      domElements.chat.clearChatButton.addEventListener('click', clearChat);
    }
    if (domElements.chat.toggleFilesButton && domElements.chat.fileDisplay) {
      domElements.chat.toggleFilesButton.addEventListener('click', () => {
        // Toggle visibility using the 'visible' class for CSS animation
        domElements.chat.fileDisplay.classList.toggle('visible');
      });
    }


    // Tips Section Listeners
    if (domElements.tips.regenerateButton) {
      domElements.tips.regenerateButton.addEventListener('click', fetchMaintenanceTip);
    }

    // Maintenance Section Listeners
    [domElements.maintenance.nameInput, domElements.maintenance.brandInput, domElements.maintenance.modelInput].forEach(input => {
      if (input) input.addEventListener('input', updateEquipmentUIState);
    });
    if (domElements.maintenance.typeButtons) {
      domElements.maintenance.typeButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          domElements.maintenance.typeButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          appState.maintenance.selectedType = button.dataset.type; // Update state
          console.log("Tipo Mantenimiento Específico:", appState.maintenance.selectedType);
          updateEquipmentUIState(); // Update UI based on new selection
        });
      });
    }
    if (domElements.maintenance.sendButton) {
      domElements.maintenance.sendButton.addEventListener('click', () => sendEquipmentQuestion(false));
    }
    if (domElements.maintenance.questionInput) {
      domElements.maintenance.questionInput.addEventListener('input', () => autoResizeTextarea(domElements.maintenance.questionInput));
      domElements.maintenance.questionInput.addEventListener('paste', () => setTimeout(() => autoResizeTextarea(domElements.maintenance.questionInput), 0));
    }
    if (domElements.maintenance.uploadButton && domElements.maintenance.fileInput) {
      domElements.maintenance.uploadButton.addEventListener('click', () => domElements.maintenance.fileInput.click());
      domElements.maintenance.fileInput.addEventListener('change', (e) => handleFileUpload(e, 'maintenance'));
    }
    if (domElements.maintenance.toggleFilesButton && domElements.maintenance.fileDisplay) {
      domElements.maintenance.toggleFilesButton.addEventListener('click', () => {
        // Toggle visibility using the 'visible' class for CSS animation
        domElements.maintenance.fileDisplay.classList.toggle('visible');
      });
    }
  }

  /** Initializes the application. */
  function initializeApp() {
    console.log("Inicializando componentes...");

    // Check for essential elements before proceeding
    const essentialElements = [
      domElements.body, domElements.darkModeToggle,
      domElements.chat.messages, domElements.chat.questionInput, domElements.chat.sendButton,
      domElements.tips.content, domElements.tips.regenerateButton,
      domElements.maintenance.section, domElements.maintenance.questionInput, domElements.maintenance.sendButton,
      domElements.references.panel // Add more checks as needed
    ];
    if (essentialElements.some(el => !el)) {
      console.error("ERROR CRÍTICO: Faltan elementos DOM esenciales. Verifique los IDs en HTML y JS.");
      alert("Error: No se pudieron cargar todos los componentes de la interfaz. Revisa la consola para más detalles.");
      // Disable all interactive elements to prevent further errors
      document.querySelectorAll('button, input, textarea').forEach(el => el.disabled = true);
      return; // Stop initialization
    }


    // Apply initial dark mode state
    applyDarkMode(appState.isDarkMode);

    // Setup UI components
    setupTabs();
    setupReferencesPanel();
    setupAIControlsForSection('assistant');
    setupAIControlsForSection('maintenance');
    setupEventListeners();

    // Initial UI state updates
    renderFileList('assistant');
    renderFileList('maintenance');

    // Check API key and perform initial actions
    const apiKeyOk = checkApiKey(); // This also handles initial UI disabling/enabling

    // Display initial chat message (even if API key is invalid)
    displayChatMessage(domElements.chat.messages, 'Asistente', `*¡Hola!* Soy BIAmedial Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas.
    
    Para consultas *muy* específicas de un equipo, usa la sección "Mantenimiento Específico".
    No olvides revisar los "Tips de Mantenimiento".
    
    **Importante:** Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética.
    ¿En qué puedo ayudarte hoy?`);

    if (apiKeyOk) {
      console.log(`API Key OK. Usando modelos: Chat=${CHAT_MODEL_NAME}, Tips/Equipo=${FLASH_MODEL_NAME}`);
      fetchMaintenanceTip(); // Fetch initial tip
      updateEquipmentUIState(); // Update equipment section UI
    } else {
      console.warn("API Key NO VÁLIDA o no configurada. Funcionalidad limitada.");
      updateEquipmentUIState(); // Ensure equipment UI reflects disabled state
    }

    // Initial resize for textareas
    if (domElements.chat.questionInput) autoResizeTextarea(domElements.chat.questionInput);
    if (domElements.maintenance.questionInput) autoResizeTextarea(domElements.maintenance.questionInput);

    console.log("Inicialización de la aplicación completada.");
  }

  // --- Start the application ---
  initializeApp();

  // Mostrar solo la sección del asistente al cargar
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => {
    if (tab.dataset.tabContent === "assistant") {
      tab.classList.remove("hidden");
      tab.style.display = "block";
    } else {
      tab.classList.add("hidden");
      tab.style.display = "none";
    }
  });

  // Botón de subir documentos
  const uploadButton = document.getElementById("uploadButton");
  const fileInput = document.getElementById("fileInput");

  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const fileCount = fileInput.files.length;
    alert(`${fileCount} archivo(s) seleccionado(s).`);
  });
  window.messageHandler = new MessageHandler();
  window.themeHandler = new ThemeHandler();

  // Load and initialize required libraries
  (async function loadLibraries() {
    try {
      // First, load the scripts
      await Promise.all([
        new Promise((resolve, reject) => {
          const markedScript = document.createElement('script');
          markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
          markedScript.onload = resolve;
          markedScript.onerror = reject;
          document.head.appendChild(markedScript);
        }),
        new Promise((resolve, reject) => {
          const hljsScript = document.createElement('script');
          hljsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
          hljsScript.onload = resolve;
          hljsScript.onerror = reject;
          document.head.appendChild(hljsScript);
        })
      ]);

      // Now that scripts are loaded, initialize marked
      if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
        marked.setOptions({
          renderer: new marked.Renderer(),
          highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          },
          langPrefix: 'hljs language-',
          pedantic: false,
          gfm: true,
          breaks: true,
          sanitize: false,
          smartypants: false,
          xhtml: false
        });
        console.log("Libraries loaded and initialized successfully");
      } else {
        throw new Error("Required libraries not loaded properly");
      }
    } catch (error) {
      console.error("Error loading or initializing libraries:", error);
      // Show error in UI if needed
      const errorMessage = document.getElementById('error-message');
      if (errorMessage) {
        errorMessage.textContent = "Error loading required libraries. Some features may not work properly.";
        errorMessage.style.display = 'block';
      }
    }
  })();

}); // Fin de DOMContentLoaded