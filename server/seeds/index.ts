import db from '../database.js';
import { v4 as uuid } from 'uuid';

/**
 * Seeds the database with preset equipment and templates for common lab equipment.
 * Only runs if the equipment table is empty.
 */
export function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as count FROM equipment').get() as { count: number };
  if (count.count > 0) {
    console.log('ℹ️  Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database with preset equipment and templates...');

  const equipmentData = [
    // Hematología
    { id: uuid(), name: 'Mindray BC-5150', brand: 'Mindray', model: 'BC-5150', category: 'hematology', description: 'Analizador hematológico automatizado de 5 partes diferencial' },
    { id: uuid(), name: 'Mindray BC-20', brand: 'Mindray', model: 'BC-20', category: 'hematology', description: 'Analizador hematológico de 3 partes diferencial' },
    { id: uuid(), name: 'Sysmex XN-1000', brand: 'Sysmex', model: 'XN-1000', category: 'hematology', description: 'Analizador hematológico automatizado multiparamétrico' },
    { id: uuid(), name: 'Sysmex XP-300', brand: 'Sysmex', model: 'XP-300', category: 'hematology', description: 'Analizador hematológico compacto de 3 partes' },
    { id: uuid(), name: 'Abbott CELL-DYN Ruby', brand: 'Abbott', model: 'CELL-DYN Ruby', category: 'hematology', description: 'Analizador hematológico automatizado' },

    // Química Clínica
    { id: uuid(), name: 'Mindray BS-380', brand: 'Mindray', model: 'BS-380', category: 'chemistry', description: 'Analizador de química clínica automatizado' },
    { id: uuid(), name: 'Mindray BS-240 Pro', brand: 'Mindray', model: 'BS-240 Pro', category: 'chemistry', description: 'Analizador de química clínica de mesa' },
    { id: uuid(), name: 'Beckman AU680', brand: 'Beckman Coulter', model: 'AU680', category: 'chemistry', description: 'Analizador de química clínica de alto rendimiento' },
    { id: uuid(), name: 'Roche Cobas c311', brand: 'Roche', model: 'Cobas c311', category: 'chemistry', description: 'Analizador de química clínica automatizado' },
    { id: uuid(), name: 'Siemens Dimension RxL', brand: 'Siemens', model: 'Dimension RxL', category: 'chemistry', description: 'Sistema integrado de química e inmunología' },

    // Inmunología
    { id: uuid(), name: 'Mindray CL-900i', brand: 'Mindray', model: 'CL-900i', category: 'immunology', description: 'Analizador de quimioluminiscencia' },
    { id: uuid(), name: 'Abbott Architect i1000SR', brand: 'Abbott', model: 'Architect i1000SR', category: 'immunology', description: 'Sistema de inmunoensayo automatizado' },
    { id: uuid(), name: 'Roche Cobas e411', brand: 'Roche', model: 'Cobas e411', category: 'immunology', description: 'Analizador de inmunoensayo por electroquimioluminiscencia' },
    { id: uuid(), name: 'Siemens ADVIA Centaur XP', brand: 'Siemens', model: 'ADVIA Centaur XP', category: 'immunology', description: 'Analizador de inmunoensayo automatizado' },

    // Serología
    { id: uuid(), name: 'Bio-Rad Evolis', brand: 'Bio-Rad', model: 'Evolis', category: 'serology', description: 'Sistema automatizado de ELISA' },
    { id: uuid(), name: 'DiaSorin LIAISON', brand: 'DiaSorin', model: 'LIAISON', category: 'serology', description: 'Analizador de quimioluminiscencia para serología' },

    // Uroanálisis
    { id: uuid(), name: 'Siemens Clinitek Advantus', brand: 'Siemens', model: 'Clinitek Advantus', category: 'urinalysis', description: 'Analizador de tiras reactivas de orina' },
    { id: uuid(), name: 'Sysmex UF-1000i', brand: 'Sysmex', model: 'UF-1000i', category: 'urinalysis', description: 'Analizador de sedimento urinario por citometría de flujo' },
    { id: uuid(), name: 'Roche Cobas u601', brand: 'Roche', model: 'Cobas u601', category: 'urinalysis', description: 'Analizador automatizado de orina' },

    // Coagulación
    { id: uuid(), name: 'Sysmex CS-2500', brand: 'Sysmex', model: 'CS-2500', category: 'coagulation', description: 'Analizador de coagulación automatizado de alto rendimiento' },
    { id: uuid(), name: 'Stago STA Compact Max', brand: 'Stago', model: 'STA Compact Max', category: 'coagulation', description: 'Analizador de hemostasia automatizado' },
    { id: uuid(), name: 'Siemens BCS XP', brand: 'Siemens', model: 'BCS XP', category: 'coagulation', description: 'Sistema de coagulación automatizado' },

    // Banco de Sangre
    { id: uuid(), name: 'Bio-Rad IH-500', brand: 'Bio-Rad', model: 'IH-500', category: 'blood_bank', description: 'Sistema automatizado de inmunohematología' },
    { id: uuid(), name: 'Ortho Vision', brand: 'Ortho Clinical', model: 'Vision', category: 'blood_bank', description: 'Analizador automatizado de banco de sangre' },

    // Gases Arteriales
    { id: uuid(), name: 'Radiometer ABL90 FLEX', brand: 'Radiometer', model: 'ABL90 FLEX', category: 'gases', description: 'Analizador de gases en sangre y electrolitos' },
    { id: uuid(), name: 'Siemens RAPIDPoint 500', brand: 'Siemens', model: 'RAPIDPoint 500', category: 'gases', description: 'Analizador de gases en sangre POC' },

    // Microbiología
    { id: uuid(), name: 'bioMérieux VITEK 2', brand: 'bioMérieux', model: 'VITEK 2', category: 'microbiology', description: 'Sistema automatizado de identificación y antibiograma' },
    { id: uuid(), name: 'BD BACTEC FX', brand: 'BD', model: 'BACTEC FX', category: 'microbiology', description: 'Sistema automatizado de hemocultivos' },
  ];

  const insertEquipment = db.prepare(`
    INSERT INTO equipment (id, name, brand, model, category, description) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const eq of equipmentData) {
    insertEquipment.run(eq.id, eq.name, eq.brand, eq.model, eq.category, eq.description);
  }

  // Create detailed template for Mindray BC-5150
  const bc5150 = equipmentData.find(e => e.model === 'BC-5150')!;
  const bc5150Template = {
    id: uuid(),
    equipmentId: bc5150.id,
    name: 'Mantenimiento Preventivo Mensual',
    serviceType: 'preventive_maintenance',
    blocks: JSON.stringify([
      {
        id: uuid(),
        title: 'Inspección Visual General',
        description: 'Verificación del estado físico general del equipo',
        order: 1,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Estado de carcasa exterior', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Estado de cables de alimentación', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Estado de pantalla/display', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Estado de impresora interna', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: false, placeholder: '' },
          { id: uuid(), label: 'Observaciones visuales', type: 'textarea', options: [], unit: '', defaultValue: '', isRequired: false, placeholder: 'Describa cualquier anomalía visual encontrada...' },
        ]
      },
      {
        id: uuid(),
        title: 'Limpieza del Sistema Neumático',
        description: 'Mantenimiento del sistema de presión y vacío',
        order: 2,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Presión positiva del sistema', type: 'measurement', options: [], unit: 'kPa', defaultValue: '', isRequired: true, placeholder: 'Ej: 23.5' },
          { id: uuid(), label: 'Presión de vacío', type: 'measurement', options: [], unit: 'kPa', defaultValue: '', isRequired: true, placeholder: 'Ej: -45.2' },
          { id: uuid(), label: 'Estado de filtros de aire', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Limpieza de líneas neumáticas', type: 'checkbox', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Reemplazo de filtro necesario', type: 'select', options: ['No', 'Sí - Próximo mantenimiento', 'Sí - Urgente'], unit: '', defaultValue: 'No', isRequired: true, placeholder: '' },
        ]
      },
      {
        id: uuid(),
        title: 'Limpieza del Sistema Fluídico',
        description: 'Mantenimiento del sistema de aspiración y distribución de muestra',
        order: 3,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Limpieza de aguja de muestreo', type: 'checkbox', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Estado de tubería de muestra', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Estado de válvulas de distribución', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Volumen de aspiración verificado', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Ciclo de limpieza con diluente', type: 'checkbox', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        ]
      },
      {
        id: uuid(),
        title: 'Calibración de Contadores',
        description: 'Verificación y ajuste de calibración de los canales de medición',
        order: 4,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Calibrador utilizado (Lote)', type: 'text', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: 'Ej: CAL-LOT-2026-001' },
          { id: uuid(), label: 'Fecha de caducidad del calibrador', type: 'date', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Resultado Cal-Lo', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Resultado Cal-Normal', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Resultado Cal-Hi', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        ]
      },
      {
        id: uuid(),
        title: 'Verificación de Reactivos',
        description: 'Control de estado y vigencia de reactivos del equipo',
        order: 5,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Diluente - Nivel', type: 'select', options: ['Lleno', 'Medio', 'Bajo', 'Vacío'], unit: '', defaultValue: 'Lleno', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Diluente - Lote', type: 'text', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Lyse - Nivel', type: 'select', options: ['Lleno', 'Medio', 'Bajo', 'Vacío'], unit: '', defaultValue: 'Lleno', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Lyse - Lote', type: 'text', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Cleanser - Nivel', type: 'select', options: ['Lleno', 'Medio', 'Bajo', 'Vacío'], unit: '', defaultValue: 'Lleno', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Fecha de caducidad más próxima', type: 'date', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        ]
      },
      {
        id: uuid(),
        title: 'Control de Calidad',
        description: 'Resultados de controles de calidad tras el mantenimiento',
        order: 6,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Control utilizado (Lote)', type: 'text', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'WBC', type: 'measurement', options: [], unit: '10³/µL', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'RBC', type: 'measurement', options: [], unit: '10⁶/µL', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'HGB', type: 'measurement', options: [], unit: 'g/dL', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'HCT', type: 'measurement', options: [], unit: '%', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'PLT', type: 'measurement', options: [], unit: '10³/µL', defaultValue: '', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Resultado general QC', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        ]
      },
      {
        id: uuid(),
        title: 'Observaciones y Firma',
        description: 'Notas finales y firma del técnico responsable',
        order: 7,
        isRequired: true,
        variables: [
          { id: uuid(), label: 'Estado general del equipo', type: 'select', options: ['Operativo', 'Operativo con observaciones', 'Fuera de servicio'], unit: '', defaultValue: 'Operativo', isRequired: true, placeholder: '' },
          { id: uuid(), label: 'Observaciones generales', type: 'textarea', options: [], unit: '', defaultValue: '', isRequired: false, placeholder: 'Notas adicionales sobre el mantenimiento realizado...' },
          { id: uuid(), label: 'Firma del técnico', type: 'signature', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        ]
      },
    ]),
    isDefault: 1,
  };

  db.prepare(`
    INSERT INTO templates (id, equipment_id, name, service_type, blocks, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bc5150Template.id, bc5150Template.equipmentId, bc5150Template.name, bc5150Template.serviceType, bc5150Template.blocks, bc5150Template.isDefault);

  // Create generic preventive maintenance template for Chemistry (BS-380)
  const bs380 = equipmentData.find(e => e.model === 'BS-380')!;
  const bs380TemplateId = uuid();
  db.prepare(`
    INSERT INTO templates (id, equipment_id, name, service_type, blocks, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bs380TemplateId, bs380.id, 'Mantenimiento Preventivo', 'preventive_maintenance', JSON.stringify([
    {
      id: uuid(), title: 'Inspección General', description: 'Verificación visual del equipo', order: 1, isRequired: true,
      variables: [
        { id: uuid(), label: 'Estado de carcasa', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Estado del brazo de muestreo', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Estado de cubetas de reacción', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
      ]
    },
    {
      id: uuid(), title: 'Limpieza Óptica', description: 'Limpieza del sistema fotométrico', order: 2, isRequired: true,
      variables: [
        { id: uuid(), label: 'Limpieza de lámpara halógena', type: 'checkbox', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Horas de uso de lámpara', type: 'measurement', options: [], unit: 'horas', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Verificación de absorbancia agua', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
      ]
    },
    {
      id: uuid(), title: 'Sistema de Lavado', description: 'Verificación del sistema de lavado de cubetas', order: 3, isRequired: true,
      variables: [
        { id: uuid(), label: 'Ciclo de lavado completado', type: 'checkbox', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Nivel de agua desionizada', type: 'select', options: ['Lleno', 'Medio', 'Bajo'], unit: '', defaultValue: 'Lleno', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Estado de agujas de lavado', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
      ]
    },
    {
      id: uuid(), title: 'Calibración y QC', description: 'Verificación de calibración y controles', order: 4, isRequired: true,
      variables: [
        { id: uuid(), label: 'Calibración de glucosa', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Calibración de creatinina', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Control Normal', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
        { id: uuid(), label: 'Control Patológico', type: 'pass_fail', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
      ]
    },
    {
      id: uuid(), title: 'Observaciones y Firma', description: '', order: 5, isRequired: true,
      variables: [
        { id: uuid(), label: 'Observaciones', type: 'textarea', options: [], unit: '', defaultValue: '', isRequired: false, placeholder: '' },
        { id: uuid(), label: 'Firma del técnico', type: 'signature', options: [], unit: '', defaultValue: '', isRequired: true, placeholder: '' },
      ]
    },
  ]), 1);

  console.log(`✅ Seeded ${equipmentData.length} equipment and 2 templates`);
}
