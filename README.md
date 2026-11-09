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

## Consulta de historial

El formulario envía una solicitud `POST` con `placa` y `no_serie` a los endpoints de documentos y verificaciones históricas en `http://192.10.10.64:8020`. El encabezado `X-API-Key` se toma del campo temporal de la página y no se persiste.

Como la clave se utiliza directamente desde el navegador, puede ser inspeccionada por quien use la página. Para producción, configura HTTPS y CORS en el servicio y considera un proxy seguro para no exponer la clave. Los navegadores también pueden bloquear la solicitud si el sitio se sirve por HTTPS y el API solo está disponible por HTTP.

El frontend muestra datos del vehículo, verificaciones y errores por endpoint. La validación de placa conserva el formato básico de 5 a 9 caracteres alfanuméricos con al menos una letra y un número.

Los recursos de assets provienen de ../SIDAP-Frontend/public.

No hay API conectada ni registros ficticios. Reemplaza el estado de servicio pendiente en app.js al integrar la API, agregando estados de carga, resultados y errores. Ajusta la validación a las reglas del servicio.
