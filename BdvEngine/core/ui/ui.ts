/**
 * HTML-based UI overlay for the engine.
 *
 * Creates DOM elements positioned over the WebGL canvas.
 * All elements are inside a root container with pointer-events
 * only on the UI elements themselves, so the canvas still receives input.
 *
 * Usage:
 *   let panel = UI.panel(10, 10, { width: 200, padding: '10px', background: 'rgba(0,0,0,0.7)' });
 *   UI.text(panel, "Score: 100", { color: 'white', fontSize: '18px' });
 *   UI.button(panel, "Start", () => console.log("clicked!"), { padding: '8px 16px' });
 */

export interface UIStyles {
  [key: string]: string;
}

export class UI {
  private static root: HTMLDivElement | null = null;

  private static ensureRoot(): HTMLDivElement {
    if (!UI.root) {
      UI.root = document.createElement("div");
      UI.root.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;" +
        "pointer-events:none;z-index:1000;overflow:hidden;";
      document.body.appendChild(UI.root);
    }
    return UI.root;
  }

  private static applyStyles(el: HTMLElement, styles?: UIStyles): void {
    if (!styles) return;
    for (let key in styles) {
      (el.style as any)[key] = styles[key];
    }
  }

  /** Remove all UI elements. */
  static clear(): void {
    if (UI.root) {
      UI.root.innerHTML = "";
    }
  }

  /** Remove a specific element. */
  static remove(element: HTMLElement): void {
    element.parentElement?.removeChild(element);
  }

  // ---- containers ----

  /** Absolutely positioned panel. Parent defaults to the UI root. */
  static panel(x: number, y: number, styles?: UIStyles, parent?: HTMLElement): HTMLDivElement {
    let el = document.createElement("div");
    el.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;pointer-events:auto;`;
    UI.applyStyles(el, styles);
    (parent || UI.ensureRoot()).appendChild(el);
    return el;
  }

  // ---- text ----

  /** Text label. */
  static text(parent: HTMLElement, content: string, styles?: UIStyles): HTMLDivElement {
    let el = document.createElement("div");
    el.textContent = content;
    el.style.cssText = "color:white;font:14px sans-serif;pointer-events:none;";
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  /** Heading text. */
  static heading(parent: HTMLElement, content: string, styles?: UIStyles): HTMLDivElement {
    return UI.text(parent, content, {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "8px",
      ...styles,
    });
  }

  /** Update the text content of an element. */
  static setText(element: HTMLElement, content: string): void {
    element.textContent = content;
  }

  // ---- interactive ----

  /** Button with click handler. */
  static button(parent: HTMLElement, label: string, onClick: () => void, styles?: UIStyles): HTMLButtonElement {
    let el = document.createElement("button");
    el.textContent = label;
    el.style.cssText =
      "padding:6px 14px;font:14px sans-serif;cursor:pointer;pointer-events:auto;" +
      "border:1px solid #555;background:#333;color:white;border-radius:3px;margin:2px;";
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  /** Checkbox with change handler. */
  static checkbox(parent: HTMLElement, label: string, checked: boolean, onChange: (val: boolean) => void, styles?: UIStyles): HTMLLabelElement {
    let wrapper = document.createElement("label");
    wrapper.style.cssText =
      "display:flex;align-items:center;gap:6px;color:white;font:14px sans-serif;" +
      "pointer-events:auto;cursor:pointer;margin:2px 0;";
    UI.applyStyles(wrapper, styles);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", (e) => {
      e.stopPropagation();
      onChange(input.checked);
    });

    let span = document.createElement("span");
    span.textContent = label;

    wrapper.appendChild(input);
    wrapper.appendChild(span);
    parent.appendChild(wrapper);
    return wrapper;
  }

  /** Slider with value change handler. */
  static slider(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    value: number,
    onChange: (val: number) => void,
    styles?: UIStyles,
  ): HTMLDivElement {
    let wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;align-items:center;gap:6px;color:white;font:14px sans-serif;" +
      "pointer-events:auto;margin:2px 0;";
    UI.applyStyles(wrapper, styles);

    let span = document.createElement("span");
    span.textContent = label;

    let input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.style.cssText = "flex:1;cursor:pointer;";

    let valDisplay = document.createElement("span");
    valDisplay.textContent = String(value);
    valDisplay.style.minWidth = "30px";

    input.addEventListener("input", (e) => {
      e.stopPropagation();
      let v = Number(input.value);
      valDisplay.textContent = String(v);
      onChange(v);
    });

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    wrapper.appendChild(valDisplay);
    parent.appendChild(wrapper);
    return wrapper;
  }

  /** Text input field. */
  static input(parent: HTMLElement, placeholder: string, onChange: (val: string) => void, styles?: UIStyles): HTMLInputElement {
    let el = document.createElement("input");
    el.type = "text";
    el.placeholder = placeholder;
    el.style.cssText =
      "padding:4px 8px;font:14px sans-serif;pointer-events:auto;" +
      "border:1px solid #555;background:#222;color:white;border-radius:3px;margin:2px;";
    el.addEventListener("input", (e) => {
      e.stopPropagation();
      onChange(el.value);
    });
    // prevent keyboard events from reaching the game
    el.addEventListener("keydown", (e) => e.stopPropagation());
    el.addEventListener("keyup", (e) => e.stopPropagation());
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  /** Dropdown select. */
  static select(parent: HTMLElement, options: string[], selected: number, onChange: (index: number, value: string) => void, styles?: UIStyles): HTMLSelectElement {
    let el = document.createElement("select");
    el.style.cssText =
      "padding:4px 8px;font:14px sans-serif;pointer-events:auto;" +
      "border:1px solid #555;background:#222;color:white;border-radius:3px;margin:2px;";
    for (let i = 0; i < options.length; i++) {
      let opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = options[i];
      if (i === selected) opt.selected = true;
      el.appendChild(opt);
    }
    el.addEventListener("change", (e) => {
      e.stopPropagation();
      onChange(el.selectedIndex, options[el.selectedIndex]);
    });
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  // ---- layout helpers ----

  /** Horizontal row container. */
  static row(parent: HTMLElement, styles?: UIStyles): HTMLDivElement {
    let el = document.createElement("div");
    el.style.cssText = "display:flex;flex-direction:row;gap:4px;align-items:center;";
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  /** Vertical column container. */
  static column(parent: HTMLElement, styles?: UIStyles): HTMLDivElement {
    let el = document.createElement("div");
    el.style.cssText = "display:flex;flex-direction:column;gap:4px;";
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  /** Spacer / divider. */
  static spacer(parent: HTMLElement, height: number = 8): HTMLDivElement {
    let el = document.createElement("div");
    el.style.height = `${height}px`;
    parent.appendChild(el);
    return el;
  }

  /** Image element. */
  static image(parent: HTMLElement, src: string, styles?: UIStyles): HTMLImageElement {
    let el = document.createElement("img");
    el.src = src;
    el.style.cssText = "pointer-events:none;";
    UI.applyStyles(el, styles);
    parent.appendChild(el);
    return el;
  }

  // ---- progress bar ----

  /** Progress bar. Returns [container, fill] so you can update fill.style.width. */
  static progressBar(parent: HTMLElement, value: number, styles?: UIStyles): { container: HTMLDivElement, fill: HTMLDivElement, setValue: (v: number) => void } {
    let container = document.createElement("div");
    container.style.cssText =
      "width:100%;height:16px;background:#222;border:1px solid #555;border-radius:3px;overflow:hidden;margin:2px 0;";
    UI.applyStyles(container, styles);

    let fill = document.createElement("div");
    fill.style.cssText =
      `width:${Math.max(0, Math.min(100, value))}%;height:100%;background:#4a4;transition:width 0.1s;`;

    container.appendChild(fill);
    parent.appendChild(container);

    return {
      container,
      fill,
      setValue: (v: number) => {
        fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
      },
    };
  }
}
