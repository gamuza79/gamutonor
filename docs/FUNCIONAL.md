# Documentación Funcional - Gamutonor

- **Interacción:**
  - **Click en Botón Undo (↩️):** En Modo Libre, permite deshacer el último match realizado.
  - **Feedback Visual:** En Modo Puzzle, si adivinas correctamente una incógnita, la casilla se volverá **verde** indicando éxito.
- **Teclado:** Manejo de numpad para adivinar.
**Gamutonor** (anteriormente Tetonor) es un videojuego de puzzle matemático y deducción lógica. El objetivo principal es despejar un tablero de números encontrando pares de cifras en una "tira" inferior que, mediante operaciones matemáticas básicas (Suma o Multiplicación), den como resultado los números del tablero.

## 2. Mecánicas de Juego

### 2.1. Reglas Básicas
- **El Tablero (Grid):** Contiene los números "Objetivo". Cada número es el resultado de una operación entre dos números de la tira inferior.
- **La Tira (Strip):** Contiene los números "Padres" o candidatos.
- **Operaciones:**
  - **Suma (+):** `Padre A + Padre B = Objetivo`
  - **Producto (×):** `Padre A × Padre B = Objetivo`
- **Selección:** El jugador debe seleccionar primero una casilla del tablero (Objetivo) y luego seleccionar los dos números de la tira que lo generan.

### 2.2. Modo Puzzle (Incógnitas)
- En dificultades superiores o niveles avanzados, algunos números de la tira inferior aparecen como **"?"** (ocultos).
- El jugador debe deducir el valor de estos números basándose en los Objetivos disponibles.
- Al resolver un Objetivo que utiliza un número oculto, este se revela.

### 2.3. Funcionalidades de Ayuda
- **Modo 2 Cifras:** Permite ingresar manualmente valores mayores a 9 para adivinar incógnitas.
- **Auto-completar:** Si queda un solo bloque por resolver, el sistema lo selecciona automáticamente para facilitar el flujo.
- **Ver Solución:** Disponible (con penalización o restricción según el modo) para mostrar la respuesta correcta.

## 3. Modos de Juego

### 3.1. Modo Competitivo (Campaña)
- **Estructura:** 25 Niveles de dificultad progresiva.
- **Sistema de Progresión:**
  - Niveles 1-5: Fácil (4 números), 1 incógnita.
  - Niveles 6-10: Fácil, 1 incógnita.
  - Niveles 11-15: Normal (6 números), 2 incógnitas.
  - Niveles 16-20: Normal, 2 incógnitas.
  - Niveles 21-24: Difícil (8 números), 3 incógnitas.
  - Nivel 25+: Muy Difícil (8 números), 4 incógnitas.
- **Temporizador:** 60 segundos por nivel. Si el tiempo se agota, es Game Over.
- **Puntuación:** Se acumulan puntos por completar niveles y bonificación por tiempo restante. Penalización por errores (-50 puntos, -3 segundos).
- **Restricción:** El botón "Ver Solución" está deshabilitado hasta que se pierde la partida.

### 3.2. Modo Libre (Sandbox)
- **Objetivo:** Práctica sin presión de tiempo (temporizador pausado o irrelevante para Game Over inmediato).
- **Personalización:**
  - **Dificultad:** Seleccionable (4, 6, 8, 12, 16 números).
  - **Modo Puzzle:** Activación manual de incógnitas.
  - **Temporizador Opcional:** Un cronómetro que cuenta el tiempo de juego, oculto por defecto para evitar estrés. Puede activarse/desactivarse con un botón.

### 3.3. Modo Hardcore (Ultra)
- **Configuración:** Tablero gigante de 16 números.
- **Operaciones:** Incluye Suma, Producto, y potencialmente Resta y División.
- **Tiempo:** Reto contrarreloj.

## 4. Interfaz de Usuario (UI)

### 4.1. Pantalla Principal
- Título y Subtítulo.
- Botones de selección de modo (Competitivo, Libre, Hardcore - deshabilitado/bloqueado visualmente).

### 4.2. Área de Juego
- **HUD (Campaña):** Muestra Nivel, Tiempo y Puntos.
- **Barra de Control (Sandbox):** Selector de dificultad, contador de restantes.
- **Grid Container:** Área visual de los objetivos.
- **Strip Container:** Área visual de los números base.
- **Controles:** Botones para Nuevo Juego, Ver Solución, Volver, y Silenciar Sonido.

### 4.3. Barra Lateral (Historial)
- **High Score / Mejor Tiempo:**
  - En Modo Competitivo: Muestra el mejor puntaje y nivel alcanzado.
  - En Modo Libre: Muestra el mejor tiempo logrado y la dificultad usada.
- **Historial:** Lista de las últimas partidas filtradas por el modo actual.
  - Competitivo: Resultado, Puntaje, Nivel.
  - Libre: Resultado, Tiempo, Dificultad.
- **Botón Compartir:** Permite copiar el récord al portapapeles.

## 5. Sistema de Audio
- Efectos de sonido para:
  - Clics (interacción general).
  - Selección de fichas.
  - Éxito (par correcto).
  - Error (par incorrecto).
  - Victoria y Derrota (melodías cortas).
- Botón de **Mute/Unmute** que persiste la preferencia en el navegador.
