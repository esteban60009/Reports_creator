import { Router } from 'express';
import db from '../database.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET templates (optionally filter by equipmentId)
router.get('/', (req, res) => {
  const { equipmentId } = req.query;
  let templates: any[];
  if (equipmentId) {
    templates = db.prepare('SELECT * FROM templates WHERE equipment_id = ? ORDER BY created_at DESC').all(equipmentId);
  } else {
    templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
  }
  const mapped = templates.map((t: any) => ({
    id: t.id,
    equipmentId: t.equipment_id,
    name: t.name,
    serviceType: t.service_type,
    blocks: JSON.parse(t.blocks),
    version: t.version,
    isDefault: !!t.is_default,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
  res.json(mapped);
});

// GET template by ID
router.get('/:id', (req, res) => {
  const t: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  res.json({
    id: t.id,
    equipmentId: t.equipment_id,
    name: t.name,
    serviceType: t.service_type,
    blocks: JSON.parse(t.blocks),
    version: t.version,
    isDefault: !!t.is_default,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  });
});

// POST create template
router.post('/', (req, res) => {
  const { equipmentId, name, serviceType, blocks, isDefault } = req.body;
  const id = uuid();
  db.prepare(`
    INSERT INTO templates (id, equipment_id, name, service_type, blocks, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, equipmentId, name, serviceType, JSON.stringify(blocks || []), isDefault ? 1 : 0);

  const created: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id,
    equipmentId: created.equipment_id,
    name: created.name,
    serviceType: created.service_type,
    blocks: JSON.parse(created.blocks),
    version: created.version,
    isDefault: !!created.is_default,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  });
});

// PUT update template
router.put('/:id', (req, res) => {
  const existing: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Template not found' });

  const { name, serviceType, blocks, isDefault } = req.body;
  db.prepare(`
    UPDATE templates SET name=?, service_type=?, blocks=?, is_default=?, version=version+1, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name ?? existing.name,
    serviceType ?? existing.service_type,
    blocks ? JSON.stringify(blocks) : existing.blocks,
    isDefault !== undefined ? (isDefault ? 1 : 0) : existing.is_default,
    req.params.id
  );

  const updated: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id,
    equipmentId: updated.equipment_id,
    name: updated.name,
    serviceType: updated.service_type,
    blocks: JSON.parse(updated.blocks),
    version: updated.version,
    isDefault: !!updated.is_default,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
});

// DELETE template
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
});

export default router;
