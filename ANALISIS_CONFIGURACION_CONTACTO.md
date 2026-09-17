# ANÁLISIS DE CONFIGURACIÓN DE DATOS DE CONTACTO

## ESTADO ACTUAL

### 📋 TABLA COMPANIES (BASE DE DATOS)
**Archivo:** `backend/database/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  ruc         VARCHAR(20)  UNIQUE,
  address     TEXT,
  phone       VARCHAR(50),        -- ✅ Teléfono básico
  email       VARCHAR(255),      -- ✅ Email básico
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos disponibles:**
- ✅ `phone` - Teléfono básico
- ✅ `email` - Email básico
- ✅ `address` - Dirección
- ❌ `whatsapp` - NO EXISTE
- ❌ `social_media` - NO EXISTE
- ❌ `facebook` - NO EXISTE
- ❌ `instagram` - NO EXISTE
- ❌ `linkedin` - NO EXISTE

### 🎨 PÁGINA DE CONTACTO PÚBLICO (FRONTEND)
**Archivo:** `frontend/src/pages/public/ContactPage.tsx`

**Datos HARDCODEADOS:**
```typescript
const contactData = {
  phone: '+51 1 234 5678',           // ❌ HARDCODEADO
  whatsapp: '+51 999 888 777',       // ❌ HARDCODEADO
  email: 'info@securityforce.pe',   // ❌ HARDCODEADO
  address: 'Av. Principal 123, Lima, Perú', // ❌ HARDCODEADO
  hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM', // ❌ HARDCODEADO
  social: {
    facebook: 'https://facebook.com/securityforce',    // ❌ HARDCODEADO
    instagram: 'https://instagram.com/securityforce',  // ❌ HARDCODEADO
    linkedin: 'https://linkedin.com/company/securityforce', // ❌ HARDCODEADO
  },
};
```

**Comentario en código:**
```typescript
// Datos de contacto - estos deberían venir de la API en el futuro
```

### 🔍 ANÁLISIS DE CANALES
**Archivo:** `backend/database/schema.sql`

```sql
CREATE TYPE channel_type AS ENUM (
  'facebook', 
  'instagram', 
  'whatsapp', 
  'qr', 
  'web', 
  'referral', 
  'campaign', 
  'other'
);
```

**Este enum es para canales de PUBLICATION, no para configuración de contacto.**

## ❌ PROBLEMAS IDENTIFICADOS

1. **Sin configuración de WhatsApp:** No hay campo para número de WhatsApp
2. **Sin configuración de redes sociales:** No hay campos para Facebook, Instagram, LinkedIn
3. **Sin horario de atención:** No hay campo para horario
4. **Datos hardcodeados:** Todo está estático en el frontend
5. **Sin panel administrativo:** No hay interfaz para editar estos datos
6. **Sin API endpoint:** No hay endpoint para obtener configuración de contacto

## ✅ SOLUCIÓN PROPUESTA

### 1. AMPLIAR TABLA COMPANIES

**Agregar campos de contacto:**
```sql
ALTER TABLE companies ADD COLUMN whatsapp VARCHAR(50);
ALTER TABLE companies ADD COLUMN facebook_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN instagram_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN linkedin_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN hours TEXT;
```

### 2. CREAR ENDPOINT API

**Backend:** `GET /api/public/contact-info`
```typescript
export async function getPublicContactInfo(req: Request, res: Response): Promise<void> {
  try {
    const company = await db.query(
      `SELECT name, address, phone, email, whatsapp, 
              facebook_url, instagram_url, linkedin_url, hours
       FROM companies 
       WHERE is_active = TRUE 
       LIMIT 1`
    );
    
    res.json(company.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener información de contacto' });
  }
}
```

### 3. ACTUALIZAR FRONTEND

**ContactPage.tsx:**
```typescript
// En lugar de datos hardcodeados:
const [contactData, setContactData] = useState(null);

useEffect(() => {
  async function loadContactInfo() {
    const data = await api.get('/public/contact-info');
    setContactData(data);
  }
  loadContactInfo();
}, []);
```

### 4. CREAR PANEL ADMINISTRATIVO

**Página:** `frontend/src/pages/admin/CompanySettingsPage.tsx`

**Funcionalidades:**
- Editar teléfono
- Editar WhatsApp
- Editar email
- Editar dirección
- Editar horario
- Editar redes sociales (Facebook, Instagram, LinkedIn)

### 5. CREAR ENDPOINT ADMIN

**Backend:** `PUT /api/recruitment/companies/:id/contact`
```typescript
export async function updateCompanyContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { phone, whatsapp, email, facebook_url, instagram_url, linkedin_url, hours } = req.body;
    
    await db.query(
      `UPDATE companies 
       SET phone = COALESCE($1, phone),
           whatsapp = COALESCE($2, whatsapp),
           email = COALESCE($3, email),
           facebook_url = COALESCE($4, facebook_url),
           instagram_url = COALESCE($5, instagram_url),
           linkedin_url = COALESCE($6, linkedin_url),
           hours = COALESCE($7, hours),
           updated_at = NOW()
       WHERE id = $8`,
      [phone, whatsapp, email, facebook_url, instagram_url, linkedin_url, hours, id]
    );
    
    res.json({ message: 'Información de contacto actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar información de contacto' });
  }
}
```

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

### ALTA PRIORIDAD (Esencial):
1. ✅ Ampliar tabla companies con campos de contacto
2. ✅ Crear endpoint público para obtener información de contacto
3. ✅ Actualizar frontend para usar datos dinámicos

### MEDIA PRIORIDAD (Importante):
4. ✅ Crear panel administrativo para editar contacto
5. ✅ Crear endpoint admin para actualizar contacto

### BAJA PRIORIDAD (Mejora):
6. Validación de URLs de redes sociales
7. Logging de cambios en configuración

## 📋 CAMBIOS REQUERIDOS

### Base de Datos:
- [ ] Agregar campos a tabla companies
- [ ] Crear migración SQL
- [ ] Actualizar seed data

### Backend:
- [ ] Crear endpoint GET /api/public/contact-info
- [ ] Crear endpoint PUT /api/recruitment/companies/:id/contact
- [ ] Actualizar esquema de validación
- [ ] Agregar tests

### Frontend:
- [ ] Actualizar ContactPage.tsx para usar API
- [ ] Crear CompanySettingsPage.tsx
- [ ] Agregar ruta al panel admin
- [ ] Actualizar navegación admin

## 🔧 DIAGNÓSTICO ACTUAL

**Estado:**
- ❌ Los datos de contacto están HARDCODEADOS
- ❌ No hay forma de editarlos desde el panel admin
- ❌ No hay configuración de WhatsApp
- ❌ No hay configuración de redes sociales
- ❌ No hay configuración de horario

**Conclusión:**
Actualmente los datos de contacto (celular, correo, redes sociales) NO se pueden configurar desde el panel administrativo. Todo está estático en el código frontend. Se requiere implementar la solución propuesta para permitir esta configuración.

---

*Generado el 21 de agosto de 2026*
*Security Force P&V S.A.C.*
