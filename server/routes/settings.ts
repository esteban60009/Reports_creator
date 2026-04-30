import { Router } from 'express';
import db from '../database.js';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for logo upload
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// GET company settings
router.get('/company', (_req, res) => {
  const s: any = db.prepare('SELECT * FROM company_settings WHERE id = ?').get('default');
  res.json({
    id: s.id,
    companyName: s.company_name,
    logoUrl: s.logo_url,
    address: s.address,
    phone: s.phone,
    email: s.email,
    website: s.website,
    reportPrefix: s.report_prefix,
    primaryColor: s.primary_color,
    secondaryColor: s.secondary_color,
    footerText: s.footer_text,
  });
});

// PUT update company settings
router.put('/company', (req, res) => {
  const { companyName, logoUrl, address, phone, email, website, reportPrefix, primaryColor, secondaryColor, footerText } = req.body;
  const existing: any = db.prepare('SELECT * FROM company_settings WHERE id = ?').get('default');

  db.prepare(`
    UPDATE company_settings SET company_name=?, logo_url=?, address=?, phone=?, email=?,
      website=?, report_prefix=?, primary_color=?, secondary_color=?, footer_text=?
    WHERE id='default'
  `).run(
    companyName ?? existing.company_name,
    logoUrl ?? existing.logo_url,
    address ?? existing.address,
    phone ?? existing.phone,
    email ?? existing.email,
    website ?? existing.website,
    reportPrefix ?? existing.report_prefix,
    primaryColor ?? existing.primary_color,
    secondaryColor ?? existing.secondary_color,
    footerText ?? existing.footer_text
  );

  const updated: any = db.prepare('SELECT * FROM company_settings WHERE id = ?').get('default');
  res.json({
    id: updated.id,
    companyName: updated.company_name,
    logoUrl: updated.logo_url,
    address: updated.address,
    phone: updated.phone,
    email: updated.email,
    website: updated.website,
    reportPrefix: updated.report_prefix,
    primaryColor: updated.primary_color,
    secondaryColor: updated.secondary_color,
    footerText: updated.footer_text,
  });
});

// POST upload logo
router.post('/company/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE company_settings SET logo_url = ? WHERE id = ?').run(logoUrl, 'default');
  res.json({ logoUrl });
});

// --- Technicians ---
router.get('/technicians', (_req, res) => {
  const techs = db.prepare('SELECT * FROM technicians ORDER BY name ASC').all();
  res.json(techs.map((t: any) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    email: t.email,
    phone: t.phone,
    signature: t.signature,
    isActive: !!t.is_active,
  })));
});

router.post('/technicians', (req, res) => {
  const { name, role, email, phone, signature } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO technicians (id, name, role, email, phone, signature) VALUES (?,?,?,?,?,?)').run(
    id, name, role || '', email || '', phone || '', signature || ''
  );
  const created: any = db.prepare('SELECT * FROM technicians WHERE id = ?').get(id);
  res.status(201).json({
    id: created.id, name: created.name, role: created.role,
    email: created.email, phone: created.phone, signature: created.signature,
    isActive: !!created.is_active,
  });
});

router.put('/technicians/:id', (req, res) => {
  const existing: any = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Technician not found' });

  const { name, role, email, phone, signature, isActive } = req.body;
  db.prepare(`
    UPDATE technicians SET name=?, role=?, email=?, phone=?, signature=?, is_active=?, updated_at=datetime('now') WHERE id=?
  `).run(
    name ?? existing.name, role ?? existing.role, email ?? existing.email,
    phone ?? existing.phone, signature ?? existing.signature,
    isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    req.params.id
  );

  const updated: any = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id, name: updated.name, role: updated.role,
    email: updated.email, phone: updated.phone, signature: updated.signature,
    isActive: !!updated.is_active,
  });
});

router.delete('/technicians/:id', (req, res) => {
  const result = db.prepare('DELETE FROM technicians WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Technician not found' });
  res.json({ success: true });
});

// --- Report Layouts ---
router.get('/layouts', (_req, res) => {
  const layouts = db.prepare('SELECT * FROM report_layouts ORDER BY name ASC').all();
  res.json(layouts.map((l: any) => ({
    id: l.id,
    name: l.name,
    showLogo: !!l.show_logo,
    showCompanyInfo: !!l.show_company_info,
    showEquipmentImage: !!l.show_equipment_image,
    showBlockNumbers: !!l.show_block_numbers,
    showSignatureLines: !!l.show_signature_lines,
    headerLayout: l.header_layout,
    blockStyle: l.block_style,
    fontSize: l.font_size,
    pageSize: l.page_size,
    margins: JSON.parse(l.margins),
    customCSS: l.custom_css,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  })));
});

router.put('/layouts/:id', (req, res) => {
  const existing: any = db.prepare('SELECT * FROM report_layouts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Layout not found' });

  const { name, showLogo, showCompanyInfo, showEquipmentImage, showBlockNumbers, showSignatureLines,
    headerLayout, blockStyle, fontSize, pageSize, margins, customCSS } = req.body;

  db.prepare(`
    UPDATE report_layouts SET name=?, show_logo=?, show_company_info=?, show_equipment_image=?,
      show_block_numbers=?, show_signature_lines=?, header_layout=?, block_style=?,
      font_size=?, page_size=?, margins=?, custom_css=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name ?? existing.name,
    showLogo !== undefined ? (showLogo ? 1 : 0) : existing.show_logo,
    showCompanyInfo !== undefined ? (showCompanyInfo ? 1 : 0) : existing.show_company_info,
    showEquipmentImage !== undefined ? (showEquipmentImage ? 1 : 0) : existing.show_equipment_image,
    showBlockNumbers !== undefined ? (showBlockNumbers ? 1 : 0) : existing.show_block_numbers,
    showSignatureLines !== undefined ? (showSignatureLines ? 1 : 0) : existing.show_signature_lines,
    headerLayout ?? existing.header_layout,
    blockStyle ?? existing.block_style,
    fontSize ?? existing.font_size,
    pageSize ?? existing.page_size,
    margins ? JSON.stringify(margins) : existing.margins,
    customCSS ?? existing.custom_css,
    req.params.id
  );

  const updated: any = db.prepare('SELECT * FROM report_layouts WHERE id = ?').get(req.params.id);
  res.json({
    id: updated.id, name: updated.name,
    showLogo: !!updated.show_logo, showCompanyInfo: !!updated.show_company_info,
    showEquipmentImage: !!updated.show_equipment_image, showBlockNumbers: !!updated.show_block_numbers,
    showSignatureLines: !!updated.show_signature_lines, headerLayout: updated.header_layout,
    blockStyle: updated.block_style, fontSize: updated.font_size,
    pageSize: updated.page_size, margins: JSON.parse(updated.margins),
    customCSS: updated.custom_css,
  });
});

export default router;
