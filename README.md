# Consulta de placas

Vista adaptable con Tailwind CSS, tipografía Gilroy y colores institucionales de Puebla.

## Abrir la vista

Abre `index.html` en el navegador, o ejecuta `python -m http.server 8080` y visita http://localhost:8080.
El CSS compilado se incluye en el repositorio.

## Desarrollo de estilos

Requiere Node.js y npm:

```powershell
npm ci
npm run dev
```

`npm run dev` recompila los estilos al cambiar los archivos; no inicia un servidor web. Abre `index.html` o ejecuta el servidor Python en otra terminal.

Para generar el CSS minificado:

```powershell
npm run build
```

Edita las clases Tailwind en `index.html`. El tema, las fuentes y las reglas base están en `tailwind.css`. No edites directamente `assets/tailwind.css`: se genera al compilar. Incluye el CSS generado al publicar.

## Alcance

Formulario accesible con validación básica, normalización de espacios y guiones, estados inicial y de error, y botón Limpiar. Sin dependencias de ejecución en el navegador.

Los recursos de assets provienen de ../SIDAP-Frontend/public.

No hay API conectada ni registros ficticios. Reemplaza el estado de servicio pendiente en app.js al integrar la API, agregando estados de carga, resultados y errores. Ajusta la validación a las reglas del servicio.
