import { Router } from 'express';
import db, { getNextReportNumber } from '../database.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET all reports with optional filters
router.get('/', (req, res) => {
  const { equipmentId, status, technician, from, to } = req.query;
  let query = 'SELECT * FROM reports WHERE 1=1';
  const params: any[] = [];

  if (equipmentId) { query += ' AND equipment_id = ?'; params.push(equipmentId); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (technician) { query += ' AND technician LIKE ?'; params.push(`%${technician}%`); }
  if (from) { query += ' AND service_date >= ?'; params.push(from); }
  if (to) { query += ' AND service_date <= ?'; params.push(to); }

  query += ' ORDER BY created_at DESC';

  const reports = db.prepare(query).all(...params);
  const mapped = reports.map((r: any) => ({
    id: r.id,
    reportNumber: r.report_number,
    equipmentId: r.equipment_id,
    equipmentName: r.equipment_name,
    templateId: r.template_id,
    templateName: r.template_name,
    serviceType: r.service_type,
    status: r.status,
    technician: r.technician,
    supervisorName: r.supervisor_name,
    serviceDate: r.service_date,
    nextServiceDate: r.next_service_date,
    generalObservations: r.general_observations,
    blocks: JSON.parse(r.blocks),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(mapped);
});

// GET report by ID
router.get('/:id', (req, res) => {
  const r: any = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Report not found' });
  res.json({
    id: r.id,
    reportNumber: r.report_number,
    equipmentId: r.equipment_id,
    equipmentName: r.equipment_name,
    templateId: r.template_id,
    templateName: r.template_name,
    serviceType: r.service_type,
    status: r.status,
    technician: r.technician,
    supervisorName: r.supervisor_name,
    serviceDate: r.service_date,
    nextServiceDate: r.next_service_date,
    generalObservations: r.general_observations,
    blocks: JSON.parse(r.blocks),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });
});

// POST create report
router.post('/', (req, res) => {
  const {
    equipmentId, equipmentName, templateId, templateName,
    serviceType, status, technician, supervisorName,
    serviceDate, nextServiceDate, generalObservations, blocks
  } = req.body;

  const id = uuid();
  const reportNumber = getNextReportNumber();

  db.prepare(`
    INSERT INTO reports (id, report_number, equipment_id, equipment_name, template_id, template_name,
      service_type, status, technician, supervisor_name, service_date, next_service_date,
      general_observations, blocks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, reportNumber, equipmentId, equipmentName || '', templateId, templateName || '',
    serviceType, status || 'draft', technician || '', supervisorName || '',
    serviceDate, nextServiceDate || '', generalObservations || '', JSON.stringify(blocks || [])
  );

  const created: any = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id,
    reportNumber: created.report_number,
    equipmentId: created.equipment_id,
    equipmentName: created.equipment_name,
    templateId: created.template_id,
    templateName: created.template_name,
    serviceType: created.service_type,
    status: created.status,
    technician: created.technician,
    supervisorName: created.supervisor_name,
    serviceDate: created.service_date,
    nextServiceDate: created.next_service_date,
    generalObservations: created.general_observations,
    blocks: JSON.parse(created.blocks),
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  });
});

// PUT update report
router.put('/:id', (req, res) => {
  const existing: any = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Report not found' });

  const {
    status, technician, supervisorName, serviceDate,
    nextServiceDate, generalObservations, blocks
  } = req.body;

  db.prepare(`
    UPDATE reports SET status=?, technician=?, supervisor_name=?, service_date=?,
      next_service_date=?, general_observations=?, blocks=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    status ?? existing.status,
    technician ?? existing.technician,
    supervisorName ?? existing.supervisor_name,
    serviceDate ?? existing.service_date,
    nextServiceDate ?? existing.next_service_date,
    generalObservations ?? existing.general_observations,
    blocks ? JSON.stringify(blocks) : existing.blocks,
    req.params.id
  );

  const updated: any = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id,
    reportNumber: updated.report_number,
    equipmentId: updated.equipment_id,
    equipmentName: updated.equipment_name,
    templateId: updated.template_id,
    templateName: updated.template_name,
    serviceType: updated.service_type,
    status: updated.status,
    technician: updated.technician,
    supervisorName: updated.supervisor_name,
    serviceDate: updated.service_date,
    nextServiceDate: updated.next_service_date,
    generalObservations: updated.general_observations,
    blocks: JSON.parse(updated.blocks),
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
});

// DELETE report
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });
  res.json({ success: true });
});

export default router;
