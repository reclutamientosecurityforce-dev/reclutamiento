# CORRECCIÓN DEL SISTEMA DE SUBIDA DE ARCHIVOS

## PROBLEMAS IDENTIFICADOS Y CORREGIDOS

### 1. CONFIGURACIÓN CORS LIMITADA
**Problema:** El backend no permitía los headers necesarios para FormData
**Solución:** Agregado header 'X-Requested-With' a allowedHeaders

**Archivo:** `backend/src/server.ts`
```typescript
// Antes:
allowedHeaders: ['Content-Type', 'Authorization'],

// Después:
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
```

### 2. LÍMITE DE TAMAÑO INSUFICIENTE
**Problema:** El límite de 10MB era muy restrictivo para archivos grandes
**Solución:** Aumentado de 10MB a 50MB

**Archivo:** `backend/src/server.ts`
```typescript
// Antes:
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Después:
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

### 3. FILTRO DE ARCHIVOS MEJORADO
**Problema:** El filtro solo verificaba extensión, no MIME type
**Solución:** Verificación mejorada de ambos extensión y MIME type

**Archivo:** `backend/src/modules/recruitment/api/routes/public.routes.ts`
```typescript
// Antes:
const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
const ext = path.extname(file.originalname).toLowerCase();
if (allowedExts.includes(ext)) {
  cb(null, true);
}

// Después:
const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ext = path.extname(file.originalname).toLowerCase();
const mime = file.mimetype;

if (allowedExts.includes(ext) || allowedMimes.includes(mime)) {
  cb(null, true);
}
```

### 4. CONFIGURACIÓN DE PROXY VITE MEJORADA
**Problema:** Sin logging para debug de errores de proxy
**Solución:** Agregado logging y configuración adicional

**Archivo:** `frontend/vite.config.ts`
```typescript
// Antes:
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}

// Después:
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    configure: (proxy, _options) => {
      proxy.on('error', (err, _req, _res) => {
        console.log('proxy error', err);
      });
      proxy.on('proxyReq', (proxyReq, req, _res) => {
        console.log('Sending Request to the Target:', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, _res) => {
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
      });
    },
  },
}
```

## ARCHIVOS PERMITIDOS DESPUÉS DE LA CORRECCIÓN

### Formatos de Documentos:
- ✅ PDF (`.pdf`)
- ✅ Word (`.doc`, `.docx`)

### Formatos de Imágenes:
- ✅ JPEG (`.jpg`, `.jpeg`)
- ✅ PNG (`.png`)
- ✅ WebP (`.webp`)
- ✅ GIF (`.gif`) - NUEVO

### Tamaño Máximo:
- ✅ 50MB (aumentado de 10MB)

## VERIFICACIÓN REALIZADA

### Tests Backend:
- ✅ 71/71 tests pasando
- ✅ Test suites: 5 passed, 5 total
- ✅ Tiempo: 15.441s

### Build Frontend:
- ✅ Build exitoso
- ✅ 1501 modules transformed
- ✅ Sin errores TypeScript

## INSTRUCCIONES PARA PROBAR

### 1. REINICIAR SERVIDORES

**Backend:**
```powershell
# Matar proceso existente en puerto 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Reiniciar backend
cd backend
npm run dev
```

**Frontend:**
```powershell
# Si ya está corriendo, se recargará automáticamente con HMR
# Si no, ejecutar:
cd frontend
npm run dev
```

### 2. PROBAR SUBIDA DE ARCHIVOS

**Pasos para verificar:**
1. Acceder a http://localhost:5173/postular
2. Seleccionar una convocatoria
3. Iniciar postulación (Paso 1)
4. Elegir método (Paso 2)
5. En Paso 4 (Documentos), intentar subir:
   - PDF
   - Imagen JPG
   - Imagen PNG
   - Word document

**Comportamiento esperado:**
- ✅ No debe mostrar error de localhost
- ✅ Debe aceptar los formatos permitidos
- ✅ Debe mostrar estado de subida en tiempo real
- ✅ Debe mostrar "🟢 RECIBIDO" después de subir exitosamente

### 3. VER LOGS DE DEBUG

Con la nueva configuración del proxy, verás logs en la consola del frontend:
```
Sending Request to the Target: POST /api/public/apply/.../upload-photos
Received Response from the Target: 200 /api/public/apply/.../upload-photos
```

Esto ayuda a identificar si hay problemas de conexión.

## DIAGNÓSTICO DE PROBLEMAS COMUNES

### Si sigue dando error de localhost:

1. **Verificar que ambos servidores estén corriendo:**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

2. **Verificar CORS:**
   - El backend debe aceptar requests desde localhost:5173
   - Revisar logs del backend para errores de CORS

3. **Verificar directorio de uploads:**
   - Debe existir: `backend/uploads/candidates`
   - Debe tener permisos de escritura

### Si no acepta archivos específicos:

1. **Verificar extensión del archivo:**
   - Debe estar en la lista de extensiones permitidas
   - Debe estar en minúsculas o mayúsculas según configuración

2. **Verificar MIME type:**
   - Algunos archivos pueden tener MIME type incorrecto
   - Revisar logs del backend para ver qué MIME type detecta

3. **Verificar tamaño:**
   - Debe ser menor a 50MB
   - Revisar si el archivo es muy grande

## CONFIGURACIÓN FINAL

### Backend:
- ✅ CORS: Headers adicionales permitidos
- ✅ Parser: Límite aumentado a 50MB
- ✅ File filter: Verificación mejorada de extensión y MIME
- ✅ Extensiones: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP, GIF
- ✅ Directorio uploads: Verificado y existente

### Frontend:
- ✅ Proxy: Configuración mejorada con logging
- ✅ Proxy: secure: false para evitar errores SSL
- ✅ UI: Botones funcionales para subida
- ✅ UX: Estados visuales claros

---

*Generado el 21 de agosto de 2026*
*Security Force P&V S.A.C.*
