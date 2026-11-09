const form = document.querySelector('#search-form');
const plateInput = document.querySelector('#plate');
const serialInput = document.querySelector('#serial');
const apiKeyInput = document.querySelector('#api-key');
const error = document.querySelector('#plate-error');
const badge = document.querySelector('#result-badge');
const title = document.querySelector('#result-title');
const description = document.querySelector('#result-description');
const details = document.querySelector('#result-details');

const endpoints = [
  { name: 'Documentos históricos', url: 'http://192.10.10.64:8020/smadsot/docs_historico' },
  { name: 'Verificaciones históricas', url: 'http://192.10.10.64:8020/smadsot/verificaciones/historico' },
];

let activeRequest;

function clearError() {
  plateInput.removeAttribute('aria-invalid');
  apiKeyInput.removeAttribute('aria-invalid');
  error.hidden = true;
  error.textContent = '';
}

function resetResult() {
  badge.textContent = 'Sin consulta';
  title.textContent = 'Tu consulta comienza aquí';
  description.textContent = 'Ingresa los datos y selecciona “Buscar placa” para continuar.';
  details.replaceChildren();
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function requestHistory(endpoint, payload, apiKey, signal) {
  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
    signal,
  });
  const responseText = await response.text();
  let data;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error(`${endpoint.name}: el servidor no devolvió JSON válido.`);
      }
    }
  }

  if (!response.ok) {
    const message = isRecord(data) && (data.detail || data.message || data.error);
    throw new Error(`${endpoint.name}: HTTP ${response.status}${message ? ` — ${message}` : ''}.`);
  }

  if (!isRecord(data)) {
    throw new Error(`${endpoint.name}: la respuesta está vacía o tiene un formato inesperado.`);
  }
  return data;
}

function addVehicleDetails(vehicle) {
  const fields = [
    ['Placa', 'placa'],
    ['Número de serie', 'no_serie'],
    ['Marca', 'marca'],
    ['Submarca', 'submarca'],
    ['Año modelo', 'anio_modelo'],
    ['Propietario', 'propietario'],
  ].filter(([, key]) => vehicle[key] !== '' && vehicle[key] !== null && vehicle[key] !== undefined);

  if (!fields.length) return;

  const section = document.createElement('section');
  const heading = document.createElement('h4');
  const list = document.createElement('dl');
  heading.textContent = 'Vehículo';
  for (const [label, key] of fields) {
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = String(vehicle[key]);
    list.append(term, value);
  }
  section.append(heading, list);
  details.append(section);
}

function addVerificationDetails(verifications) {
  const fields = [
    ['Folio', 'folio'],
    ['Resultado', 'tipo_resultado'],
    ['Fecha', 'fecha'],
    ['Vigencia', 'vigencia'],
    ['CVV', 'cvv'],
  ];
  const section = document.createElement('section');
  const heading = document.createElement('h4');
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const body = document.createElement('tbody');

  heading.textContent = 'Verificaciones';
  for (const [label] of fields) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headerRow.append(cell);
  }
  head.append(headerRow);

  for (const verification of verifications) {
    const row = document.createElement('tr');
    for (const [, key] of fields) {
      const cell = document.createElement('td');
      cell.textContent = verification[key] === null || verification[key] === undefined
        ? ''
        : String(verification[key]);
      row.append(cell);
    }
    body.append(row);
  }

  table.append(head, body);
  section.append(heading, table);
  details.append(section);
}

function addMessage(message, className = '') {
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  if (className) paragraph.className = className;
  details.append(paragraph);
}

function renderResults(results) {
  const successful = results.filter((result) => result.data);
  const failed = results.filter((result) => result.error);
  const vehicleResponse = successful.find(({ data }) => isRecord(data.vehiculo));
  const vehicle = vehicleResponse?.data.vehiculo;
  const verifications = successful.flatMap(({ data }) =>
    Array.isArray(data.verificaciones) ? data.verificaciones.filter(isRecord) : [],
  );
  const hasVehicleData = vehicle
    && Object.values(vehicle).some((value) => value !== '' && value !== null && value !== undefined);

  addVehicleDetails(vehicle ?? {});
  if (verifications.length) addVerificationDetails(verifications);

  if (failed.length) {
    addMessage(failed.map(({ error: requestError }) => requestError.message).join(' '), 'result-error');
  }
  if (!hasVehicleData && !verifications.length) {
    addMessage('Las APIs respondieron, pero no devolvieron datos de vehículo ni verificaciones.');
  }

  if (failed.length === results.length) {
    badge.textContent = 'Error de consulta';
    title.textContent = 'No se pudo completar la consulta';
    description.textContent = 'Revisa la conexión y vuelve a intentarlo.';
  } else if (failed.length) {
    badge.textContent = 'Resultado parcial';
    title.textContent = 'Consulta incompleta';
    description.textContent = 'Al menos uno de los servicios no respondió correctamente.';
  } else if (hasVehicleData || verifications.length) {
    badge.textContent = 'Consulta completada';
    title.textContent = 'Datos encontrados';
    description.textContent = 'Información devuelta por los servicios de consulta histórica.';
  } else {
    badge.textContent = 'Sin resultados';
    title.textContent = 'No se encontraron registros';
    description.textContent = 'No hay información histórica para los datos ingresados.';
  }
}

function showValidationError(message, input) {
  resetResult();
  error.textContent = message;
  error.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}

for (const input of [plateInput, serialInput, apiKeyInput]) {
  input.addEventListener('input', () => {
    activeRequest?.abort();
    activeRequest = undefined;
    clearError();
    resetResult();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const plate = plateInput.value.toUpperCase().replace(/[\s-]/g, '');
  const apiKey = apiKeyInput.value.trim();
  if (!/^(?=.*[A-Z])(?=.*\d)[A-Z\d]{5,9}$/.test(plate)) {
    showValidationError(
      plate ? 'Revisa la placa: debe contener de 5 a 9 letras y números, sin caracteres especiales.' : 'Ingresa la placa del vehículo para continuar.',
      plateInput,
    );
    return;
  }
  if (!apiKey) {
    showValidationError('Ingresa la API Key para consultar los servicios.', apiKeyInput);
    return;
  }

  apiKeyInput.value = '';
  plateInput.value = plate;
  serialInput.value = serialInput.value.trim().toUpperCase();
  const payload = { placa: plate, no_serie: serialInput.value };
  activeRequest?.abort();
  activeRequest = new AbortController();
  const { signal } = activeRequest;

  badge.textContent = 'Consultando';
  title.textContent = 'Buscando información';
  description.textContent = 'Consultando documentos y verificaciones históricas.';
  details.replaceChildren();

  const responses = await Promise.all(endpoints.map(async (endpoint) => {
    try {
      return { data: await requestHistory(endpoint, payload, apiKey, signal) };
    } catch (requestError) {
      return { error: requestError };
    }
  }));
  if (signal.aborted) return;
  renderResults(responses);
});

form.addEventListener('reset', () => {
  activeRequest?.abort();
  activeRequest = undefined;
  clearError();
  resetResult();
});
