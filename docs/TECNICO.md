# Documentación Técnica - Gamutonor

## 1. Arquitectura del Proyecto
El proyecto está construido utilizando tecnologías web estándar (Vanilla HTML, CSS, JS) sin dependencias de frameworks externos ni procesos de compilación complejos.

### 1.1. Estructura de Archivos (Actual)
*   **`index.html`**: Punto de entrada de la aplicación. Contiene la estructura DOM, los contenedores de la UI (Menú, Juego, Modales, Sidebar) y la carga de scripts.
*   **`style.css`**: Hoja de estilos principal. Utiliza variables CSS (`:root`) para la paleta de colores y un diseño responsivo basado en Flexbox y Grid.
*   **`script.js`**: Archivo monolítico que contiene toda la lógica del juego. (Actualmente en versión 8).
    *   *Nota: Existen carpetas `js/core` y `js/logic` que parecen ser parte de un refactor no implementado en producción.*

## 2. Descripción de Clases (`script.js`)

### 2.1. Clase `AudioController`
Maneja la síntesis de audio utilizando la **Web Audio API**. No requiere archivos de audio externos, genera los sonidos mediante osciladores en tiempo real.
- **Propiedades:** `ctx` (AudioContext), `enabled` (Estado de silencio).
- **Persistencia:** Guarda el estado del audio en `localStorage` (`audio_muted`).
- **Métodos Principales:**
  - `play(type)`: Reproduce sonidos predefinidos ('click', 'success', 'error', 'win', 'loss').
  - `playNote(freq, time, dur)`: Helper para generar tonos musicales.

### 2.2. Clase `GamutonorGame`
Controlador principal del flujo de juego, manejo del DOM y estado.
- **Estado (`this.state`):**
  - `mode`: 'menu', 'campaign', 'sandbox', 'ultra'.
  - `gridNumbers`: Array de objetos objetivo (valor, tipo operación, padres).
  - `stripNumbers`: Array de números simples disponibles para selección.
  - `difficulty`: Número entero que define la cantidad de elementos en la tira (4 a 16).
  - `isPuzzleMode`: Booleano para activar incógnitas.
  - `history`: Array de objetos con el registro de partidas recientes.

- **Generación de Niveles (`startNewGame`):**
  1.  Genera números base (`strip`) aleatorios o secuenciales (1-9) según dificultad.
  2.  Forma pares aleatorios de la tira.
  3.  Calcula sus resultados (Suma o Producto) para crear los Objetivos del tablero (`targets`).
  4.  Asegura que **cada número de la tira se use al menos una vez** (o en pares definidos) para garantizar que el puzzle tenga solución lógica.
  5.  Oculta números de la tira según `hiddenIndices` si está activo el Modo Puzzle.

- **Manejo de Inputs:**
  - Soporta clics directos en las fichas.
  - Soporta "Teclado Numérico" en pantalla (modal) para adivinar incógnitas.
  - Validación inmediata de pares seleccionados.

- **Sistema de Puntuación y Tiempo:**
  - `startLevel(level)`: Configura dificultad basada en curvas predefinidas.
  - `applyPenalty()`: Resta puntos y tiempo ante errores.
  - `addToHistory()`: Registra el resultado final y actualiza el High Score.

## 3. Tecnologías y Librerías
- **Lenguaje:** ECMAScript 6+ (JavaScript Moderno).
- **Estilos:** CSS3 nativo con Variables Custom.
- **Fuentes:** Google Fonts ("Outfit").
- **Iconos:** SVGs inline.

## 4. Flujo de Datos
1.  **Inicio:** `DOMContentLoaded` instancia `GamutonorGame`.
2.  **Interacción:** Listeners en el DOM disparan métodos de la clase.
3.  **Lógica:** La clase actualiza el estado (`this.state`) y redibuja la UI (`render()`, `updateTimeDisplay()`).
4.  **Audio:** Las acciones invocan `AudioController` para feedback sonoro.

## 5. Mantenimiento y Extensión
- **Refactorización:** Se recomienda migrar la lógica monolítica de `script.js` a módulos ES6 (como se observa en `js/core/Game.js`) para mejorar la mantenibilidad.
- **Configuración:** Las curvas de dificultad están *hardcoced* en `startLevel`. Podrían moverse a un archivo de configuración separado.
