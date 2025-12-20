# Estructura del Proyecto

## Árbol de Directorios
```
/
├── index.html          # Archivo Principal (Producción)
├── style.css           # Estilos Globales
├── script.js           # Lógica Principal (Producción - v8)
├── docs/               # Documentación del Proyecto
│   ├── FUNCIONAL.md
│   ├── TECNICO.md
│   └── ESTRUCTURA_PROYECTO.md
└── js/                 # [EN REVISIÓN] Archivos de Refactorización / Módulos
    ├── main.js         # Entry point modular (no usado en index.html)
    ├── core/
    │   ├── Game.js     # Lógica de juego modularizada
    │   └── Audio.js    # Controlador de audio modular
    └── logic/
        └── Generator.js # Lógica de generación de puzzles
```

## Detalles de Archivos Clave

### `script.js` (Producción)
Actualmente es el archivo "vivo". Contiene todas las correcciones recientes (botón de mute, historial, lógica de modos).

### `js/` (Desarrollo / Futuro)
Esta carpeta contiene una estructura modular que separa responsabilidades.
- **Estado Actual:** Parece ser una versión anterior o un intento de refactorización incompleto.
- **Recomendación:** Para futuras versiones, se debería migrar el código de `script.js` a esta estructura modular para facilitar el trabajo en equipo y el mantenimiento.
  1. Actualizar `js/core/Game.js` con los últimos cambios de `script.js`.
  2. Implementar `type="module"` en `index.html`.
  3. Eliminar `script.js` una vez completada la migración.

## Recursos Externos
- **Fuentes:** Se carga "Outfit" desde Google Fonts.
- **Librerías:** No se utilizan librerías externas de JS (jQuery, React, etc.).
