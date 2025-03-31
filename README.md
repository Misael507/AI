# Asistente Biomédico IA Moderna

Este proyecto es una plataforma web que integra un asistente de inteligencia artificial (IA) diseñado para apoyar a ingenieros y técnicos biomédicos, especialmente en el contexto de Panamá. La aplicación ofrece funcionalidades de chat, generación de tips de mantenimiento y consultas específicas sobre equipos médicos.

## Características Principales

*   **Asistente de Chat con IA:**
    *   Responde preguntas generales sobre ingeniería biomédica, mantenimiento (predictivo, preventivo y correctivo), normativas, y más.
    *   Permite ajustar el tono (neutro, formal, conciso) y la longitud de las respuestas (corta, media, larga).
    *   Simula búsquedas web para obtener información actualizada (opcional).
    *   Permite subir archivos de texto (.txt) para proporcionar contexto adicional a las consultas.
    *   Ofrece la opción de regenerar la última respuesta.
    *   Mantiene un historial de la conversación para un mejor contexto.
*   **Mantenimiento Específico:**
    *   Permite realizar consultas detalladas sobre el mantenimiento de equipos biomédicos específicos.
    *   Requiere ingresar el nombre, marca y modelo del equipo.
    *   Permite seleccionar el tipo de mantenimiento (predictivo, preventivo o correctivo).
    *   Genera respuestas enfocadas en procedimientos prácticos, posibles fallas, herramientas necesarias y recomendaciones de frecuencia.
*   **Tips de Mantenimiento:**
    *   Genera tips prácticos y concisos sobre mantenimiento de equipos biomédicos.
    *   Ofrece la opción de regenerar un nuevo tip.
    *   Incluye tips sobre mantenimiento predictivo, preventivo y correctivo.
*   **Interfaz Moderna e Intuitiva:**
    *   Diseño atractivo y fácil de usar.
    *   Modo oscuro/claro seleccionable.
    *   Animaciones y transiciones suaves.
    *   Adaptable a diferentes tamaños de pantalla (responsive).
* **Manejo de Errores:**
    * Muestra mensajes de error claros y específicos en cada sección.
    * Detecta y advierte sobre la falta de una API Key válida.
    * Maneja errores de conexión y timeouts.
    * Valida los inputs del usuario.
* **Seguridad:**
    * Escapa el HTML en las respuestas para evitar inyección de código.
    * Utiliza ajustes de seguridad en la API para bloquear contenido dañino.
    * Ofrece feedback sobre respuestas bloqueadas por seguridad.
* **Optimización:**
    * Usa diferentes modelos de IA para chat y tips, optimizando velocidad y costo.
    * Limita el tamaño de los archivos subidos y el número de archivos.
    * Trunca el historial del chat para evitar prompts demasiado largos.

## Tecnologías Utilizadas

*   **HTML5:** Estructura del documento.
*   **CSS3:** Estilos y diseño visual.
*   **JavaScript:** Lógica de la aplicación, interacciones y llamadas a la API.
*   **Google Gemini API:** Generación de texto por IA.
*   **Font Awesome:** Iconos.
*   **Google Fonts:** Fuentes web.

## Instalación y Uso

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    ```
2.  **Configurar la API Key:**
    *   Obtén una API Key de Google Gemini.
    *   Abre el archivo `script.js`.
    *   Reemplaza `AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI` en la línea `const API_KEY = 'AIzaSyD9FyPqqUhh53xy9CQTnQPZuHDkF-trWTI';` con tu API Key real.
    *   **IMPORTANTE:** No compartas tu API Key en repositorios públicos. Considera usar variables de entorno para mayor seguridad.
3.  **Abrir `index.html`:** Abre el archivo `index.html` en tu navegador web.

## Estructura de Archivos

*   `index.html`: Archivo principal HTML.
*   `style.css`: Archivo de estilos CSS.
*   `script.js`: Archivo de lógica JavaScript.
*   `README.md`: Este archivo.

## Consideraciones

*   **API Key:** Es **imprescindible** configurar una API Key válida para que la aplicación funcione correctamente. Sin ella, las funcionalidades de IA estarán deshabilitadas.
*   **Limitaciones de la IA:** Las respuestas generadas por la IA deben ser verificadas. La aplicación es una herramienta de apoyo, no un sustituto del conocimiento y la experiencia de un profesional.
*   **Seguridad:** Siempre sigue los protocolos de seguridad, normativas y bioética.
* **Archivos:** Solo se admiten archivos de texto plano (.txt).
* **Tamaño de Archivos:** El tamaño máximo por archivo es de 4MB.
* **Número de Archivos:** Se pueden subir hasta 5 archivos a la vez.
* **Historial:** El historial del chat se trunca a las últimas 10 interacciones.

## Mejoras Futuras

*   Soporte para más tipos de archivos (PDF, imágenes).
*   Integración con bases de datos de equipos médicos.
*   Mejoras en la interfaz de usuario.
*   Implementación de un sistema de autenticación.
*   Mayor personalización de la IA.
*   Optimización de la velocidad de respuesta.
*   Implementación de variables de entorno para la API Key.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar, por favor, crea un *fork* del repositorio y envía un *pull request* con tus cambios.

## Licencia

Este proyecto no cuenta con licencia.
