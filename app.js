const form = document.querySelector('#search-form');
const plateInput = document.querySelector('#plate');
const error = document.querySelector('#plate-error');
const badge = document.querySelector('#result-badge');
const title = document.querySelector('#result-title');
const description = document.querySelector('#result-description');
function clearError() {
  plateInput.removeAttribute('aria-invalid');
  error.hidden = true;
  error.textContent = '';
}
function resetResult() {
  badge.textContent = 'Sin consulta';
  title.textContent = 'Tu consulta comienza aquí';
  description.textContent = 'Ingresa una placa y selecciona “Buscar placa” para continuar.';
}
plateInput.addEventListener('input', () => { clearError(); resetResult(); });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearError();
  const plate = plateInput.value.toUpperCase().replace(/[\s-]/g, '');
  if (!/^(?=.*[A-Z])(?=.*\d)[A-Z\d]{5,9}$/.test(plate)) {
    resetResult();
    error.textContent = plate ? 'Revisa la placa: debe contener de 5 a 9 letras y números, sin caracteres especiales.' : 'Ingresa la placa del vehículo para continuar.';
    error.hidden = false;
    plateInput.setAttribute('aria-invalid', 'true');
    plateInput.focus();
    return;
  }
  plateInput.value = plate;
  // Sustituir este estado al integrar el servicio real de consulta.
  badge.textContent = 'Servicio pendiente';
  title.textContent = `Placa ${plate}`;
  description.textContent = 'La consulta de registros aún no está disponible. El servicio de verificación está pendiente de conexión.';
});
form.addEventListener('reset', () => { clearError(); resetResult(); plateInput.focus(); });
