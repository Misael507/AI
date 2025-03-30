// --- Constantes Globales ---
const API_KEY = 'AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI'; // ¡¡¡ IMPORTANTE: REEMPLAZAR CON TU API KEY REAL !!!
const API_KEY_WARNING = "TU_API_KEY_DE_GOOGLE_GEMINI"; // Referencia para la advertencia
const CHAT_MODEL_NAME = 'gemini-2.5-pro-exp-03-25'; // Modelo principal para chat y preguntas específicas
const TIPS_MODEL_NAME = 'gemini-2.0-flash'; // Modelo más rápido para tips // CAMBIADO para usar Flash aquí
const EQUIPMENT_MODEL_NAME = CHAT_MODEL_NAME; // Reutilizamos el modelo principal para preguntas específicas

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
  const aiControls = document.getElementById('ai-controls');
  const toneButtons = aiControls?.querySelectorAll('[data-tone]'); // Añadir ? por si aiControls no existe
  const lengthButtons = aiControls?.querySelectorAll('[data-length]');
  const webSearchButton = document.getElementById('toggle-web-search-button');
  const regenerateButton = document.getElementById('regenerate-button'); // Regenerar chat

  // Tips
  const maintenanceTipsSection = document.getElementById('maintenance-tips-section');
  const maintenanceTipsContent = document.getElementById('maintenance-tips-content');
  const maintenanceTipsLoading = document.getElementById('maintenance-tips-loading');
  const maintenanceTipsError = document.getElementById('maintenance-tips-error'); // Error específico tips
  const regenerateTipButton = document.getElementById('regenerate-tip-button'); // Regenerar tip

  // Mantenimiento Específico
  const equipmentSection = document.getElementById('equipment-section');
  const equipmentNameInput = document.getElementById('equipmentName');
  const equipmentBrandInput = document.getElementById('equipmentBrand'); // Verificado
  const equipmentModelInput = document.getElementById('equipmentModel');
  const maintenanceTypeSelector = document.getElementById('maintenance-type-selector');
  const maintenanceButtons = maintenanceTypeSelector?.querySelectorAll('.maintenance-button'); // Dentro de su contenedor
  const equipmentQuestionArea = document.getElementById('equipment-question-area');
  const equipmentQuestionInput = document.getElementById('equipmentQuestionInput');
  const sendEquipmentQuestionButton = document.getElementById('sendEquipmentQuestionButton');
  const equipmentLoading = document.getElementById('equipmentLoading');
  const equipmentError = document.getElementById('equipmentError'); // Error específico equipo
  const equipmentResponseDisplay = document.getElementById('equipmentResponseDisplay');

  // Comunes / Generales
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  // --- Estado (Todas las secciones) ---
  let isDarkMode = localStorage.getItem('darkMode') === 'true';
  let uploadedFilesData = [];
  let currentTone = 'neutral';
  let currentLength = 'media';
  let useWebSearch = false;
  let lastUserPromptParts = null; // Para regenerar chat
  let lastQuestionText = ''; // Para regenerar chat
  let chatHistory = []; // Para contexto del chat
  let selectedMaintenanceType = null; // Para equipo específico

  // --- Funciones de Utilidad ---

  // Muestra errores en el contenedor especificado
  function showGeneralError(message, targetElement) {
   if (targetElement) {
    targetElement.textContent = message;
    targetElement.style.display = 'block';
    // Usar requestAnimationFrame para asegurar que display: block se aplica antes de la opacidad
    requestAnimationFrame(() => {
       requestAnimationFrame(() => { // Doble frame para mayor seguridad en algunos navegadores
        targetElement.style.opacity = '1';
      });
    });

    // No ocultar automáticamente errores de API Key
    if (!message || !message.toLowerCase().includes("api key")) {
      setTimeout(() => {
        if (targetElement) {
          targetElement.style.opacity = '0';
          // Esperar a que termine la transición antes de ocultar
          setTimeout(() => {
               if (targetElement.style.opacity === '0') { // Solo ocultar si todavía está invisible
                  targetElement.style.display = 'none';
              }
          }, 300); // 300ms = transition duration + buffer
        }
      }, 7000); // Ocultar después de 7 segundos
    }
   } else {
    console.error(`Error: Elemento de display de error no encontrado. Mensaje:`, message);
    alert("Error interno: " + message); // Fallback
   }
  }

  // Verifica la API Key y deshabilita controles en TODAS las secciones si es inválida
  function checkApiKey() {
    if (!API_KEY || API_KEY === API_KEY_WARNING) {
      const errorMsg = "Error Crítico: Configura tu API Key de Google Gemini en la variable API_KEY del código JavaScript.";
      showGeneralError(errorMsg, errorMessageDisplay); // Error en chat
      if (maintenanceTipsError) showGeneralError("Funcionalidad limitada por falta de API Key.", maintenanceTipsError); // Error en tips
      if (equipmentError) showGeneralError("Funcionalidad limitada por falta de API Key.", equipmentError); // Error en equipo

      // Deshabilitar botones críticos (verificando existencia)
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

       // Actualizar placeholders para indicar el problema
      if (questionInput) questionInput.placeholder = "Se requiere API Key...";
      if (equipmentQuestionInput) equipmentQuestionInput.placeholder = "Se requiere API Key...";


      return false;
    }
    // Si la key es válida, asegurarse que los botones estén potencialmente habilitables
    // (su estado final dependerá de otras condiciones, como si hay texto en el input)
    // Nota: No habilitamos todo aquí, solo evitamos la deshabilitación permanente por API Key.
    // La lógica de habilitación específica está en otras partes (e.g., updateEquipmentUIState).
     return true;
  }

  // --- Funciones de Formateo y Display ---

   // Aplica el modo oscuro/claro
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

   // Cambia entre modo oscuro/claro
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
  }

  // Ajusta la altura del textarea automáticamente
  function autoResizeTextarea(element = questionInput) { // Permitir pasar cualquier textarea
   if (!element) return;
   requestAnimationFrame(() => {
      try {
        const maxHeight = parseInt(window.getComputedStyle(element).maxHeight, 10) || 160;
        element.style.height = 'auto'; // Reset height
        element.style.overflowY = 'hidden'; // Hide scrollbar temporarily
        let newHeight = element.scrollHeight;

        if (newHeight > maxHeight) {
          element.style.height = maxHeight + 'px';
          element.style.overflowY = 'auto'; // Show scrollbar if needed
        } else {
          // Usar min-height como base mínima
          const minHeight = parseInt(window.getComputedStyle(element).minHeight, 10) || 50;
           element.style.height = Math.max(newHeight, minHeight) + 'px';
        }
      } catch (error) { console.error("Error en autoResizeTextarea:", error); }
    });
  }

   // Función genérica para formatear texto Markdown básico a HTML
  function formatMarkdownToHtml(text) {
   if (!text) return "<p>(Respuesta vacía)</p>";

    // 1. Escapar HTML básico para evitar inyección
    let escapedMessage = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // 2. Convertir Markdown a HTML
    let formattedMessage = escapedMessage
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
      .replace(/\*(.*?)\*/g, '<em>$1</em>')      // Cursiva
      // Bloques de código (maneja ```lenguaje\n ... ``` y ``` ... ```)
      .replace(/```(\w*\n?)([\s\S]*?)```/g, (match, lang, code) => `<pre><code class="language-${lang.trim() || 'plaintext'}">${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code>$1</code>')     // Código en línea
      // Encabezados H1-H4 (convierte a H3-H6 en la app)
      .replace(/^####\s+(.*)/gm, '<h6>$1</h6>')
      .replace(/^###\s+(.*)/gm, '<h5>$1</h5>')
      .replace(/^##\s+(.*)/gm, '<h4>$1</h4>')
      .replace(/^#\s+(.*)/gm, '<h3>$1</h3>')
      // Listas - REVISADO: Simplificado para evitar problemas de anidación compleja con regex
       .replace(/^(\s*)(\*|\-|\+)\s+(.*)/gm, (match, indent, bullet, content) => `${indent}<li>${content.trim()}</li>`)
       .replace(/^(\s*)(\d+\.)\s+(.*)/gm, (match, indent, number, content) => `${indent}<li>${content.trim()}</li>`)
       // Envolver bloques de <li> en <ul> u <ol> (heurística básica)
       .replace(/^(<li>[\s\S]*?<\/li>)/gm, (match) => {
           // Asume ul si empieza con *, -, +; ol si empieza con dígito.
           // Necesita verificar el primer item original, lo cual es difícil aquí.
           // Simplificación: Usar <ul> por defecto.
           // Una librería Markdown sería más robusta.
           if (match.includes('<ol><li>') || match.includes('<ul><li>')) return match; // Evitar doble envoltura
           return `<ul>\n${match}\n</ul>`; // Envuelve en <ul> por defecto
       })
       // Limpieza de saltos de línea extra alrededor de listas
       .replace(/<\/ul>\s*<ul>/g, '') // Fusionar listas adyacentes
       .replace(/<br>\s*<ul>/g, '<ul>')
       .replace(/<\/ul>\s*<br>/g, '</ul>')


      // Párrafos (maneja saltos de línea dobles)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>'); // Saltos de línea simples

   // 3. Envolver en <p> si no empieza con etiqueta de bloque válida
    if (!formattedMessage.trim().match(/^<(p|h[3-6]|ul|ol|pre|li|blockquote|div)/)) {
      formattedMessage = `<p>${formattedMessage}</p>`;
    }
   // 4. Limpiar párrafos vacíos resultantes
    formattedMessage = formattedMessage.replace(/<p>(<br\s*\/?>|\s)*<\/p>/g, '');
   // 5. Limpiar <br> al inicio/final de párrafos
    formattedMessage = formattedMessage.replace(/<p><br\s*\/?>/g, '<p>').replace(/<br\s*\/?>\s*<\/p>/g, '</p>');
    // 6. Limpiar <br> extras antes/después de listas/pre
    formattedMessage = formattedMessage.replace(/<br>\s*<(ul|ol|pre)/g, '<$1');
    formattedMessage = formattedMessage.replace(/<\/(ul|ol|pre)>\s*<br>/g, '</$1>');


   return formattedMessage.trim();
   }


  // Muestra un mensaje en el área del chat
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

      responseSpan.innerHTML = formatMarkdownToHtml(message); // Usar función de formateo

      messageDiv.appendChild(senderSpan);
      messageDiv.appendChild(responseSpan);
      chatMessages.appendChild(messageDiv);

      // Scroll suave al nuevo mensaje
      chatMessages.scrollTop = chatMessages.scrollHeight;
      // O usar scrollIntoView si prefieres centrar el último mensaje
      // messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

    } catch (error) {
      console.error("Error en displayMessage:", error);
      // Mostrar error en la UI de forma segura
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

  // Muestra el tip de mantenimiento en su sección
  function displayMaintenanceTip(tipText) {
    if (!maintenanceTipsContent) return;
    maintenanceTipsContent.innerHTML = ''; // Limpiar contenido anterior (incluido loading)

    const tipDiv = document.createElement('div');
    tipDiv.classList.add('tip-item');

     tipDiv.innerHTML = formatMarkdownToHtml(tipText); // Usar función de formateo

    maintenanceTipsContent.appendChild(tipDiv);
     // Forzar reflow para que la animación funcione al regenerar
     void tipDiv.offsetWidth;
     tipDiv.style.opacity = 1; // Iniciar animación desde CSS
     tipDiv.style.transform = 'translateX(0) scale(1)';
  }

  // Muestra la respuesta específica del equipo
   function displayEquipmentResponse(responseText) {
    if (!equipmentResponseDisplay) return;

     equipmentResponseDisplay.innerHTML = formatMarkdownToHtml(responseText); // Usar formateo

    equipmentResponseDisplay.style.display = 'block';
     // Forzar reflow para animación
     void equipmentResponseDisplay.offsetWidth;
     equipmentResponseDisplay.style.opacity = '1';
    // Scroll suave a la respuesta
     equipmentResponseDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
   }

  // --- Funciones de API ---

   // Función genérica para llamar a la API de Gemini
   async function callGenerativeApi(modelName, promptContents, history = null) {
    if (!checkApiKey()) {
      throw new Error("API Key no válida o no configurada.");
     }

     // CORREGIDO: Construcción correcta de la URL
     const apiUrl = `${API_BASE_URL}${modelName}:generateContent?key=${API_KEY}`;

     const generationConfig = {
          temperature: 0.8, // Ajustado ligeramente para balancear creatividad y precisión
          maxOutputTokens: modelName === TIPS_MODEL_NAME ? 4096 : 8192, // Más corto para tips
          topP: 0.95,
          topK: 50
      };
      // Ajustes específicos basados en controles (si aplica al modelo de chat/equipo)
      if (modelName !== TIPS_MODEL_NAME) {
          if (currentTone === 'formal') generationConfig.temperature = 0.4;
          if (currentTone === 'conciso' || currentLength === 'corta') generationConfig.maxOutputTokens = Math.min(generationConfig.maxOutputTokens || 2048, 512);
          if (currentLength === 'larga') generationConfig.maxOutputTokens = Math.min(generationConfig.maxOutputTokens || 2048, 4096);
      }


     const safetySettings = [
       { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
       { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ];

    // Construir el cuerpo de la solicitud
    const contents = history ? [...history, { role: "user", parts: promptContents }] : [{ role: "user", parts: promptContents }];
    const requestBody = { contents, generationConfig, safetySettings };

    console.log(`Enviando a API (${modelName}):`, JSON.stringify(requestBody, null, 2));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

    try {
       const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
       const responseBodyText = await response.text(); // Leer siempre como texto primero
        console.log(`Respuesta API (${response.status}) (${modelName}) (raw):`, responseBodyText);

        if (!response.ok) {
          let errorDetail = `HTTP ${response.status} - ${response.statusText}`;
           try {
             const errData = JSON.parse(responseBodyText);
             errorDetail = errData.error?.message || JSON.stringify(errData.error) || errorDetail;
             if (response.status === 400 && errorDetail.includes('API key not valid')) {
                 errorDetail = "API Key inválida. Verifica que sea correcta.";
                 // Intentar deshabilitar todo de nuevo por si acaso
                 checkApiKey();
             } else if (response.status === 429) {
                  errorDetail = "Límite de cuota alcanzado. Intenta de nuevo más tarde.";
              }
           } catch(e) { /* No hacer nada si no es JSON válido */ }
           throw new Error(`Error API (${modelName}): ${errorDetail}`);
         }

        const data = JSON.parse(responseBodyText); // Ahora parsear JSON

        // Verificar bloqueo por prompt
        if (data.promptFeedback?.blockReason) {
           throw new Error(`Prompt bloqueado por seguridad (${modelName}): ${data.promptFeedback.blockReason}. Motivos comunes: contenido dañino detectado.`);
         }

         // Verificar bloqueo en la respuesta o respuesta válida
         if (data.candidates && data.candidates.length > 0) {
             if (data.candidates[0].content?.parts?.[0]?.text) {
                let text = data.candidates[0].content.parts[0].text;
                 // Actualizar historial si se pasó como argumento (para el chat)
                 if (history !== null) {
                      history.push({ role: "user", parts: promptContents });
                      history.push({ role: "model", parts: [{ text: text }] });
                      // Truncar historial si es muy largo (ejemplo: 10 últimas interacciones)
                     const MAX_HISTORY_TURNS = 10;
                      if (history.length > MAX_HISTORY_TURNS * 2) {
                          history.splice(0, history.length - MAX_HISTORY_TURNS * 2); // Quita los más antiguos
                         console.log("Historial de chat truncado.");
                     }
                 }
                if (data.candidates[0].finishReason === "MAX_TOKENS") {
                    text += "\n\n[Respuesta truncada por límite de tokens]";
                } else if (data.candidates[0].finishReason === "SAFETY") {
                     text += "\n\n[Respuesta parcial. Contenido adicional bloqueado por seguridad]";
                     console.warn(`Respuesta (${modelName}) finalizada por SAFETY, pero se devolvió contenido parcial.`);
                 }
                return text;
             } else if (data.candidates[0].finishReason === "SAFETY") {
                 // Hubo candidato pero sin contenido, bloqueado totalmente
                 if (history !== null) { history.push({ role: "user", parts: promptContents }); }
                   // Proveer feedback más útil si es posible
                   let safetyRatingsInfo = "";
                   if(data.candidates[0].safetyRatings) {
                       safetyRatingsInfo = data.candidates[0].safetyRatings
                           .filter(r => r.probability !== 'NEGLIGIBLE')
                           .map(r => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`)
                           .join(', ');
                   }
                   throw new Error(`Respuesta bloqueada por motivos de seguridad (${modelName}). ${safetyRatingsInfo ? `Categorías detectadas: ${safetyRatingsInfo}` : '' }`);

             } else {
                 // Caso raro: candidato existe pero no tiene 'parts' o 'text'
                 console.warn(`Respuesta API (${modelName}) con candidato pero sin texto:`, data.candidates[0]);
                 if (history !== null) { history.push({ role: "user", parts: promptContents }); history.push({ role: "model", parts: [{ text: "(Respuesta inesperada recibida)" }] }); }
                 return `(No se generó contenido válido en ${modelName} - Candidato vacío)`;
             }

         } else {
             // No hay candidatos, verificar promptFeedback como fallback si no se capturó antes
             if (data.promptFeedback?.blockReason) {
                  throw new Error(`Prompt bloqueado (${modelName}): ${data.promptFeedback.blockReason}.`);
             }
             console.warn(`Respuesta API (${modelName}) inesperada o sin candidatos:`, data);
             if (history !== null) { history.push({ role: "user", parts: promptContents }); history.push({ role: "model", parts: [{ text: "(Respuesta vacía)" }] }); }
             return `(No se generó contenido válido en ${modelName} - Sin candidatos)`;
         }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error en callGenerativeApi (${modelName}):`, error);
        if (error.name === 'AbortError') {
          throw new Error(`Timeout en la solicitud a la IA (${modelName}).`);
         }
        throw error; // Re-lanzar para manejo específico
     }
   }

  // --- Funciones de Lógica de Aplicación ---

  // Envía mensaje en la sección de chat
  async function sendMessage(isRegeneration = false) {
    let questionTextOrParts;
    let currentPromptPartsToSend;

     // ---- Obtener pregunta y construir 'parts' ----
     if (isRegeneration) {
       if (!lastUserPromptParts || !lastQuestionText) {
         showGeneralError("No hay mensaje anterior válido para regenerar.", errorMessageDisplay);
         return;
       }
       // Usar la pregunta y 'parts' guardados
        questionTextOrParts = lastQuestionText;
        currentPromptPartsToSend = lastUserPromptParts;
       console.log("Regenerando respuesta para:", questionTextOrParts);

       // Quitar el último par user/model del historial si existe
       if (chatHistory.length >= 2 && chatHistory[chatHistory.length - 1].role === 'model' && chatHistory[chatHistory.length - 2].role === 'user') {
         chatHistory.pop(); // Quita model
         chatHistory.pop(); // Quita user
         console.log("Historial revertido para regeneración.");
       } else {
         console.warn("No se pudo revertir el historial para regeneración (¿primer mensaje?).");
       }
       // Mostrar un indicador visual de que se está regenerando
        displayMessage('Usuario', `(Regenerando...)`, true, true);

     } else {
       questionTextOrParts = questionInput.value.trim();
       if (questionTextOrParts === "" && uploadedFilesData.length === 0) return; // No enviar si no hay texto ni archivos

       lastQuestionText = questionTextOrParts; // Guardar la pregunta actual (solo texto)
        if (questionInput) {
          questionInput.value = ''; // Limpiar input
          autoResizeTextarea(questionInput);
       }
       // Mostrar pregunta del usuario (incluso si está vacía pero hay archivos)
       displayMessage('Usuario', questionTextOrParts || "(Archivos adjuntos enviados)", true);

       // Construir prompt parts
       currentPromptPartsToSend = [];
       let instrucciones = `Eres experto en ingeniería biomédica en Panamá. Responde de forma clara y útil`;
        if (useWebSearch) { instrucciones += ` (simulando búsqueda web para información actualizada)`; }
       instrucciones += `. Tono: ${currentTone}. Longitud esperada: ${currentLength}.`;
       instrucciones += ` Considera el contexto previo de esta conversación (si existe) y cualquier archivo adjunto. La pregunta/solicitud actual es: "${lastQuestionText || '(Ver archivos adjuntos)'}"`;
        currentPromptPartsToSend.push({ text: instrucciones });

       // Añadir contexto de archivos adjuntos si existen
       if (uploadedFilesData.length > 0) {
         currentPromptPartsToSend.push({ text: "\n--- Contexto Adicional de Archivos Adjuntos ---" });
          uploadedFilesData.forEach(fileData => {
            // Simplificar: añadir como texto plano. Para imágenes/otros se usaría inlineData.
             currentPromptPartsToSend.push({ text: `\n[Inicio Archivo: ${fileData.name}]\n${fileData.content}\n[Fin Archivo: ${fileData.name}]` });
          });
         currentPromptPartsToSend.push({ text: "--- Fin Contexto Archivos ---" });
         // Limpiar archivos después de usarlos para la consulta actual
          uploadedFilesData = [];
          if(fileList) fileList.innerHTML = ''; // Limpiar la lista visual
          console.log("Archivos adjuntos añadidos al prompt y limpiados.");
       }

       // Guardar los parts del usuario para posible regeneración
       lastUserPromptParts = [...currentPromptPartsToSend]; // Guardar una copia
     }

     // ---- Manejo UI y Llamada API ----
     if (loadingIndicator) loadingIndicator.style.display = 'block';
     if (errorMessageDisplay) errorMessageDisplay.style.display = 'none'; errorMessageDisplay.style.opacity = '0';
     if (sendButton) sendButton.disabled = true;
     if (regenerateButton) regenerateButton.disabled = true; // Siempre deshabilitar al enviar/regenerar

     try {
        // Llamar a la API genérica (pasando historial)
        const apiResponse = await callGenerativeApi(CHAT_MODEL_NAME, currentPromptPartsToSend, chatHistory);
        displayMessage('Asistente', apiResponse, false, isRegeneration);
        // Habilitar regenerar SOLO si la respuesta fue exitosa
         if (regenerateButton && checkApiKey()) regenerateButton.disabled = false;
     } catch (error) {
        showGeneralError(`Error al obtener respuesta del chat: ${error.message}`, errorMessageDisplay);
        // Mantener regenerar deshabilitado si hubo error
         if (regenerateButton) regenerateButton.disabled = true;
     } finally {
         // Ocultar loading, habilitar botón de enviar (si API key ok)
         if (loadingIndicator) loadingIndicator.style.display = 'none';
          // Habilitar botón de enviar solo si la key está ok
          if (sendButton && checkApiKey()) {
              sendButton.disabled = false;
          }
        // El estado del botón de regenerar se maneja en try/catch
     }
   }

   // Obtiene un nuevo tip de mantenimiento
  async function fetchMaintenanceTip() {
   // Verificar elementos necesarios
   if (!maintenanceTipsLoading || !maintenanceTipsContent || !maintenanceTipsError || !regenerateTipButton) {
      console.error("Faltan elementos DOM para la sección de Tips.");
     return;
   }

   // UI Handling inicial
   maintenanceTipsLoading.style.display = 'block';
   maintenanceTipsContent.innerHTML = ''; // Limpiar contenido anterior
   maintenanceTipsError.style.display = 'none'; maintenanceTipsError.style.opacity = '0';
   regenerateTipButton.disabled = true; // Deshabilitar mientras carga

   try {
      const tipPromptText = `Genera tres tips prácticos y concisos (máximo 3 frases cortas) sobre mantenimiento de equipos biomédicos uno predictivo, uno preventivo y uno correctivo. De cualquier equipo o situación. Hazlo útil para técnicos/ingenieros en un hospital en Panamá. Sé lo más variado posible. No repitas ningún Tip previo si es posible recordarlo (aunque no tienes memoria a largo plazo). No respondas nada adicional como saludos y despedidas, solo los tips.`;
      const tipResponse = await callGenerativeApi(TIPS_MODEL_NAME, [{ text: tipPromptText }]);
      displayMaintenanceTip(tipResponse); // Mostrar tip formateado

    } catch (error) {
      console.error("Error al obtener tip:", error.message);
      showGeneralError(`Error al cargar tip: ${error.message}`, maintenanceTipsError);
    } finally {
      maintenanceTipsLoading.style.display = 'none';
     // Habilitar botón solo si la API key sigue siendo válida
     if (checkApiKey()) {
       regenerateTipButton.disabled = false;
     }
    }
   }

   // Envía la pregunta de mantenimiento específico
  async function sendEquipmentQuestion() {
   // Validar Inputs (Nombre, Marca, Modelo, Tipo, Pregunta)
   const validationResult = validateEquipmentInputs();
   if (!validationResult) return; // validateEquipmentInputs muestra el error específico

   const { name, brand, model, type, question } = validationResult;

   // ---- Manejo UI y Llamada API ----
    if (equipmentLoading) equipmentLoading.style.display = 'block';
    if (equipmentError) { equipmentError.style.display = 'none'; equipmentError.style.opacity = '0'; }
    if (equipmentResponseDisplay) { equipmentResponseDisplay.style.display = 'none'; equipmentResponseDisplay.style.opacity = '0'; }
    if (sendEquipmentQuestionButton) sendEquipmentQuestionButton.disabled = true;
    if (maintenanceButtons) maintenanceButtons.forEach(btn => btn.disabled = true); // Deshabilitar selección mientras carga
    if (equipmentNameInput) equipmentNameInput.disabled = true;
    if (equipmentBrandInput) equipmentBrandInput.disabled = true;
    if (equipmentModelInput) equipmentModelInput.disabled = true;
    if (equipmentQuestionInput) equipmentQuestionInput.disabled = true;


     try {
      // Construir Prompt Específico para Mantenimiento
       const promptText = `Eres ingeniero biomédico experto en Panamá, proporciona información sobre el mantenimiento ${type} para el equipo "${name}", marca "${brand}", modelo "${model}". La pregunta específica es: "${question}". Enfócate en procedimientos prácticos, posibles fallas comunes relacionadas, herramientas necesarias o recomendaciones de frecuencia, según aplique al tipo de mantenimiento y la pregunta. Sé técnico pero claro. No incluyas saludos ni despedidas innecesarias.`;

      // Llamar a la API genérica (sin historial para esta sección)
      const apiResponse = await callGenerativeApi(EQUIPMENT_MODEL_NAME, [{ text: promptText }]);
      displayEquipmentResponse(apiResponse); // Mostrar respuesta formateada

    } catch (error) {
      console.error("Error consulta mantenimiento específico:", error);
      showGeneralError(`Error: ${error.message}`, equipmentError); // Mostrar error en su área
     } finally {
      // ---- Restaurar UI ----
       if (equipmentLoading) equipmentLoading.style.display = 'none';
       // Habilitar controles si la API key está OK
      if (checkApiKey()) {
        if (sendEquipmentQuestionButton) sendEquipmentQuestionButton.disabled = false;
        if (maintenanceButtons) maintenanceButtons.forEach(btn => btn.disabled = false);
        if (equipmentNameInput) equipmentNameInput.disabled = false;
        if (equipmentBrandInput) equipmentBrandInput.disabled = false;
        if (equipmentModelInput) equipmentModelInput.disabled = false;
         if (equipmentQuestionInput) equipmentQuestionInput.disabled = false; // Re-habilitar textarea
        // El estado final del textarea (habilitado/deshabilitado) y el botón Send
        // será re-evaluado por updateEquipmentUIState si el usuario cambia algo después.
        updateEquipmentUIState(); // Re-evaluar estado general de la UI de equipo
       } else {
          // Si la API key falló mientras tanto, checkApiKey ya habrá deshabilitado todo.
       }
     }
   }


   // Valida los inputs de la sección de equipo específico
   function validateEquipmentInputs() {
    if (equipmentError) { equipmentError.style.display = 'none'; equipmentError.style.opacity = '0'; } // Ocultar error previo

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

     if (errorMessage) {
      showGeneralError(errorMessage, equipmentError); // Mostrar error en su sección
      return false;
    }
    return { name, brand, model, type: selectedMaintenanceType, question };
  }

   // Actualiza el estado de la UI en la sección de equipo específico
   function updateEquipmentUIState() {
    // Si alguno de los elementos críticos no existe, salir para evitar errores
    if (!equipmentNameInput || !equipmentBrandInput || !equipmentModelInput ||
      !equipmentQuestionInput || !sendEquipmentQuestionButton || !maintenanceButtons) {
         console.warn("updateEquipmentUIState: Faltan elementos DOM críticos.");
         return;
       }

     const name = equipmentNameInput.value.trim();
     const brand = equipmentBrandInput.value.trim();
     const model = equipmentModelInput.value.trim();
     const apiKeyOk = checkApiKey(); // Usar la función unificada

     // Habilitar/Deshabilitar botones de tipo de mantenimiento basado solo en API Key
     maintenanceButtons.forEach(btn => {
       btn.disabled = !apiKeyOk;
     });

     // Habilitar Textarea y Botón de envío solo si todo está completo Y API key OK
     let enableQuestionArea = false;
     let placeholderText = "Completa Nombre, Marca, Modelo y Tipo...";

     if (!apiKeyOk) {
       placeholderText = "Se requiere API Key configurada.";
     } else if (name && brand && model && selectedMaintenanceType) {
       enableQuestionArea = true;
       // Usar comillas invertidas para template literals correctamente
       placeholderText = `Escribe tu pregunta sobre mantenimiento ${selectedMaintenanceType} para ${name} ${model}...`;
     } else if (!name || !brand || !model) {
        placeholderText = "Completa Nombre, Marca y Modelo del equipo...";
     } else if (!selectedMaintenanceType) {
        placeholderText = "Selecciona un tipo de mantenimiento...";
      }


     equipmentQuestionInput.disabled = !enableQuestionArea;
     equipmentQuestionInput.placeholder = placeholderText;
     sendEquipmentQuestionButton.disabled = !enableQuestionArea; // El botón se activa/desactiva junto con el textarea

    // Ajustar altura del textarea específico si está habilitado
    if(enableQuestionArea) {
      autoResizeTextarea(equipmentQuestionInput);
    }
   }


  // Maneja la selección de archivos
  function handleFiles(event) {
    try {
      const files = event.target.files;
      if (!files || files.length === 0 || !fileList) return;

      fileList.innerHTML = ''; // Limpiar lista anterior
      uploadedFilesData = []; // Limpiar datos anteriores
      const readPromises = [];
      const maxFiles = 5;
      const maxSizeMB = 4; // Límite más realista para contexto
      let addedFilesCount = 0;

      // Mensaje inicial de procesamiento
       if (files.length > 0) {
        fileList.innerHTML = '<li><i class="fas fa-spinner fa-spin file-icon"></i> Procesando archivos...</li>';
       }

      const allFileReaders = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeMB = file.size / 1024 / 1024;
        const li = document.createElement('li');
        let iconClass = 'fa-file-alt'; // Icono por defecto
        let statusText = ` Leyendo...`;
        let isValid = false;

        // Validaciones
        if (addedFilesCount >= maxFiles) {
           iconClass = 'fa-exclamation-triangle'; statusText = ` Omitido (Máx. ${maxFiles} archivos)`;
        } else if (!file.type.startsWith('text/plain')) {
           iconClass = 'fa-times-circle'; statusText = ` Omitido (Solo .txt)`;
        } else if (fileSizeMB > maxSizeMB) {
           iconClass = 'fa-exclamation-triangle'; statusText = ` Omitido (Máx. ${maxSizeMB}MB)`;
        } else {
          iconClass = 'fa-spinner fa-spin'; // Icono mientras lee
          statusText = ` Leyendo...`;
           isValid = true;
        }

         li.innerHTML = `<i class="fas ${iconClass} file-icon"></i> ${file.name} <small>${statusText}</small>`;
         if (i === 0) fileList.innerHTML = ''; // Limpiar mensaje inicial al añadir el primero
        fileList.appendChild(li);

        // Leer archivos válidos
        if (isValid) {
          addedFilesCount++;
          const reader = new FileReader();
          const promise = new Promise((resolve, reject) => {
            reader.onload = (e) => {
              try {
                const fileData = { name: file.name, content: e.target.result };
                uploadedFilesData.push(fileData);
                li.innerHTML = `<i class="fas fa-check-circle file-icon"></i> ${file.name} <small>(Listo)</small>`; // Icono de éxito
                resolve(fileData);
              } catch (readError) {
                 console.error(`Error procesando contenido de ${file.name}:`, readError);
                 li.innerHTML = `<i class="fas fa-times-circle file-icon"></i> ${file.name} <small>(Error lectura)</small>`;
                 reject(new Error(`Error procesando ${file.name}`));
               }
            };
            reader.onerror = (e) => {
              console.error(`Error leyendo ${file.name}:`, e);
              li.innerHTML = `<i class="fas fa-times-circle file-icon"></i> ${file.name} <small>(Error I/O)</small>`;
               reject(new Error(`Error I/O ${file.name}`));
            };
            reader.readAsText(file); // Leer como texto
          });
           readPromises.push(promise);
        }
      }

      // Esperar a que todas las lecturas terminen
      Promise.allSettled(readPromises).then((results) => {
         console.log("Procesamiento de archivos completado:", results);
         const successfulReads = results.filter(r => r.status === 'fulfilled').length;
         const failedReads = results.filter(r => r.status === 'rejected').length;
         console.log(`Archivos leídos con éxito: ${successfulReads}, Fallidos: ${failedReads}`);
         if (failedReads > 0) {
          showGeneralError("Algunos archivos no pudieron ser leídos.", errorMessageDisplay);
         }
         // Limpiar mensaje "Procesando..." si no quedó nada válido o no se seleccionó nada
         if (uploadedFilesData.length === 0 && fileList.querySelector('.fa-spinner')) {
          fileList.innerHTML = '<li><i class="fas fa-info-circle file-icon"></i> Ningún archivo .txt válido fue procesado.</li>';
         } else if (files.length === 0) {
          fileList.innerHTML = ''; // Limpiar si no se seleccionó nada
         }
       });

    } catch (error) {
      console.error("Error en handleFiles:", error);
       showGeneralError("Error inesperado al procesar archivos.", errorMessageDisplay);
       if(fileList) fileList.innerHTML = '<li><i class="fas fa-times-circle file-icon"></i> Error al procesar archivos.</li>';
    } finally {
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
       if (event?.target) {
        event.target.value = null;
      }
    }
   }

  // Configura los controles de IA (Tono, Longitud, etc.) del chat
  function setupAIControls() {
   if (!aiControls || !toneButtons || !lengthButtons || !webSearchButton || !regenerateButton) {
      console.warn("setupAIControls: Faltan elementos de control de IA.");
     return;
   }
    // Tone Buttons
   toneButtons.forEach(button => {
     button.addEventListener('click', () => {
       if (button.disabled) return;
       currentTone = button.dataset.tone;
       toneButtons.forEach(btn => btn.classList.remove('active'));
       button.classList.add('active'); console.log("Tono:", currentTone);
     });
   });
    // Length Buttons
   lengthButtons.forEach(button => {
     button.addEventListener('click', () => {
       if (button.disabled) return;
       currentLength = button.dataset.length;
       lengthButtons.forEach(btn => btn.classList.remove('active'));
       button.classList.add('active'); console.log("Longitud:", currentLength);
     });
   });
    // Web Search Button
   webSearchButton.addEventListener('click', () => {
     if (webSearchButton.disabled) return;
     useWebSearch = !useWebSearch;
     webSearchButton.classList.toggle('active', useWebSearch);
     const icon = webSearchButton.querySelector('i');
     //if (icon) icon.style.color = useWebSearch ? 'var(--success-color)' : ''; // Ejemplo
     console.log("Instrucción Web Search:", useWebSearch);
   });
    // Regenerate Button (Chat)
   regenerateButton.addEventListener('click', () => {
      if (!regenerateButton.disabled) { sendMessage(true); }
   });
    // Estado inicial deshabilitado (se habilita después de una respuesta exitosa)
   regenerateButton.disabled = true;
   }


  // --- Inicialización y Event Listeners ---
  function initializeApp() {
    console.log("Inicializando componentes...");

   // Verificar elementos esenciales para evitar errores críticos tempranos
   if (!chatMessages || !questionInput || !sendButton || !loadingIndicator || !errorMessageDisplay ||
       !maintenanceTipsContent || !maintenanceTipsLoading || !maintenanceTipsError || !regenerateTipButton ||
       !equipmentSection || !equipmentNameInput || !equipmentBrandInput || !equipmentModelInput ||
       !maintenanceButtons || !equipmentQuestionInput || !sendEquipmentQuestionButton ||
       !equipmentLoading || !equipmentError || !equipmentResponseDisplay || !darkModeToggle || !body) {
          console.error("ERROR CRÍTICO: Faltan elementos DOM esenciales. La aplicación no funcionará correctamente.");
         alert("Error: No se pudieron cargar todos los componentes de la interfaz. Revisa la consola.");
         return; // No continuar si faltan elementos clave
      }


    // Aplicar Dark Mode inicial
   applyDarkMode(isDarkMode);

   // Listeners Generales
   darkModeToggle.addEventListener('click', toggleDarkMode);

    // Listeners Chat
   sendButton.addEventListener('click', () => sendMessage(false));
   questionInput.addEventListener('keydown', (event) => {
      // Enviar con Enter (sin Shift)
      if (event.key === 'Enter' && !event.shiftKey && !sendButton.disabled) {
        event.preventDefault();
        sendMessage(false);
      }
       // Permitir autoResize ajustar incluso con Enter/Shift+Enter
        autoResizeTextarea(questionInput); // Llamar en keydown también
   });
   questionInput.addEventListener('paste', () => autoResizeTextarea(questionInput)); // Ajustar al pegar
   questionInput.addEventListener('input', () => autoResizeTextarea(questionInput)); // Ajustar al escribir
   uploadButton.addEventListener('click', () => fileInput.click());
   fileInput.addEventListener('change', handleFiles);
   setupAIControls(); // Configurar botones de Tono, Longitud, etc.

    // Listener Tips
   regenerateTipButton.addEventListener('click', fetchMaintenanceTip);

    // Listeners Mantenimiento Específico
    // 1. Cambios en inputs de texto
   [equipmentNameInput, equipmentBrandInput, equipmentModelInput].forEach(input => {
      if (input) {
         input.addEventListener('input', updateEquipmentUIState);
       }
   });
    // 2. Selección de tipo de mantenimiento
   maintenanceButtons.forEach(button => {
      button.addEventListener('click', () => {
         if (button.disabled) return;
         maintenanceButtons.forEach(btn => btn.classList.remove('active'));
         button.classList.add('active');
         selectedMaintenanceType = button.dataset.type;
         console.log("Tipo Mantenimiento Específico:", selectedMaintenanceType);
         updateEquipmentUIState(); // Actualizar estado general de UI
      });
   });
    // 3. Envío de pregunta específica
    sendEquipmentQuestionButton.addEventListener('click', sendEquipmentQuestion);
    // 4. Ajuste de altura del textarea específico
    equipmentQuestionInput.addEventListener('input', () => autoResizeTextarea(equipmentQuestionInput));
    equipmentQuestionInput.addEventListener('paste', () => autoResizeTextarea(equipmentQuestionInput));


    // Verificar API Key al inicio (esto también deshabilita controles si es necesario)
    const apiKeyOk = checkApiKey();

    // Mensaje inicial del chat
   displayMessage('Asistente', `¡Hola! Soy tu asistente biomédico IA. Puedo ayudarte con temas de ingeniería biomédica, mantenimiento (predictivo, preventivo, correctivo) y más, enfocado en Panamá. Puedes subir documentos (.txt) o hacer preguntas. Para consultas *muy* específicas de un equipo, usa la sección "Mantenimiento Específico". Revisa también los "Tips de Mantenimiento".\n\n**Importante:** Mis respuestas son generadas por IA y deben ser verificadas. Siempre sigue los protocolos de seguridad, normativas y bioética. ¿En qué puedo ayudarte hoy?`);

    // Cargar Tip inicial y establecer estado inicial Equipo si la API Key está OK
    if (apiKeyOk) {
      console.log(`API Key OK. Usando modelos: Chat/Equipo=${EQUIPMENT_MODEL_NAME}, Tips=${TIPS_MODEL_NAME}`);
      fetchMaintenanceTip(); // Cargar tip
      updateEquipmentUIState(); // Establecer estado inicial UI Equipo
     } else {
      console.warn("API Key NO VÁLIDA o no configurada. Funcionalidad limitada.");
      // Mensajes de error ya mostrados por checkApiKey()
      // updateEquipmentUIState() también reflejará el estado deshabilitado
       updateEquipmentUIState();
     }

   // Ajustar tamaño inicial de los textareas
   autoResizeTextarea(questionInput);
   autoResizeTextarea(equipmentQuestionInput);

   console.log("Inicialización de la aplicación completada.");
  }

  // Iniciar la aplicación
  initializeApp();

}); // Fin de DOMContentLoaded