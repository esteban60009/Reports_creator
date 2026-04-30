import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for PDF uploads (memory storage - no need to save)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
});

const router = Router();

/**
 * POST /api/ai/analyze-pdf
 * Receives a PDF, extracts text with pdf-parse, then sends to Gemini AI
 * for maintenance phase extraction.
 */
router.post('/analyze-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo PDF' });
  }

  const { equipmentName } = req.body;

  try {
    // 1. Extract text from PDF
    let extractedText = '';
    try {
      // Dynamic import to handle ESM/CJS compatibility issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } catch (parseErr: any) {
      console.error('PDF parse error:', parseErr.message);
      return res.status(422).json({ error: 'No se pudo leer el PDF. Asegúrese de que no sea un PDF escaneado o protegido.' });
    }

    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(422).json({
        error: 'El PDF no contiene texto legible. Podría ser un PDF escaneado o de imágenes.',
      });
    }

    // 2. Limit text to ~12000 chars to stay within token limits
    const truncatedText = extractedText.slice(0, 12000);

    // 3. Check for Gemini API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      // Return a demo extraction if no API key configured
      return res.json(generateDemoBlocks(equipmentName, truncatedText));
    }

    // 4. Call Gemini AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(equipmentName || 'equipo médico', truncatedText);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 5. Parse the JSON response from Gemini
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\])/);
    if (!jsonMatch) {
      throw new Error('La IA no devolvió un formato JSON válido');
    }

    const blocks = JSON.parse(jsonMatch[1]);
    return res.json({ blocks, pageCount: extractedText.length > 12000 ? 'truncated' : 'full' });
  } catch (err: any) {
    console.error('AI analysis error:', err.message);
    return res.status(500).json({
      error: `Error al analizar el PDF: ${err.message}`,
    });
  }
});

function buildPrompt(equipmentName: string, text: string): string {
  return `Eres un experto en mantenimiento de equipos médicos de laboratorio.

El siguiente texto fue extraído del manual de servicio/mantenimiento del equipo: "${equipmentName}".

Analiza el texto y extrae TODAS las fases o pasos de mantenimiento preventivo o correctivo que encuentres.
Crea bloques estructurados con variables específicas para cada fase.

Para cada bloque (fase de mantenimiento) incluye:
- title: nombre claro del procedimiento
- description: breve descripción del propósito
- variables: lista de verificaciones/mediciones específicas

Para las variables usa estos tipos:
- "pass_fail": para verificaciones de estado (aprobado/falla)
- "measurement": para valores numéricos con unidades
- "checkbox": para pasos de procedimiento (se hizo o no)
- "text": para campos de texto libre
- "select": para seleccionar entre opciones
- "textarea": para observaciones o notas extensas
- "date": para fechas
- "signature": para firmas

Responde ÚNICAMENTE con JSON válido, sin texto adicional, en este formato exacto:

\`\`\`json
[
  {
    "title": "Nombre del Bloque",
    "description": "Descripción breve",
    "isRequired": true,
    "variables": [
      {
        "label": "Nombre del campo",
        "type": "pass_fail",
        "isRequired": true,
        "unit": "",
        "options": [],
        "placeholder": "",
        "defaultValue": ""
      }
    ]
  }
]
\`\`\`

Texto del manual:
---
${text}
---

Extrae máximo 10 bloques con máximo 8 variables cada uno. Sé específico y usa terminología técnica del manual.`;
}

function generateDemoBlocks(equipmentName: string, text: string) {
  // Smart demo extraction: scan for maintenance-related keywords in the PDF text
  const textLower = text.toLowerCase();
  const blocks: any[] = [];

  const sectionPatterns = [
    { keywords: ['inspect', 'visual', 'exterior', 'carcasa', 'housing'], title: 'Inspección Visual General', description: 'Verificación del estado físico exterior del equipo' },
    { keywords: ['clean', 'limpi', 'wash', 'flush', 'purge', 'purga'], title: 'Limpieza del Sistema', description: 'Procedimiento de limpieza de componentes internos y externos' },
    { keywords: ['calibrat', 'calibra', 'adjust', 'ajust', 'verificat', 'verific'], title: 'Calibración y Verificación', description: 'Ajuste y calibración de los sistemas de medición' },
    { keywords: ['reagent', 'reactivo', 'diluent', 'diluy', 'solution', 'soluci'], title: 'Control de Reactivos', description: 'Verificación del estado y vigencia de reactivos' },
    { keywords: ['qualit', 'control', 'qc ', 'control de calidad'], title: 'Control de Calidad', description: 'Verificación mediante controles de calidad certificados' },
    { keywords: ['replac', 'reemplaz', 'cambio', 'change', 'filter', 'filtro'], title: 'Reemplazo de Componentes', description: 'Sustitución programada de piezas de desgaste' },
    { keywords: ['pressure', 'presion', 'presión', 'vacuum', 'vacio', 'vacío', 'neumati'], title: 'Sistema Neumático', description: 'Verificación del sistema de presión y vacío' },
    { keywords: ['optical', 'optic', 'óptic', 'lamp', 'lampara', 'light', 'absorbance'], title: 'Sistema Óptico', description: 'Verificación y limpieza del sistema fotométrico' },
    { keywords: ['fluid', 'fluidi', 'tubing', 'tuberi', 'pump', 'bomba'], title: 'Sistema Fluídico', description: 'Inspección de tuberías, válvulas y sistema de muestreo' },
    { keywords: ['error', 'alarm', 'log', 'registr', 'incident'], title: 'Registro de Incidencias', description: 'Documentación de errores y alarmas del sistema' },
  ];

  for (const pattern of sectionPatterns) {
    const found = pattern.keywords.some(kw => textLower.includes(kw));
    if (found) {
      blocks.push(generateBlockForPattern(pattern, equipmentName));
    }
    if (blocks.length >= 7) break;
  }

  // Always add a signature block
  blocks.push({
    title: 'Observaciones y Firma',
    description: 'Notas finales del técnico y firma de conformidad',
    isRequired: true,
    variables: [
      { label: 'Estado general del equipo', type: 'select', isRequired: true, options: ['Operativo', 'Operativo con observaciones', 'Requiere atención', 'Fuera de servicio'], unit: '', placeholder: '', defaultValue: 'Operativo' },
      { label: 'Observaciones generales', type: 'textarea', isRequired: false, options: [], unit: '', placeholder: 'Describa el trabajo realizado y cualquier anomalía detectada...', defaultValue: '' },
      { label: 'Firma del técnico responsable', type: 'signature', isRequired: true, options: [], unit: '', placeholder: '', defaultValue: '' },
    ],
  });

  return {
    blocks,
    pageCount: 'demo',
    message: 'Se generaron bloques basados en el contenido del PDF. Para análisis completo con IA, configura GEMINI_API_KEY en el servidor.',
  };
}

function generateBlockForPattern(pattern: any, equipmentName: string) {
  const varsByTitle: Record<string, any[]> = {
    'Inspección Visual General': [
      { label: 'Estado de carcasa exterior', type: 'pass_fail', isRequired: true },
      { label: 'Estado de cables y conectores', type: 'pass_fail', isRequired: true },
      { label: 'Estado de pantalla / display', type: 'pass_fail', isRequired: true },
      { label: 'Fugas visibles de líquido', type: 'pass_fail', isRequired: true },
      { label: 'Observaciones visuales', type: 'textarea', isRequired: false, placeholder: 'Describa cualquier anomalía encontrada...' },
    ],
    'Limpieza del Sistema': [
      { label: 'Limpieza exterior completada', type: 'checkbox', isRequired: true },
      { label: 'Limpieza de aguja de muestreo', type: 'checkbox', isRequired: true },
      { label: 'Ciclo de limpieza interno ejecutado', type: 'checkbox', isRequired: true },
      { label: 'Tipo de solución limpiadora usada', type: 'text', isRequired: false, placeholder: 'Ej: Cleaner A, Diluente' },
    ],
    'Calibración y Verificación': [
      { label: 'Calibrador utilizado (Lote)', type: 'text', isRequired: true, placeholder: 'Número de lote del calibrador' },
      { label: 'Fecha de vencimiento del calibrador', type: 'date', isRequired: true },
      { label: 'Resultado de calibración', type: 'pass_fail', isRequired: true },
      { label: 'Coeficiente de correlación obtenido', type: 'measurement', isRequired: false, unit: 'R²', placeholder: 'Ej: 0.9998' },
    ],
    'Control de Reactivos': [
      { label: 'Reactivo principal — Nivel', type: 'select', isRequired: true, options: ['Lleno (>75%)', 'Medio (25-75%)', 'Bajo (<25%)', 'Vacío'] },
      { label: 'Reactivo principal — Lote', type: 'text', isRequired: true, placeholder: 'Número de lote' },
      { label: 'Fecha de vencimiento más próxima', type: 'date', isRequired: true },
      { label: 'Todos los reactivos vigentes', type: 'pass_fail', isRequired: true },
    ],
    'Control de Calidad': [
      { label: 'Nivel del control QC', type: 'select', isRequired: true, options: ['Normal', 'Bajo', 'Alto', 'Patológico'] },
      { label: 'Lote del control', type: 'text', isRequired: true, placeholder: 'Número de lote' },
      { label: 'Resultado dentro de rango aceptable', type: 'pass_fail', isRequired: true },
      { label: 'Desviación estándar (CV%)', type: 'measurement', isRequired: false, unit: '%', placeholder: 'Ej: 2.3' },
    ],
    'Sistema Neumático': [
      { label: 'Presión positiva del sistema', type: 'measurement', isRequired: true, unit: 'kPa', placeholder: 'Ej: 23.5' },
      { label: 'Presión de vacío', type: 'measurement', isRequired: true, unit: 'kPa', placeholder: 'Ej: -45.2' },
      { label: 'Estado de filtros de aire', type: 'pass_fail', isRequired: true },
      { label: 'Limpieza de líneas neumáticas', type: 'checkbox', isRequired: true },
    ],
    'Sistema Óptico': [
      { label: 'Horas de uso de la lámpara', type: 'measurement', isRequired: true, unit: 'horas', placeholder: 'Ej: 1250' },
      { label: 'Limpieza de lámpara realizada', type: 'checkbox', isRequired: true },
      { label: 'Verificación absorbancia con agua', type: 'pass_fail', isRequired: true },
      { label: 'Absorbancia medida', type: 'measurement', isRequired: false, unit: 'Abs', placeholder: 'Ej: 0.002' },
    ],
    'Sistema Fluídico': [
      { label: 'Estado de tubería de muestra', type: 'pass_fail', isRequired: true },
      { label: 'Fugas en conexiones', type: 'pass_fail', isRequired: true },
      { label: 'Estado de válvulas de distribución', type: 'pass_fail', isRequired: true },
      { label: 'Volumen de aspiración correcto', type: 'pass_fail', isRequired: true },
    ],
    'Reemplazo de Componentes': [
      { label: 'Componente reemplazado', type: 'text', isRequired: false, placeholder: 'Nombre o código de la pieza' },
      { label: 'Número de parte / Lote', type: 'text', isRequired: false, placeholder: 'Ej: PART-00123' },
      { label: 'Reemplazo fue necesario', type: 'pass_fail', isRequired: false },
      { label: 'Próxima fecha de reemplazo programado', type: 'date', isRequired: false },
    ],
    'Registro de Incidencias': [
      { label: 'Errores o alarmas registrados', type: 'select', isRequired: true, options: ['Sin errores', '1 error menor', 'Múltiples errores', 'Error crítico'] },
      { label: 'Código de error (si aplica)', type: 'text', isRequired: false, placeholder: 'Ej: E-04, F-012' },
      { label: 'Se realizó acción correctiva', type: 'checkbox', isRequired: false },
      { label: 'Descripción de la incidencia', type: 'textarea', isRequired: false, placeholder: 'Detalle los errores encontrados y acciones tomadas...' },
    ],
  };

  const variables = varsByTitle[pattern.title] || [
    { label: 'Verificación completada', type: 'pass_fail', isRequired: true },
    { label: 'Observaciones', type: 'textarea', isRequired: false, placeholder: 'Notas...' },
  ];

  return {
    title: pattern.title,
    description: pattern.description,
    isRequired: true,
    variables: variables.map((v: any) => ({
      label: v.label,
      type: v.type,
      isRequired: v.isRequired ?? false,
      unit: v.unit ?? '',
      options: v.options ?? [],
      placeholder: v.placeholder ?? '',
      defaultValue: v.defaultValue ?? '',
    })),
  };
}

export default router;
