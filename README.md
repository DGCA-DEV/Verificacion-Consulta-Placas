# Consulta de placas

Vista adaptable basada en SIDAP-Frontend: tipografía Gilroy, guinda, dorado y recursos institucionales de Puebla.

## Abrir la vista

Abre index.html directamente en un navegador, o ejecuta `python -m http.server 8080` y visita http://localhost:8080.

## Alcance

Formulario accesible con validación básica, normalización de espacios y guiones, estados inicial y de error, y botón Limpiar. Sin dependencias ni compilación.

Los recursos de assets provienen de ../SIDAP-Frontend/public.

No hay API conectada ni registros ficticios. Reemplaza el estado de servicio pendiente en app.js al integrar la API, agregando estados de carga, resultados y errores. Ajusta la validación a las reglas del servicio.
