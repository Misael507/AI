# BIAmedical - Asistente Biomédico IA

BIAmedical es una aplicación web que proporciona asistencia inteligente para profesionales en ingeniería biomédica en Panamá, enfocándose en el mantenimiento de equipos médicos.

## Características Principales

- **Asistente IA**: Chatbot especializado en ingeniería biomédica y mantenimiento de equipos médicos
- **Mantenimiento Específico**: Guías detalladas para mantenimiento predictivo, preventivo y correctivo
- **Tips de Mantenimiento**: Consejos prácticos generados por IA
- **Procesamiento de Documentos**: Soporte para archivos PDF, Word y texto
- **Modo Oscuro**: Interfaz adaptable para mejor visibilidad
- **Diseño Responsivo**: Funciona en dispositivos móviles y escritorio

## Tecnologías Utilizadas

- HTML5, CSS3, JavaScript (Vanilla)
- Google Gemini API para procesamiento de IA
- PDF.js para procesamiento de PDFs
- Mammoth.js para procesamiento de documentos Word
- Markdown-it para formateo de texto
- Font Awesome para iconografía

## Configuración

1. Clona el repositorio
2. Configura las claves API en `script.js`:
   ```javascript
   const GOOGLE_API_KEY = 'TU_API_KEY';
   const GOOGLE_CSE_ID = 'TU_CSE_ID';
   const TAVILY_API_KEY = 'TU_TAVILY_KEY';
   ```
3. Abre `index.html` en un servidor web

## Estructura del Proyecto

```
├── index.html          # Página principal
├── styles.css         # Estilos CSS
├── script.js          # Lógica principal
├── lib/              # Librerías
│   └── markdown-it.min.js
└── logo.svg          # Logo de la aplicación
```

## Uso

1. Accede a la aplicación a través del navegador
2. Selecciona una sección (Asistente, Mantenimiento o Tips)
3. En el Asistente:
   - Haz preguntas sobre ingeniería biomédica
   - Sube documentos para análisis
4. En Mantenimiento:
   - Selecciona el tipo de mantenimiento
   - Especifica el equipo
   - Obtén guías detalladas
5. En Tips:
   - Recibe consejos automáticos de mantenimiento

## Notas Importantes

- Las respuestas son generadas por IA y deben ser verificadas
- Siempre sigue los protocolos de seguridad y normativas oficiales
- Se recomienda la supervisión de personal calificado

## Licencia

Todos los derechos reservados. Este proyecto es propietario y su uso está restringido.
