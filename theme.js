// IOS26.EDAWARD — fond dynamique + menu de configuration.
(function IOS26() {
  if (
    !(
      window.Spicetify &&
      Spicetify.Player &&
      Spicetify.Player.addEventListener &&
      Spicetify.Menu &&
      document.body
    )
  ) {
    setTimeout(IOS26, 300);
    return;
  }

  /* ── Palettes (miroir de color.ini) ─────────────────────────────── */
  const SCHEMES = {
    dark: {
      text: "FFFFFF",
      subtext: "B8B8C2",
      main: "0A0A0F",
      sidebar: "15151E",
      player: "15151E",
      card: "1E1E28",
      shadow: "000000",
      "selected-row": "FFFFFF",
      button: "0A84FF",
      "button-active": "0A84FF",
      "button-disabled": "3A3A45",
      "tab-active": "2A2A36",
      notification: "0A84FF",
      "notification-error": "FF453A",
      misc: "8E8E93",
    },
    light: {
      text: "1C1C1E",
      subtext: "6E6E73",
      main: "EDEDF4",
      sidebar: "FBFBFD",
      player: "FBFBFD",
      card: "FFFFFF",
      shadow: "9A9AA5",
      "selected-row": "1C1C1E",
      button: "007AFF",
      "button-active": "007AFF",
      "button-disabled": "C7C7CC",
      "tab-active": "E3E3EA",
      notification: "007AFF",
      "notification-error": "FF3B30",
      misc: "AEAEB2",
    },
    amoled: {
      text: "FFFFFF",
      subtext: "A8A8B0",
      main: "000000",
      sidebar: "000000",
      player: "000000",
      card: "0A0A0A",
      shadow: "000000",
      "selected-row": "FFFFFF",
      button: "0A84FF",
      "button-active": "0A84FF",
      "button-disabled": "2A2A30",
      "tab-active": "1A1A1F",
      notification: "0A84FF",
      "notification-error": "FF453A",
      misc: "8E8E93",
    },
  };

  const STORAGE_KEY = "ios26:settings";
  const BLUR = { subtil: "24px", normal: "42px", fort: "64px" };

  const ACCENTS = {
    red: { dark: "FF453A", light: "FF3B30" },
    orange: { dark: "FF9F0A", light: "FF9500" },
    yellow: { dark: "FFD60A", light: "FFCC00" },
    green: { dark: "30D158", light: "34C759" },
    teal: { dark: "64D2FF", light: "5AC8FA" },
    blue: { dark: "0A84FF", light: "007AFF" },
    indigo: { dark: "5E5CE6", light: "5856D6" },
    purple: { dark: "BF5AF2", light: "AF52DE" },
    pink: { dark: "FF375F", light: "FF2D55" },
  };

  const settings = { scheme: "dark", artwork: true, blur: "normal", accent: "blue" };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
  } catch (_) {}
  if (!SCHEMES[settings.scheme] && settings.scheme !== "auto") settings.scheme = "dark";
  if (!BLUR[settings.blur]) settings.blur = "normal";
  if (!ACCENTS[settings.accent]) settings.accent = "blue";

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function hexToRgb(hex) {
    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
      .map((p) => parseInt(p, 16))
      .join(",");
  }

  const media = window.matchMedia("(prefers-color-scheme: light)");

  function resolvedScheme() {
    if (settings.scheme === "auto") return media.matches ? "light" : "dark";
    return settings.scheme;
  }

  function render() {
    const name = resolvedScheme();
    const palette = Object.assign({}, SCHEMES[name]);
    const accent = ACCENTS[settings.accent][name === "light" ? "light" : "dark"];
    palette.button = accent;
    palette["button-active"] = accent;
    palette.notification = accent;
    const root = document.documentElement;
    for (const key of Object.keys(palette)) {
      root.style.setProperty("--spice-" + key, "#" + palette[key]);
      root.style.setProperty("--spice-rgb-" + key, hexToRgb(palette[key]));
    }
    root.style.setProperty("--glass-blur", BLUR[settings.blur]);
    document.body.classList.toggle("ios26-light", name === "light");
    document.body.classList.toggle("ios26-amoled", name === "amoled");
    document.body.classList.toggle("ios26-no-art", !settings.artwork);
  }

  media.addEventListener("change", () => {
    if (settings.scheme === "auto") render();
  });

  /* ── Fond dynamique : pochette du morceau en cours, floutée ─────── */
  const backdrop = document.createElement("div");
  backdrop.id = "ios26-backdrop";
  const layers = [document.createElement("div"), document.createElement("div")];
  for (const layer of layers) {
    layer.className = "layer";
    backdrop.appendChild(layer);
  }
  document.body.prepend(backdrop);

  let active = 0;
  let currentUrl = "";

  function artworkUrl() {
    const meta =
      Spicetify.Player.data &&
      Spicetify.Player.data.item &&
      Spicetify.Player.data.item.metadata;
    if (!meta) return "";
    const raw =
      meta.image_xlarge_url || meta.image_large_url || meta.image_url || "";
    return raw.replace("spotify:image:", "https://i.scdn.co/image/");
  }

  function update() {
    const url = artworkUrl();
    if (!url || url === currentUrl) return;
    currentUrl = url;
    const next = 1 - active;
    const img = new Image();
    img.onload = () => {
      layers[next].style.backgroundImage = 'url("' + url + '")';
      layers[next].classList.add("visible");
      layers[active].classList.remove("visible");
      active = next;
    };
    img.src = url;
  }

  Spicetify.Player.addEventListener("songchange", update);

  /* ── Panneau de configuration ───────────────────────────────────── */
  function pickScheme(name) {
    settings.scheme = name;
    save();
    render();
  }
  function pickBlur(level) {
    settings.blur = level;
    save();
    render();
  }
  function pickAccent(name) {
    settings.accent = name;
    save();
    render();
  }
  function toggleArtwork() {
    settings.artwork = !settings.artwork;
    save();
    render();
  }

  function segRow(labelText, options, current, onPick) {
    const row = document.createElement("div");
    row.className = "ios26-row";
    const label = document.createElement("span");
    label.className = "ios26-label";
    label.textContent = labelText;
    const seg = document.createElement("div");
    seg.className = "ios26-seg";
    for (const opt of options) {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      if (opt.value === current) btn.classList.add("active");
      btn.onclick = () => {
        onPick(opt.value);
        for (const other of seg.querySelectorAll("button")) {
          other.classList.remove("active");
        }
        btn.classList.add("active");
      };
      seg.appendChild(btn);
    }
    row.append(label, seg);
    return row;
  }

  function switchRow(labelText, isOn, onToggle) {
    const row = document.createElement("div");
    row.className = "ios26-row";
    const label = document.createElement("span");
    label.className = "ios26-label";
    label.textContent = labelText;
    const toggle = document.createElement("button");
    toggle.className = "ios26-switch" + (isOn ? " on" : "");
    toggle.onclick = () => {
      onToggle();
      toggle.classList.toggle("on");
    };
    row.append(label, toggle);
    return row;
  }

  function accentRow() {
    const row = document.createElement("div");
    row.className = "ios26-row";
    const label = document.createElement("span");
    label.className = "ios26-label";
    label.textContent = "Accent";
    const dots = document.createElement("div");
    dots.className = "ios26-accents";
    for (const name of Object.keys(ACCENTS)) {
      const dot = document.createElement("button");
      dot.className = "ios26-dot" + (name === settings.accent ? " active" : "");
      dot.style.setProperty("--dot", "#" + ACCENTS[name].dark);
      dot.setAttribute("aria-label", "Accent " + name);
      dot.onclick = () => {
        pickAccent(name);
        for (const other of dots.querySelectorAll("button")) {
          other.classList.remove("active");
        }
        dot.classList.add("active");
      };
      dots.appendChild(dot);
    }
    row.append(label, dots);
    return row;
  }

  function openSettings() {
    const ui = document.createElement("div");
    ui.id = "ios26-settings";
    ui.appendChild(
      segRow(
        "Schéma",
        [
          { label: "Sombre", value: "dark" },
          { label: "Clair", value: "light" },
          { label: "Auto", value: "auto" },
          { label: "AMOLED", value: "amoled" },
        ],
        settings.scheme,
        pickScheme
      )
    );
    ui.appendChild(accentRow());
    ui.appendChild(switchRow("Fond pochette", settings.artwork, toggleArtwork));
    ui.appendChild(
      segRow(
        "Flou",
        [
          { label: "Subtil", value: "subtil" },
          { label: "Normal", value: "normal" },
          { label: "Fort", value: "fort" },
        ],
        settings.blur,
        pickBlur
      )
    );
    Spicetify.PopupModal.display({ title: "IOS26", content: ui });
  }

  /* Bouton visible dans la barre du haut (à côté des flèches). */
  const ICON =
    '<svg role="img" height="18" width="18" viewBox="0 0 16 16" fill="currentColor"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/></svg>';
  try {
    new Spicetify.Topbar.Button("IOS26", ICON, openSettings);
  } catch (_) {}

  /* Repli : entrée « IOS26 » dans le menu profil, si disponible. */
  try {
    new Spicetify.Menu.Item("IOS26", false, openSettings).register();
  } catch (_) {}

  render();
  update();
})();
