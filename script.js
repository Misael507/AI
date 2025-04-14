const GOOGLE_API_KEY = 'AIzaSyB0089qQN6JEg_RJsS_hi0MjEZgnxCrh5o';
const GOOGLE_CSE_ID = '933054f4e5ea543ab';
const TAVILY_API_KEY = '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';

window.AppConfig = {
  GOOGLE_API_KEY,
  GOOGLE_CSE_ID,
  TAVILY_API_KEY
};


function checkApiKey() {
  return window.AppConfig?.GOOGLE_API_KEY && window.AppConfig.GOOGLE_API_KEY !== "TU_API_KEY_DE_GOOGLE_GEMINI";
}


function applyDarkMode(isDark) {
  const body = document.body;
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  if (isDark) {
    body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    body.classList.remove('dark-mode');
    if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
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
      let htmlContent = md.render(text);


      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const tables = tempDiv.querySelectorAll('table');
      tables.forEach(table => {

        if (!table.parentElement || !table.parentElement.classList.contains('table-wrapper')) {
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
    const escapedText = text.replace(/</g, "<").replace(/>/g, ">");
    return escapedText.replace(/\n/g, '<br>');
  }
}



function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';

  setTimeout(() => {
    if (textarea) {
      textarea.style.height = (textarea.scrollHeight) + 'px';
    }
  }, 0);
}


function showGeneralError(message, targetElement) {
  if (!targetElement) return;

  targetElement.textContent = message;
  targetElement.style.display = 'block';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targetElement.style.opacity = '1';
    });
  });


  if (!message || !message.toLowerCase().includes("api key")) {
    setTimeout(() => {
      if (targetElement) {
        targetElement.style.opacity = '0';
        setTimeout(() => {
          if (targetElement) targetElement.style.display = 'none';
        }, 300);
      }
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


  applyInitialTheme();


  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('dark-mode');
      const newIsDark = !isCurrentlyDark;
      applyDarkMode(newIsDark);
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    });
  }


  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyDarkMode(e.matches);
    }
  });
}




window.SearchServices = (function () {

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
      if (data.results && data.results.length > 0) {
        return data.results.map(result => ({
          title: result.title,
          url: result.url,
          content: result.content
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error en búsqueda con Tavily:", error);
      return [];
    }
  }


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
      if (data.items && data.items.length > 0) {
        return data.items.map(item => ({
          title: item.title,
          url: item.link,
          content: item.snippet
        }));
      } else {
        return [];
      }
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
          let base64String = '';
          let mimeTypePart = file.type; // Use original file type

          if (typeof dataUrl === 'string' && dataUrl.includes('base64,')) {
            const parts = dataUrl.split('base64,');
            base64String = parts[1];

          } else {

            console.warn(`Unexpected data URL format for file ${file.name}. Trying ArrayBuffer fallback.`);

            reject(new Error("Invalid data URL format"));
            return;
          }

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



  function processGroundingCitations(citations) {
    if (!citations) return [];
    const webReferences = citations.map(citation => ({
      title: citation.title || "Fuente Web",
      url: citation.uri,
      snippet: `Fuente citada por el modelo`,
      source: "web"
    }));

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


  async function callGeminiAPI(prompt, files = [], useSearch = true, searchResultsContext = null) {
    if (!window.AppConfig?.GOOGLE_API_KEY) {
      throw new Error("Clave API de Google no configurada.");
    }
    try {
      console.log("Llamando a la API de Gemini...");
      const hasFiles = files && files.length > 0;
      const modelName = hasFiles ? 'gemini-2.0-flash-thinking-exp-01-21' : 'gemini-2.0-flash';
      console.log(`Using model: ${modelName}, Google Grounding: ${useSearch && !searchResultsContext}, Manual Search Context: ${!!searchResultsContext}`);

      let fileProcessingReferences = [];
      let filesTextContext = "";
      const fileDataParts = [];

      if (hasFiles) {
        console.log(`Procesando ${files.length} archivos...`);
        const maxFiles = 10;
        const limitedFiles = files.slice(0, maxFiles);

        for (const file of limitedFiles) {
          try {
            // Prepare for multimodal if model supports it
            if (modelName === 'gemini-1.5-pro-preview-03-25') { // Check against the correct model
              try {
                const fileInfoForMultimodal = await FileServices.readFileContent(file);
                if (fileInfoForMultimodal?.mimeType && fileInfoForMultimodal?.data) {
                  fileDataParts.push({ inlineData: { mimeType: fileInfoForMultimodal.mimeType, data: fileInfoForMultimodal.data } });
                  fileProcessingReferences.push({ title: file.name, snippet: `[Archivo: ${file.name}]`, source: "file" });
                }
              } catch (readError) {
                console.error(`Error leyendo ${file.name} para multimodal:`, readError);
                fileProcessingReferences.push({ title: file.name, snippet: `[Error al leer archivo: ${readError.message}]`, source: "error" });
              }
            }


            let textContent = "";
            const isText = file.type === "text/plain" || file.name.endsWith(".txt");
            const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
            const isWord = file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc');

            if (isText) {
              textContent = await file.text();
            } else if (isPdf && window.pdfjsLib) {

              try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let pdfText = "";
                for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { // Limit pages
                  const page = await pdf.getPage(i);
                  const content = await page.getTextContent();
                  pdfText += content.items.map(item => item.str).join(" ") + "\n";
                }
                textContent = pdfText || "[PDF] No se pudo extraer texto.";
                if (pdf.numPages > 20) textContent += "\n...[contenido truncado]";
              } catch (pdfError) { console.error("Error pdf.js:", pdfError); textContent = "[PDF] Error extracción."; }
            } else if (isWord && window.mammoth) {

              try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await window.mammoth.extractRawText({ arrayBuffer });
                textContent = result.value || "[Word] No se pudo extraer texto.";
              } catch (mammothError) { console.error("Error mammoth.js:", mammothError); textContent = "[Word] Error extracción."; }
            }

            if (textContent.trim()) {
              const maxTextLength = 1000000;
              if (textContent.length > maxTextLength) {
                textContent = textContent.substring(0, maxTextLength) + "\n...[contenido de texto truncado]";
              }
              filesTextContext += `\n\n[Contexto de archivo "${file.name}"]\n${textContent}\n`;

              if (!fileProcessingReferences.some(ref => ref.title === file.name)) {
                fileProcessingReferences.push({ title: file.name, snippet: `[Archivo procesado como texto]`, source: "file" });
              }
            }
          } catch (fileError) {
            console.error(`Error procesando archivo ${file.name}:`, fileError);
            fileProcessingReferences.push({ title: file.name, snippet: `[Error al procesar archivo]`, source: "error" });
          }
        }
        if (files.length > maxFiles) console.warn(`Se limitó el procesamiento a ${maxFiles} archivos.`);
      }


      const systemPrompt = typeof prompt.systemPrompt === 'string' ? prompt.systemPrompt : '';
      const userMessage = typeof prompt.userMessage === 'string' ? prompt.userMessage : '';
      if (!systemPrompt || !userMessage) throw new Error("Prompt inválido.");


      let finalPromptText = systemPrompt;
      if (filesTextContext) {
        finalPromptText += `\n\n${filesTextContext}`;
      }
      finalPromptText += `\n\n${userMessage}`;


      const contents = [{ role: "user", parts: [{ text: finalPromptText }, ...fileDataParts] }];
      const requestBody = {
        contents,
        generationConfig: { temperature: 0.7, topK: 32, topP: 0.8, maxOutputTokens: 8192, candidateCount: 1 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      };


      if (useSearch && !searchResultsContext) {
        console.log("Habilitando Google Search Grounding (no manual context provided)...");
        requestBody.tools = [{ "googleSearchRetrieval": {} }];
      } else if (searchResultsContext) {
        console.log("Manual search context provided, skipping Google Search Grounding tool.");
      }


      console.log("Enviando request a Gemini API...");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${AppConfig.GOOGLE_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
      );


      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error detallado de la API de Gemini:", errorData);
        throw new Error(`Error de la API (${response.status}): ${errorData.error?.message || 'Desconocido'}`);
      }
      const data = await response.json();
      console.log("Respuesta de Gemini recibida.");


      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text && !candidate?.citationMetadata?.citations?.length > 0) {
        console.error("Respuesta inválida de la API:", data);
        const blockReason = data.promptFeedback?.blockReason;
        throw new Error(blockReason ? `Solicitud bloqueada: ${blockReason}` : "Formato de respuesta inválido");
      }

      let responseText = candidate.content.parts[0].text || "";
      let groundedReferences = [];

      if (candidate.citationMetadata?.citations?.length > 0) {
        console.log("Procesando referencias de grounding...");
        groundedReferences = processGroundingCitations(candidate.citationMetadata.citations);
        if (!responseText) {
          responseText = "Se encontraron fuentes relevantes, pero no se pudo generar un resumen directo. Consulta las referencias.";
        }
      }


      const finalReferences = [...fileProcessingReferences, ...groundedReferences];

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


  function updateReferencesPanel(references, panelElement) {
    if (!panelElement) return;
    panelElement.innerHTML = ''; // Clear panel

    if (!references || references.length === 0) {
      panelElement.innerHTML = '<div class="empty-state">No hay referencias disponibles</div>';
      return;
    }

    const orderedList = document.createElement('ol');
    orderedList.className = 'references-list';

    references.forEach((reference) => {
      const listItem = document.createElement('li');
      listItem.className = 'reference-item'; // Use li as the item container

      let iconClass = 'fa-file-alt'; // Default
      let domainName = '';
      let sourcePrefix = ''; // To indicate search source

      // Determine icon and prefix based on source
      if (reference.source === 'file') {
        iconClass = 'fa-file-alt'; // Or more specific based on type if needed
      } else if (reference.source === 'error') {
        iconClass = 'fa-exclamation-triangle';
      } else if (reference.source === 'google-cse') {
        iconClass = 'fab fa-google'; // Google icon
        sourcePrefix = '[Google] ';
        try { domainName = reference.url ? new URL(reference.url).hostname.replace(/^www\./, '') : 'Fuente web'; } catch (e) { domainName = reference.url || 'Fuente web'; }
      } else if (reference.source === 'tavily') {
        iconClass = 'fa-search'; // Tavily/Search icon
        sourcePrefix = '[Tavily] ';
        try { domainName = reference.url ? new URL(reference.url).hostname.replace(/^www\./, '') : 'Fuente web'; } catch (e) { domainName = reference.url || 'Fuente web'; }
      } else if (reference.source === 'web') { // Gemini grounding source
        iconClass = 'fa-globe';
        sourcePrefix = '[Gemini Web] ';
        try { domainName = reference.url ? new URL(reference.url).hostname.replace(/^www\./, '') : 'Fuente web'; } catch (e) { domainName = reference.url || 'Fuente web'; }
      }


      // Use innerHTML on a content div inside the li for easier styling/structure
      listItem.innerHTML = `
        <div class="reference-content">
          <div class="reference-title">
            <i class="fas ${iconClass}"></i> <!-- Use determined icon -->
            ${reference.url ?
          `<a href="${reference.url}" target="_blank" rel="noopener noreferrer">${sourcePrefix}${reference.title || 'Fuente Web'}</a>` :
          `<span>${sourcePrefix}${reference.title || 'Referencia'}</span>`
        }
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



function handleAssistantFileUpload(event) {
  const files = event.target.files;
  if (files.length > 0) {
    console.log(`${files.length} archivos seleccionados para Asistente`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Prevent duplicates
      if (!uploadedFilesData.some(f => f.name === file.name && f.size === file.size)) {
        uploadedFilesData.push({
          id: Date.now() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          fileObject: file
        });
      }
    }
    updateAssistantFilesCount();
    updateAssistantFilesPanel();
    if (filesSidebar) filesSidebar.classList.add('active'); // Show sidebar
    fileInput.value = ''; // Clear input
  }
}

function updateAssistantFilesCount() {
  if (filesCount) {
    const count = uploadedFilesData.length;
    filesCount.textContent = count;
    filesCount.style.display = count > 0 ? 'flex' : 'none';
  }
}

function updateAssistantFilesPanel() {
  if (!filesPanelContent) return;
  filesPanelContent.innerHTML = ''; // Clear panel

  if (uploadedFilesData.length === 0) {
    filesPanelContent.innerHTML = '<div class="empty-state">No hay archivos subidos</div>';
    return;
  }

  uploadedFilesData.forEach(fileData => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    let iconClass = 'fa-file'; // Default icon
    if (fileData.type.includes('pdf')) iconClass = 'fa-file-pdf';
    else if (fileData.type.includes('word')) iconClass = 'fa-file-word';
    else if (fileData.type.includes('text')) iconClass = 'fa-file-alt';
    else if (fileData.type.includes('image')) iconClass = 'fa-file-image'; // Add image icon
    // Add other icons as needed

    fileItem.innerHTML = `
      <div class="file-info">
        <i class="fas ${iconClass} file-icon"></i>
        <span class="file-name" title="${fileData.name}">${fileData.name}</span>
      </div>
      <div class="file-actions">
        <button class="file-action-btn delete" data-file-id="${fileData.id}" title="Eliminar archivo">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    // Add delete listener
    fileItem.querySelector('.delete').addEventListener('click', (e) => {
      const idToRemove = parseInt(e.currentTarget.dataset.fileId);
      uploadedFilesData = uploadedFilesData.filter(f => f.id !== idToRemove);
      updateAssistantFilesCount();
      updateAssistantFilesPanel();
    });
    filesPanelContent.appendChild(fileItem);
  });
}

// Display message in chat (uses common formatMarkdownToHtml)
// Added isHTML flag
function displayMessage(_, text, isUserMessage = false, isHTML = false) {
  if (!chatMessages) return;
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUserMessage ? 'user-turn' : 'assistant-turn');

  const senderSpan = document.createElement('span');
  senderSpan.classList.add('sender');
  senderSpan.innerHTML = isUserMessage ? `<i class="fas fa-user"></i> Usuario` : `<i class="fas fa-robot"></i> Asistente`;

  const responseSpan = document.createElement('div');
  responseSpan.classList.add('response');
  if (isUserMessage) {
    responseSpan.classList.add('user');
    responseSpan.textContent = text; // Use textContent for user messages
  } else {
    if (isHTML) {
      responseSpan.innerHTML = text; // Directly set HTML if flagged
    } else {
      responseSpan.innerHTML = formatMarkdownToHtml(text); // Use synchronous formatter
    }
  }

  messageDiv.appendChild(senderSpan);
  messageDiv.appendChild(responseSpan);
  chatMessages.appendChild(messageDiv);
  // Scroll smoothly to the bottom
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

// Send message logic
async function sendMessage() {
  if (!questionInput || !questionInput.value.trim()) return;
  const userMessage = questionInput.value.trim();
  lastQuestionText = userMessage; // Store for potential regeneration
  console.log("Enviando mensaje:", userMessage);
  displayMessage('Usuario', userMessage, true);
  questionInput.value = '';
  autoResizeTextarea(questionInput);
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessageDisplay) errorMessageDisplay.style.display = 'none'; // Hide previous errors
  if (regenerateButton) regenerateButton.disabled = true; // Disable regenerate during request

  try {
    let searchContext = ""; // Initialize as empty string
    let collectedWebReferences = [];
    const seenUrls = new Set();

    if (useWebSearch) {
      console.log("Web search enabled, fetching Google CSE and Tavily results...");
      try {
        // Fetch both concurrently
        const [googleResults, tavilyResults] = await Promise.all([
          SearchServices.searchWithGoogleCSE(userMessage, 5).catch(e => { console.error("Google CSE Search failed:", e); return []; }), // Limit to 5, handle errors
          SearchServices.searchWithTavily(userMessage, 5).catch(e => { console.error("Tavily Search failed:", e); return []; })      // Limit to 5, handle errors
        ]);

        let contextParts = [];

        // Process Google CSE results first
        if (googleResults && googleResults.length > 0) {
          googleResults.forEach((res, index) => {
            if (res.url && !seenUrls.has(res.url)) {
              contextParts.push(`[Google ${index + 1}] ${res.title}: ${res.content || 'N/A'}`);
              collectedWebReferences.push({ title: res.title, url: res.url, snippet: res.content, source: 'google-cse' });
              seenUrls.add(res.url);
            }
          });
        }

        // Process Tavily results next, adding only new ones
        if (tavilyResults && tavilyResults.length > 0) {
          tavilyResults.forEach((res, index) => {
            if (res.url && !seenUrls.has(res.url)) {
              contextParts.push(`[Tavily ${index + 1}] ${res.title}: ${res.content || 'N/A'}`);
              collectedWebReferences.push({ title: res.title, url: res.url, snippet: res.content, source: 'tavily' });
              seenUrls.add(res.url);
            }
          });
        }

        if (contextParts.length > 0) {
          searchContext = "Contexto de Búsqueda Web:\n" + contextParts.join('\n');
          console.log("Contexto de búsqueda web combinado preparado.");
        } else {
          console.log("No se encontraron resultados de búsqueda web relevantes de Google CSE o Tavily.");
        }

      } catch (searchError) {
        console.error("Error durante la búsqueda web:", searchError);
        // Proceed without search context
      }
    }

    const prompt = buildAssistantPrompt(userMessage, searchContext || null); // Pass context or null
    const filesToProcess = uploadedFilesData.map(f => f.fileObject);
    // Pass searchContext to disable grounding if context exists
    const response = await ApiServices.callGeminiAPI(prompt, filesToProcess, useWebSearch, searchContext || null);

    displayMessage('Asistente', response.text);

    // Combine references: file processing refs + web refs + grounding refs (if any)
    const allReferences = [...(response.references || []), ...collectedWebReferences];
    const uniqueReferences = [];
    const finalSeenUrls = new Set();

    allReferences.forEach(ref => {
      // Prioritize non-web references or references with URLs
      if (ref.source === 'file' || ref.source === 'error' || (ref.url && !finalSeenUrls.has(ref.url))) {
        uniqueReferences.push(ref);
        if (ref.url) {
          finalSeenUrls.add(ref.url);
        }
      } else if (!ref.url && !uniqueReferences.some(uRef => uRef.title === ref.title && uRef.snippet === ref.snippet)) {
        // Add references without URL only if title/snippet combo is unique
        uniqueReferences.push(ref);
      }
    });


    // Update and show references panel
    if (uniqueReferences.length > 0) {
      ApiServices.updateReferencesPanel(uniqueReferences, referencesPanelContent);
      if (showReferencesBtn && referencesSidebar && !referencesSidebar.classList.contains('active')) {
        showReferencesBtn.click();
      }
    } else {
      ApiServices.updateReferencesPanel([], referencesPanelContent); // Clear panel if no refs found
    }

    if (regenerateButton) regenerateButton.disabled = false; // Re-enable regenerate

  } catch (error) {
    console.error('Error al obtener respuesta:', error);
    showGeneralError(`Error al obtener respuesta: ${error.message}`, errorMessageDisplay); // Use common error display
    // Display fallback response
    const fallbackResponse = generateFallbackResponse(userMessage);
    displayMessage('Asistente', fallbackResponse);
    if (regenerateButton) regenerateButton.disabled = true; // Keep disabled on error
  } finally {
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
      if (regenerateButton.disabled || !lastQuestionText) return;
      console.log("Regenerando respuesta para:", lastQuestionText);
      // Re-send the last message (don't display user message again)
      if (loadingIndicator) loadingIndicator.style.display = 'block';
      if (errorMessageDisplay) errorMessageDisplay.style.display = 'none';
      regenerateButton.disabled = true;
      try {
        const prompt = buildAssistantPrompt(lastQuestionText);
        const filesToProcess = uploadedFilesData.map(f => f.fileObject);
        const response = await ApiServices.callGeminiAPI(prompt, filesToProcess, useWebSearch);
        displayMessage('Asistente', response.text);
        if (response.references && response.references.length > 0) {
          ApiServices.updateReferencesPanel(response.references, referencesPanelContent);
          if (showReferencesBtn && referencesSidebar && !referencesSidebar.classList.contains('active')) {
            showReferencesBtn.click();
          }
        } else {
          ApiServices.updateReferencesPanel([], referencesPanelContent);
        }
        regenerateButton.disabled = false;
      } catch (error) {
        console.error('Error al regenerar respuesta:', error);
        showGeneralError(`Error al regenerar: ${error.message}`, errorMessageDisplay);
        regenerateButton.disabled = true;
      } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
      }
    });
    regenerateButton.disabled = true; // Start disabled
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

// Function to fetch and display a new tip using the API
async function fetchAndDisplayNewTip() {
  if (maintenanceTipsLoading) maintenanceTipsLoading.style.display = 'block';
  if (maintenanceTipsError) maintenanceTipsError.style.display = 'none';
  if (maintenanceTipsContent) maintenanceTipsContent.innerHTML = ''; // Clear previous tip
  if (regenerateTipButton) regenerateTipButton.disabled = true; // Disable button during fetch

  try {
    const prompt = buildTipPrompt();
    // Use the faster flash model for tips, no files, no web search needed
    const response = await ApiServices.callGeminiAPI(prompt, [], false); // Use false for useSearch

    // Basic parsing assuming the format "**Title**\nContent..."
    const lines = response.text.split('\n');
    let title = `Tip de Mantenimiento`; // Default title
    let content = response.text; // Default content

    if (lines.length > 0 && lines[0].startsWith('**') && lines[0].endsWith('**')) {
      title = lines[0].substring(2, lines[0].length - 2).trim(); // Extract title
      content = lines.slice(1).join('\n').trim(); // Get the rest as content
    }

    displayMaintenanceTip({ title: title, content: content });

  } catch (error) {
    console.error('Error fetching maintenance tip:', error);
    if (maintenanceTipsError) {
      showGeneralError(`Error al generar el tip: ${error.message}`, maintenanceTipsError); // Use common error display
    }
    if (maintenanceTipsContent) {
      maintenanceTipsContent.innerHTML = '<p>No se pudo generar un nuevo tip en este momento.</p>';
    }
  } finally {
    if (maintenanceTipsLoading) maintenanceTipsLoading.style.display = 'none';
    if (regenerateTipButton) regenerateTipButton.disabled = false; // Re-enable button
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

function handleMaintenanceFileUpload(event) {
  const files = event.target.files;
  if (files.length > 0) {
    console.log(`${files.length} archivos seleccionados para Mantenimiento`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Prevent duplicates
      if (!eqUploadedFilesData.some(f => f.name === file.name && f.size === file.size)) {
        eqUploadedFilesData.push({
          id: Date.now() + i, name: file.name, size: file.size, type: file.type, fileObject: file
        });
      }
    }
    updateEqFilesCount();
    updateEqFilesPanel();
    if (eqFilesSidebar) eqFilesSidebar.classList.add('active');
    eqFileInput.value = ''; // Clear input
  }
}

function updateEqFilesCount() {
  if (eqFilesCount) {
    const count = eqUploadedFilesData.length;
    eqFilesCount.textContent = count;
    eqFilesCount.style.display = count > 0 ? 'flex' : 'none';
  }
}

function updateEqFilesPanel() {
  if (!eqFilesPanelContent) return;
  eqFilesPanelContent.innerHTML = ''; // Clear panel
  if (eqUploadedFilesData.length === 0) {
    eqFilesPanelContent.innerHTML = '<div class="empty-state">No hay archivos subidos</div>';
    return;
  }
  eqUploadedFilesData.forEach(fileData => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    let iconClass = 'fa-file';
    if (fileData.type.includes('pdf')) iconClass = 'fa-file-pdf';
    else if (fileData.type.includes('word')) iconClass = 'fa-file-word';
    else if (fileData.type.includes('text')) iconClass = 'fa-file-alt';
    else if (fileData.type.includes('image')) iconClass = 'fa-file-image';
    // Add other icons as needed

    fileItem.innerHTML = `
      <div class="file-info">
        <i class="fas ${iconClass} file-icon"></i>
        <span class="file-name" title="${fileData.name}">${fileData.name}</span>
      </div>
      <div class="file-actions">
        <button class="file-action-btn delete" data-file-id="${fileData.id}" title="Eliminar archivo">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    fileItem.querySelector('.delete').addEventListener('click', (e) => {
      const idToRemove = parseInt(e.currentTarget.dataset.fileId);
      eqUploadedFilesData = eqUploadedFilesData.filter(f => f.id !== idToRemove);
      updateEqFilesCount();
      updateEqFilesPanel();
    });
    eqFilesPanelContent.appendChild(fileItem);
  });
}

async function handleSendMaintenanceRequest() {
  const name = equipmentNameInput?.value?.trim();
  const brand = equipmentBrandInput?.value?.trim();
  const model = equipmentModelInput?.value?.trim();
  const question = equipmentQuestionInput?.value?.trim() || `Genera el protocolo de mantenimiento ${selectedMaintenanceType}.`;

  if (!name || !brand || !model || !selectedMaintenanceType) {
    showEqError('Por favor, complete todos los campos del equipo y seleccione un tipo de mantenimiento.');
    return;
  }
  console.log("Obteniendo información de mantenimiento específica...");
  lastEqPromptDetails = { name, brand, model, type: selectedMaintenanceType, question }; // Store for regenerate
  await fetchAndDisplayMaintenanceInfo(lastEqPromptDetails);
}

async function fetchAndDisplayMaintenanceInfo(details) {
  if (equipmentLoading) equipmentLoading.style.display = 'block';
  if (equipmentError) equipmentError.style.display = 'none';
  if (equipmentResponseDisplay) equipmentResponseDisplay.innerHTML = ''; // Clear previous response
  if (eqRegenerateButton) eqRegenerateButton.disabled = true; // Disable regenerate during request

  try {
    let searchContext = "";
    let collectedWebReferences = [];
    const seenUrls = new Set();
    const searchQuery = `${details.brand} ${details.name} ${details.model} mantenimiento ${details.type}`;

    if (eqUseWebSearch) {
      console.log("Web search enabled for maintenance, fetching Google CSE and Tavily results...");
      try {
        const [googleResults, tavilyResults] = await Promise.all([
          SearchServices.searchWithGoogleCSE(searchQuery, 5).catch(e => { console.error("Google CSE Search failed (maint):", e); return []; }),
          SearchServices.searchWithTavily(searchQuery, 5).catch(e => { console.error("Tavily Search failed (maint):", e); return []; })
        ]);

        let contextParts = [];

        // Process Google CSE results first
        if (googleResults && googleResults.length > 0) {
          googleResults.forEach((res, index) => {
            if (res.url && !seenUrls.has(res.url)) {
              contextParts.push(`[Google ${index + 1}] ${res.title}: ${res.content || 'N/A'}`);
              collectedWebReferences.push({ title: res.title, url: res.url, snippet: res.content, source: 'google-cse' });
              seenUrls.add(res.url);
            }
          });
        }

        // Process Tavily results next
        if (tavilyResults && tavilyResults.length > 0) {
          tavilyResults.forEach((res, index) => {
            if (res.url && !seenUrls.has(res.url)) {
              contextParts.push(`[Tavily ${index + 1}] ${res.title}: ${res.content || 'N/A'}`);
              collectedWebReferences.push({ title: res.title, url: res.url, snippet: res.content, source: 'tavily' });
              seenUrls.add(res.url);
            }
          });
        }

        if (contextParts.length > 0) {
          searchContext = "Contexto de Búsqueda Web:\n" + contextParts.join('\n');
          console.log("Contexto de búsqueda web (mantenimiento) combinado preparado.");
        } else {
          console.log("No se encontraron resultados de búsqueda web relevantes para mantenimiento.");
        }
      } catch (searchError) {
        console.error("Error durante la búsqueda web (mantenimiento):", searchError);
      }
    }

    const prompt = buildEqPrompt(details, searchContext || null); // Pass context or null
    const filesToProcess = eqUploadedFilesData.map(f => f.fileObject);
    const response = await ApiServices.callGeminiAPI(prompt, filesToProcess, eqUseWebSearch, searchContext || null); // Pass context

    if (equipmentResponseDisplay) {
      equipmentResponseDisplay.innerHTML = formatMarkdownToHtml(response.text); // Use common formatter
      equipmentResponseDisplay.style.display = 'block'; // Ensure display is block
      requestAnimationFrame(() => equipmentResponseDisplay.style.opacity = '1'); // Fade in
    }

    // Combine references
    const allReferences = [...(response.references || []), ...collectedWebReferences];
    const uniqueReferences = [];
    const finalSeenUrls = new Set();

    allReferences.forEach(ref => {
      if (ref.source === 'file' || ref.source === 'error' || (ref.url && !finalSeenUrls.has(ref.url))) {
        uniqueReferences.push(ref);
        if (ref.url) {
          finalSeenUrls.add(ref.url);
        }
      } else if (!ref.url && !uniqueReferences.some(uRef => uRef.title === ref.title && uRef.snippet === ref.snippet)) {
        uniqueReferences.push(ref);
      }
    });

    // Update references using the standard panel function
    const referencesPanel = document.getElementById('eq-references-panel-content'); // Get the correct panel
    if (referencesPanel) {
      ApiServices.updateReferencesPanel(uniqueReferences, referencesPanel);
      if (uniqueReferences.length > 0 && eqShowReferencesBtn && eqReferencesSidebar && !eqReferencesSidebar.classList.contains('active')) {
        eqShowReferencesBtn.click();
      }
    }

    if (eqRegenerateButton) eqRegenerateButton.disabled = false; // Re-enable regenerate

  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    showEqError(`Error al obtener la información: ${error.message}`);
    if (eqRegenerateButton) eqRegenerateButton.disabled = true;
  } finally {
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
}

function showEqError(message) {
  if (equipmentError) {
    equipmentError.textContent = message;
    equipmentError.style.display = 'block';
    // Use common function's timeout logic indirectly
    showGeneralError(message, equipmentError);
  }
}

function handlePrintMaintenanceInfo() {
  const equipName = equipmentNameInput?.value || 'No especificado';
  const equipBrand = equipmentBrandInput?.value || 'No especificada';
  const equipModel = equipmentModelInput?.value || 'No especificado';
  const maintenanceType = selectedMaintenanceType ? selectedMaintenanceType.charAt(0).toUpperCase() + selectedMaintenanceType.slice(1) : 'No especificado';
  const responseContent = equipmentResponseDisplay?.innerHTML || '<p>No hay información para imprimir.</p>';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir.');
    return;
  }

  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BIAmedical - Mantenimiento</title>
        <style>
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BIAmedical - Mantenimiento</h1>
          <p>Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="equipment-details">
          <h2>Detalles del Equipo</h2>
          <p><strong>Nombre:</strong> ${equipName}</p>
          <p><strong>Marca:</strong> ${equipBrand}</p>
          <p><strong>Modelo:</strong> ${equipModel}</p>
          <p><strong>Tipo Mantenimiento:</strong> ${maintenanceType}</p>
        </div>
        <div class="maintenance-info">
          <h2>Información Generada</h2>
          ${responseContent}
        </div>
        <div class="footer">
          <p style="font-size: 0.8em; color: #666;">Generado por BIAmedical Assistant - ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

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

function showSection(sectionId, skipHistory = false) {
  console.log(`Showing section: ${sectionId}`);
  let sectionFound = false;
  pageSections.forEach(section => {
    if (section.id === sectionId) {
      section.style.display = 'block';
      sectionFound = true;
      currentSection = sectionId;
    } else {
      section.style.display = 'none';
    }
  });

  if (!sectionFound) {
    console.warn(`Section with ID ${sectionId} not found. Showing splash.`);
    showSection('splash-section', true); // Show splash as fallback, skip history
    return;
  }

  // Update active link in sidebar
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.targetSection === sectionId);
  });

  if (!skipHistory) {
    history.replaceState({ section: sectionId }, '', `#${sectionId}`);
  }



  switch (sectionId) {
    case 'asistente-section':
      initializeAssistantPage();
      break;
    case 'mantenimiento-section':
      initializeMaintenancePage();
      break;
    case 'tips-section':
      initializeTipsPage();
      break;
    case 'splash-section':

      break;
  }


  const mainSidebar = document.getElementById('main-sidebar');
  const body = document.body;
  const SMALL_SCREEN_BREAKPOINT = 768;
  if (window.innerWidth <= SMALL_SCREEN_BREAKPOINT && mainSidebar && !mainSidebar.classList.contains('collapsed')) {
    mainSidebar.classList.add('collapsed');
    body.classList.remove('sidebar-open');
    if (typeof initializeSidebar === 'function') { }
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