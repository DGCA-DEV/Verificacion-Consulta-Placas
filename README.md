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

El formulario tiene un solo campo para placa o número de serie. El frontend reconoce como placa una entrada de 5 a 9 caracteres alfanuméricos que incluya letras y números; otros valores se envían como número de serie. Envía una solicitud `POST` con `placa` y `no_serie` directamente a `http://192.10.10.64:8020/smadsot/verificaciones/historico`.

La API Key pública se configura en `api-config.js` y se envía en el encabezado `X-API-Key`. Esta clave queda visible para cualquier usuario que visite el sitio; úsala solo si está autorizada para exposición pública. La API también debe permitir el origen donde se publica esta página mediante CORS.

El frontend muestra los datos de vehículo, verificaciones y errores del endpoint. El valor de búsqueda está limitado a 32 caracteres.

Los recursos de assets provienen de ../SIDAP-Frontend/public.
