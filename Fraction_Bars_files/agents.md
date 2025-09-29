# AGENTS.MD: Refactoring Fraction Bars & Integrating Ace of Bases

## 1. Project Overview

This document provides the execution plan for a comprehensive modernization of the "Fraction Bars" application, integrating the "Ace of Base Arithmetic" module. The current codebase relies on outdated dependencies (jQuery, jQuery UI, and touch polyfills) and a monolithic architecture, primarily centered around `fractionBars.js`.

The goal is to transition to a modern, maintainable, and high-performance application using native web technologies, realizing the pedagogical vision of linking fractions (partitioning) and number bases (composition).

## 2. Objectives and Target Stack

### 2.1. Objectives

*   **Eliminate Technical Debt:** Completely remove jQuery, jQuery UI, and `jquery.ui.touch-punch.min.js`.
*   **Modern Architecture:** Implement a modular, component-based architecture (ES6+ modules) with strict separation of concerns.
*   **Unified Input:** Adopt the Pointer Events API for native, efficient handling of mouse, touch, and stylus inputs.
*   **Vector Graphics:** Transition the rendering engine to use Scalable Vector Graphics (SVG) for resolution-independent visuals.
*   **Mathematical Typesetting:** Integrate KaTeX or MathJax for professional rendering of all mathematical notation.
*   **Strategic Integration:** Integrate "Ace of Bases" to create the "Number Explorer" feature.

### 2.2. Technology Stack

*   **Frontend:** Vanilla JavaScript (ES6+ Modules), HTML5, CSS3.
*   **Graphics:** SVG (Scalable Vector Graphics).
*   **Input:** Pointer Events API.
*   **UI:** Native HTML Elements (`<dialog>`, `<input type="range">`).
*   **Typesetting:** KaTeX or MathJax.

## 3. Architectural Vision

The application must be refactored into a series of distinct, loosely coupled components. The monolithic structure of `fractionBars.js` must be completely dismantled and its responsibilities redistributed.

### 3.1. Core Components

*   **`StateManager.js` (Model):**
    *   The single source of truth.
    *   Manages all data: bars, mats, selections, undo/redo stack, active tool settings.
    *   Handles all state mutations (e.g., `addBar`, `partitionBar`).
    *   Must contain NO DOM manipulation or rendering logic.
*   **`SVGRenderer.js` (View):**
    *   Responsible for visualizing the state using SVG.
    *   Manages the SVG DOM, creating and updating SVG elements (`<rect>`, `<text>`, `<g>`) based on the `StateManager`.
*   **`InputHandler.js` (Controller/Adapter):**
    *   Listens to raw Pointer Events on the main SVG container.
    *   Interprets events based on the active tool.
    *   Translates raw input into semantic actions (e.g., `dragStart`, `barSelected`) and communicates these to the `StateManager`.
*   **`AppController.js`:**
    *   The main orchestrator. Initializes components and manages the application lifecycle.
    *   Manages view switching between the Fraction Bars module and the Ace of Bases module.

### 3.2. UI Components

*   **`ToolbarComponent.js`:** Manages the tool palette, color swatches, and action buttons.
*   **`DialogService.js`:** A reusable service utilizing the native HTML `<dialog>` element for all modal interactions (Partitioning, Properties, Iteration, Make Fraction, File Open).
*   **`SplitsWidget.js`:** Dedicated component for the partitioning UI, using native `<input type="range">`.

## 4. Refactoring Roadmap: Phased Execution Plan

Agents must follow these phases sequentially, ensuring stability at each checkpoint.

### Phase 0: Preparation and Analysis

1.  **Thorough Code Review:** Analyze the existing codebase, especially `fractionBars.js`, `FractionBarsCanvas.js`, and `SplitsWidget.js`. Ensure all functionalities, data structures, and interaction logic are fully understood.
2.  **Project Setup:** Create the new directory structure (e.g., `/src/model`, `/src/view`, `/src/controller`).
3.  **Asset Migration:** Port and clean existing HTML/CSS, removing jQuery UI assets.

### Phase 1: Architectural Foundation and Core jQuery Removal

**Goal:** Establish the new architecture and eliminate `jquery-1.9.1.min.js`.

1.  **Setup Structure:** Establish the directory structure for the new modules.
2.  **Implement `StateManager`:** Identify and migrate global state variables (e.g., `fbCanvasObj`, `selectedBars`, `selectedMats`) from `fractionBars.js` and `FractionBarsCanvas.js` into `StateManager.js`.
3.  **Systematic jQuery Replacement:** Use the "Refactoring Matrix" (Section 1.3 of the Audit) as a guide.
    *   Replace `$(document).ready()` with `document.addEventListener('DOMContentLoaded', ...)` (Move initialization to `AppController.js`).
    *   Replace `$()` selectors with `document.getElementById`, `document.querySelector`, or `document.querySelectorAll`.
    *   Replace `.addClass()`/`.removeClass()` with `element.classList.add()`/`.remove()`.
    *   Replace `.hide()`/`.show()` with `element.style.display`.
    *   Replace `.css()` with `element.style.property`.
    *   Replace `.attr()`/`.val()` with direct property access (e.g., `element.id`, `element.value`).
    *   Replace `$.inArray()` with `Array.prototype.includes()`.
    *   Replace `$.each()` with `Array.prototype.forEach()`.
4.  **Basic Event Handler Migration:** Convert jQuery event attachments (`.click()`, `.keydown()`) on UI elements (like toolbars) to `element.addEventListener()`.

*Checkpoint 1:* The application initializes without the core jQuery library. UI widgets and main interactions will be broken.

### Phase 2: UI Component Re-implementation (jQuery UI Removal)

**Goal:** Rebuild UI widgets natively and eliminate `jquery-ui-1.10.3.custom.min.js`.

1.  **Implement `DialogService`:** Create the reusable service based on the native HTML `<dialog>` element, using `.showModal()` and `.close()`.
2.  **Migrate Dialogs:** Replace the five jQuery UI `.dialog()` initializations (found in `fractionBars.js`) with the new `DialogService`.
    *   Dialogs: `#dialog-splits`, `#dialog-properties`, `#dialog-iterate`, `#dialog-make`, `#dialog-file`.
3.  **Migrate Slider:** Replace the jQuery UI `.slider()` widget (`#split-slider`).
    *   Use `<input type="range">`.
    *   Style it using CSS.
    *   Update `SplitsWidget.js` to use the native input's `.value` and listen to the `input` event.

*Checkpoint 2:* All dialogs and the slider function correctly. jQuery UI library and CSS are removed.

### Phase 3: Unified Input Model and Core Logic Migration

**Goal:** Implement Pointer Events, migrate interaction logic, and remove legacy touch shims.

1.  **Remove Legacy Touch Support:**
    *   Delete `jquery.ui.touch-punch.min.js`.
    *   Delete the now-redundant helper functions `getTouchPos` and `normalizeEvent` from `fractionBars.js`.
2.  **Implement `InputHandler`:**
    *   Consolidate all interaction listeners. Replace `mousedown`/`mousemove`/`mouseup` and `touchstart`/`touchmove`/`touchend` with `pointerdown`, `pointermove`, `pointerup`, `pointercancel`.
    *   Use `setPointerCapture()` for reliable drag operations.
    *   Ensure `touch-action: none;` is set on the interaction area via CSS.
3.  **Migrate Core Logic:**
    *   Move the actual manipulation logic (e.g., creating, selecting, moving bars/mats) from the old event handlers in `fractionBars.js` into methods within `StateManager.js`.
    *   The `InputHandler` should interpret the user's intent and call the appropriate `StateManager` methods.

*Checkpoint 3:* The application handles all inputs via Pointer Events. All legacy dependencies are removed.

### Phase 4: Graphics and Typesetting Modernization (SVG)

**Goal:** Transition to vector graphics and modern typesetting.

1.  **Transition to SVG:** This is a critical architectural change.
    *   Replace the `<canvas>` element with an `<svg>` element as the main workspace.
2.  **Implement SVG `SVGRenderer`:**
    *   Refactor the rendering logic from `FractionBarsCanvas.js` into `SVGRenderer.js`.
    *   The previous Canvas 2D API calls must be replaced with SVG element creation and manipulation.
    *   Bars and Mats must be represented as SVG groups (`<g>`) containing `<rect>` and `<text>` elements.
3.  **Data Binding:** Implement an efficient way for the `SVGRenderer` to update the SVG DOM when the `StateManager` data changes.
4.  **Mathematical Typesetting:**
    *   Integrate KaTeX or MathJax.
    *   Use the library to render all fractions (labels, dialogs). Ensure correct rendering within the SVG context (potentially using `<foreignObject>` if necessary, or direct SVG path output if supported).

*Checkpoint 4:* The application renders crisp, scalable vector graphics, and mathematical notation is professionally typeset.

### Phase 5: Integration of "Ace of Bases" and "Number Explorer"

**Goal:** Integrate the modules to realize the pedagogical vision (Section 3.2 and 3.3 of the Audit).

1.  **Refactor Ace of Bases:** Encapsulate the logic from `script_ace_of_bases.js` into a self-contained `AceOfBaseModule.js`. It must adhere to the new architecture (SVG rendering, Pointer Events).
2.  **Implement View Switching:** Update `AppController.js` to manage switching between the FractionBars view and the AceOfBase view.
3.  **Implement "Number Explorer":**
    *   Develop the inter-module communication API.
    *   Implement the UI flow: User selects a fraction (e.g., 3/7) -> User clicks "Analyze in Base" -> Controller activates `AceOfBaseModule` passing the rational value (3, 7).
    *   `AceOfBaseModule` visualizes the quantity/division and allows the user to dynamically change the base, observing the transition between terminating and repeating representations.

*Checkpoint 5:* The integrated application is complete, realizing the "Number Explorer" concept.

## 5. Specific Instructions: Dismantling `fractionBars.js`

The legacy file `fractionBars.js` is a primary source of technical debt and must be systematically eliminated by redistributing its logic:

*   **Initialization (`$(document).ready`)**: Move to `AppController.js`.
*   **State Variables (e.g., `selectedBars`, `activeTool`):** Move to `StateManager.js`.
*   **Core Business Logic (e.g., functions for partitioning, copying, coloring):** Move to `StateManager.js`.
*   **Canvas Interaction Event Handlers (mousedown, etc.):** Interpretation logic moves to `InputHandler.js`; action logic moves to `StateManager.js`.
*   **Toolbar Event Handlers (.click on tools/colors):** Move to `ToolbarComponent.js`.
*   **jQuery UI Initialization (dialogs, slider):** Replace with `DialogService.js` and `SplitsWidget.js`.
*   **`normalizeEvent` / `getTouchPos`:** Delete.

The goal is the complete deletion of the original `fractionBars.js` file.

## 6. Testing and Quality Strategy

*   **Incremental Validation:** Validate functionality after each significant change, particularly during the jQuery replacement phases.
*   **Phase Checkpoints:** Conduct thorough functional testing at the end of each phase.
*   **Regression Testing:** Ensure all core features (creation, selection, coloring, labeling, partitioning, iteration, file operations) remain intact.
*   **Cross-Device Testing:** Rigorously validate the Pointer Events implementation with mouse and touch inputs across modern browsers.
*   **Code Quality:** Adhere to modern ES6+ standards (classes, modules, `const`/`let`). Ensure code is clean, readable, and well-documented.