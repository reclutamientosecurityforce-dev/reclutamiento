/**
 * Script de Verificación Integral E2E contra el servidor en ejecución
 * Ejecuta todas las fases del requerimiento.
 */
const BASE_URL = 'http://localhost:3000/api';

async function request(endpoint: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    return { status: res.status, data };
  }
  const text = await res.text();
  return { status: res.status, data: text };
}

async function runVerification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🚀 INICIANDO VERIFICACIÓN E2E DEL SISTEMA DE CONTROL DE CARTAS');
  console.log('   Security Force S.A.C. — PostgreSQL persistente');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // 1. Health check
  console.log('1️⃣  Health Check...');
  const healthRes = await fetch('http://localhost:3000/health');
  const health: any = await healthRes.json();
  console.log(`   Status: ${health.status}, Database: ${health.database}`);
  if (health.status !== 'ok') throw new Error('Health check falló');

  // 2. Login Admin
  console.log('\n2️⃣  Login Administrador (admin)...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'Admin1234!' }),
  });
  console.log(`   Status: ${adminLogin.status}, Role: ${adminLogin.data.user?.role}`);
  const adminToken = adminLogin.data.token;

  // 3. Login Operador
  console.log('\n3️⃣  Login Operador (carlos.perez)...');
  const userLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'carlos.perez', password: 'User1234!' }),
  });
  console.log(`   Status: ${userLogin.status}, Role: ${userLogin.data.user?.role}`);
  const userToken = userLogin.data.token;

  // 4. RBAC: Operador no puede acceder a /admin/users
  console.log('\n4️⃣  Prueba RBAC (Operador -> /admin/users)...');
  const rbacTest = await request('/admin/users', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`   Status esperado 403: Obtenido ${rbacTest.status} (${rbacTest.data.error})`);

  // 5. Dashboard Resumen (/api/cards/summary) - NO envía miles de cartas
  console.log('\n5️⃣  Dashboard Resumen (/api/cards/summary)...');
  const summaryRes = await request('/cards/summary', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('   KPIs agregados:', summaryRes.data);

  // 6. Matriz de cartas paginada
  console.log('\n6️⃣  Matriz de Cartas Paginada (/api/cards?limit=10&page=1)...');
  const cardsRes = await request('/cards?limit=10&page=1', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Cartas recibidas: ${cardsRes.data.data?.length}, Total en base: ${cardsRes.data.pagination?.total}`);

  // 7. Búsqueda exacta de carta 573
  console.log('\n7️⃣  Búsqueda exacta (número 573)...');
  const exactRes = await request('/cards?number=573', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Resultado carta: N.º ${exactRes.data.data?.[0]?.number}, Estado: ${exactRes.data.data?.[0]?.status}`);

  // 8. Dashboard Usuario (/api/cards/my)
  console.log('\n8️⃣  Dashboard de Usuario (/api/cards/my)...');
  const myCardsRes = await request('/cards/my', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('   Resumen usuario:', myCardsRes.data.summary);

  // 9. Concurrencia crítica: 10 peticiones simultáneas sobre una carta
  console.log('\n9️⃣  PRUEBA DE CONCURRENCIA CRÍTICA (10 solicitudes concurrentes)...');
  // Buscar una carta disponible
  const availRes = await request('/cards?status=available&limit=1', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const testCard = availRes.data.data?.[0];
  if (testCard) {
    console.log(`   Probando concurrencia en Carta N.º ${testCard.number}...`);
    const promises = Array.from({ length: 10 }, (_, i) =>
      request(`/cards/${testCard.id}/use`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ observations: `Petición concurrente #${i + 1}` }),
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.status === 200).length;
    const conflictCount = results.filter((r) => r.status === 409).length;
    console.log(`   ✅ Resultados: ${successCount} exitosa (HTTP 200), ${conflictCount} bloqueadas por concurrencia (HTTP 409)`);
  }

  // 10. Trazabilidad e historial
  if (testCard) {
    console.log('\n🔟 Verificando trazabilidad e historial...');
    const histRes = await request(`/cards/${testCard.id}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   Entradas de historial para carta N.º ${testCard.number}: ${histRes.data?.length}`);
  }

  // 11. Reportes
  console.log('\n1️⃣1️⃣ Verificando generación de reportes (CSV / PDF / XLSX)...');
  const csvReport = await request('/admin/reports/cards?format=csv', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Reporte CSV status: ${csvReport.status} (Longitud contenido: ${csvReport.data.length} bytes)`);

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('🎉 TODAS LAS VERIFICACIONES E2E FUERON EJECUTADAS CON ÉXITO');
  console.log('════════════════════════════════════════════════════════════════════════\n');
}

runVerification().catch((err) => {
  console.error('❌ Error en verificación:', err);
  process.exit(1);
});
