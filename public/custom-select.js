(() => {
  const selectors = document.querySelectorAll("[data-neuro-select]");
  if (!selectors.length) {
    return;
  }

  function closeAll(except) {
    selectors.forEach(wrapper => {
      if (wrapper !== except) {
        wrapper.dataset.open = "false";
        const trigger = wrapper.querySelector(".neuro-select-trigger");
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  function syncDisplay(select, triggerLabel, optionButtons) {
    const selected = select.options[select.selectedIndex];
    const label = selected ? selected.textContent : "";
    triggerLabel.textContent = label;

    optionButtons.forEach(button => {
      const isSelected = button.dataset.value === select.value;
      button.setAttribute("aria-selected", String(isSelected));
      button.classList.toggle("is-selected", isSelected);
    });
  }

  selectors.forEach(wrapper => {
    const select = wrapper.querySelector("select[data-neuro-native]");
    if (!select) {
      return;
    }

    wrapper.dataset.open = "false";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "neuro-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", `${select.id}-menu`);

    const label = document.createElement("span");
    label.className = "neuro-select-label";
    trigger.appendChild(label);

    const icon = document.createElement("span");
    icon.className = "neuro-select-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    trigger.appendChild(icon);

    const menu = document.createElement("div");
    menu.className = "neuro-select-menu";
    menu.id = `${select.id}-menu`;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", select.getAttribute("aria-label") || "Select option");

    const optionButtons = [];
    Array.from(select.options).forEach(option => {
      if (option.disabled && !option.value) {
        return;
      }

      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "neuro-option";
      optionButton.setAttribute("role", "option");
      optionButton.dataset.value = option.value;
      optionButton.textContent = option.textContent;

      optionButton.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("input", { bubbles: true }));
        wrapper.dataset.open = "false";
        trigger.setAttribute("aria-expanded", "false");
        syncDisplay(select, label, optionButtons);
        trigger.focus();
      });

      optionButtons.push(optionButton);
      menu.appendChild(optionButton);
    });

    trigger.addEventListener("click", () => {
      const isOpen = wrapper.dataset.open === "true";
      closeAll(wrapper);
      wrapper.dataset.open = String(!isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });

    trigger.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        wrapper.dataset.open = "false";
        trigger.setAttribute("aria-expanded", "false");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        wrapper.dataset.open = "true";
        trigger.setAttribute("aria-expanded", "true");
        if (optionButtons[0]) {
          optionButtons[0].focus();
        }
      }
    });

    menu.addEventListener("keydown", event => {
      const currentIndex = optionButtons.indexOf(document.activeElement);
      if (event.key === "Escape") {
        wrapper.dataset.open = "false";
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
      if (event.key === "ArrowDown" && currentIndex < optionButtons.length - 1) {
        event.preventDefault();
        optionButtons[currentIndex + 1].focus();
      }
      if (event.key === "ArrowUp" && currentIndex > 0) {
        event.preventDefault();
        optionButtons[currentIndex - 1].focus();
      }
    });

    select.addEventListener("change", () => {
      syncDisplay(select, label, optionButtons);
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    syncDisplay(select, label, optionButtons);
  });

  document.addEventListener("click", event => {
    const targetWrapper = event.target.closest("[data-neuro-select]");
    closeAll(targetWrapper || null);
  });
})();
