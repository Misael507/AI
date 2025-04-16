const GOOGLE_API_KEY = 'AIzaSyB0089qQN6JEg_RJsS_hi0MjEZgnxCrh5o';
const GOOGLE_CSE_ID = '933054f4e5ea543ab';
const TAVILY_API_KEY = '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';

window.AppConfig = Object.freeze({
  GOOGLE_API_KEY,
  GOOGLE_CSE_ID,
  TAVILY_API_KEY
});

function checkApiKey() {
  return window.AppConfig?.GOOGLE_API_KEY && window.AppConfig.GOOGLE_API_KEY !== "TU_API_KEY_DE_GOOGLE_GEMINI";
}


function applyDarkMode(isDark) {
  const body = document.body;
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  body.classList[isDark ? 'add' : 'remove']('dark-mode');
  if (darkModeToggle) {
    darkModeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
  }
}

function toggleDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  const newMode = !isDarkMode;
  localStorage.setItem('darkMode', newMode);
  applyDarkMode(newMode);
}


const md = window.markdownit({
  html: true,
  xhtmlOut: false,
  breaks: true,
  linkify: true,
  typographer: true
});

function formatMarkdownToHtml(text) {
  if (!text) return '';

  if (typeof md === 'object' && typeof md.render === 'function') {
    try {
      const htmlContent = md.render(text);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // Wrap tables for better mobile experience
      const tables = tempDiv.querySelectorAll('table');
      tables.forEach(table => {
        if (!table.parentElement?.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-wrapper';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
      return tempDiv.innerHTML;
    } catch (e) {
      console.error("Error rendering markdown with markdown-it:", e);
      return text.replace(/\n/g, '<br>');
    }
  } else {
    console.warn("markdown-it library not found. Using basic text formatting.");
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
  }
}



function autoResizeTextarea(textarea) {
  if (!textarea) return;

  // Reset height before calculating the scrollHeight
  textarea.style.height = 'auto';

  // Use requestAnimationFrame for better performance than setTimeout
  requestAnimationFrame(() => {
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
}


function showGeneralError(message, targetElement) {
  if (!targetElement) return;

  targetElement.textContent = message;
  targetElement.style.display = 'block';

  // Use double requestAnimationFrame to ensure the display change has been applied
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targetElement.style.opacity = '1';
    });
  });

  // Auto-hide errors except for API key issues
  if (!message || !message.toLowerCase().includes("api key")) {
    setTimeout(() => {
      targetElement.style.opacity = '0';
      setTimeout(() => {
        if (targetElement) targetElement.style.display = 'none';
      }, 300);
    }, 5000);
  }
}


function initializeCommonComponents() {
  console.log("Inicializando componentes comunes...");

  // Verificar API Key
  if (!checkApiKey()) {
    console.warn("API Key de Google NO VÁLIDA o no configurada. Funcionalidad limitada.");
    // Optionally show a persistent warning to the user
  } else {
    console.log("API Key de Google OK.");
  }
}




function initializeThemeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      applyDarkMode(true);
    } else if (savedTheme === 'light') {
      applyDarkMode(false);
    } else {
      applyDarkMode(prefersDarkScheme.matches);
    }
  }

  // Apply theme immediately
  applyInitialTheme();

  // Set up toggle button
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('dark-mode');
      const newIsDark = !isCurrentlyDark;
      applyDarkMode(newIsDark);
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    });
  }

  // Listen for system preference changes
  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyDarkMode(e.matches);
    }
  });
}




window.SearchServices = (function () {
  /**
   * Search using Tavily API
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} - Search results
   */
  async function searchWithTavily(query, maxResults = 20) {
    if (!window.AppConfig?.TAVILY_API_KEY) {
      console.error("Tavily API Key not configured.");
      return [];
    }

    try {
      console.log("Buscando con Tavily:", query);
      const apiUrl = "https://api.tavily.com/search";
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: AppConfig.TAVILY_API_KEY,
          query: query,
          search_depth: "advanced",
          include_raw_content: true,
          max_results: maxResults
        })
      };

      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) {
        throw new Error(`Error de Tavily: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results?.length > 0
        ? data.results.map(result => ({
          title: result.title,
          url: result.url,
          content: result.content
        }))
        : [];
    } catch (error) {
      console.error("Error en búsqueda con Tavily:", error);
      return [];
    }
  }

  /**
   * Search using Google Custom Search Engine
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} - Search results
   */
  async function searchWithGoogleCSE(query, maxResults = 20) {
    if (!window.AppConfig?.GOOGLE_API_KEY || !window.AppConfig?.GOOGLE_CSE_ID) {
      console.error("Google API Key or CSE ID not configured.");
      return [];
    }

    try {
      console.log("Buscando con Google CSE:", query);
      const numResults = Math.min(maxResults, 20);
      const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${AppConfig.GOOGLE_API_KEY}&cx=${AppConfig.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error de Google CSE: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.items?.length > 0
        ? data.items.map(item => ({
          title: item.title,
          url: item.link,
          content: item.snippet
        }))
        : [];
    } catch (error) {
      console.error("Error en búsqueda con Google CSE:", error);
      return [];
    }
  }

  return {
    searchWithTavily,
    searchWithGoogleCSE
  };
})();




window.FileServices = (function () {
  /**
   * Convert UTF-8 string to Base64
   * @param {string} str - String to convert
   * @returns {Promise<string>} - Base64 encoded string
   */
  function utf8ToBase64(str) {
    try {
      return new Promise((resolve, reject) => {
        const blob = new Blob([str], { type: 'text/plain' });
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };

        reader.onerror = () => reject(new Error('Error al codificar el texto a base64'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error encoding text to base64:", error);
      throw error; // Re-throw to be caught by caller
    }
  }

  /**
   * Read file content and convert to base64
   * @param {File} file - File object to read
   * @returns {Promise<Object>} - Object with file data
   */
  async function readFileContent(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof Blob)) {
        reject(new Error(`Invalid file object provided for ${file?.name || 'unknown file'}`));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const dataUrl = event.target.result;
          const mimeTypePart = file.type; // Use original file type

          if (typeof dataUrl !== 'string' || !dataUrl.includes('base64,')) {
            console.warn(`Unexpected data URL format for file ${file.name}`);
            reject(new Error("Invalid data URL format"));
            return;
          }

          const base64String = dataUrl.split('base64,')[1];

          if (!base64String) {
            throw new Error("No base64 data found");
          }

          resolve({
            mimeType: mimeTypePart,
            data: base64String,
            name: file.name
          });
        } catch (error) {
          console.error("Error processing file data URL:", error);
          reject(new Error(`Failed to process file ${file.name}: ${error.message}`));
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`Failed to read file ${file.name}: ${error.message}`));
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        reject(new Error(`Failed to read file ${file.name}: ${error.message}`));
      }
    });
  }

  return {
    readFileContent,
    utf8ToBase64
  };
})();




window.ApiServices = (function () {
  /**
   * Process citations from Gemini API grounding
   * @param {Array} citations - Citations from Gemini API
   * @returns {Array} - Processed references with unique URLs
   */
  function processGroundingCitations(citations) {
    if (!citations?.length) return [];

    const webReferences = citations.map(citation => ({
      title: citation.title || "Fuente Web",
      url: citation.uri,
      snippet: `Fuente citada por el modelo`,
      source: "web"
    }));

    // Filter for unique URLs
    const uniqueWebReferences = [];
    const seenUrls = new Set();

    for (const ref of webReferences) {
      if (ref.url && !seenUrls.has(ref.url)) {
        uniqueWebReferences.push(ref);
        seenUrls.add(ref.url);
      }
    }

    return uniqueWebReferences;
  }


  /**
   * Process a file to extract its text content
   * @param {File} file - The file to process
   * @returns {Promise<{text: string, reference: Object}>} - Extracted text and reference object
   */
  async function processFile(file) {
    let textContent = "";
    let reference = { title: file.name, source: "file" };

    try {
      // Determine file type
      const isText = file.type === "text/plain" || file.name.endsWith(".txt");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isWord = file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc');

      // Process based on file type
      if (isText) {
        textContent = await file.text();
        reference.snippet = `[Archivo de texto]`;
      } else if (isPdf && window.pdfjsLib) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const maxPages = 20; // Limit pages for performance

          let pdfText = "";
          for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pdfText += content.items.map(item => item.str).join(" ") + "\n";
          }

          textContent = pdfText || "[PDF] No se pudo extraer texto.";
          if (pdf.numPages > maxPages) {
            textContent += "\n...[contenido truncado]";
          }
          reference.snippet = `[Archivo PDF: ${pdf.numPages} páginas]`;
        } catch (pdfError) {
          console.error("Error pdf.js:", pdfError);
          textContent = "[PDF] Error extracción.";
          reference.source = "error";
          reference.snippet = `[Error al procesar PDF: ${pdfError.message}]`;
        }
      } else if (isWord && window.mammoth) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          textContent = result.value || "[Word] No se pudo extraer texto.";
          reference.snippet = `[Archivo Word]`;
        } catch (mammothError) {
          console.error("Error mammoth.js:", mammothError);
          textContent = "[Word] Error extracción.";
          reference.source = "error";
          reference.snippet = `[Error al procesar Word: ${mammothError.message}]`;
        }
      } else {
        reference.snippet = `[Tipo de archivo no soportado]`;
      }

      // Truncate very large text
      if (textContent.trim()) {
        const maxTextLength = 1000000;
        if (textContent.length > maxTextLength) {
          textContent = textContent.substring(0, maxTextLength) + "\n...[contenido de texto truncado]";
        }
        if (!reference.snippet || reference.source === "error") {
          reference.snippet = `[Archivo procesado como texto]`;
          reference.source = "file";
        }
      }

      return { text: textContent, reference };
    } catch (error) {
      console.error(`Error procesando archivo ${file.name}:`, error);
      reference.source = "error";
      reference.snippet = `[Error al procesar archivo: ${error.message}]`;
      return { text: "", reference };
    }
  }

  /**
   * Call the Gemini API with prompt and optional files
   * @param {Object} prompt - The prompt object with systemPrompt and userMessage
   * @param {Array} files - Array of files to process
   * @param {boolean} useSearch - Whether to use Google Search Grounding
   * @param {string|null} searchResultsContext - Manual search context if available
   * @returns {Promise<Object>} - API response with text, references, and safety ratings
   */
  async function callGeminiAPI(prompt, files = [], useSearch = true, searchResultsContext = null) {
    if (!window.AppConfig?.GOOGLE_API_KEY) {
      throw new Error("Clave API de Google no configurada.");
    }

    try {
      console.log("Llamando a la API de Gemini...");
      const hasFiles = files?.length > 0;
      const modelName = hasFiles ? 'gemini-2.0-flash-thinking-exp-01-21' : 'gemini-2.0-flash';
      const useGrounding = useSearch && !searchResultsContext;

      console.log(`Using model: ${modelName}, Google Grounding: ${useGrounding}, Manual Search Context: ${!!searchResultsContext}`);

      // Process files if any
      let fileProcessingReferences = [];
      let filesTextContext = "";
      const fileDataParts = [];

      if (hasFiles) {
        console.log(`Procesando ${files.length} archivos...`);
        const maxFiles = 10;
        const limitedFiles = files.slice(0, maxFiles);

        // Process files in parallel for better performance
        const fileResults = await Promise.all(
          limitedFiles.map(async (file) => {
            // Handle multimodal files for specific models
            if (modelName === 'gemini-1.5-pro-preview-03-25') {
              try {
                const fileInfo = await FileServices.readFileContent(file);
                if (fileInfo?.mimeType && fileInfo?.data) {
                  return {
                    multimodalData: { inlineData: { mimeType: fileInfo.mimeType, data: fileInfo.data } },
                    reference: { title: file.name, snippet: `[Archivo: ${file.name}]`, source: "file" }
                  };
                }
              } catch (readError) {
                console.error(`Error leyendo ${file.name} para multimodal:`, readError);
                return {
                  reference: { title: file.name, snippet: `[Error al leer archivo: ${readError.message}]`, source: "error" }
                };
              }
            }

            // Process text content from file
            return processFile(file);
          })
        );

        // Collect results
        for (const result of fileResults) {
          if (result.multimodalData) {
            fileDataParts.push(result.multimodalData);
          }
          if (result.text) {
            filesTextContext += `\n\n[Contexto de archivo "${result.reference.title}"]\n${result.text}\n`;
          }
          if (result.reference) {
            fileProcessingReferences.push(result.reference);
          }
        }

        if (files.length > maxFiles) {
          console.warn(`Se limitó el procesamiento a ${maxFiles} archivos.`);
        }
      }

      // Validate and prepare prompt
      const systemPrompt = typeof prompt.systemPrompt === 'string' ? prompt.systemPrompt : '';
      const userMessage = typeof prompt.userMessage === 'string' ? prompt.userMessage : '';

      if (!systemPrompt || !userMessage) {
        throw new Error("Prompt inválido.");
      }

      // Build final prompt text
      let finalPromptText = systemPrompt;
      if (filesTextContext) {
        finalPromptText += `\n\n${filesTextContext}`;
      }
      finalPromptText += `\n\n${userMessage}`;

      // Prepare API request
      const contents = [{ role: "user", parts: [{ text: finalPromptText }, ...fileDataParts] }];
      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 8192,
          candidateCount: 1
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      };

      // Add search tools if needed
      if (useGrounding) {
        console.log("Habilitando Google Search Grounding...");
        requestBody.tools = [{ "googleSearch": {} }];
      } else if (searchResultsContext) {
        console.log("Using manual search context, skipping Google Search Grounding.");
      }

      // Make API request
      console.log("Enviando request a Gemini API...");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${AppConfig.GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        }
      );

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error detallado de la API de Gemini:", errorData);
        throw new Error(`Error de la API (${response.status}): ${errorData.error?.message || 'Desconocido'}`);
      }

      // Process response
      const data = await response.json();
      console.log("Respuesta de Gemini recibida.");

      // Validate response
      const candidate = data.candidates?.[0];
      const hasText = !!candidate?.content?.parts?.[0]?.text;
      const hasCitations = candidate?.citationMetadata?.citations?.length > 0;

      if (!hasText && !hasCitations) {
        console.error("Respuesta inválida de la API:", data);
        const blockReason = data.promptFeedback?.blockReason;
        throw new Error(blockReason ?
          `Solicitud bloqueada: ${blockReason}` :
          "Formato de respuesta inválido");
      }

      // Extract response text and references
      let responseText = candidate.content.parts[0]?.text || "";
      let groundedReferences = [];

      if (hasCitations) {
        console.log("Procesando referencias de grounding...");
        groundedReferences = processGroundingCitations(candidate.citationMetadata.citations);

        if (!responseText) {
          responseText = "Se encontraron fuentes relevantes, pero no se pudo generar un resumen directo. Consulta las referencias.";
        }
      }

      // Combine all references
      const finalReferences = [...fileProcessingReferences, ...groundedReferences];

      // Return formatted response
      return {
        text: responseText,
        references: finalReferences,
        safetyRatings: data.promptFeedback?.safetyRatings || []
      };

    } catch (error) {
      console.error("Error detallado al llamar a la API de Gemini:", error);
      throw error; // Re-throw for the calling function to handle
    }
  }


  /**
   * Update references panel with formatted references
   * @param {Array} references - Array of reference objects
   * @param {HTMLElement} panelElement - DOM element to update
   */
  function updateReferencesPanel(references, panelElement) {
    if (!panelElement) return;

    // Clear panel
    panelElement.innerHTML = '';

    // Show empty state if no references
    if (!references?.length) {
      panelElement.innerHTML = '<div class="empty-state">No hay referencias disponibles</div>';
      return;
    }

    const orderedList = document.createElement('ol');
    orderedList.className = 'references-list';

    // Helper function to extract domain name safely
    const extractDomain = (url) => {
      if (!url) return 'Fuente web';
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch (e) {
        return url;
      }
    };

    // Process each reference
    references.forEach((reference) => {
      const listItem = document.createElement('li');
      listItem.className = 'reference-item';

      // Set defaults
      let iconClass = 'fa-file-alt';
      let domainName = '';
      let sourcePrefix = '';

      // Determine icon and prefix based on source
      switch (reference.source) {
        case 'file':
          iconClass = 'fa-file-alt';
          break;
        case 'error':
          iconClass = 'fa-exclamation-triangle';
          break;
        case 'google-cse':
          iconClass = 'fab fa-google';
          sourcePrefix = '[Google] ';
          domainName = extractDomain(reference.url);
          break;
        case 'tavily':
          iconClass = 'fa-search';
          sourcePrefix = '[Tavily] ';
          domainName = extractDomain(reference.url);
          break;
        case 'web':
          iconClass = 'fa-globe';
          sourcePrefix = '[Gemini Web] ';
          domainName = extractDomain(reference.url);
          break;
      }

      // Create reference HTML
      const title = reference.title || (reference.url ? 'Fuente Web' : 'Referencia');
      const titleElement = reference.url
        ? `<a href="${reference.url}" target="_blank" rel="noopener noreferrer">${sourcePrefix}${title}</a>`
        : `<span>${sourcePrefix}${title}</span>`;

      listItem.innerHTML = `
        <div class="reference-content">
          <div class="reference-title">
            <i class="fas ${iconClass}"></i>
            ${titleElement}
          </div>
          ${domainName ? `<div class="reference-domain">${domainName}</div>` : ''}
          <div class="reference-snippet">${reference.snippet || ''}</div>
          ${reference.url ? `<div class="reference-url-small"><a href="${reference.url}" target="_blank" rel="noopener noreferrer">${reference.url}</a></div>` : ''}
        </div>
      `;

      orderedList.appendChild(listItem);
    });

    panelElement.appendChild(orderedList);
  }


  return {
    callGeminiAPI,
    updateReferencesPanel,

  };
})();





let chatMessages;
let questionInput;
let sendButton;
let loadingIndicator;
let errorMessageDisplay;
let fileInput;
let uploadFilesBtn;
let showFilesBtn;
let showReferencesBtn;
let filesSidebar;
let referencesSidebar;
let closeFilesSidebarBtn;
let closeReferencesSidebarBtn;
let filesPanelContent;
let referencesPanelContent;
let filesCount;
let inputActions;
let toggleActionsBtn;
let chatControls;
let toneButtons;
let lengthButtons;
let webSearchButton;
let regenerateButton;
let clearChatButton;



let uploadedFilesData = [];
let currentTone = 'neutral';
let currentLength = 'media';
let useWebSearch = false;
let lastQuestionText = '';
let isAssistantInitialized = false;

function initializeAssistantPage() {
  if (isAssistantInitialized) return;
  console.log("Inicializando página de Asistente...");


  chatMessages = document.getElementById('chat-messages');
  questionInput = document.getElementById('questionInput');
  sendButton = document.getElementById('sendButton');
  loadingIndicator = document.getElementById('loading');
  errorMessageDisplay = document.getElementById('error-message');
  fileInput = document.getElementById('fileInput');
  uploadFilesBtn = document.getElementById('upload-files-btn');
  showFilesBtn = document.getElementById('show-files-btn');
  showReferencesBtn = document.getElementById('show-references-btn');
  filesSidebar = document.getElementById('files-sidebar');
  referencesSidebar = document.getElementById('references-sidebar');
  closeFilesSidebarBtn = document.getElementById('close-files-sidebar');
  closeReferencesSidebarBtn = document.getElementById('close-references-sidebar');
  filesPanelContent = document.getElementById('files-panel-content');
  referencesPanelContent = document.getElementById('references-panel-content');
  filesCount = document.getElementById('files-count');
  inputActions = document.getElementById('input-actions');
  toggleActionsBtn = document.getElementById('toggle-actions-btn');
  chatControls = document.querySelector('#asistente-section .input-actions'); // Scope to section
  toneButtons = chatControls?.querySelectorAll('[data-tone]');
  lengthButtons = chatControls?.querySelectorAll('[data-length]');
  webSearchButton = document.getElementById('toggle-web-search-button');
  regenerateButton = document.getElementById('regenerate-button');
  clearChatButton = document.getElementById('clear-chat-button');


  if (sendButton) sendButton.addEventListener('click', sendMessage);
  if (questionInput) {
    questionInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
      autoResizeTextarea(questionInput);
    });
    questionInput.addEventListener('input', () => autoResizeTextarea(questionInput));
    questionInput.addEventListener('paste', () => autoResizeTextarea(questionInput));
    autoResizeTextarea(questionInput);
  }


  if (uploadFilesBtn && fileInput) {
    uploadFilesBtn.addEventListener('click', () => fileInput.click());
  }


  if (toggleActionsBtn && inputActions) {
    const inputContainer = document.querySelector('#asistente-section .input-container');
    toggleActionsBtn.addEventListener('click', () => {
      inputActions.classList.toggle('collapsed');
      if (inputContainer) inputContainer.classList.toggle('collapsed');
      toggleActionsBtn.classList.toggle('collapsed');
      localStorage.setItem('inputActionsCollapsed', inputActions.classList.contains('collapsed'));
    });

    if (localStorage.getItem('inputActionsCollapsed') === 'true') {
      inputActions.classList.add('collapsed');
      if (inputContainer) inputContainer.classList.add('collapsed');
      toggleActionsBtn.classList.add('collapsed');
    }
  }


  if (showFilesBtn && filesSidebar) {
    showFilesBtn.addEventListener('click', () => {
      filesSidebar.classList.add('active');
      if (referencesSidebar) referencesSidebar.classList.remove('active');
    });
  }
  if (showReferencesBtn && referencesSidebar) {
    showReferencesBtn.addEventListener('click', () => {
      referencesSidebar.classList.add('active');
      if (filesSidebar) filesSidebar.classList.remove('active');
    });
  }
  if (closeFilesSidebarBtn && filesSidebar) {
    closeFilesSidebarBtn.addEventListener('click', () => filesSidebar.classList.remove('active'));
  }
  if (closeReferencesSidebarBtn && referencesSidebar) {
    closeReferencesSidebarBtn.addEventListener('click', () => referencesSidebar.classList.remove('active'));
  }


  if (fileInput) {
    fileInput.addEventListener('change', handleAssistantFileUpload);
  }


  if (clearChatButton) {
    clearChatButton.addEventListener('click', clearAssistantChat);
  }


  setupAssistantAIControls();


  if (chatMessages && chatMessages.children.length === 0) {
    const welcomeMessageHTML = `
      <p><strong>¡Hola!</strong> Soy BIAmedical Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas.</p>
      <p><strong>Importante:</strong> Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética.</p>
      <p>¿En qué puedo ayudarte hoy?</p>`;
    displayMessage('Asistente', welcomeMessageHTML, false, true);
  }


  updateAssistantFilesCount();
  updateAssistantFilesPanel();
  isAssistantInitialized = true;
}



/**
 * Handle file upload for the assistant
 * @param {Event} event - File input change event
 */
function handleAssistantFileUpload(event) {
  const files = event.target.files;
  if (!files?.length) return;

  console.log(`${files.length} archivos seleccionados para Asistente`);

  // Maximum number of files to allow
  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'text/plain', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif'
  ];

  // Check if adding these files would exceed the limit
  if (uploadedFilesData.length + files.length > MAX_FILES) {
    showGeneralError(`No se pueden subir más de ${MAX_FILES} archivos. Por favor, elimine algunos archivos primero.`, errorMessageDisplay);
    return;
  }

  // Process each file
  let filesAdded = 0;
  let filesRejected = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      filesRejected++;
      console.warn(`Archivo ${file.name} rechazado: excede el tamaño máximo de 50MB`);
      continue;
    }

    // Check if file type is allowed (loose check)
    const isAllowedType = ALLOWED_TYPES.some(type => file.type.includes(type)) ||
      /\.(txt|pdf|doc|docx|jpg|jpeg|png|gif)$/i.test(file.name);

    if (!isAllowedType) {
      filesRejected++;
      console.warn(`Archivo ${file.name} rechazado: tipo de archivo no soportado`);
      continue;
    }

    // Prevent duplicates by name and size
    if (!uploadedFilesData.some(f => f.name === file.name && f.size === file.size)) {
      uploadedFilesData.push({
        id: Date.now() + i,
        name: file.name,
        size: file.size,
        type: file.type,
        fileObject: file,
        addedAt: new Date().toISOString()
      });
      filesAdded++;
    }
  }

  // Show feedback if files were rejected
  if (filesRejected > 0) {
    showGeneralError(
      `${filesRejected} ${filesRejected === 1 ? 'archivo rechazado' : 'archivos rechazados'} por tamaño o formato no soportado.`,
      errorMessageDisplay
    );
  }

  // Update UI
  if (filesAdded > 0) {
    updateAssistantFilesCount();
    updateAssistantFilesPanel();
    if (filesSidebar) filesSidebar.classList.add('active'); // Show sidebar
  }

  // Clear input to allow selecting the same file again
  if (fileInput) fileInput.value = '';
}

function updateAssistantFilesCount() {
  if (filesCount) {
    const count = uploadedFilesData.length;
    filesCount.textContent = count;
    filesCount.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Get appropriate icon class based on file type
 * @param {string} fileType - MIME type of the file
 * @param {string} fileName - Name of the file
 * @returns {string} - FontAwesome icon class
 */
function getFileIconClass(fileType, fileName) {
  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) return 'fa-file-pdf';
  if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'fa-file-word';
  if (fileType.includes('text') || fileName.endsWith('.txt')) return 'fa-file-alt';
  if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(fileName)) return 'fa-file-image';
  if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'fa-file-excel';
  if (fileType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'fa-file-powerpoint';
  if (fileType.includes('zip') || fileName.endsWith('.zip') || fileName.endsWith('.rar')) return 'fa-file-archive';
  if (fileType.includes('audio') || /\.(mp3|wav|ogg|flac)$/i.test(fileName)) return 'fa-file-audio';
  if (fileType.includes('video') || /\.(mp4|avi|mov|wmv)$/i.test(fileName)) return 'fa-file-video';
  if (fileType.includes('code') || /\.(js|html|css|py|java|cpp|c|php)$/i.test(fileName)) return 'fa-file-code';
  return 'fa-file'; // Default icon
}

/**
 * Update the files panel with current uploaded files
 */
function updateAssistantFilesPanel() {
  if (!filesPanelContent) return;

  // Clear panel
  filesPanelContent.innerHTML = '';

  // Show empty state if no files
  if (uploadedFilesData.length === 0) {
    filesPanelContent.innerHTML = '<div class="empty-state">No hay archivos subidos</div>';
    return;
  }

  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();

  // Add each file to the panel
  uploadedFilesData.forEach(fileData => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    // Get appropriate icon
    const iconClass = getFileIconClass(fileData.type, fileData.name);

    // Format file size
    const fileSize = fileData.size < 1024 * 1024
      ? `${Math.round(fileData.size / 1024)} KB`
      : `${(fileData.size / (1024 * 1024)).toFixed(1)} MB`;

    fileItem.innerHTML = `
      <div class="file-info">
        <i class="fas ${iconClass} file-icon"></i>
        <span class="file-name" title="${fileData.name}">${fileData.name}</span>
        <span class="file-size">${fileSize}</span>
      </div>
      <div class="file-actions">
        <button class="file-action-btn delete" data-file-id="${fileData.id}" title="Eliminar archivo">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    // Add delete listener
    const deleteBtn = fileItem.querySelector('.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const idToRemove = parseInt(e.currentTarget.dataset.fileId);
        uploadedFilesData = uploadedFilesData.filter(f => f.id !== idToRemove);
        updateAssistantFilesCount();
        updateAssistantFilesPanel();
      });
    }

    fragment.appendChild(fileItem);
  });

  // Add all files to the panel at once (more efficient)
  filesPanelContent.appendChild(fragment);
}

/**
 * Display a message in the chat window
 * @param {string} _ - Unused parameter (kept for compatibility)
 * @param {string} text - Message text content
 * @param {boolean} isUserMessage - Whether this is a user message
 * @param {boolean} isHTML - Whether to treat text as HTML
 */
function displayMessage(_, text, isUserMessage = false, isHTML = false) {
  if (!chatMessages) return;

  // Create message container
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUserMessage ? 'user-turn' : 'assistant-turn');

  // Create sender label
  const senderSpan = document.createElement('span');
  senderSpan.classList.add('sender');
  senderSpan.innerHTML = isUserMessage
    ? `<i class="fas fa-user"></i> Usuario`
    : `<i class="fas fa-robot"></i> Asistente`;

  // Create response content
  const responseSpan = document.createElement('div');
  responseSpan.classList.add('response');

  if (isUserMessage) {
    responseSpan.classList.add('user');
    responseSpan.textContent = text; // Use textContent for user messages (safer)
  } else {
    // For assistant messages, either use direct HTML or format markdown
    responseSpan.innerHTML = isHTML ? text : formatMarkdownToHtml(text);
  }

  // Assemble and append message
  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(responseSpan);
  chatMessages.appendChild(messageDiv);

  // Scroll smoothly to the bottom
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

/**
 * Process web search results and collect references
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to fetch
 * @returns {Promise<{searchContext: string, references: Array}>} - Search context and references
 */
async function performWebSearch(query, maxResults = 5) {
  let searchContext = "";
  let collectedReferences = [];
  const seenUrls = new Set();

  try {
    console.log("Fetching web search results...");

    // Fetch results from multiple sources concurrently
    const [googleResults, tavilyResults] = await Promise.all([
      SearchServices.searchWithGoogleCSE(query, maxResults)
        .catch(e => {
          console.error("Google CSE Search failed:", e);
          return [];
        }),
      SearchServices.searchWithTavily(query, maxResults)
        .catch(e => {
          console.error("Tavily Search failed:", e);
          return [];
        })
    ]);

    // Process and combine results
    const contextParts = [];

    // Helper function to process results from any source
    const processResults = (results, sourceName, sourceType) => {
      if (!results?.length) return;

      results.forEach((res, index) => {
        if (res.url && !seenUrls.has(res.url)) {
          contextParts.push(`[${sourceName} ${index + 1}] ${res.title}: ${res.content || 'N/A'}`);
          collectedReferences.push({
            title: res.title,
            url: res.url,
            snippet: res.content,
            source: sourceType
          });
          seenUrls.add(res.url);
        }
      });
    };

    // Process results from each source
    processResults(googleResults, 'Google', 'google-cse');
    processResults(tavilyResults, 'Tavily', 'tavily');

    // Build search context if results were found
    if (contextParts.length > 0) {
      searchContext = "Contexto de Búsqueda Web:\n" + contextParts.join('\n');
      console.log(`Prepared search context with ${contextParts.length} results`);
    } else {
      console.log("No relevant web search results found");
    }

  } catch (error) {
    console.error("Error during web search:", error);
  }

  return { searchContext, references: collectedReferences };
}

/**
 * Process and deduplicate references from multiple sources
 * @param {Array} apiReferences - References from API response
 * @param {Array} webReferences - References from web search
 * @returns {Array} - Unique, deduplicated references
 */
function processReferences(apiReferences = [], webReferences = []) {
  const uniqueReferences = [];
  const seenUrls = new Set();
  const seenTitleSnippetPairs = new Set();

  // Combine all references
  const allReferences = [...apiReferences, ...webReferences];

  // Process each reference
  allReferences.forEach(ref => {
    // For references with URLs
    if (ref.url) {
      if (!seenUrls.has(ref.url)) {
        uniqueReferences.push(ref);
        seenUrls.add(ref.url);
      }
      return;
    }

    // For references without URLs (like file references)
    if (ref.source === 'file' || ref.source === 'error') {
      uniqueReferences.push(ref);
      return;
    }

    // For other references without URLs, check title+snippet combination
    const titleSnippetKey = `${ref.title}|${ref.snippet}`;
    if (!seenTitleSnippetPairs.has(titleSnippetKey)) {
      uniqueReferences.push(ref);
      seenTitleSnippetPairs.add(titleSnippetKey);
    }
  });

  return uniqueReferences;
}

/**
 * Send a message to the assistant and process the response
 */
async function sendMessage() {
  // Validate input
  if (!questionInput || !questionInput.value.trim()) return;

  const userMessage = questionInput.value.trim();
  lastQuestionText = userMessage; // Store for potential regeneration

  console.log("Sending message:", userMessage);

  // Update UI for user message
  displayMessage('Usuario', userMessage, true);
  questionInput.value = '';
  autoResizeTextarea(questionInput);

  // Show loading state
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessageDisplay) errorMessageDisplay.style.display = 'none';
  if (regenerateButton) regenerateButton.disabled = true;

  try {
    // Perform web search if enabled
    let searchContext = "";
    let webReferences = [];

    if (useWebSearch) {
      const searchResults = await performWebSearch(userMessage, 5);
      searchContext = searchResults.searchContext;
      webReferences = searchResults.references;
    }

    // Prepare prompt and files
    const prompt = buildAssistantPrompt(userMessage, searchContext || null);
    const filesToProcess = uploadedFilesData.map(f => f.fileObject);

    // Call API
    const response = await ApiServices.callGeminiAPI(
      prompt,
      filesToProcess,
      useWebSearch,
      searchContext || null
    );

    // Display response
    displayMessage('Asistente', response.text);

    // Process and display references
    const uniqueReferences = processReferences(response.references, webReferences);

    if (uniqueReferences.length > 0) {
      ApiServices.updateReferencesPanel(uniqueReferences, referencesPanelContent);

      // Show references panel if not already visible
      if (showReferencesBtn &&
        referencesSidebar &&
        !referencesSidebar.classList.contains('active')) {
        showReferencesBtn.click();
      }
    } else {
      ApiServices.updateReferencesPanel([], referencesPanelContent);
    }

    // Re-enable regenerate button
    if (regenerateButton) regenerateButton.disabled = false;

  } catch (error) {
    console.error('Error getting response:', error);

    // Show error and fallback response
    showGeneralError(`Error al obtener respuesta: ${error.message}`, errorMessageDisplay);
    const fallbackResponse = generateFallbackResponse(userMessage);
    displayMessage('Asistente', fallbackResponse);

    // Keep regenerate button disabled on error
    if (regenerateButton) regenerateButton.disabled = true;
  } finally {
    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Build prompt for the main assistant - Added searchResultsContext parameter
function buildAssistantPrompt(userMessage, searchResultsContext = null) {
  // Base system prompt (can be adjusted)
  let systemPrompt = `Eres BIAmedical Assistant, un asistente experto en ingeniería biomédica y mantenimiento de equipos médicos en Panamá.
  Tu objetivo es proporcionar información precisa, útil y bien estructurada.
  **Instrucciones de formato:**
  - Formatea tus respuestas usando Markdown (encabezados ##, listas *, -, 1., negritas **, etc.).
  - Asegúrate de que la respuesta sea clara y fácil de leer.
  **Instrucciones sobre fuentes:**
  - Si se activa la búsqueda web (grounding) O se proporciona contexto de búsqueda, basa tu respuesta **principalmente** en esa información y cíta las fuentes proporcionadas por el modelo si usa grounding.
  - Si se proporcionan archivos, usa su contexto.
  - Usa tu conocimiento interno solo si las otras fuentes no son suficientes.`;

  // Prepend search context if available
  if (searchResultsContext) {
    systemPrompt += `\n\n${searchResultsContext}`;
  }

  // Add tone/length context
  if (currentTone && currentTone !== 'neutral') systemPrompt += `\n- **Tono:** ${currentTone}`;
  if (currentLength && currentLength !== 'media') systemPrompt += `\n- **Longitud:** ${currentLength}`;

  return { systemPrompt, userMessage };
}

// Setup AI control buttons
function setupAssistantAIControls() {
  // Tone Buttons
  if (toneButtons) {
    // No aplicamos la clase 'active' al inicializar para que ningún botón aparezca seleccionado
    // pero mantenemos currentTone como 'neutral' para cuando se envíe una pregunta

    // Add listeners
    toneButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        currentTone = button.dataset.tone;
        toneButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        console.log("Tono:", currentTone);
      });
    });
  }

  // Length Buttons
  if (lengthButtons) {
    // No aplicamos la clase 'active' al inicializar para que ningún botón aparezca seleccionado
    // pero mantenemos currentLength como 'media' para cuando se envíe una pregunta

    lengthButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        currentLength = button.dataset.length;
        lengthButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        console.log("Longitud:", currentLength);
      });
    });
  }

  // Web Search Button
  if (webSearchButton) {
    webSearchButton.classList.toggle('active', useWebSearch); // Set initial state
    webSearchButton.addEventListener('click', () => {
      if (webSearchButton.disabled) return;
      useWebSearch = !useWebSearch;
      webSearchButton.classList.toggle('active', useWebSearch);
      console.log("Web Search:", useWebSearch);
    });
  }

  // Regenerate Button
  if (regenerateButton) {
    regenerateButton.addEventListener('click', async () => {
      // Validate state
      if (regenerateButton.disabled || !lastQuestionText) return;

      console.log("Regenerando respuesta para:", lastQuestionText);

      // Update UI state
      if (loadingIndicator) loadingIndicator.style.display = 'block';
      if (errorMessageDisplay) errorMessageDisplay.style.display = 'none';
      regenerateButton.disabled = true;

      try {
        // Perform web search if enabled
        let searchContext = "";
        let webReferences = [];

        if (useWebSearch) {
          const searchResults = await performWebSearch(lastQuestionText, 5);
          searchContext = searchResults.searchContext;
          webReferences = searchResults.references;
        }

        // Prepare prompt and files
        const prompt = buildAssistantPrompt(lastQuestionText, searchContext || null);
        const filesToProcess = uploadedFilesData.map(f => f.fileObject);

        // Call API
        const response = await ApiServices.callGeminiAPI(
          prompt,
          filesToProcess,
          useWebSearch,
          searchContext || null
        );

        // Display response
        displayMessage('Asistente', response.text);

        // Process and display references
        const uniqueReferences = processReferences(response.references, webReferences);

        if (uniqueReferences.length > 0) {
          ApiServices.updateReferencesPanel(uniqueReferences, referencesPanelContent);

          // Show references panel if not already visible
          if (showReferencesBtn &&
            referencesSidebar &&
            !referencesSidebar.classList.contains('active')) {
            showReferencesBtn.click();
          }
        } else {
          ApiServices.updateReferencesPanel([], referencesPanelContent);
        }

        // Re-enable regenerate button
        regenerateButton.disabled = false;
      } catch (error) {
        console.error('Error al regenerar respuesta:', error);
        showGeneralError(`Error al regenerar: ${error.message}`, errorMessageDisplay);
        regenerateButton.disabled = true;
      } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
      }
    });

    // Start with regenerate button disabled
    regenerateButton.disabled = true;
  }
}

// Clear chat function
function clearAssistantChat() {
  if (chatMessages) {
    chatMessages.innerHTML = ''; // Clear messages
    // Display welcome message again (Use the full version)
    const welcomeMessageHTML = `
      <p><strong>¡Hola!</strong> Soy BIAmedical Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas.</p>
      <p><strong>Importante:</strong> Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética.</p>
      <p>¿En qué puedo ayudarte hoy?</p>`;
    displayMessage('Asistente', welcomeMessageHTML, false, true); // Pass true for isHTML
  }
  uploadedFilesData = []; // Clear files
  updateAssistantFilesCount();
  updateAssistantFilesPanel();
  if (filesSidebar) filesSidebar.classList.remove('active');
  if (referencesSidebar) referencesSidebar.classList.remove('active');
  ApiServices.updateReferencesPanel([], referencesPanelContent); // Clear references panel
  // Reset controls
  currentTone = 'neutral';
  currentLength = 'media';
  useWebSearch = false;
  // Quitamos la clase 'active' de todos los botones
  if (toneButtons) toneButtons.forEach(btn => btn.classList.remove('active'));
  if (lengthButtons) lengthButtons.forEach(btn => btn.classList.remove('active'));
  if (webSearchButton) webSearchButton.classList.remove('active');
  if (regenerateButton) regenerateButton.disabled = true;
  if (questionInput) {
    questionInput.value = '';
    autoResizeTextarea(questionInput);
  }
  console.log("Chat limpiado");
}

// Fallback response function
function generateFallbackResponse(userMessage) {
  // Simple fallback logic
  if (userMessage.toLowerCase().includes('hola')) {
    return "¡Hola! ¿En qué puedo ayudarte hoy?";
  }
  return "Lo siento, no pude procesar tu solicitud en este momento. Por favor, intenta de nuevo.";
}

// Initialize the assistant page logic when the DOM is ready
// document.addEventListener('DOMContentLoaded', initializeAssistantPage); // Moved initialization call
// --- END asistente-script.js ---



let maintenanceTipsContent;
let maintenanceTipsLoading;
let maintenanceTipsError;
let regenerateTipButton;
let isTipsInitialized = false;

function initializeTipsPage() {
  if (isTipsInitialized) return;

  // Obtener elementos del DOM
  maintenanceTipsContent = document.getElementById('maintenance-tips-content');
  maintenanceTipsLoading = document.getElementById('maintenance-tips-loading');
  maintenanceTipsError = document.getElementById('maintenance-tips-error');
  regenerateTipButton = document.getElementById('regenerate-tip-button');


  // Configurar event listeners
  if (regenerateTipButton) {
    regenerateTipButton.addEventListener('click', fetchAndDisplayNewTip);
  }


  if (maintenanceTipsContent && maintenanceTipsContent.children.length === 0) {
    fetchAndDisplayNewTip();
  }
  isTipsInitialized = true;
}


function displayMaintenanceTip(tipData) {
  if (!maintenanceTipsContent) return;
  maintenanceTipsContent.innerHTML = ''; // Clear previous tip

  const tipContainer = document.createElement('div');
  tipContainer.classList.add('tip-container');


  const formattedContent = formatMarkdownToHtml(tipData.content);

  tipContainer.innerHTML = `
    <h3>${tipData.title || 'Tip de Mantenimiento'}</h3>
    <div class="tip-body">
      ${formattedContent}
    </div>
  `;
  maintenanceTipsContent.appendChild(tipContainer);
}

// Function to build the prompt for generating a maintenance tip
function buildTipPrompt() {
  const tipTypes = ['Preventivo', 'Correctivo', 'Predictivo', 'General', 'Seguridad'];
  const randomType = tipTypes[Math.floor(Math.random() * tipTypes.length)];

  const systemPrompt = `Eres un experto en ingeniería biomédica. Genera un consejo (tip) de mantenimiento **${randomType}** práctico y útil para equipos biomédicos.
  **Instrucciones:**
  - El consejo debe ser accionable y fácil de entender (2-4 párrafos cortos o una lista).
  - Formatea usando Markdown (un título corto en negrita **Título del Tip**, seguido del contenido).
  - Incluye una advertencia sobre verificar con manuales oficiales y la necesidad de personal calificado.`;
  const userMessage = `Genera un nuevo consejo de mantenimiento tipo ${randomType}.`;

  return { systemPrompt, userMessage };
}

/**
 * Parse tip content from API response
 * @param {string} text - Raw text from API
 * @returns {Object} - Parsed title and content
 */
function parseTipContent(text) {
  const lines = text.split('\n');
  let title = 'Tip de Mantenimiento'; // Default title
  let content = text; // Default content

  // Check if first line is a markdown title
  const titlePatterns = [
    /^\*\*(.+)\*\*$/, // **Title**
    /^# (.+)$/,       // # Title
    /^## (.+)$/       // ## Title
  ];

  if (lines.length > 0) {
    for (const pattern of titlePatterns) {
      const match = lines[0].match(pattern);
      if (match) {
        title = match[1].trim();
        content = lines.slice(1).join('\n').trim();
        break;
      }
    }
  }

  return { title, content };
}

/**
 * Fetch and display a new maintenance tip
 */
async function fetchAndDisplayNewTip() {
  // Update UI state
  if (maintenanceTipsLoading) maintenanceTipsLoading.style.display = 'block';
  if (maintenanceTipsError) maintenanceTipsError.style.display = 'none';
  if (maintenanceTipsContent) maintenanceTipsContent.innerHTML = '';
  if (regenerateTipButton) regenerateTipButton.disabled = true;

  try {
    // Generate prompt and call API
    const prompt = buildTipPrompt();
    const response = await ApiServices.callGeminiAPI(prompt, [], false);

    if (!response?.text) {
      throw new Error('Respuesta vacía del API');
    }

    // Parse and display the tip
    const tipData = parseTipContent(response.text);
    displayMaintenanceTip(tipData);

  } catch (error) {
    console.error('Error fetching maintenance tip:', error);

    // Show error message
    if (maintenanceTipsError) {
      showGeneralError(`Error al generar el tip: ${error.message}`, maintenanceTipsError);
    }

    // Show fallback content
    if (maintenanceTipsContent) {
      maintenanceTipsContent.innerHTML = `
        <div class="tip-container error">
          <h3>Tip no disponible</h3>
          <div class="tip-body">
            <p>No se pudo generar un nuevo tip en este momento. Por favor, intenta de nuevo más tarde.</p>
          </div>
        </div>
      `;
    }
  } finally {
    // Reset UI state
    if (maintenanceTipsLoading) maintenanceTipsLoading.style.display = 'none';
    if (regenerateTipButton) regenerateTipButton.disabled = false;
  }
}

// Initialize the tips page logic when the DOM is ready
// document.addEventListener('DOMContentLoaded', initializeTipsPage); // Moved initialization call
// --- END tips-script.js ---


// --- START sidebar.js ---
function initializeSidebar() {
  const mainSidebar = document.getElementById('main-sidebar');
  const contentWrapper = document.querySelector('.content-wrapper');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const toggleIcon = toggleSidebarBtn ? toggleSidebarBtn.querySelector('i') : null;
  const body = document.body;
  const SMALL_SCREEN_BREAKPOINT = 768; // Match CSS

  function updateToggleIconVisuals() {
    if (!toggleIcon) return;
    // Use chevron-right when collapsed (button shows to open)
    // Use chevron-left when open (button shows to collapse)
    if (mainSidebar.classList.contains('collapsed')) {
      toggleIcon.classList.remove('fa-chevron-left');
      toggleIcon.classList.add('fa-chevron-right');
      toggleSidebarBtn.title = "Mostrar menú";
    } else {
      toggleIcon.classList.remove('fa-chevron-right');
      toggleIcon.classList.add('fa-chevron-left');
      toggleSidebarBtn.title = "Ocultar menú";
    }
  }

  function toggleSidebar() {
    const isCollapsed = mainSidebar.classList.toggle('collapsed');
    body.classList.toggle('sidebar-open', !isCollapsed); // Add/remove body class
    updateToggleIconVisuals();
    // Save state
    localStorage.setItem('mainSidebarCollapsed', isCollapsed);
  }

  if (mainSidebar && contentWrapper && toggleSidebarBtn && toggleIcon) {
    // Set initial state from localStorage or default
    const savedState = localStorage.getItem('mainSidebarCollapsed');
    // Default to collapsed on small screens, open on large unless saved otherwise
    const startCollapsed = window.innerWidth <= SMALL_SCREEN_BREAKPOINT || savedState === 'true';

    if (startCollapsed) {
      mainSidebar.classList.add('collapsed');
      body.classList.remove('sidebar-open');
    } else {
      mainSidebar.classList.remove('collapsed');
      body.classList.add('sidebar-open');
    }
    updateToggleIconVisuals(); // Set initial icon state

    // Add click listener
    toggleSidebarBtn.addEventListener('click', toggleSidebar);

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('sidebar-open')) {
        toggleSidebar();
      }
    });

    // Close on click outside (mobile only)
    document.addEventListener('click', function (event) {
      if (
        window.innerWidth <= SMALL_SCREEN_BREAKPOINT &&
        body.classList.contains('sidebar-open') &&
        !mainSidebar.contains(event.target) &&
        !toggleSidebarBtn.contains(event.target)
      ) {
        toggleSidebar();
      }
    });

  } else {
    console.warn("Sidebar elements not found for initialization.");
  }
}
// --- END sidebar.js ---


// --- START mantenimiento-script.js ---
// Variables globales para esta página
let equipmentNameInput;
let equipmentBrandInput;
let equipmentModelInput;
// let maintenanceTypeSelector; // Container div, not needed directly
let maintenanceButtons;
let sendEquipmentQuestionButton;
let equipmentLoading;
let equipmentError;
let equipmentResponseDisplay;
let eqToneButtons;
let eqLengthButtons;
let eqWebSearchButton;
let eqRegenerateButton;
let eqFileInput;
let eqUploadFilesBtn;
let eqShowFilesBtn;
let eqShowReferencesBtn;
let eqFilesSidebar;
let eqReferencesSidebar;
let eqFilesPanelContent;
let eqReferencesPanelContent;
let eqFilesCount;
let eqPrintButton;
let equipmentQuestionInput;

// Estado
let selectedMaintenanceType = null;
let eqCurrentTone = 'neutral';
let eqCurrentLength = 'media';
let eqUseWebSearch = false;
let lastEqPromptDetails = null;
let eqUploadedFilesData = []; // Files specific to this section
let isMaintenanceInitialized = false; // Flag

function initializeMaintenancePage() {
  if (isMaintenanceInitialized) return;
  console.log("Inicializando página de Mantenimiento Específico...");

  // Obtener elementos del DOM
  equipmentNameInput = document.getElementById('equipmentName');
  equipmentBrandInput = document.getElementById('equipmentBrand');
  equipmentModelInput = document.getElementById('equipmentModel');
  maintenanceButtons = document.querySelectorAll('#mantenimiento-section .maintenance-button'); // Scope to section
  sendEquipmentQuestionButton = document.getElementById('sendEquipmentQuestionButton');
  equipmentLoading = document.getElementById('equipmentLoading');
  equipmentError = document.getElementById('equipmentError');
  equipmentResponseDisplay = document.getElementById('equipmentResponseDisplay');
  const eqControls = document.querySelector('#mantenimiento-section .equipment-controls'); // Scope to section
  eqToneButtons = eqControls?.querySelectorAll('[data-tone]');
  eqLengthButtons = eqControls?.querySelectorAll('[data-length]');
  eqWebSearchButton = document.getElementById('eq-toggle-web-search-button');
  eqRegenerateButton = document.getElementById('eq-regenerate-button');
  eqFileInput = document.getElementById('eq-fileInput');
  eqUploadFilesBtn = document.getElementById('eq-upload-files-btn');
  eqShowFilesBtn = document.getElementById('eq-show-files-btn');
  eqShowReferencesBtn = document.getElementById('eq-show-references-btn');
  eqFilesSidebar = document.getElementById('eq-files-sidebar');
  eqReferencesSidebar = document.getElementById('eq-references-sidebar');
  eqFilesPanelContent = document.getElementById('eq-files-panel-content');
  eqReferencesPanelContent = document.getElementById('eq-references-panel-content');
  eqFilesCount = document.getElementById('eq-files-count');
  eqPrintButton = document.getElementById('eq-print-button');
  equipmentQuestionInput = document.getElementById('equipmentQuestionInput');

  // Configurar event listeners
  [equipmentNameInput, equipmentBrandInput, equipmentModelInput, equipmentQuestionInput].forEach(input => {
    if (input) input.addEventListener('input', updateEquipmentUIState);
  });
  if (equipmentQuestionInput) {
    equipmentQuestionInput.addEventListener('input', () => autoResizeTextarea(equipmentQuestionInput));
    equipmentQuestionInput.addEventListener('paste', () => autoResizeTextarea(equipmentQuestionInput));
    autoResizeTextarea(equipmentQuestionInput); // Initial resize
  }

  // Maintenance type buttons
  if (maintenanceButtons) {
    maintenanceButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        maintenanceButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedMaintenanceType = button.dataset.type;
        console.log("Tipo Mantenimiento Específico:", selectedMaintenanceType);
        updateEquipmentUIState();
      });
    });
  }

  // AI Controls
  setupMaintenanceAIControls();

  // Send Button
  if (sendEquipmentQuestionButton) {
    sendEquipmentQuestionButton.addEventListener('click', handleSendMaintenanceRequest);
  }

  // File Upload
  if (eqUploadFilesBtn && eqFileInput) {
    eqUploadFilesBtn.addEventListener('click', () => eqFileInput.click());
    eqFileInput.addEventListener('change', handleMaintenanceFileUpload);
  }

  // Show/Hide Sidebars
  if (eqShowFilesBtn && eqFilesSidebar) {
    eqShowFilesBtn.addEventListener('click', () => {
      eqFilesSidebar.classList.add('active');
      if (eqReferencesSidebar) eqReferencesSidebar.classList.remove('active');
    });
  }
  if (eqShowReferencesBtn && eqReferencesSidebar) {
    eqShowReferencesBtn.addEventListener('click', () => {
      eqReferencesSidebar.classList.add('active');
      if (eqFilesSidebar) eqFilesSidebar.classList.remove('active');
    });
  }
  const closeEqFilesSidebarBtn = document.getElementById('close-eq-files-sidebar');
  const closeEqReferencesSidebarBtn = document.getElementById('close-eq-references-sidebar');
  if (closeEqFilesSidebarBtn && eqFilesSidebar) {
    closeEqFilesSidebarBtn.addEventListener('click', () => eqFilesSidebar.classList.remove('active'));
  }
  if (closeEqReferencesSidebarBtn && eqReferencesSidebar) {
    closeEqReferencesSidebarBtn.addEventListener('click', () => eqReferencesSidebar.classList.remove('active'));
  }

  // Print Button
  if (eqPrintButton) {
    eqPrintButton.addEventListener('click', handlePrintMaintenanceInfo);
  }

  // Initialize UI state
  updateEquipmentUIState();
  updateEqFilesCount();
  updateEqFilesPanel();
  isMaintenanceInitialized = true; // Set flag
}

// --- Maintenance Specific Functions ---

function updateEquipmentUIState() {
  if (!sendEquipmentQuestionButton) return;
  const name = equipmentNameInput?.value?.trim();
  const brand = equipmentBrandInput?.value?.trim();
  const model = equipmentModelInput?.value?.trim();
  // Enable button only if all required fields are filled
  sendEquipmentQuestionButton.disabled = !(name && brand && model && selectedMaintenanceType);
}

/**
 * Handle file upload for the maintenance section
 * @param {Event} event - File input change event
 */
function handleMaintenanceFileUpload(event) {
  const files = event.target.files;
  if (!files?.length) return;

  console.log(`${files.length} archivos seleccionados para Mantenimiento`);

  // Maximum number of files to allow
  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'text/plain', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif'
  ];

  // Check if adding these files would exceed the limit
  if (eqUploadedFilesData.length + files.length > MAX_FILES) {
    showGeneralError(`No se pueden subir más de ${MAX_FILES} archivos. Por favor, elimine algunos archivos primero.`, equipmentError);
    return;
  }

  // Process each file
  let filesAdded = 0;
  let filesRejected = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      filesRejected++;
      console.warn(`Archivo ${file.name} rechazado: excede el tamaño máximo de 50MB`);
      continue;
    }

    // Check if file type is allowed (loose check)
    const isAllowedType = ALLOWED_TYPES.some(type => file.type.includes(type)) ||
      /\.(txt|pdf|doc|docx|jpg|jpeg|png|gif)$/i.test(file.name);

    if (!isAllowedType) {
      filesRejected++;
      console.warn(`Archivo ${file.name} rechazado: tipo de archivo no soportado`);
      continue;
    }

    // Prevent duplicates by name and size
    if (!eqUploadedFilesData.some(f => f.name === file.name && f.size === file.size)) {
      eqUploadedFilesData.push({
        id: Date.now() + i,
        name: file.name,
        size: file.size,
        type: file.type,
        fileObject: file,
        addedAt: new Date().toISOString()
      });
      filesAdded++;
    }
  }

  // Show feedback if files were rejected
  if (filesRejected > 0) {
    showGeneralError(
      `${filesRejected} ${filesRejected === 1 ? 'archivo rechazado' : 'archivos rechazados'} por tamaño o formato no soportado.`,
      equipmentError
    );
  }

  // Update UI
  if (filesAdded > 0) {
    updateEqFilesCount();
    updateEqFilesPanel();
    if (eqFilesSidebar) eqFilesSidebar.classList.add('active');
  }

  // Clear input to allow selecting the same file again
  if (eqFileInput) eqFileInput.value = '';
}

function updateEqFilesCount() {
  if (eqFilesCount) {
    const count = eqUploadedFilesData.length;
    eqFilesCount.textContent = count;
    eqFilesCount.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Update the equipment files panel with current uploaded files
 */
function updateEqFilesPanel() {
  if (!eqFilesPanelContent) return;

  // Clear panel
  eqFilesPanelContent.innerHTML = '';

  // Show empty state if no files
  if (eqUploadedFilesData.length === 0) {
    eqFilesPanelContent.innerHTML = '<div class="empty-state">No hay archivos subidos</div>';
    return;
  }

  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();

  // Add each file to the panel
  eqUploadedFilesData.forEach(fileData => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    // Get appropriate icon
    const iconClass = getFileIconClass(fileData.type, fileData.name);

    // Format file size
    const fileSize = fileData.size < 1024 * 1024
      ? `${Math.round(fileData.size / 1024)} KB`
      : `${(fileData.size / (1024 * 1024)).toFixed(1)} MB`;

    fileItem.innerHTML = `
      <div class="file-info">
        <i class="fas ${iconClass} file-icon"></i>
        <span class="file-name" title="${fileData.name}">${fileData.name}</span>
        <span class="file-size">${fileSize}</span>
      </div>
      <div class="file-actions">
        <button class="file-action-btn delete" data-file-id="${fileData.id}" title="Eliminar archivo">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    // Add delete listener
    const deleteBtn = fileItem.querySelector('.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const idToRemove = parseInt(e.currentTarget.dataset.fileId);
        eqUploadedFilesData = eqUploadedFilesData.filter(f => f.id !== idToRemove);
        updateEqFilesCount();
        updateEqFilesPanel();
      });
    }

    fragment.appendChild(fileItem);
  });

  // Add all files to the panel at once (more efficient)
  eqFilesPanelContent.appendChild(fragment);
}

/**
 * Handle the request to get maintenance information
 */
async function handleSendMaintenanceRequest() {
  // Get form values
  const name = equipmentNameInput?.value?.trim();
  const brand = equipmentBrandInput?.value?.trim();
  const model = equipmentModelInput?.value?.trim();
  const question = equipmentQuestionInput?.value?.trim() ||
    `Genera el protocolo de mantenimiento ${selectedMaintenanceType}.`;

  // Validate required fields
  if (!name || !brand || !model || !selectedMaintenanceType) {
    showEqError('Por favor, complete todos los campos del equipo y seleccione un tipo de mantenimiento.');
    return;
  }

  console.log("Obteniendo información de mantenimiento específica...");

  // Store details for potential regeneration
  lastEqPromptDetails = {
    name,
    brand,
    model,
    type: selectedMaintenanceType,
    question
  };

  // Fetch and display maintenance information
  await fetchAndDisplayMaintenanceInfo(lastEqPromptDetails);
}

/**
 * Fetch and display maintenance information for a specific equipment
 * @param {Object} details - Equipment details including name, brand, model, type and question
 */
async function fetchAndDisplayMaintenanceInfo(details) {
  // Update UI state
  if (equipmentLoading) equipmentLoading.style.display = 'block';
  if (equipmentError) equipmentError.style.display = 'none';
  if (equipmentResponseDisplay) equipmentResponseDisplay.innerHTML = '';
  if (eqRegenerateButton) eqRegenerateButton.disabled = true;

  try {
    // Prepare search query based on equipment details
    const searchQuery = `${details.brand} ${details.name} ${details.model} mantenimiento ${details.type}`;

    // Perform web search if enabled
    let searchContext = "";
    let webReferences = [];

    if (eqUseWebSearch) {
      console.log("Web search enabled for maintenance...");
      const searchResults = await performWebSearch(searchQuery, 5);
      searchContext = searchResults.searchContext;
      webReferences = searchResults.references;
    }

    // Prepare prompt and files
    const prompt = buildEqPrompt(details, searchContext || null);
    const filesToProcess = eqUploadedFilesData.map(f => f.fileObject);

    // Call API
    const response = await ApiServices.callGeminiAPI(
      prompt,
      filesToProcess,
      eqUseWebSearch,
      searchContext || null
    );

    // Display response
    if (equipmentResponseDisplay) {
      equipmentResponseDisplay.innerHTML = formatMarkdownToHtml(response.text);
      equipmentResponseDisplay.style.display = 'block';

      // Use requestAnimationFrame for smooth fade-in
      requestAnimationFrame(() => {
        equipmentResponseDisplay.style.opacity = '1';
      });
    }

    // Process and display references
    const uniqueReferences = processReferences(response.references, webReferences);

    // Update references panel
    const referencesPanel = document.getElementById('eq-references-panel-content');
    if (referencesPanel) {
      ApiServices.updateReferencesPanel(uniqueReferences, referencesPanel);

      // Show references panel if not already visible and has references
      if (uniqueReferences.length > 0 &&
        eqShowReferencesBtn &&
        eqReferencesSidebar &&
        !eqReferencesSidebar.classList.contains('active')) {
        eqShowReferencesBtn.click();
      }
    }

    // Re-enable regenerate button
    if (eqRegenerateButton) eqRegenerateButton.disabled = false;

  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    showEqError(`Error al obtener la información: ${error.message}`);
    if (eqRegenerateButton) eqRegenerateButton.disabled = true;
  } finally {
    // Hide loading indicator
    if (equipmentLoading) equipmentLoading.style.display = 'none';
  }
}

// Added searchResultsContext parameter
function buildEqPrompt(details, searchResultsContext = null) {
  let systemPrompt = `Eres un asistente experto en mantenimiento de equipos biomédicos. Genera un protocolo de mantenimiento **${details.type}** detallado y específico para el equipo: **${details.brand} ${details.name} (Modelo: ${details.model})**.
  **Instrucciones:**
  - Enfócate **exclusivamente** en el tipo de mantenimiento solicitado (${details.type}).
  - Proporciona pasos claros, concisos y accionables en formato Markdown (listas numeradas o con viñetas).
  - Incluye recomendaciones de seguridad específicas.
  - Menciona herramientas/materiales necesarios.
  - Si se proporciona contexto de archivos, utilízalo. Si se activa la búsqueda web (grounding) O se proporciona contexto de búsqueda, prioriza esa información y cita las fuentes si usa grounding.
  - **Importante:** Siempre incluye una advertencia final sobre verificar con manuales oficiales y la necesidad de personal calificado.`;

  // Prepend search context if available
  if (searchResultsContext) {
    systemPrompt += `\n\n${searchResultsContext}`;
  }

  // Add tone/length context
  if (eqCurrentTone && eqCurrentTone !== 'neutral') systemPrompt += `\n- **Tono:** ${eqCurrentTone}.`;
  if (eqCurrentLength && eqCurrentLength !== 'media') systemPrompt += `\n- **Longitud:** ${eqCurrentLength}.`;

  const userMessage = details.question || `Protocolo de mantenimiento ${details.type} para ${details.brand} ${details.name} ${details.model}.`;

  return { systemPrompt, userMessage };
}

function setupMaintenanceAIControls() {
  // Tone Buttons
  if (eqToneButtons) {
    // No aplicamos la clase 'active' al inicializar para que ningún botón aparezca seleccionado
    // pero mantenemos eqCurrentTone como 'neutral' para cuando se envíe una pregunta
    eqToneButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        eqCurrentTone = button.dataset.tone;
        eqToneButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        console.log("EQ Tono:", eqCurrentTone);
      });
    });
  }
  // Length Buttons
  if (eqLengthButtons) {
    // No aplicamos la clase 'active' al inicializar para que ningún botón aparezca seleccionado
    // pero mantenemos eqCurrentLength como 'media' para cuando se envíe una pregunta
    eqLengthButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        eqCurrentLength = button.dataset.length;
        eqLengthButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        console.log("EQ Longitud:", eqCurrentLength);
      });
    });
  }
  // Web Search Button
  if (eqWebSearchButton) {
    eqWebSearchButton.classList.toggle('active', eqUseWebSearch);
    eqWebSearchButton.addEventListener('click', () => {
      if (eqWebSearchButton.disabled) return;
      eqUseWebSearch = !eqUseWebSearch;
      eqWebSearchButton.classList.toggle('active', eqUseWebSearch);
      console.log("EQ Web Search:", eqUseWebSearch);
    });
  }
  // Regenerate Button
  if (eqRegenerateButton) {
    eqRegenerateButton.addEventListener('click', async () => {
      if (eqRegenerateButton.disabled || !lastEqPromptDetails) return;
      console.log("Regenerando información de mantenimiento específica...");
      await fetchAndDisplayMaintenanceInfo(lastEqPromptDetails);
    });
    eqRegenerateButton.disabled = true; // Start disabled
  }

  // Clear Button
  const eqClearButton = document.getElementById('eq-clear-button');
  if (eqClearButton) {
    eqClearButton.addEventListener('click', clearMaintenanceForm);
  }
}

/**
 * Clear the maintenance form and reset all fields and states
 */
function clearMaintenanceForm() {
  console.log("Limpiando formulario de mantenimiento");

  // Clear input fields
  if (equipmentNameInput) equipmentNameInput.value = '';
  if (equipmentBrandInput) equipmentBrandInput.value = '';
  if (equipmentModelInput) equipmentModelInput.value = '';
  if (equipmentQuestionInput) {
    equipmentQuestionInput.value = '';
    autoResizeTextarea(equipmentQuestionInput);
  }

  // Reset maintenance type selection
  if (maintenanceButtons) {
    maintenanceButtons.forEach(btn => btn.classList.remove('active'));
    selectedMaintenanceType = null;
  }

  // Clear response display
  if (equipmentResponseDisplay) {
    equipmentResponseDisplay.innerHTML = `
      <div class="empty-response">
        <i class="fas fa-clipboard"></i>
        <p>Complete los detalles del equipo, seleccione un tipo de mantenimiento y haga clic en el botón de enviar para generar recomendaciones.</p>
      </div>
    `;
    equipmentResponseDisplay.style.opacity = '1';
  }

  // Clear error message
  if (equipmentError) equipmentError.style.display = 'none';

  // Reset controls
  eqCurrentTone = 'neutral';
  eqCurrentLength = 'media';
  eqUseWebSearch = false;

  // Reset UI buttons
  if (eqToneButtons) eqToneButtons.forEach(btn => btn.classList.remove('active'));
  if (eqLengthButtons) eqLengthButtons.forEach(btn => btn.classList.remove('active'));
  if (eqWebSearchButton) eqWebSearchButton.classList.remove('active');
  if (eqRegenerateButton) eqRegenerateButton.disabled = true;

  // Clear files
  eqUploadedFilesData = [];
  updateEqFilesCount();
  updateEqFilesPanel();

  // Hide sidebars
  if (eqFilesSidebar) eqFilesSidebar.classList.remove('active');
  if (eqReferencesSidebar) eqReferencesSidebar.classList.remove('active');

  // Clear references
  ApiServices.updateReferencesPanel([], document.getElementById('eq-references-panel-content'));

  // Reset last prompt details
  lastEqPromptDetails = null;

  // Update UI state
  updateEquipmentUIState();
}

/**
 * Update the UI state of the equipment maintenance form
 * Enables/disables buttons based on form state
 */
function updateEquipmentUIState() {
  // Check if required fields are filled
  const name = equipmentNameInput?.value?.trim();
  const brand = equipmentBrandInput?.value?.trim();
  const model = equipmentModelInput?.value?.trim();
  const hasMaintenanceType = !!selectedMaintenanceType;

  // Enable/disable send button based on required fields
  const formIsValid = name && brand && model && hasMaintenanceType;
  if (sendEquipmentQuestionButton) {
    sendEquipmentQuestionButton.disabled = !formIsValid;
  }

  // Update UI hints
  if (maintenanceButtons) {
    const maintenanceTypeHint = document.getElementById('maintenance-type-hint');
    if (maintenanceTypeHint) {
      maintenanceTypeHint.style.display = hasMaintenanceType ? 'none' : 'block';
    }
  }
}

/**
 * Show an error message in the equipment section
 * @param {string} message - Error message to display
 */
function showEqError(message) {
  if (equipmentError) {
    equipmentError.textContent = message;
    equipmentError.style.display = 'block';
    // Use common function's timeout logic indirectly
    showGeneralError(message, equipmentError);
  }
}

/**
 * Handle printing of maintenance information
 */
function handlePrintMaintenanceInfo() {
  // Get equipment details
  const equipName = equipmentNameInput?.value || 'No especificado';
  const equipBrand = equipmentBrandInput?.value || 'No especificada';
  const equipModel = equipmentModelInput?.value || 'No especificado';
  const maintenanceType = selectedMaintenanceType
    ? selectedMaintenanceType.charAt(0).toUpperCase() + selectedMaintenanceType.slice(1)
    : 'No especificado';
  const responseContent = equipmentResponseDisplay?.innerHTML || '<p>No hay información para imprimir.</p>';

  // Open a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir.');
    return;
  }

  // Create print content with styles
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString();
  const timeString = currentDate.toLocaleString();

  // Create HTML content using DOM methods instead of document.write
  printWindow.document.open();

  // Create DOCTYPE
  const docType = document.implementation.createDocumentType('html', '', '');
  printWindow.document.appendChild(docType);

  // Create HTML structure
  const htmlElement = printWindow.document.createElement('html');

  // Create head
  const head = printWindow.document.createElement('head');
  const title = printWindow.document.createElement('title');
  title.textContent = 'BIAmedical - Mantenimiento';

  const style = printWindow.document.createElement('style');
  style.textContent = `
    body { font-family: sans-serif; line-height: 1.5; padding: 20px; }
    .header, .equipment-details, .maintenance-info, .footer { margin-bottom: 15px; }
    .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    h1, h2 { color: #007bff; }
    strong { font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { font-family: monospace; background-color: #eee; padding: 2px 4px; border-radius: 3px; }
    blockquote { border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0; color: #555; }
  `;

  head.appendChild(title);
  head.appendChild(style);
  htmlElement.appendChild(head);

  // Create body
  const body = printWindow.document.createElement('body');

  // Header section
  const header = printWindow.document.createElement('div');
  header.className = 'header';
  const h1 = printWindow.document.createElement('h1');
  h1.textContent = 'BIAmedical - Mantenimiento';
  const dateP = printWindow.document.createElement('p');
  dateP.textContent = `Fecha: ${dateString}`;
  header.appendChild(h1);
  header.appendChild(dateP);

  // Equipment details section
  const equipmentDetails = printWindow.document.createElement('div');
  equipmentDetails.className = 'equipment-details';
  const h2Details = printWindow.document.createElement('h2');
  h2Details.textContent = 'Detalles del Equipo';
  equipmentDetails.appendChild(h2Details);

  // Add equipment info
  const details = [
    { label: 'Nombre', value: equipName },
    { label: 'Marca', value: equipBrand },
    { label: 'Modelo', value: equipModel },
    { label: 'Tipo Mantenimiento', value: maintenanceType }
  ];

  details.forEach(detail => {
    const p = printWindow.document.createElement('p');
    const strong = printWindow.document.createElement('strong');
    strong.textContent = `${detail.label}:`;
    p.appendChild(strong);
    p.appendChild(printWindow.document.createTextNode(` ${detail.value}`));
    equipmentDetails.appendChild(p);
  });

  // Maintenance info section
  const maintenanceInfo = printWindow.document.createElement('div');
  maintenanceInfo.className = 'maintenance-info';
  const h2Info = printWindow.document.createElement('h2');
  h2Info.textContent = 'Información Generada';
  maintenanceInfo.appendChild(h2Info);

  // Add response content (using innerHTML for the formatted content)
  const contentDiv = printWindow.document.createElement('div');
  contentDiv.innerHTML = responseContent;
  maintenanceInfo.appendChild(contentDiv);

  // Footer section
  const footer = printWindow.document.createElement('div');
  footer.className = 'footer';
  const footerP = printWindow.document.createElement('p');
  footerP.style.fontSize = '0.8em';
  footerP.style.color = '#666';
  footerP.textContent = `Generado por BIAmedical Assistant - ${timeString}`;
  footer.appendChild(footerP);

  // Assemble body
  body.appendChild(header);
  body.appendChild(equipmentDetails);
  body.appendChild(maintenanceInfo);
  body.appendChild(footer);
  htmlElement.appendChild(body);

  // Add to document
  printWindow.document.appendChild(htmlElement);
  printWindow.document.close();

  // Print after content is loaded
  printWindow.onload = function () {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}




let currentSection = 'splash-section';
const pageSections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.sidebar-nav-button[data-target-section]');

/**
 * Show a specific section and hide others
 * @param {string} sectionId - ID of the section to show
 * @param {boolean} skipHistory - Whether to skip adding to browser history
 */
function showSection(sectionId, skipHistory = false) {
  console.log(`Showing section: ${sectionId}`);

  // Find and show the requested section, hide others
  let sectionFound = false;
  pageSections.forEach(section => {
    const isTargetSection = section.id === sectionId;
    section.style.display = isTargetSection ? 'block' : 'none';
    if (isTargetSection) {
      sectionFound = true;
      currentSection = sectionId;
    }
  });

  // Fallback to splash if section not found
  if (!sectionFound) {
    console.warn(`Section with ID ${sectionId} not found. Showing splash.`);
    showSection('splash-section', true); // Show splash as fallback, skip history
    return;
  }

  // Update active link in sidebar
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.targetSection === sectionId);
  });

  // Update browser history if needed
  if (!skipHistory) {
    history.replaceState({ section: sectionId }, '', `#${sectionId}`);
  }

  // Initialize section-specific functionality
  const sectionInitializers = {
    'asistente-section': initializeAssistantPage,
    'mantenimiento-section': initializeMaintenancePage,
    'tips-section': initializeTipsPage
  };

  if (sectionInitializers[sectionId]) {
    sectionInitializers[sectionId]();
  }

  // Handle sidebar on small screens
  const mainSidebar = document.getElementById('main-sidebar');
  const body = document.body;
  const SMALL_SCREEN_BREAKPOINT = 768;

  if (window.innerWidth <= SMALL_SCREEN_BREAKPOINT &&
    mainSidebar &&
    !mainSidebar.classList.contains('collapsed')) {
    mainSidebar.classList.add('collapsed');
    body.classList.remove('sidebar-open');
  }
}


window.showSection = showSection;


window.addEventListener('popstate', (event) => {
  if (event.state && event.state.section) {
    showSection(event.state.section, true); // Show section without adding new history entry
  } else {

    const hash = window.location.hash.substring(1);
    if (hash) {
      showSection(hash, true);
    } else {
      showSection('splash-section', true);
    }
  }
});


document.addEventListener('DOMContentLoaded', () => {
  initializeCommonComponents();
  initializeThemeToggle();
  initializeSidebar();


  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSectionId = link.dataset.targetSection;
      if (targetSectionId) {
        showSection(targetSectionId);
      }
    });
  });


  const initialHash = window.location.hash.substring(1);
  const validSections = Array.from(pageSections).map(s => s.id);
  const initialSectionId = validSections.includes(initialHash) ? initialHash : 'splash-section';

  showSection(initialSectionId, true);
});
