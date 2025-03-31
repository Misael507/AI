// --- Constantes Globales ---
const API_KEY = 'AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI'; // ¡¡¡ IMPORTANTE: REEMPLAZAR CON TU API KEY REAL !!!
const API_KEY_WARNING = "TU_API_KEY_DE_GOOGLE_GEMINI"; // Referencia para la advertencia
const CHAT_MODEL_NAME = 'gemini-2.5-pro-exp-03-25'; // ACTUALIZADO: Usar el modelo más reciente
const FLASH_MODEL_NAME = 'gemini-2.0-flash'; // Modelo más rápido para tips y equipo específico

// URLs base (se completarán con modelo y key)
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Cargado. Inicializando aplicación completa...");

  // --- Elementos del DOM (Todas las secciones) ---
  // Chat
  const chatMessages = document.getElementById('chat-messages');
  const questionInput = document.getElementById('questionInput');
  const sendButton = document.getElementById('sendButton');
  const loadingIndicator = document.getElementById('loading');
  const errorMessageDisplay = document.getElementById('error-message'); // Error general chat
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const fileList = document.getElementById('file-list');
  const chatControls = document.querySelector('.chat-controls');
  const toneButtons = chatControls?.querySelectorAll('[data-tone]');
  const lengthButtons = chatControls?.querySelectorAll('[data-length]');
  const webSearchButton = document.getElementById('toggle-web-search-button');
  const regenerateButton = document.getElementById('regenerate-button');
  const clearChatButton = document.getElementById('clear-chat-button');

  // Tips
  const maintenanceTipsSection = document.getElementById('maintenance-tips-section');
  const maintenanceTipsContent = document.getElementById('maintenance-tips-content');
  const maintenanceTipsLoading = document.getElementById('maintenance-tips-loading');
  const maintenanceTipsError = document.getElementById('maintenance-tips-error');
  const regenerateTipButton = document.getElementById('regenerate-tip-button');

  // Mantenimiento Específico
  const equipmentSection = document.getElementById('equipment-section');
  const equipmentNameInput = document.getElementById('equipmentName');
  const equipmentBrandInput = document.getElementById('equipmentBrand');
  const equipmentModelInput = document.getElementById('equipmentModel');
  const maintenanceTypeSelector = document.getElementById('maintenance-type-selector');
  const maintenanceButtons = maintenanceTypeSelector?.querySelectorAll('.maintenance-button');
  const equipmentQuestionArea = document.getElementById('equipment-question-area');
  const equipmentQuestionInput = document.getElementById('equipmentQuestionInput');
  const sendEquipmentQuestionButton = document.getElementById('sendEquipmentQuestionButton');
  const equipmentLoading = document.getElementById('equipmentLoading');
  const equipmentError = document.getElementById('equipmentError');
  const equipmentResponseDisplay = document.getElementById('equipmentResponseDisplay');
  // Controles IA para Equipo Específico
  const equipmentControlsWrapper = document.querySelector('.equipment-controls-wrapper');
  const eqToneButtons = equipmentControlsWrapper?.querySelectorAll('[data-tone]');
  const eqLengthButtons = equipmentControlsWrapper?.querySelectorAll('[data-length]');
  const eqWebSearchButton = document.getElementById('eq-toggle-web-search-button');
  const eqRegenerateButton = document.getElementById('eq-regenerate-button');
  // File Upload para Equipo Específico
  const eqFileInput = document.getElementById('eq-fileInput');
  const eqUploadButton = document.getElementById('eq-uploadButton');
  const eqFileList = document.getElementById('eq-file-list');


  // Comunes / Generales
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  // --- Estado (Todas las secciones) ---
  let isDarkMode = localStorage.getItem('darkMode') === 'true';
  // Chat
  let uploadedFilesData = []; // Array to store { id: string, name: string, type: string, content?: string, data?: string }
  let currentTone = 'neutral';
  let currentLength = 'media';
  let useWebSearch = false;
  let lastUserPromptParts = null;
  let lastQuestionText = '';
  let chatHistory = [];
  let isStreaming = false;
  // Equipo Específico
  let selectedMaintenanceType = null;
  let eqCurrentTone = 'neutral';
  let eqCurrentLength = 'media';
  let eqUseWebSearch = false;
  let lastEqPromptDetails = null;
  let lastEqApiResponse = null;
  let eqUploadedFilesData = []; // NUEVO: Estado para archivos de equipo

  // --- Funciones de Utilidad ---

  function showGeneralError(message, targetElement) {
   if (targetElement) {
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
               if (targetElement.style.opacity === '0') {
                  targetElement.style.display = 'none';
              }
          }, 300);
        }
      }, 7000);
    }
   } else {
    console.error(`Error: Elemento de display de error no encontrado. Mensaje:`, message);
    alert("Error interno: " + message);
   }
  }

  function checkApiKey() {
    if (!API_KEY || API_KEY === API_KEY_WARNING) {
      const errorMsg = "Error Crítico: Configura tu API Key de Google Gemini en la variable API_KEY del código JavaScript.";
      showGeneralError(errorMsg, errorMessageDisplay);
      if (maintenanceTipsError) showGeneralError("Funcionalidad limitada por falta de API Key.", maintenanceTipsError);
      if (equipmentError) showGeneralError("Funcionalidad limitada por falta de API Key.", equipmentError);
      if (sendButton) sendButton.disabled = true;
      if (uploadButton) uploadButton.disabled = true;
      if (regenerateButton) regenerateButton.disabled = true;
      if (regenerateTipButton) regenerateTipButton.disabled = true;
      if (sendEquipmentQuestionButton) sendEquipmentQuestionButton.disabled = true;
      if (toneButtons) toneButtons.forEach(btn => btn.disabled = true);
      if (lengthButtons) lengthButtons.forEach(btn => btn.disabled = true);
      if (webSearchButton) webSearchButton.disabled = true;
      if (maintenanceButtons) maintenanceButtons.forEach(btn => btn.disabled = true);
      if (equipmentQuestionInput) equipmentQuestionInput.disabled = true;
      if (eqUploadButton) eqUploadButton.disabled = true; // Deshabilitar nuevo botón
      if (eqRegenerateButton) eqRegenerateButton.disabled = true; // Deshabilitar nuevo botón
      if (eqToneButtons) eqToneButtons.forEach(btn => btn.disabled = true);
      if (eqLengthButtons) eqLengthButtons.forEach(btn => btn.disabled = true);
      if (eqWebSearchButton) eqWebSearchButton.disabled = true;
      if (questionInput) questionInput.placeholder = "Se requiere API Key...";
      if (equipmentQuestionInput) equipmentQuestionInput.placeholder = "Se requiere API Key...";
      return false;
    }
     return true;
  }

  // --- Funciones de Formateo y Display ---

  function applyDarkMode(isDark) {
    if (!body || !darkModeToggle) return;
    body.classList.toggle('dark-mode', isDark);
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-sun', isDark);
      icon.classList.toggle('fa-moon', !isDark);
    }
    localStorage.setItem('darkMode', isDark);
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
  }

  function autoResizeTextarea(element = questionInput) {
   if (!element) return;
   requestAnimationFrame(() => {
      try {
        const maxHeight = parseInt(window.getComputedStyle(element).maxHeight, 10) || 160;
        element.style.height = 'auto';
        element.style.overflowY = 'hidden';
        let newHeight = element.scrollHeight;
        if (newHeight > maxHeight) {
          element.style.height = maxHeight + 'px';
          element.style.overflowY = 'auto';
        } else {
          const minHeight = parseInt(window.getComputedStyle(element).minHeight, 10) || 50;
           element.style.height = Math.max(newHeight, minHeight) + 'px';
        }
      } catch (error) { console.error("Error en autoResizeTextarea:", error); }
    });
   }

   function formatMarkdownToHtml(text) {
    if (!text) return "<p>(Respuesta vacía)</p>";
    // 1. Escapar HTML básico para evitar inyección (CORREGIDO)
    let escapedMessage = text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "&quot;").replace(/'/g, '&#039;');
    // 2. Convertir Markdown a HTML
    let formattedMessage = escapedMessage
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w*\n?)([\s\S]*?)```/g, (match, lang, code) => `<pre><code class="language-${lang.trim() || 'plaintext'}">${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^####\s+(.*)/gm, '<h6>$1</h6>')
      .replace(/^###\s+(.*)/gm, '<h5>$1</h5>')
      .replace(/^##\s+(.*)/gm, '<h4>$1</h4>')
      .replace(/^#\s+(.*)/gm, '<h3>$1</h3>')
       .replace(/^(\s*)(\*|\-|\+)\s+(.*)/gm, (match, indent, bullet, content) => `${indent}<li>${content.trim()}</li>`)
       .replace(/^(\s*)(\d+\.)\s+(.*)/gm, (match, indent, number, content) => `${indent}<li>${content.trim()}</li>`)
       .replace(/^(<li>[\s\S]*?<\/li>)/gm, (match) => {
           if (match.includes('<ol><li>') || match.includes('<ul><li>')) return match;
           return `<ul>\n${match}\n</ul>`;
       })
       .replace(/<\/ul>\s*<ul>/g, '')
       .replace(/<br>\s*<ul>/g, '<ul>')
       .replace(/<\/ul>\s*<br>/g, '</ul>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');
    if (!formattedMessage.trim().match(/^<(p|h[3-6]|ul|ol|pre|li|blockquote|div)/)) {
      formattedMessage = `<p>${formattedMessage}</p>`;
    }
    formattedMessage = formattedMessage.replace(/<p>(<br\s*\/?>|\s)*<\/p>/g, '');
    formattedMessage = formattedMessage.replace(/<p><br\s*\/?>/g, '<p>').replace(/<br\s*\/?>\s*<\/p>/g, '</p>');
    formattedMessage = formattedMessage.replace(/<br>\s*<(ul|ol|pre)/g, '<$1');
    formattedMessage = formattedMessage.replace(/<\/(ul|ol|pre)>\s*<br>/g, '</$1>');
   return formattedMessage.trim();
   }

  function displayMessage(sender, message, isUser = false, isRegenerated = false) {
    try {
      if (!chatMessages) return;
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message');
      messageDiv.classList.add(isUser ? 'user-turn' : 'assistant-turn');
      const senderSpan = document.createElement('span');
      senderSpan.classList.add('sender');
      senderSpan.innerHTML = `<i class="fas ${isUser ? 'fa-user-alt' : 'fa-robot'}"></i> ${isUser ? 'Tú' : 'Asistente'}${isRegenerated ? ' (Regenerado)' : ''}`;
      const responseSpan = document.createElement('div');
      responseSpan.classList.add('response');
      if (isUser) responseSpan.classList.add('user-message');
      responseSpan.innerHTML = formatMarkdownToHtml(message);
      messageDiv.appendChild(senderSpan);
      messageDiv.appendChild(responseSpan);
      chatMessages.appendChild(messageDiv);
      requestAnimationFrame(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    } catch (error) {
      console.error("Error en displayMessage:", error);
       try {
        const errorP = document.createElement('p');
        errorP.style.color = 'var(--danger-color)';
        errorP.textContent = "[Error al mostrar este mensaje. Revisa la consola.]";
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('message', 'error-display');
        errorDiv.appendChild(errorP);
         if (chatMessages) {
          chatMessages.appendChild(errorDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
         }
      } catch (displayError) {
         console.error("Error al intentar mostrar el error de displayMessage:", displayError);
       }
    }
  }

  function displayMaintenanceTip(tipText) {
    if (!maintenanceTipsContent) return;
    maintenanceTipsContent.innerHTML = '';
    const tipDiv = document.createElement('div');
    tipDiv.classList.add('tip-item');
    tipDiv.innerHTML = formatMarkdownToHtml(tipText);
    maintenanceTipsContent.appendChild(tipDiv);
    void tipDiv.offsetWidth;
    tipDiv.style.opacity = 1;
    tipDiv.style.transform = 'translateX(0) scale(1)';
  }

   function displayEquipmentResponse(responseText) {
    if (!equipmentResponseDisplay) return;
    equipmentResponseDisplay.innerHTML = formatMarkdownToHtml(responseText);
    equipmentResponseDisplay.style.display = 'block';
    void equipmentResponseDisplay.offsetWidth;
    equipmentResponseDisplay.style.opacity = '1';
    equipmentResponseDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
   }

  // --- Funciones de API ---

   async function callGenerativeApi(modelName, promptContents) {
     if (!checkApiKey()) { throw new Error("API Key no válida o no configurada."); }
     const apiUrl = `${API_BASE_URL}${modelName}:generateContent?key=${API_KEY}`;
     const generationConfig = { temperature: 0.8, maxOutputTokens: 4096, topP: 0.95, topK: 40 };
     const safetySettings = [
       { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
     ];
     // promptContents ya es un array de 'parts'
     const requestBody = { contents: [{ role: "user", parts: promptContents }], generationConfig, safetySettings };
     console.log(`Enviando a API (NO-STREAM) (${modelName}):`, JSON.stringify(requestBody, null, 2));
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 45000);
     try {
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: controller.signal });
       clearTimeout(timeoutId);
       const responseBodyText = await response.text();
       console.log(`Respuesta API (NO-STREAM) (${response.status}) (${modelName}) (raw):`, responseBodyText);
       if (!response.ok) {
         let parsedError;
         try { parsedError = JSON.parse(responseBodyText); } catch (e) { parsedError = { error: { message: responseBodyText || response.statusText } }; }
         let errorDetail = parsedError.error?.message || `HTTP ${response.status}`;
         let errorCode = parsedError.error?.code || response.status;
         if (errorCode === 400 && errorDetail.includes('API key not valid')) { errorDetail = "API Key inválida o mal configurada."; checkApiKey(); }
         else if (errorCode === 429) { errorDetail = "Límite de cuota API alcanzado."; }
         else if (errorCode === 500 || errorCode === 503) { errorDetail = `Error interno del servidor IA (${errorCode}).`; }
         throw new Error(`Error API (NO-STREAM) (${modelName}): ${errorDetail} (Code: ${errorCode})`);
       }
       const data = JSON.parse(responseBodyText);
       if (data.promptFeedback?.blockReason) { throw new Error(`Prompt bloqueado (NO-STREAM) (${modelName}): ${data.promptFeedback.blockReason}.`); }
       if (data.candidates && data.candidates.length > 0) {
         if (data.candidates[0].content?.parts?.[0]?.text) {
           let text = data.candidates[0].content.parts[0].text;
           if (data.candidates[0].finishReason === "MAX_TOKENS") { text += "\n\n[Respuesta truncada por límite de tokens]"; }
           else if (data.candidates[0].finishReason === "SAFETY") { text += "\n\n[Respuesta parcial bloqueada por seguridad]"; console.warn(`Respuesta (NO-STREAM) (${modelName}) finalizada por SAFETY.`); }
           return text;
         } else if (data.candidates[0].finishReason === "SAFETY") { throw new Error(`Respuesta bloqueada por seguridad (NO-STREAM) (${modelName}).`); }
         else { console.warn(`Respuesta API (NO-STREAM) (${modelName}) sin texto:`, data.candidates[0]); return `(Respuesta inesperada de ${modelName})`; }
       } else { console.warn(`Respuesta API (NO-STREAM) (${modelName}) sin candidatos:`, data); return `(No se generó contenido válido en ${modelName})`; }
     } catch (error) {
       clearTimeout(timeoutId);
       console.error(`Error en callGenerativeApi (NO-STREAM) (${modelName}):`, error);
       if (error.name === 'AbortError') { throw new Error(`Timeout en la solicitud a IA (NO-STREAM) (${modelName}).`); }
       throw error;
     }
   }

   async function streamChatResponse(promptContents, history) {
     if (!checkApiKey()) { throw new Error("API Key no válida o no configurada."); }
     if (isStreaming) { throw new Error("Ya se está procesando una respuesta."); }
     isStreaming = true;
     const modelName = CHAT_MODEL_NAME;
     const apiUrl = `${API_BASE_URL}${modelName}:streamGenerateContent?key=${API_KEY}&alt=sse`;
     let maxOutputTokens;
     let temperature = 0.7;
     let topP = 0.95;
     let topK = 40;
     switch (currentLength) {
       case 'corta': maxOutputTokens = 4096; break;
       case 'larga': maxOutputTokens = 32768; break;
       default: maxOutputTokens = 8192; break;
     }
     if (currentTone === 'formal') temperature = 0.5;
     else if (currentTone === 'creativo') temperature = 0.9;
     const generationConfig = { temperature, maxOutputTokens, topP, topK };
     const safetySettings = [
       { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
     ];
     const contents = [...history, { role: "user", parts: promptContents }];
     const requestBody = { contents, generationConfig, safetySettings };
     console.log(`Enviando a API (STREAM) (${modelName}):`, JSON.stringify(requestBody, null, 2));
     const messageDiv = document.createElement('div');
     messageDiv.classList.add('message', 'assistant-turn');
     const senderSpan = document.createElement('span');
     senderSpan.classList.add('sender');
     senderSpan.innerHTML = `<i class="fas fa-robot"></i> Asistente`;
     const responseSpan = document.createElement('div');
     responseSpan.classList.add('response');
     responseSpan.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
     messageDiv.appendChild(senderSpan);
     messageDiv.appendChild(responseSpan);
     chatMessages.appendChild(messageDiv);
     requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
     let accumulatedText = "";
     let finalError = null;
     let finishReason = null;
     let safetyBlocked = false;
     try {
       const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), });
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
       const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
       let buffer = '';
       while (true) {
         const { value, done } = await reader.read();
         if (done) break;
         buffer += value;
         let lines = buffer.split('\n');
         buffer = lines.pop();
         for (const line of lines) {
           if (line.startsWith('data: ')) {
             try {
               const chunkJson = JSON.parse(line.substring(6));
               if (chunkJson.candidates && chunkJson.candidates.length > 0) {
                 const candidate = chunkJson.candidates[0];
                 if (candidate.content?.parts?.[0]?.text) {
                   accumulatedText += candidate.content.parts[0].text;
                   responseSpan.textContent = accumulatedText + '▍';
                   requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
                 }
                 if (candidate.finishReason && candidate.finishReason !== "FINISH_REASON_UNSPECIFIED") { finishReason = candidate.finishReason; }
                 if (finishReason === "SAFETY") { safetyBlocked = true; console.warn("Stream bloqueado por seguridad."); }
               } else if (chunkJson.promptFeedback?.blockReason) { throw new Error(`Prompt bloqueado (STREAM): ${chunkJson.promptFeedback.blockReason}`); }
             } catch (e) { console.warn("Error parseando chunk JSON del stream:", e, "Línea:", line); }
           }
         }
       }
     } catch (error) {
       console.error("Error durante streaming:", error);
       finalError = error;
     } finally {
       isStreaming = false;
       responseSpan.textContent = accumulatedText;
       responseSpan.innerHTML = formatMarkdownToHtml(accumulatedText);
       if (finishReason === "MAX_TOKENS") { responseSpan.innerHTML += "<p><small>[Respuesta truncada por límite de tokens]</small></p>"; }
       else if (safetyBlocked) { responseSpan.innerHTML += "<p><small>[Respuesta finalizada o modificada por motivos de seguridad]</small></p>"; }
       requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
       if (!finalError && accumulatedText) {
         history.push({ role: "user", parts: promptContents });
         history.push({ role: "model", parts: [{ text: accumulatedText }] });
         const MAX_HISTORY_TURNS = 10;
         if (history.length > MAX_HISTORY_TURNS * 2) { history.splice(0, history.length - MAX_HISTORY_TURNS * 2); console.log("Historial de chat truncado."); }
         if (regenerateButton && checkApiKey()) regenerateButton.disabled = false;
       } else {
         if (finalError) { showGeneralError(`Error en respuesta: ${finalError.message}`, errorMessageDisplay); }
         else if (!accumulatedText) { responseSpan.innerHTML = "<p><small>(No se recibió contenido)</small></p>"; }
         if (regenerateButton) regenerateButton.disabled = true;
       }
       if (sendButton && checkApiKey()) sendButton.disabled = false;
       if (loadingIndicator) loadingIndicator.style.display = 'none';
     }
   }

  // --- Funciones de Lógica de Aplicación ---

  function clearChat() {
      console.log("Limpiando chat...");
      if (chatMessages) chatMessages.innerHTML = '';
      chatHistory = [];
      lastUserPromptParts = null;
      lastQuestionText = '';
      uploadedFilesData = [];
      if (fileList) renderFileList();
      if (errorMessageDisplay) { errorMessageDisplay.style.display = 'none'; errorMessageDisplay.style.opacity = '0'; }
      if (regenerateButton) regenerateButton.disabled = true;
      if (questionInput) questionInput.value = '';
      if (questionInput) autoResizeTextarea(questionInput);
      displayMessage('Asistente', `*¡Hola!* Soy BIAmedial Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas. 
      \n\nPara consultas *muy* específicas de un equipo, usa la sección "Mantenimiento Específico". 
      No olvides revisar los "Tips de Mantenimiento".
      \n\n**Importante:** Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética. 
      ¿En qué puedo ayudarte hoy?`);
      console.log("Chat limpiado.");
  }

  async function sendMessage(isRegeneration = false) {
    if (isStreaming) { showGeneralError("Espera a que la respuesta anterior termine de generarse.", errorMessageDisplay); return; }
    let questionText;
    let currentPromptPartsToSend;
    if (isRegeneration) {
      if (!lastUserPromptParts || !lastQuestionText) { showGeneralError("No hay mensaje anterior válido para regenerar.", errorMessageDisplay); return; }
      questionText = lastQuestionText;
      currentPromptPartsToSend = lastUserPromptParts;
      console.log("Regenerando respuesta para:", questionText);
      if (chatHistory.length >= 2 && chatHistory[chatHistory.length - 1].role === 'model' && chatHistory[chatHistory.length - 2].role === 'user') { chatHistory.pop(); chatHistory.pop(); console.log("Historial revertido para regeneración."); }
      else { console.warn("No se pudo revertir el historial para regeneración."); }
      displayMessage('Usuario', `(Regenerando para: ${questionText || 'archivos adjuntos'})`, true, true);
    } else {
      questionText = questionInput.value.trim();
      if (questionText === "" && uploadedFilesData.length === 0) return;
      lastQuestionText = questionText;
      if (questionInput) { questionInput.value = ''; autoResizeTextarea(questionInput); }
      displayMessage('Usuario', questionText || "(Archivos adjuntos enviados)", true);
      currentPromptPartsToSend = [];
      let instrucciones = `**Instrucciones Clave:**
1.  **Rol:** Eres un asistente experto en ingeniería biomédica **especializado en el contexto de Panamá.**
2.  **Contexto Panamá:** A menos que se indique explícitamente lo contrario, **todas tus respuestas deben basarse y hacer referencia a normativas, prácticas, proveedores, y situaciones relevantes en Panamá.** Si la información no es específica de Panamá, indícalo claramente.
3.  **Formato:** Responde de forma clara, útil y bien estructurada. **ABSOLUTAMENTE NO incluyas saludos iniciales (como 'Hola', '¡Hola!', etc.) ni despedidas finales (como 'Espero que esto ayude', 'Saludos', etc.).** Ve directo al punto.
4.  **Tono y Longitud:** Tono actual: ${currentTone}. Longitud esperada: ${currentLength}.
5.  **Búsqueda Web:** ${useWebSearch ? 'Simula una búsqueda web para obtener información actualizada si es necesario.' : 'No se requiere búsqueda web.'}
6.  **Historial y Archivos:** Considera el historial de conversación previo (si existe) y los archivos adjuntos proporcionados.
7.  **Pregunta Principal:** La consulta del usuario es: "${lastQuestionText || '(Consulta basada en los archivos adjuntos)'}"`;
      currentPromptPartsToSend.push({ text: instrucciones });
      if (uploadedFilesData.length > 0) {
        console.log(`Adjuntando ${uploadedFilesData.length} archivos al prompt.`);
        uploadedFilesData.forEach(fileData => {
          if (fileData.content) { currentPromptPartsToSend.push({ text: `Archivo adjunto "${fileData.name}":\n${fileData.content}` }); }
          else if (fileData.data && fileData.type) { currentPromptPartsToSend.push({ inlineData: { mimeType: fileData.type, data: fileData.data } }); currentPromptPartsToSend.push({ text: `(Archivo adjunto: "${fileData.name}" tipo ${fileData.type})` }); }
          else { console.warn(`Datos inválidos para ${fileData.name}, omitiendo.`); }
        });
      }
      lastUserPromptParts = [...currentPromptPartsToSend];
    }
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessageDisplay) { errorMessageDisplay.style.display = 'none'; errorMessageDisplay.style.opacity = '0'; }
    if (sendButton) sendButton.disabled = true;
    if (regenerateButton) regenerateButton.disabled = true;
    try { await streamChatResponse(currentPromptPartsToSend, chatHistory); }
    catch (error) { showGeneralError(`Error al iniciar la solicitud: ${error.message}`, errorMessageDisplay); if (loadingIndicator) loadingIndicator.style.display = 'none'; if (sendButton && checkApiKey()) sendButton.disabled = false; isStreaming = false; }
  }

  async function fetchMaintenanceTip() {
    if (!maintenanceTipsLoading || !maintenanceTipsContent || !maintenanceTipsError || !regenerateTipButton) { console.error("Faltan elementos DOM para Tips."); return; }
    maintenanceTipsLoading.style.display = 'block';
    maintenanceTipsContent.innerHTML = '';
    maintenanceTipsError.style.display = 'none'; maintenanceTipsError.style.opacity = '0';
    regenerateTipButton.disabled = true;
    try {
      const tipPromptText = `Genera tres tips prácticos y concisos (máximo 3 frases cortas) sobre mantenimiento de equipos biomédicos (uno predictivo, uno preventivo, uno correctivo) **aplicables específicamente al entorno hospitalario de Panamá.** Varía los tips. **ABSOLUTAMENTE NO incluyas saludos ni despedidas, solo los tips directamente.**`;
      const tipResponse = await callGenerativeApi(FLASH_MODEL_NAME, [{ text: tipPromptText }]);
      displayMaintenanceTip(tipResponse);
    } catch (error) {
      console.error("Error al obtener tip:", error);
      showGeneralError(`Error al cargar tip: ${error.message}`, maintenanceTipsError);
    } finally {
      maintenanceTipsLoading.style.display = 'none';
      if (checkApiKey()) regenerateTipButton.disabled = false;
   }
 }

  async function sendEquipmentQuestion(isRegeneration = false) {
    let name, brand, model, type, question;
    let promptParts = []; // Array para construir las partes del prompt

    if (isRegeneration) {
        if (!lastEqPromptDetails) { showGeneralError("No hay información previa para regenerar la consulta del equipo.", equipmentError); return; }
        ({ name, brand, model, type, question } = lastEqPromptDetails);
        console.log("Regenerando información para equipo:", name, brand, model);
        if (equipmentResponseDisplay) { equipmentResponseDisplay.innerHTML = `<p><i>Regenerando información para ${name} ${model}...</i></p>`; equipmentResponseDisplay.style.display = 'block'; equipmentResponseDisplay.style.opacity = '1'; }
    } else {
        const validationResult = validateEquipmentInputs();
        if (!validationResult) return;
        ({ name, brand, model, type, question } = validationResult);
        lastEqPromptDetails = { name, brand, model, type, question };
    }

    // Construir instrucciones
    const instrucciones = `**Instrucciones Clave:**
1.  **Rol:** Eres un asistente experto en ingeniería biomédica **especializado en el contexto de Panamá.**
2.  **Contexto Panamá:** Proporciona información sobre el mantenimiento **${type}** para el equipo **"${name}" (Marca: "${brand}", Modelo: "${model}")**, considerando el **contexto panameño** (normativas, proveedores locales si aplica).
3.  **Pregunta Específica:** La consulta del usuario es: "${question}".
4.  **Enfoque:** Céntrate en procedimientos prácticos, fallas comunes, herramientas o frecuencia relevantes para el tipo de mantenimiento y la pregunta.
5.  **Formato:** Sé técnico, claro y conciso. **ABSOLUTAMENTE NO incluyas saludos iniciales ni despedidas finales.**
6.  **Tono y Longitud:** Tono: ${eqCurrentTone}. Longitud: ${eqCurrentLength}.
7.  **Búsqueda Web:** ${eqUseWebSearch ? 'Simula búsqueda web si es necesario.' : 'No se requiere búsqueda web.'}
8.  **Archivos Adjuntos:** Considera los siguientes archivos adjuntos proporcionados para esta consulta específica del equipo.`;
    promptParts.push({ text: instrucciones });

    // NUEVO: Añadir archivos adjuntos específicos del equipo
    if (eqUploadedFilesData.length > 0) {
        console.log(`Adjuntando ${eqUploadedFilesData.length} archivos al prompt de equipo.`);
        eqUploadedFilesData.forEach(fileData => {
          if (fileData.content) { promptParts.push({ text: `Archivo adjunto (Equipo) "${fileData.name}":\n${fileData.content}` }); }
          else if (fileData.data && fileData.type) { promptParts.push({ inlineData: { mimeType: fileData.type, data: fileData.data } }); promptParts.push({ text: `(Archivo adjunto (Equipo): "${fileData.name}" tipo ${fileData.type})` }); }
          else { console.warn(`Datos inválidos para archivo de equipo ${fileData.name}, omitiendo.`); }
        });
    }

    // ---- Manejo UI y Llamada API ----
    if (equipmentLoading) equipmentLoading.style.display = 'block';
    if (equipmentError) { equipmentError.style.display = 'none'; equipmentError.style.opacity = '0'; }
    if (!isRegeneration && equipmentResponseDisplay) { equipmentResponseDisplay.style.display = 'none'; equipmentResponseDisplay.style.opacity = '0'; }
    if (sendEquipmentQuestionButton) sendEquipmentQuestionButton.disabled = true;
    if (eqRegenerateButton) eqRegenerateButton.disabled = true;
    if (maintenanceButtons) maintenanceButtons.forEach(btn => btn.disabled = true);
    if (equipmentNameInput) equipmentNameInput.disabled = true;
    if (equipmentBrandInput) equipmentBrandInput.disabled = true;
    if (equipmentModelInput) equipmentModelInput.disabled = true;
    if (equipmentQuestionInput) equipmentQuestionInput.disabled = true;
    if (eqToneButtons) eqToneButtons.forEach(btn => btn.disabled = true);
    if (eqLengthButtons) eqLengthButtons.forEach(btn => btn.disabled = true);
    if (eqWebSearchButton) eqWebSearchButton.disabled = true;
    if (eqUploadButton) eqUploadButton.disabled = true; // Deshabilitar botón de subida

    try {
      // Llamar a la API con todas las partes construidas
      const apiResponse = await callGenerativeApi(FLASH_MODEL_NAME, promptParts); // Pasar el array de partes
      lastEqApiResponse = apiResponse;
      displayEquipmentResponse(apiResponse);
      if (eqRegenerateButton && checkApiKey()) eqRegenerateButton.disabled = false;
    } catch (error) {
      console.error("Error consulta mantenimiento específico:", error);
      showGeneralError(`Error: ${error.message}`, equipmentError);
      lastEqApiResponse = null;
      if (eqRegenerateButton) eqRegenerateButton.disabled = true;
    } finally {
      if (equipmentLoading) equipmentLoading.style.display = 'none';
      if (checkApiKey()) {
        if (sendEquipmentQuestionButton) sendEquipmentQuestionButton.disabled = false;
        if (maintenanceButtons) maintenanceButtons.forEach(btn => btn.disabled = false);
        if (equipmentNameInput) equipmentNameInput.disabled = false;
        if (equipmentBrandInput) equipmentBrandInput.disabled = false;
        if (equipmentModelInput) equipmentModelInput.disabled = false;
        if (equipmentQuestionInput) equipmentQuestionInput.disabled = false;
        if (eqToneButtons) eqToneButtons.forEach(btn => btn.disabled = false);
        if (eqLengthButtons) eqLengthButtons.forEach(btn => btn.disabled = false);
        if (eqWebSearchButton) eqWebSearchButton.disabled = false;
        if (eqUploadButton) eqUploadButton.disabled = false; // Rehabilitar botón de subida
        updateEquipmentUIState();
      }
    }
  }

   function validateEquipmentInputs() {
    if (equipmentError) { equipmentError.style.display = 'none'; equipmentError.style.opacity = '0'; }
    const name = equipmentNameInput?.value.trim();
    const brand = equipmentBrandInput?.value.trim();
    const model = equipmentModelInput?.value.trim();
    const question = equipmentQuestionInput?.value.trim();
    let errorMessage = null;
     if (!name) errorMessage = "Falta el Nombre del Equipo.";
     else if (!brand) errorMessage = "Falta la Marca del Equipo.";
     else if (!model) errorMessage = "Falta el Modelo del Equipo.";
     else if (!selectedMaintenanceType) errorMessage = "Selecciona un Tipo de Mantenimiento.";
     else if (!question) errorMessage = "Escribe tu pregunta específica.";
     if (errorMessage) { showGeneralError(errorMessage, equipmentError); return false; }
    return { name, brand, model, type: selectedMaintenanceType, question };
  }

   function updateEquipmentUIState() {
    if (!equipmentNameInput || !equipmentBrandInput || !equipmentModelInput || !equipmentQuestionInput || !sendEquipmentQuestionButton || !maintenanceButtons) { console.warn("updateEquipmentUIState: Faltan elementos DOM críticos."); return; }
     const name = equipmentNameInput.value.trim();
     const brand = equipmentBrandInput.value.trim();
     const model = equipmentModelInput.value.trim();
     const apiKeyOk = checkApiKey();
     maintenanceButtons.forEach(btn => { btn.disabled = !apiKeyOk; });
     let enableQuestionArea = false;
     let placeholderText = "Completa Nombre, Marca, Modelo y Tipo...";
     if (!apiKeyOk) { placeholderText = "Se requiere API Key configurada."; }
     else if (name && brand && model && selectedMaintenanceType) { enableQuestionArea = true; placeholderText = `Escribe tu pregunta sobre mantenimiento ${selectedMaintenanceType} para ${name} ${model}...`; }
     else if (!name || !brand || !model) { placeholderText = "Completa Nombre, Marca y Modelo del equipo..."; }
     else if (!selectedMaintenanceType) { placeholderText = "Selecciona un tipo de mantenimiento..."; }
     equipmentQuestionInput.disabled = !enableQuestionArea;
     equipmentQuestionInput.placeholder = placeholderText;
     sendEquipmentQuestionButton.disabled = !enableQuestionArea;
    if(enableQuestionArea) { autoResizeTextarea(equipmentQuestionInput); }
   }

   // --- Funciones de Manejo de Archivos (Chat Principal) ---

   function renderFileList() {
       if (!fileList) return;
       fileList.innerHTML = '';
       if (uploadedFilesData.length === 0) { fileList.innerHTML = '<li><i class="fas fa-info-circle file-icon"></i> No hay archivos adjuntos.</li>'; return; }
       uploadedFilesData.forEach(fileData => {
           const li = document.createElement('li');
           li.dataset.fileId = fileData.id;
           li.innerHTML = `<i class="fas fa-check-circle file-icon"></i> <span class="file-name">${fileData.name}</span> <button class="remove-file-btn" title="Quitar archivo"><i class="fas fa-times"></i></button>`;
           li.querySelector('.remove-file-btn').addEventListener('click', (e) => { e.stopPropagation(); removeFile(fileData.id); });
           fileList.appendChild(li);
       });
   }

   function removeFile(fileId) {
       uploadedFilesData = uploadedFilesData.filter(file => file.id !== fileId);
       console.log(`Archivo ${fileId} eliminado. Restantes:`, uploadedFilesData);
       renderFileList();
   }

   function getDataFromDataUrl(dataUrl) {
       if (typeof dataUrl === 'string' && dataUrl.includes(',')) { return dataUrl.split(',')[1]; }
       console.error("Formato de Data URL inválido:", dataUrl);
       return null;
   }

  async function handleFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0 || !fileList) return;
    const readPromises = [];
    const maxFiles = 10;
    const maxSizeMB = 20;
    let currentFileCount = uploadedFilesData.length;
    fileList.innerHTML = '<li><i class="fas fa-spinner fa-spin file-icon"></i> Procesando archivos...</li>';
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `file-${Date.now()}-${i}`;
        const fileSizeMB = file.size / 1024 / 1024;
        if (currentFileCount >= maxFiles) { showGeneralError(`Se alcanzó el límite de ${maxFiles} archivos. "${file.name}" omitido.`, errorMessageDisplay); continue; }
        const textMimeTypes = [ 'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml', 'application/rtf', 'text/tsv', 'application/yaml', 'text/x-python', 'text/x-java-source', ];
        const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        const audioMimeTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'];
        const videoMimeTypes = ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/wmv', 'video/webm', 'video/x-matroska'];
        const pdfMimeType = 'application/pdf';
        const fileType = file.type || '';
        const fileName = file.name || '';
        const isText = textMimeTypes.includes(fileType) || fileName.match(/\.(txt|md|csv|json|xml|html|css|js|py|java|yaml|rtf|tsv)$/i);
        const isImage = imageMimeTypes.includes(fileType);
        const isAudio = audioMimeTypes.includes(fileType);
        const isVideo = videoMimeTypes.includes(fileType);
        const isPdf = fileType === pdfMimeType;
        const isSupported = isText || isImage || isAudio || isVideo || isPdf;
        if (!isSupported) { showGeneralError(`Tipo de archivo no soportado: "${fileName}" (${fileType || 'desconocido'}). Omitido.`, errorMessageDisplay); continue; }
        if (fileSizeMB > maxSizeMB) { showGeneralError(`Archivo "${file.name}" excede el límite de ${maxSizeMB}MB. Omitido.`, errorMessageDisplay); continue; }
        currentFileCount++;
         const reader = new FileReader();
         const promise = new Promise((resolve, reject) => {
             reader.onload = (e) => {
                 try {
                     let fileData;
                     const base64Data = isText ? null : getDataFromDataUrl(e.target.result);
                     if (isText) { fileData = { id: fileId, name: fileName, type: fileType || 'text/plain', content: e.target.result }; }
                     else if (base64Data) { fileData = { id: fileId, name: fileName, type: fileType, data: base64Data }; }
                     else if (!isText) { throw new Error("No se pudo extraer base64 de Data URL"); }
                    uploadedFilesData.push(fileData);
                    resolve(fileData);
                } catch (readError) { console.error(`Error procesando contenido de ${file.name}:`, readError); showGeneralError(`Error al procesar "${file.name}".`, errorMessageDisplay); reject(new Error(`Error procesando ${file.name}`)); }
            };
            reader.onerror = (e) => { console.error(`Error leyendo ${fileName}:`, e); showGeneralError(`Error de lectura/I/O en "${fileName}".`, errorMessageDisplay); reject(new Error(`Error I/O ${fileName}`)); };
             if (isText) { reader.readAsText(file); } else { reader.readAsDataURL(file); }
         });
         readPromises.push(promise);
    }
    try { await Promise.allSettled(readPromises); console.log("Procesamiento de archivos completado. Archivos actuales:", uploadedFilesData); }
    catch (error) { console.error("Error durante la lectura de archivos:", error); showGeneralError("Ocurrió un error al leer uno o más archivos.", errorMessageDisplay); }
    finally { renderFileList(); if (event?.target) { event.target.value = null; } }
}

  // --- NUEVO: Funciones de Manejo de Archivos para Equipo Específico ---

   function renderEqFileList() {
       if (!eqFileList) return;
       eqFileList.innerHTML = '';
       if (eqUploadedFilesData.length === 0) { eqFileList.innerHTML = '<li><i class="fas fa-info-circle file-icon"></i> No hay archivos adjuntos (Equipo).</li>'; return; }
       eqUploadedFilesData.forEach(fileData => {
           const li = document.createElement('li');
           li.dataset.fileId = fileData.id;
           li.innerHTML = `<i class="fas fa-check-circle file-icon"></i> <span class="file-name">${fileData.name}</span> <button class="remove-file-btn" title="Quitar archivo"><i class="fas fa-times"></i></button>`;
           li.querySelector('.remove-file-btn').addEventListener('click', (e) => { e.stopPropagation(); removeEqFile(fileData.id); });
           eqFileList.appendChild(li);
       });
   }

   function removeEqFile(fileId) {
       eqUploadedFilesData = eqUploadedFilesData.filter(file => file.id !== fileId);
       console.log(`Archivo de equipo ${fileId} eliminado. Restantes:`, eqUploadedFilesData);
       renderEqFileList();
   }

  async function handleEqFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0 || !eqFileList) return; // Usar eqFileList
    const readPromises = [];
    const maxFiles = 10; // Mismos límites
    const maxSizeMB = 20;
    let currentFileCount = eqUploadedFilesData.length; // Usar eqUploadedFilesData
    eqFileList.innerHTML = '<li><i class="fas fa-spinner fa-spin file-icon"></i> Procesando archivos...</li>';
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `eq-file-${Date.now()}-${i}`; // Prefijo diferente
        const fileSizeMB = file.size / 1024 / 1024;
        if (currentFileCount >= maxFiles) { showGeneralError(`Se alcanzó el límite de ${maxFiles} archivos para equipo. "${file.name}" omitido.`, equipmentError); continue; } // Usar equipmentError
        const textMimeTypes = [ 'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml', 'application/rtf', 'text/tsv', 'application/yaml', 'text/x-python', 'text/x-java-source', ];
        const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        const audioMimeTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'];
        const videoMimeTypes = ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/wmv', 'video/webm', 'video/x-matroska'];
        const pdfMimeType = 'application/pdf';
        const fileType = file.type || '';
        const fileName = file.name || '';
        const isText = textMimeTypes.includes(fileType) || fileName.match(/\.(txt|md|csv|json|xml|html|css|js|py|java|yaml|rtf|tsv)$/i);
        const isImage = imageMimeTypes.includes(fileType);
        const isAudio = audioMimeTypes.includes(fileType);
        const isVideo = videoMimeTypes.includes(fileType);
        const isPdf = fileType === pdfMimeType;
        const isSupported = isText || isImage || isAudio || isVideo || isPdf;
        if (!isSupported) { showGeneralError(`Tipo de archivo no soportado: "${fileName}" (${fileType || 'desconocido'}). Omitido.`, equipmentError); continue; } // Usar equipmentError
        if (fileSizeMB > maxSizeMB) { showGeneralError(`Archivo "${file.name}" excede el límite de ${maxSizeMB}MB. Omitido.`, equipmentError); continue; } // Usar equipmentError
        currentFileCount++;
         const reader = new FileReader();
         const promise = new Promise((resolve, reject) => {
             reader.onload = (e) => {
                 try {
                     let fileData;
                     const base64Data = isText ? null : getDataFromDataUrl(e.target.result);
                     if (isText) { fileData = { id: fileId, name: fileName, type: fileType || 'text/plain', content: e.target.result }; }
                     else if (base64Data) { fileData = { id: fileId, name: fileName, type: fileType, data: base64Data }; }
                     else if (!isText) { throw new Error("No se pudo extraer base64 de Data URL"); }
                    eqUploadedFilesData.push(fileData); // Usar eqUploadedFilesData
                    resolve(fileData);
                } catch (readError) { console.error(`Error procesando contenido de ${file.name}:`, readError); showGeneralError(`Error al procesar "${file.name}".`, equipmentError); reject(new Error(`Error procesando ${file.name}`)); } // Usar equipmentError
            };
            reader.onerror = (e) => { console.error(`Error leyendo ${fileName}:`, e); showGeneralError(`Error de lectura/I/O en "${fileName}".`, equipmentError); reject(new Error(`Error I/O ${fileName}`)); }; // Usar equipmentError
             if (isText) { reader.readAsText(file); } else { reader.readAsDataURL(file); }
         });
         readPromises.push(promise);
    }
    try { await Promise.allSettled(readPromises); console.log("Procesamiento de archivos de equipo completado:", eqUploadedFilesData); } // Usar eqUploadedFilesData
    catch (error) { console.error("Error durante la lectura de archivos de equipo:", error); showGeneralError("Ocurrió un error al leer uno o más archivos para equipo.", equipmentError); } // Usar equipmentError
    finally { renderEqFileList(); if (event?.target) { event.target.value = null; } } // Usar renderEqFileList
}

  // Configura los controles de IA (Tono, Longitud, etc.) del chat
  function setupAIControls() {
   if (!chatControls || !toneButtons || !lengthButtons || !webSearchButton || !regenerateButton) { console.warn("setupAIControls: Faltan elementos de control de IA (chatControls, tone/length buttons, webSearch, regenerate)."); return; }
   toneButtons.forEach(button => { button.addEventListener('click', () => { if (button.disabled) return; currentTone = button.dataset.tone; toneButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); console.log("Tono:", currentTone); }); });
   lengthButtons.forEach(button => { button.addEventListener('click', () => { if (button.disabled) return; currentLength = button.dataset.length; lengthButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); console.log("Longitud:", currentLength); }); });
   webSearchButton.addEventListener('click', () => { if (webSearchButton.disabled) return; useWebSearch = !useWebSearch; webSearchButton.classList.toggle('active', useWebSearch); console.log("Instrucción Web Search:", useWebSearch); });
   regenerateButton.addEventListener('click', () => { if (!regenerateButton.disabled) { sendMessage(true); } });
   regenerateButton.disabled = true;
   }

  // --- Inicialización y Event Listeners ---
  function initializeApp() {
    console.log("Inicializando componentes...");
   if (!chatMessages || !questionInput || !sendButton || !loadingIndicator || !errorMessageDisplay ||
       !maintenanceTipsContent || !maintenanceTipsLoading || !maintenanceTipsError || !regenerateTipButton ||
       !equipmentSection || !equipmentNameInput || !equipmentBrandInput || !equipmentModelInput ||
       !maintenanceButtons || !equipmentQuestionInput || !sendEquipmentQuestionButton ||
       !equipmentLoading || !equipmentError || !equipmentResponseDisplay || !darkModeToggle || !body ||
       !clearChatButton || !equipmentControlsWrapper || !eqToneButtons || !eqLengthButtons ||
       !eqWebSearchButton || !eqRegenerateButton || !eqFileInput || !eqUploadButton || !eqFileList ) { // Añadir verificación de nuevos elementos de archivo
          console.error("ERROR CRÍTICO: Faltan elementos DOM esenciales. La aplicación no funcionará correctamente.");
         alert("Error: No se pudieron cargar todos los componentes de la interfaz. Revisa la consola.");
         return;
      }
    applyDarkMode(isDarkMode);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // Chat Listeners
    sendButton.addEventListener('click', () => sendMessage(false));
    questionInput.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey && !sendButton.disabled && !isStreaming) { event.preventDefault(); sendMessage(false); } autoResizeTextarea(questionInput); });
    questionInput.addEventListener('paste', () => autoResizeTextarea(questionInput));
    questionInput.addEventListener('input', () => autoResizeTextarea(questionInput));
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    clearChatButton.addEventListener('click', clearChat);
    setupAIControls();
    renderFileList(); // Renderizar lista de chat
    // Tips Listener
    regenerateTipButton.addEventListener('click', fetchMaintenanceTip);
    // Mantenimiento Específico Listeners
    [equipmentNameInput, equipmentBrandInput, equipmentModelInput].forEach(input => { if (input) input.addEventListener('input', updateEquipmentUIState); });
    maintenanceButtons.forEach(button => { button.addEventListener('click', () => { if (button.disabled) return; maintenanceButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); selectedMaintenanceType = button.dataset.type; console.log("Tipo Mantenimiento Específico:", selectedMaintenanceType); updateEquipmentUIState(); }); });
    sendEquipmentQuestionButton.addEventListener('click', () => sendEquipmentQuestion(false));
    equipmentQuestionInput.addEventListener('input', () => autoResizeTextarea(equipmentQuestionInput));
    equipmentQuestionInput.addEventListener('paste', () => autoResizeTextarea(equipmentQuestionInput));
    // Listeners Controles IA Equipo
    eqToneButtons.forEach(button => { button.addEventListener('click', () => { if (button.disabled) return; eqCurrentTone = button.dataset.tone; eqToneButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); console.log("EQ Tono:", eqCurrentTone); }); });
    eqLengthButtons.forEach(button => { button.addEventListener('click', () => { if (button.disabled) return; eqCurrentLength = button.dataset.length; eqLengthButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); console.log("EQ Longitud:", eqCurrentLength); }); });
    eqWebSearchButton.addEventListener('click', () => { if (eqWebSearchButton.disabled) return; eqUseWebSearch = !eqUseWebSearch; eqWebSearchButton.classList.toggle('active', eqUseWebSearch); console.log("EQ Web Search:", eqUseWebSearch); });
    eqRegenerateButton.addEventListener('click', () => { if (!eqRegenerateButton.disabled) { sendEquipmentQuestion(true); } });
    eqRegenerateButton.disabled = true;
    // Listeners File Upload Equipo
    eqUploadButton.addEventListener('click', () => eqFileInput.click()); // NUEVO
    eqFileInput.addEventListener('change', handleEqFiles); // NUEVO
    renderEqFileList(); // NUEVO: Renderizar lista de equipo inicial

    // Init
    const apiKeyOk = checkApiKey();
    displayMessage('Asistente', `*¡Hola!* Soy BIAmedial Assistant. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, en Panamá. Puedes subir documentos (texto, PDF, Word) o hacer preguntas. 
    \n\nPara consultas *muy* específicas de un equipo, usa la sección "Mantenimiento Específico". 
    No olvides revisar los "Tips de Mantenimiento".
    \n\n**Importante:** Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética. 
    ¿En qué puedo ayudarte hoy?`);
    if (apiKeyOk) {
      console.log(`API Key OK. Usando modelos: Chat=${CHAT_MODEL_NAME}, Tips/Equipo=${FLASH_MODEL_NAME}`);
      fetchMaintenanceTip();
      updateEquipmentUIState();
    } else {
      console.warn("API Key NO VÁLIDA o no configurada. Funcionalidad limitada.");
      updateEquipmentUIState();
    }
    autoResizeTextarea(questionInput);
    autoResizeTextarea(equipmentQuestionInput);
    console.log("Inicialización de la aplicación completada.");
  }

  initializeApp();

}); // Fin de DOMContentLoaded
