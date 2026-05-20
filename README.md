# Punto M — Dashboard de Contenidos

Dashboard HTML estático conectado al Google Sheet "Punto M - Master Content System".

---

## Setup en 3 pasos

### Paso 1 — Desplegar el Apps Script

1. Abrí el Google Sheet → **Extensiones → Apps Script**
2. Borrá el código existente y pegá el contenido de `Code.gs`
3. Guardá (Ctrl+S)
4. Clic en **Desplegar → Nueva implementación**
5. Tipo: **Aplicación web**
6. Ejecutar como: **Yo**
7. Quién tiene acceso: **Cualquier persona**
8. Clic en **Desplegar** → copiá la **URL de la aplicación web**

### Paso 2 — Conectar el dashboard

1. Abrí `app.js`
2. En la línea `API_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'`
3. Reemplazá el valor con la URL que copiaste

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/TU_ID_AQUI/exec',
  ...
};
```

### Paso 3 — Publicar en GitHub Pages

1. Creá un repositorio en GitHub
2. Subí los 3 archivos: `index.html`, `styles.css`, `app.js`
3. En el repositorio → **Settings → Pages → Branch: main → Save**
4. Tu dashboard va a estar disponible en `https://tuusuario.github.io/nombre-repo`

---

## Estructura de archivos

```
punto-m-dashboard/
├── index.html      → estructura HTML del dashboard
├── styles.css      → estilos (diseño Punto M)
├── app.js          → lógica, fetch de datos, renderizado
├── Code.gs         → backend Apps Script (va en el Sheet)
└── README.md       → este archivo
```

---

## Cómo actualizar datos

Los datos siempre vienen del Google Sheet. No hay nada que hacer en el dashboard — cada vez que Romi o Andy abren el link, el dashboard lee la última versión del sheet.

Si querés forzar una actualización manual: botón **↻** arriba a la derecha.

---

## Funcionalidades

| Tab | Qué muestra |
|-----|-------------|
| **Resumen** | Stats de la semana, mensaje central, próximos eventos |
| **Estrategia** | Foco comercial, foco confianza, productos prioritarios |
| **Reels** | Variantes, hooks, guiones, tomas, texto en pantalla + performance |
| **WhatsApp** | Copy completo listo para pegar + botón copiar |
| **Stories** | Tipo, hook, texto visual, texto apoyo, CTA |
| **Emails** | Asunto, preheader, email completo + botones copiar |
| **Calendario** | Eventos comerciales y estacionales del año |
| **Performance** | Tabla de métricas de reels completadas |
| **Productos** | Stock, precios, alertas de stock bajo |

---

## Si algo no carga

- Verificá que `API_URL` en `app.js` sea la URL correcta del deploy
- Si cambiás el `Code.gs`, necesitás hacer un **nuevo deploy** (no editar el existente)
- Si el Sheet es privado, el Apps Script igual funciona porque corre con tu cuenta
