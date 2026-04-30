import { Router } from 'express';
import db from '../database.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET all equipment
router.get('/', (_req, res) => {
  const equipment = db.prepare('SELECT * FROM equipment ORDER BY name ASC').all();
  const mapped = equipment.map((e: any) => ({
    id: e.id,
    name: e.name,
    brand: e.brand,
    model: e.model,
    category: e.category,
    serialNumber: e.serial_number,
    location: e.location,
    imageUrl: e.image_url,
    description: e.description,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }));
  res.json(mapped);
});

// GET equipment by ID
router.get('/:id', (req, res) => {
  const e: any = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Equipment not found' });
  res.json({
    id: e.id,
    name: e.name,
    brand: e.brand,
    model: e.model,
    category: e.category,
    serialNumber: e.serial_number,
    location: e.location,
    imageUrl: e.image_url,
    description: e.description,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  });
});

// POST create equipment
router.post('/', (req, res) => {
  const { name, brand, model, category, serialNumber, location, imageUrl, description } = req.body;
  const id = uuid();
  const stmt = db.prepare(`
    INSERT INTO equipment (id, name, brand, model, category, serial_number, location, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, brand, model, category, serialNumber || '', location || '', imageUrl || '', description || '');
  const created: any = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id,
    name: created.name,
    brand: created.brand,
    model: created.model,
    category: created.category,
    serialNumber: created.serial_number,
    location: created.location,
    imageUrl: created.image_url,
    description: created.description,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  });
});

// PUT update equipment
router.put('/:id', (req, res) => {
  const existing: any = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Equipment not found' });

  const { name, brand, model, category, serialNumber, location, imageUrl, description } = req.body;
  db.prepare(`
    UPDATE equipment SET name=?, brand=?, model=?, category=?, serial_number=?, location=?, image_url=?, description=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name ?? existing.name,
    brand ?? existing.brand,
    model ?? existing.model,
    category ?? existing.category,
    serialNumber ?? existing.serial_number,
    location ?? existing.location,
    imageUrl ?? existing.image_url,
    description ?? existing.description,
    req.params.id
  );

  const updated: any = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id,
    name: updated.name,
    brand: updated.brand,
    model: updated.model,
    category: updated.category,
    serialNumber: updated.serial_number,
    location: updated.location,
    imageUrl: updated.image_url,
    description: updated.description,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
});

// DELETE equipment
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Equipment not found' });
  res.json({ success: true });
});

export default router;
