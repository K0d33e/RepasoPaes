# HistoriaLab Atlas · PAES Historia 2027

**Versión Atlas: rediseño completo, presentaciones animadas y estudio ponderado por eje.**

## Nuevo en la versión Atlas

### Estudio según el peso de cada eje
| Eje | Peso | Preguntas de 65 |
|---|---|---|
| Historia: Mundo, América y Chile | 56% | 36 |
| Formación ciudadana | 31% | 20 |
| Sistema económico | 13% | 9 |

- Panel **«Dónde se juega tu puntaje»** con el peso, las preguntas equivalentes y tu dominio en cada eje.
- **Preparación ponderada:** promedio de tus mejores pruebas multiplicado por el peso de cada eje.
- **Siguiente paso recomendado:** prioriza la unidad con mayor peso × brecha de dominio (Historia primero).
- Cada unidad muestra su peso aproximado (≈ preguntas de 65).
- **Ensayo ponderado** (`clasico/`): 65 preguntas al azar en proporción 36 · 20 · 9; práctica rápida de 15 en proporción 8 · 5 · 2.
- **39 preguntas nuevas en formato PAES** (`clasico/banco-paes.js`): fuentes, datos, cronologías y combinaciones I-II-III. Banco total del ensayo: 104 ítems (56 H · 30 C · 18 E). Son originales; no reproducen ítems oficiales del DEMRE.

### Diseño «Archivo del historiador» (UI/UX Pro Max)
- Papel con textura, tapas de cuero, polaroids, cinta washi, pergamino y sellos de lacre.
- Tipografía Crimson Pro (títulos) + Atkinson Hyperlegible (lectura), con Georgia y la fuente del sistema como respaldo si no hay internet.
- Colores por eje: lacre (Historia), azul tinta (Ciudadanía), oliva (Economía). Contraste ≥ 4,5:1.

### Presentaciones más interactivas
- Transición de «pasar la página» según la dirección y aparición escalonada del contenido.
- Cronología con botón **Reproducir** y riel animado.
- Fichas de conceptos con **giro 3D**.
- Fuentes que se despliegan como **pergamino**.
- Mapas con estilo de mapa antiguo y pines animados.
- Respuesta inmediata: vibración al fallar, sello «✓ Correcto» al acertar, confeti de papel y sello de lacre al completar.
- Deslizar para avanzar en móvil. Atajos en las pruebas: **A–D** para responder, **← →** para navegar.
- Todo respeta `prefers-reduced-motion`.

### Archivos nuevos
- `atlas.css`: capa visual y animaciones del aula.
- `clasico/atlas-classic.css`: tema del ensayo.
- `clasico/banco-paes.js`: banco adicional en formato PAES.

### Verificaciones
- Sin errores JS ni desbordamiento horizontal a 390 y 1366 px.
- Regresión: responder siempre A en la primera prueba = **3/10**.
- Ensayo completo: 36 H · 20 C · 9 E sin repetir preguntas; letras correctas repartidas entre A–D.

---


**Base anterior: versión notebook y responsiva.** Mantiene las 9 unidades, 16 escenas por lección, 27 pruebas, el banco de preguntas, el ensayo clásico y el guardado de progreso de HistoriaLab UX Pro.

Versión rediseñada de **HistoriaLab PRO** siguiendo criterios de la skill **UI/UX Pro Max — adaptación para ChatGPT**. Sitio educativo en **HTML + CSS + JavaScript**, sin framework, backend, API ni dependencias externas.


## Nuevo en la versión notebook

- **Escritorio de estudio adaptable** a notebooks de 1280×720, 1366×768 y 1440×900: la diapositiva usa el espacio disponible en altura, se desplaza dentro de su panel y deja los botones **Anterior / Continuar** siempre a la vista.
- **Modo enfoque** (en pantallas anchas): el botón situado arriba a la derecha de la lección oculta o recupera el panel «Tu ruta» para ampliar la presentación.
- **Exámenes a la altura del notebook:** pregunta a la izquierda y hoja de respuestas a la derecha, ambas con desplazamiento interno cuando es necesario. El botón «Siguiente» permanece visible. Al cambiar de pregunta se vuelve al principio del enunciado.
- **Avisos de desplazamiento** cuando un mapa, juego o fuente tiene contenido por debajo de la ventana. No se comprimen los mapas para hacerlos caber artificialmente.
- **Inicio más compacto** en notebooks para acceder antes al progreso y las unidades, sin ocultar información.
- **Ensayo clásico de 65 preguntas** actualizado también para notebooks con poca altura de pantalla.
- **Mobile y tablet:** conservan desplazamiento natural vertical, botones táctiles y navegación accesible. La interfaz sigue sin librerías externas ni servicios.

### Archivos incorporados

- `notebook-responsive.css`: ajustes de pantalla y navegación del aula.
- `clasico/notebook-classic.css`: ajustes equivalentes del ensayo clásico.
- `index.html`, `app.js`, `clasico/index.html`: integración de esos ajustes y el botón de modo enfoque.

### Compatibilidad verificada

- Renderización, ausencia de desbordamiento horizontal y continuidad del mapa en anchos de 375, 390, 768, 820, 912, 1024, 1280, 1366, 1440 y 1920 px.
- Botón Continuar accesible dentro de la ventana en notebooks de 1280×720, 1366×768, 1024×768 y 912×683.
- Recorrido completo de primera lección, juegos, tres pruebas desbloqueadas y resultado **3/10** al responder siempre A en la primera evaluación.
- Ensayo clásico en modo rápido: inicio, pregunta siguiente y controles en pantalla a los anchos comprobados.
- Mensajes de «Desplázate» y reinicio de la posición de lectura al cambiar de pregunta.

La visualización en pantalla depende también del zoom del navegador: si utilizas un zoom muy alto, la página tendrá más contenido desplazable para no recortar información. Los materiales son educativos originales, no preguntas oficiales del DEMRE.

---

## Mejoras visuales de esta entrega

- Nuevo inicio **Atlas del tiempo**, con cuatro hitos históricos, métricas de estudio, animaciones discretas y navegación clara.
- Indicador circular de **avance total**, acceso a **la siguiente unidad pendiente** y catálogo con filtros y búsqueda.
- Tarjetas por eje con un sistema coherente de color, progreso y estados de interacción.
- Presentaciones con legibilidad mejorada, títulos grandes, mapas, cronologías, tarjetas y juegos táctiles.
- Pruebas con alternativas más legibles, mejor diferenciación de selección, controles de revisión y corrección comentada.
- Diseño de la sección **ensayo clásico** armonizado con la plataforma y enlace de regreso al aula.
- Ajustes para ancho móvil de 375 y 390 px, tablet 768 px, portátil 1024 px y escritorio 1440 px, con foco visible y compatibilidad con `prefers-reduced-motion`.

## Contenido y mecánicas que se conservan

- **9 unidades:** 5 de Historia, 2 de Formación Ciudadana y 2 de Sistema Económico.
- **16 escenas por unidad:** introducción, contexto, mapa interactivo, línea de tiempo, orden cronológico, tarjetas, comparaciones, asociación de conceptos, causas/efectos, análisis de evidencia y síntesis.
- **3 chequeos de comprensión por unidad**, diferentes de las preguntas de examen.
- **3 juegos obligatorios de secuencia, asociación y análisis de fuentes**, además de explorar completamente el mapa.
- **3 pruebas por unidad:** Conceptos clave, Análisis de fuentes y Desafío PAES.
- **270 preguntas originales** en 27 pruebas de 10 preguntas, con cuatro alternativas y retroalimentación tras el examen.
- Las pruebas se habilitan **solo después de completar los juegos, el mapa y los chequeos de la presentación**.
- Cada prueba incluye 20 minutos, hoja de respuestas, marca para revisar, resultados por pregunta y descarga de corrección CSV.
- Guardado local de avances y exámenes con `localStorage`.
- Un **simulador clásico de 65 preguntas**, en la ruta `clasico/index.html`.

## Cómo abrirlo

1. **Descomprime** todo el ZIP (no abras únicamente el `index.html` dentro del ZIP).
2. Abre **`index.html`** en Chrome, Safari, Edge o Firefox.
3. Entra a cualquier tema. Recorre las 16 escenas y completa todas las actividades para desbloquear las tres pruebas.
4. Si quieres un ensayo general, pulsa **Abrir ensayo general** desde el inicio.

En iPhone es preferible publicarlo mediante un hosting estático (GitHub Pages o similar), ya que los visores locales de archivos pueden limitar JavaScript o su almacenamiento.

### Publicarlo gratuitamente con GitHub Pages

Sube **todo el contenido de esta carpeta** a la raíz del repositorio (incluida la subcarpeta `clasico`). Luego entra a **Settings → Pages → Build and deployment → Deploy from a branch** y selecciona `main` + `/ (root)`. La plataforma es estática y no necesita npm ni build.

## Archivos

```text
HistoriaLab_UX_Pro_2027/
├── index.html             # Vistas principales y navegación
├── styles.css             # Estilos originales de la plataforma
├── enhancements.css       # Mapas y juegos interactivos
├── design-system.css      # Nuevo sistema de diseño UI/UX Pro
├── notebook-responsive.css # Adaptación de notebook con controles visibles
├── app.js                 # Estado, navegación, pruebas y persistencia
├── content.js             # Nueve lecciones originales
├── interactive-content.js # Mapas y desafíos adicionales
├── deep-content.js       # Contenido ampliado: contexto, causas/efectos por hito, fechas, errores frecuentes
├── paes-score.js / .css  # Puntaje PAES estimado (tabla DEMRE) e historial de ensayos completos con sus respuestas, compartido con clasico/
├── ui-dialog.js / .css   # Diálogo de confirmación con el estilo del sitio (reemplaza confirm()), compartido con clasico/
├── questions.js           # Banco original de preguntas
├── questions-plus.js      # Datos para interpretación visual
├── README.md
└── clasico/
    ├── index.html
    ├── styles.css
    ├── design-classic.css # Rediseño del ensayo clásico
    ├── notebook-classic.css # Adaptación de notebook del ensayo
    └── app.js
```

## Verificaciones realizadas

- Carga de 9 unidades y presentación en 1440, 1024, 768, 390 y 375 px.
- Sin desbordamiento horizontal en inicio, unidad, portada de lección y mapa en dichos anchos.
- Recorrido de la primera unidad con mapa, juegos, chequeos, desbloqueo de 3 pruebas y corrección.
- Prueba de regresión: **responder siempre A = 3/10**, por debajo del umbral de dominio del 70%.
- Ensayo clásico en modo rápido: inicio, preguntas y ausencia de errores JS en varios tamaños.

## Referencias y límites

Temario de referencia: [PAES Historia y Ciencias Sociales — Admisión 2027](https://acceso.mineduc.cl/wp-content/uploads/2026/03/Temario-PAESRegular-2026-Historia-v2.pdf). Los nueve temas son una organización didáctica de los tres ejes oficiales; no representan la división oficial del DEMRE. Las preguntas, microactividades y fuentes didácticas son **materiales educativos originales** inspirados en el formato y las habilidades que evalúa la PAES. No constituyen preguntas oficiales, predicciones ni puntajes PAES oficiales.

Los datos de progreso se almacenan únicamente en **el navegador y el dominio actual**; no se envían a servidores. Abrir el proyecto en otra dirección web o borrar datos del navegador puede mostrar progreso distinto.
