const form = document.querySelector('#search-form');
const identifierInput = document.querySelector('#vehicle-identifier');
const error = document.querySelector('#identifier-error');
const badge = document.querySelector('#result-badge');
const title = document.querySelector('#result-title');
const description = document.querySelector('#result-description');
const details = document.querySelector('#result-details');

const endpoint = {
  name: 'Verificaciones históricas',
  url: 'http://192.10.10.64:8020/smadsot/verificaciones/historico',
};

let activeRequest;

function clearError() {
  identifierInput.removeAttribute('aria-invalid');
  error.hidden = true;
  error.textContent = '';
}

function resetResult() {
  badge.textContent = 'Sin consulta';
  title.textContent = 'Tu consulta comienza aquí';
  description.textContent = 'Ingresa la placa o el número de serie y selecciona “Buscar vehículo” para continuar.';
  details.replaceChildren();
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function requestHistory(endpoint, payload, signal) {
  const apiKey = window.APP_CONFIG?.apiKey;
  if (!apiKey) {
    throw new Error('No se configuró la API Key pública para la consulta.');
  }

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
  if (!failed.length && !hasVehicleData && !verifications.length) {
    addMessage('El servicio respondió, pero no devolvió datos de vehículo ni verificaciones.');
  }

  if (failed.length === results.length) {
    badge.textContent = 'Error de consulta';
    title.textContent = 'No se pudo completar la consulta';
    description.textContent = 'Revisa la conexión y vuelve a intentarlo.';
  } else if (failed.length) {
    badge.textContent = 'Resultado parcial';
    title.textContent = 'Consulta incompleta';
    description.textContent = 'El servicio no respondió correctamente.';
  } else if (hasVehicleData || verifications.length) {
    badge.textContent = 'Consulta completada';
    title.textContent = 'Datos encontrados';
    description.textContent = 'Información devuelta por el servicio de consulta histórica.';
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

identifierInput.addEventListener('input', () => {
  activeRequest?.abort();
  activeRequest = undefined;
  clearError();
  resetResult();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const identifier = identifierInput.value.trim().toUpperCase();
  if (!identifier) {
    showValidationError('Ingresa la placa o el número de serie del vehículo para continuar.', identifierInput);
    return;
  }
  if (identifier.length > 32) {
    showValidationError('El dato ingresado no debe exceder 32 caracteres.', identifierInput);
    return;
  }

  identifierInput.value = identifier;
  const isPlate = /^(?=.*[A-Z])(?=.*\d)[A-Z\d]{5,9}$/.test(identifier.replace(/[\s-]/g, ''));
  const payload = {
    placa: isPlate ? identifier.replace(/[\s-]/g, '') : '',
    no_serie: isPlate ? '' : identifier,
  };
  activeRequest?.abort();
  activeRequest = new AbortController();
  const { signal } = activeRequest;

  badge.textContent = 'Consultando';
  title.textContent = 'Buscando información';
  description.textContent = 'Consultando verificaciones históricas.';
  details.replaceChildren();

  let responses;
  try {
    responses = [{ data: await requestHistory(endpoint, payload, signal) }];
  } catch (requestError) {
    if (requestError instanceof TypeError) {
      requestError.message = `${endpoint.name}: no se pudo conectar; revisa la conexión y la configuración CORS de la API.`;
    }
    responses = [{ error: requestError }];
  }
  if (signal.aborted) return;
  renderResults(responses);
});

form.addEventListener('reset', () => {
  activeRequest?.abort();
  activeRequest = undefined;
  clearError();
  resetResult();
});
