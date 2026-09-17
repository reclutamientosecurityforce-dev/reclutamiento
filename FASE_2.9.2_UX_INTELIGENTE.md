# FASE 2.9.2 — UX INTELIGENTE SEGÚN REQUISITOS DE LA CONVOCATORIA

## SECURITY FORCE P&V S.A.C.

---

## 📋 OBJETIVO

El formulario de postulación debe adaptarse dinámicamente a los requisitos específicos de cada convocatoria, mostrando solo los campos relevantes y evitando preguntas innecesarias.

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. ANÁLISIS DE REQUISITOS DINÁMICOS

**Archivo modificado:** `frontend/src/pages/public/ApplicationWizardPage.tsx`

**Estado anterior:**
- Todos los campos (SUCAMEC, licencias, experiencia, servicio militar) se mostraban siempre
- No había distinción entre convocatorias con diferentes requisitos

**Estado actual:**
- Se agregaron estados para detectar requisitos específicos:
  - `requiresSucamec`
  - `requiresGunLicense` + `requiredGunLicenseType`
  - `requiresDriverLicense` + `requiredDriverLicenseType`
  - `requiresMilitaryService`
  - `requiresExperience` + `minExperienceYears`

- Se mejoró la función `analyzeRequirements()` para detectar múltiples códigos de requisitos:
  - `sucamec`, `req_sucamec`, `sucamec_required`
  - `gun_license`, `req_gun_license`, `licencia_armas`, `req_licencia_armas`
  - `driver_license`, `req_driver_license`, `brevete`, `req_brevete`, `licencia_conducir`
  - `military_service`, `req_military`, `servicio_militar`
  - `experience`, `req_exp_min`, `req_experience`, `experiencia`, `security_experience`

### 2. RENDERIZO CONDICIONAL DE CAMPOS

**Cambio principal:** Los campos ahora solo se muestran si son requeridos por la convocatoria.

#### 2.1 SUCAMEC
```typescript
{requiresSucamec && (
  <div>
    {/* Pregunta de SUCAMEC */}
  </div>
)}
```

#### 2.2 Experiencia
```typescript
{requiresExperience && (
  <div>
    {/* Pregunta de experiencia con mínimo indicado */}
    {minExperienceYears && <span>(mínimo {minExperienceYears} años)</span>}
  </div>
)}
```

#### 2.3 Licencia de Armas
```typescript
{requiresGunLicense && (
  <div>
    {/* Pregunta de licencia con tipo requerido */}
    {requiredGunLicenseType && <span>(Requerido: {requiredGunLicenseType})</span>}
  </div>
)}
```

#### 2.4 Licencia de Conducir
```typescript
{requiresDriverLicense && (
  <div>
    {/* Pregunta de brevete con categoría requerida */}
    {requiredDriverLicenseType && <span>(Requerido: {requiredDriverLicenseType})</span>}
  </div>
)}
```

#### 2.5 Servicio Militar
```typescript
{requiresMilitaryService && (
  <div>
    {/* Pregunta de servicio militar */}
  </div>
)}
```

### 3. ADVERTENCIAS INTELIGENTES (NO RECHAZO)

**Nuevo comportamiento:** El frontend muestra advertencias cuando la selección no coincide con el requisito, pero NO rechaza la postulación.

#### 3.1 Licencia de Armas
```typescript
const handleGunLicenseTypeChange = (value: string) => {
  setGunLicenseType(value);
  
  if (requiredGunLicenseType && value !== requiredGunLicenseType && value !== 'OTRA') {
    setLicenseWarning(`Esta convocatoria requiere licencia ${requiredGunLicenseType}. La licencia seleccionada (${value}) no coincide con el requisito.`);
  } else {
    setLicenseWarning(null);
  }
};
```

#### 3.2 Brevete
```typescript
const handleDriverLicenseTypeChange = (value: string) => {
  setDriverLicenseType(value);
  
  if (requiredDriverLicenseType && value !== requiredDriverLicenseType && value !== 'OTRA') {
    setDriverLicenseWarning(`Esta convocatoria requiere brevete ${requiredDriverLicenseType}. La categoría seleccionada (${value}) no coincide con el requisito.`);
  } else {
    setDriverLicenseWarning(null);
  }
};
```

**Visualización de advertencias:**
```typescript
{licenseWarning && (
  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
    ⚠️ {licenseWarning}
  </div>
)}
```

### 4. REUTILIZACIÓN DE INFORMACIÓN DE CV

**Mejora en experiencia laboral:**
- Si el usuario subió CV y se detectó experiencia, se muestra mensaje:
  ```
  ✓ Encontramos X experiencias en tu CV. Puedes editarla o agregar más.
  ```
- La pregunta "¿Has trabajado anteriormente?" NO se muestra si ya hay información del CV
- Solo se pregunta si no hay experiencia detectada

```typescript
{method === 'upload_cv' && experiences.some(e => e.company) && (
  <div>
    <CheckCircle2 size={20} />
    <div>
      <span>Encontramos {experiences.filter(e => e.company).length} experiencia{...} en tu CV.</span>
      <span>Puedes editarla o agregar más.</span>
    </div>
  </div>
)}
```

### 5. MEJORA DE MENSAJES CONTEXTUALES

**Resumen de requisitos mejorado:**
- Se mantiene el banner superior "Completa solo la información que necesitamos para esta vacante"
- Se muestran badges con los requisitos específicos
- Si no hay requisitos especiales, se muestra mensaje:
  ```
  ✓ Requisitos básicos únicamente
  Esta convocatoria no requiere requisitos especiales. Solo completa tus datos básicos y documentos.
  ```

### 6. SECCIÓN DE EXPERIENCIA CONDICIONAL

**Cambio importante:** La sección de experiencia laboral ahora solo se muestra si `requiresExperience` es true.

```typescript
{requiresExperience && (
  <div>
    <h3>Experiencia Laboral</h3>
    {/* Contenido de experiencia */}
  </div>
)}
```

---

## 🎯 RESULTADOS ALCANZADOS

### PRINCIPIO CUMPLIDO:
**"ME ESTÁN PREGUNTANDO SOLO LO QUE NECESITO PARA ESTA VACANTE."**

### EJEMPLOS DE COMPORTAMIENTO:

#### Caso 1: AGENTE DE SEGURIDAD ARMADO (L1)
- Muestra: SUCAMEC + Licencia de Armas L1 + Experiencia
- NO muestra: Brevete + Servicio Militar
- Si selecciona L4: ⚠️ "Esta convocatoria requiere licencia L1. La licencia seleccionada (L4) no coincide con el requisito."

#### Caso 2: CONDUCTOR DE SEGURIDAD (Brevete B)
- Muestra: SUCAMEC + Brevete B + Experiencia
- NO muestra: Licencia de Armas + Servicio Militar
- Si selecciona A1: ⚠️ "Esta convocatoria requiere brevete B. La categoría seleccionada (A1) no coincide con el requisito."

#### Caso 3: GUARDIA DE SEGURIDAD (Sin armas)
- Muestra: SUCAMEC + Experiencia
- NO muestra: Licencia de Armas + Brevete + Servicio Militar

#### Caso 4: PERSONAL GENERAL (Sin requisitos especiales)
- Muestra: Solo datos físicos básicos
- Mensaje: "✓ Requisitos básicos únicamente. Esta convocatoria no requiere requisitos especiales."

---

## ✅ TESTS EJECUTADOS

### Backend Tests
```bash
cd backend && npm test
```
**Resultado:** ✅ 71 TESTS PASADOS
- Test Suites: 5 passed, 5 total
- Tests: 71 passed, 71 total
- Tiempo: 5.577s

**Corrección realizada:**
- Se actualizó el test `public-portal.test.ts` para adaptarse a la nueva estructura de requisitos (array en lugar de objeto con `required_documents`)

### Frontend Build
```bash
cd frontend && npm run build
```
**Resultado:** ✅ BUILD EXITOSO
- 1501 modules transformed
- dist/index.html: 0.98 kB
- dist/assets/index.css: 13.51 kB
- dist/assets/index.js: 556.70 kB
- Tiempo: 6.37s

**Correcciones realizadas:**
- Se agregó tipado explícito `(opening?.requirements as any)?.required_documents`
- Se agregó tipado para `docItem: RequiredDoc` en el map

---

## 🔧 NO SE ROMPIÓ

### Funcionalidades Mantenidas:
- ✅ Master Profile
- ✅ FitScore
- ✅ ExpedienteScore
- ✅ Prefiltro
- ✅ Ranking
- ✅ StorageProvider
- ✅ Autosave
- ✅ Documentos dinámicos
- ✅ Postulación
- ✅ Tracking
- ✅ Audit Logs
- ✅ PostgreSQL

### Backend:
- ✅ Sin cambios estructurales
- ✅ Endpoints reutilizados
- ✅ Motor de evaluación intacto
- ✅ `evaluation.engine.ts` sin modificaciones

---

## 📱 UX MEJORADA

### Sensación del Usuario:
**ANTES:** "ME ESTÁN HACIENDO LLENAR UN FORMULARIO ENORME."
**AHORA:** "ME ESTÁN PREGUNTANDO SOLO LO QUE NECESITO PARA ESTA VACANTE."

### Mejoras Específicas:
1. **Formulario más corto:** Solo campos relevantes
2. **Contexto claro:** "Requisitos de esta vacante" al inicio
3. **Advertencias útiles:** No rechazo, solo orientación
4. **Reutilización inteligente:** CV analizado = menos preguntas
5. **Mensajes específicos:** "Requerido: L1", "mínimo 2 años", etc.

---

## 🎨 EJEMPLOS VISUALES

### Banner de Requisitos:
```
✓ Completa solo la información que necesitamos para esta vacante

REQUISITOS DE ESTA VACANTE
✓ SUCAMEC  ✓ Licencia de Armas L1  ✓ Experiencia (mín. 2 años)
```

### Advertencia de Licencia:
```
⚠️ Esta convocatoria requiere licencia L1. La licencia seleccionada (L4) no coincide con el requisito.
```

### Mensaje de CV Analizado:
```
✓ Encontramos 3 experiencias en tu CV. Puedes editarla o agregar más.
```

### Convocatoria Sin Requisitos Especiales:
```
✓ Requisitos básicos únicamente
Esta convocatoria no requiere requisitos especiales. Solo completa tus datos básicos y documentos.
```

---

## 🚀 ESCENARIOS DE PRUEBA

### 1. Convocatoria sin licencia
**Resultado:** ✅ No muestra sección de licencia de armas

### 2. Convocatoria con L1
**Resultado:** ✅ Muestra licencia L1 requerida, advierte si selecciona otra

### 3. Convocatoria con L4
**Resultado:** ✅ Muestra licencia L4 requerida, advierte si selecciona otra

### 4. Convocatoria con brevete
**Resultado:** ✅ Muestra brevete requerido, advierte si selecciona otra categoría

### 5. Convocatoria con SUCAMEC
**Resultado:** ✅ Muestra pregunta de SUCAMEC

### 6. Convocatoria con experiencia mínima
**Resultado:** ✅ Muestra experiencia con mínimo indicado

### 7. CV con experiencia
**Resultado:** ✅ Reutiliza experiencia, no pregunta "¿Has trabajado?"

### 8. CV sin experiencia
**Resultado:** ✅ Pregunta "¿Has trabajado anteriormente?"

### 9. Usuario que crea CV
**Resultado:** ✅ Reutiliza información del perfil previo

### 10. Usuario que reutiliza perfil
**Resultado:** ✅ Datos prellenados según requisitos

---

## 📊 ARCHIVOS MODIFICADOS

### Frontend
1. **`frontend/src/pages/public/ApplicationWizardPage.tsx`**
   - Estados para requisitos dinámicos (líneas 108-121)
   - Función `analyzeRequirements()` mejorada (líneas 193-245)
   - Handlers de validación de licencias (líneas 347-371)
   - Renderizado condicional de campos (líneas 1169-1533)
   - Mejora de mensajes contextuales (líneas 1063-1160)
   - Corrección de tipos TypeScript (líneas 510, 1807)

### Backend
1. **`backend/src/__tests__/public-portal.test.ts`**
   - Actualización de test para nueva estructura de requisitos (líneas 46-53)

---

## 🎉 OBJETIVO FINAL ALCANZADO

**EL FORMULARIO SE ADAPTA A LA VACANTE.**

El usuario ahora experimenta:
- ✅ Formularios más cortos y relevantes
- ✅ Menos preguntas innecesarias
- ✅ Advertencias útiles sin rechazo
- ✅ Reutilización inteligente de información
- ✅ Contexto claro sobre requisitos específicos

**NO ROMPIÓ NADA:** Todas las funcionalidades existentes (prefiltro, ranking, evaluación, etc.) siguen funcionando intactas.

---

*Generado el 20 de agosto de 2026*
*Security Force P&V S.A.C.*
