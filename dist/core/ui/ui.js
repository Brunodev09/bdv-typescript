export class UI {
    static ensureRoot() {
        if (!UI.root) {
            UI.root = document.createElement("div");
            UI.root.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;" +
                    "pointer-events:none;z-index:1000;overflow:hidden;";
            document.body.appendChild(UI.root);
        }
        return UI.root;
    }
    static applyStyles(el, styles) {
        if (!styles)
            return;
        for (let key in styles) {
            el.style[key] = styles[key];
        }
    }
    static clear() {
        if (UI.root) {
            UI.root.innerHTML = "";
        }
    }
    static remove(element) {
        var _a;
        (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
    }
    static panel(x, y, styles, parent) {
        let el = document.createElement("div");
        el.style.cssText =
            `position:absolute;left:${x}px;top:${y}px;pointer-events:auto;`;
        UI.applyStyles(el, styles);
        (parent || UI.ensureRoot()).appendChild(el);
        return el;
    }
    static text(parent, content, styles) {
        let el = document.createElement("div");
        el.textContent = content;
        el.style.cssText = "color:white;font:14px sans-serif;pointer-events:none;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static heading(parent, content, styles) {
        return UI.text(parent, content, Object.assign({ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }, styles));
    }
    static setText(element, content) {
        element.textContent = content;
    }
    static button(parent, label, onClick, styles) {
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
    static checkbox(parent, label, checked, onChange, styles) {
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
    static slider(parent, label, min, max, value, onChange, styles) {
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
    static input(parent, placeholder, onChange, styles) {
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
        el.addEventListener("keydown", (e) => e.stopPropagation());
        el.addEventListener("keyup", (e) => e.stopPropagation());
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static select(parent, options, selected, onChange, styles) {
        let el = document.createElement("select");
        el.style.cssText =
            "padding:4px 8px;font:14px sans-serif;pointer-events:auto;" +
                "border:1px solid #555;background:#222;color:white;border-radius:3px;margin:2px;";
        for (let i = 0; i < options.length; i++) {
            let opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = options[i];
            if (i === selected)
                opt.selected = true;
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
    static row(parent, styles) {
        let el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:row;gap:4px;align-items:center;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static column(parent, styles) {
        let el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;gap:4px;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static spacer(parent, height = 8) {
        let el = document.createElement("div");
        el.style.height = `${height}px`;
        parent.appendChild(el);
        return el;
    }
    static image(parent, src, styles) {
        let el = document.createElement("img");
        el.src = src;
        el.style.cssText = "pointer-events:none;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static progressBar(parent, value, styles) {
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
            setValue: (v) => {
                fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
            },
        };
    }
}
UI.root = null;
//# sourceMappingURL=ui.js.map