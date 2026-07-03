/* =========================================================================
   EVENT MEDIA — PRICING
   =========================================================================
   👉 THIS TOP SECTION IS THE ONLY PART YOU NEED TO EDIT TO CHANGE PRICES.
   Change any number, label, or line of text below and save the file.
   Everything else further down just makes the app work.
   ========================================================================= */

const CONFIG = {

  // ---- Your business name (shows at the top of the app) ----
  businessName: "Bassface Event Media",

  // ---- The currency symbol used everywhere ----
  currency: "$",

  /* ---- PACKAGES: the customer picks ONE of these ----
     price      = the base price
     summary    = short line shown under the name
     includes   = bullet points listed in the quote                       */
  packages: [
    {
      id: "artist_spotlight",
      name: "Artist Spotlight",
      price: 300,
      summary: "Our standard package — full coverage of a one-hour set",
      includes: [
        "1 hour set coverage",
        "10 videos",
        "20–30 images",
        "Audio recording (when a clean front-of-house feed is available)",
        "1 photographer + 1 videographer",
      ],
    },
    {
      id: "big_shot",
      name: "The Big Shot",
      price: 600,
      summary: "Mid-tier — multi-cam coverage plus press and social content",
      includes: [
        "Everything in Artist Spotlight",
        "30–40 images",
        "10–15 press photos",
        "Multi-cam (minimum 2 additional angles)",
        "20 social media clips",
      ],
    },
    {
      id: "main_event",
      name: "The Main Event",
      price: 1200,
      summary: "Top tier — shot by the Bassface Nation crew",
      includes: [
        "25 micro content pieces",
        "50 set images",
        "20 press images",
        "Full set multi-cam",
        "Event recap video",
        "Personalized carousel of images",
      ],
    },
    {
      id: "main_event_subbed",
      name: "The Main Event (Subbed Out)",
      price: 1000,
      summary: "Same deliverables, shot by a subcontracted crew",
      includes: [
        "25 micro content pieces",
        "50 set images",
        "20 press images",
        "Full set multi-cam",
        "Event recap video",
        "Personalized carousel of images",
      ],
    },
  ],

  /* ---- ADD-ONS: extra things the customer can toggle on ----
     type "toggle"   = on/off, adds `price` once
     type "quantity" = customer enters a number, adds price × quantity
     unit            = shown next to the quantity box (e.g. "hours")       */
  addons: [
    { id: "extra_hours",   name: "Extra coverage",             type: "quantity", price: 150, unit: "hours" },
    { id: "extra_photos",  name: "Extra edited photos",        type: "quantity", price: 60,  unit: "×25 photos" },
    { id: "extra_cams",    name: "Additional cameras",         type: "quantity", price: 185, unit: "camera" },
    { id: "travel_miles",  name: "Travel beyond 25 miles",     type: "quantity", price: 1.5, unit: "miles" },
    { id: "nyc_tolls",     name: "NYC / five boroughs travel (est. tolls)", type: "toggle", price: 40 },
    { id: "drone",         name: "Drone aerial coverage",      type: "toggle",   price: 200 },
    { id: "same_day_reel", name: "Same-day highlight reel",    type: "toggle",   price: 400 },
    { id: "multitrack",    name: "Multitrack audio recording", type: "toggle",   price: 75 },
    { id: "rush",          name: "Rush 48-hour delivery",      type: "toggle",   price: 350 },
  ],

  // ---- Deposit required to book, as a percentage of the total ----
  depositPercent: 50,

/* =========================================================================
   👆 STOP EDITING HERE. The code below runs the app.
   ========================================================================= */
};


/* ---------- Helpers ---------- */

// Format a number as money, e.g. 1234.5 -> "$1,234.50" (or whole if round)
function money(n) {
  const rounded = Math.round(n * 100) / 100;
  const hasCents = rounded % 1 !== 0;
  return CONFIG.currency + rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

// The current selection, kept in one place
const state = {
  packageId: CONFIG.packages[0].id,  // start on the first package
  addons: {},                        // { addonId: quantity-or-1 }
  discountPercent: 0,
};


/* ---------- Build the screen ---------- */

function buildPackages() {
  const wrap = document.getElementById("packages");
  wrap.innerHTML = "";
  CONFIG.packages.forEach((pkg) => {
    const selected = pkg.id === state.packageId;
    const card = document.createElement("button");
    card.className = "package" + (selected ? " selected" : "");
    card.type = "button";
    card.innerHTML = `
      <div class="package-head">
        <span class="package-name">${pkg.name}</span>
        <span class="package-price">${money(pkg.price)}</span>
      </div>
      <p class="package-summary">${pkg.summary}</p>
      <ul class="package-includes">
        ${pkg.includes.map((i) => `<li>${i}</li>`).join("")}
      </ul>
    `;
    card.addEventListener("click", () => {
      state.packageId = pkg.id;
      render();
    });
    wrap.appendChild(card);
  });
}

function buildAddons() {
  const wrap = document.getElementById("addons");
  wrap.innerHTML = "";
  CONFIG.addons.forEach((addon) => {
    const row = document.createElement("div");
    row.className = "addon";

    if (addon.type === "toggle") {
      const on = !!state.addons[addon.id];
      row.innerHTML = `
        <label class="addon-main">
          <input type="checkbox" ${on ? "checked" : ""}>
          <span class="addon-name">${addon.name}</span>
        </label>
        <span class="addon-price">${money(addon.price)}</span>
      `;
      row.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.addons[addon.id] = 1;
        else delete state.addons[addon.id];
        render();
      });
    } else {
      const qty = state.addons[addon.id] || 0;
      row.innerHTML = `
        <div class="addon-main">
          <span class="addon-name">${addon.name}</span>
          <span class="addon-unit">${money(addon.price)} / ${addon.unit}</span>
        </div>
        <input class="addon-qty" type="number" min="0" step="1" value="${qty}"
               aria-label="${addon.name} quantity">
      `;
      row.querySelector("input").addEventListener("input", (e) => {
        const v = Math.max(0, parseFloat(e.target.value) || 0);
        if (v > 0) state.addons[addon.id] = v;
        else delete state.addons[addon.id];
        renderTotalsOnly();
      });
    }
    wrap.appendChild(row);
  });
}


/* ---------- Do the math ---------- */

function calculate() {
  const pkg = CONFIG.packages.find((p) => p.id === state.packageId);
  const lines = [{ label: pkg.name + " package", amount: pkg.price }];

  CONFIG.addons.forEach((addon) => {
    const qty = state.addons[addon.id];
    if (!qty) return;
    if (addon.type === "toggle") {
      lines.push({ label: addon.name, amount: addon.price });
    } else {
      lines.push({
        label: `${addon.name} (${qty} ${addon.unit})`,
        amount: addon.price * qty,
      });
    }
  });

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const discount = subtotal * (state.discountPercent / 100);
  const total = subtotal - discount;
  const deposit = total * (CONFIG.depositPercent / 100);

  return { lines, subtotal, discount, total, deposit };
}


/* ---------- Show the results ---------- */

function renderTotalsOnly() {
  const { lines, subtotal, discount, total, deposit } = calculate();

  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = lines
    .map((l) => `<div class="line"><span>${l.label}</span><span>${money(l.amount)}</span></div>`)
    .join("");

  const discountRow = document.getElementById("discount-row");
  if (state.discountPercent > 0) {
    discountRow.style.display = "flex";
    discountRow.querySelector(".discount-label").textContent =
      `Discount (${state.discountPercent}%)`;
    discountRow.querySelector(".discount-amount").textContent = "−" + money(discount);
  } else {
    discountRow.style.display = "none";
  }

  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("total").textContent = money(total);
  document.getElementById("deposit").textContent =
    `${money(deposit)} deposit to book (${CONFIG.depositPercent}%)`;
}

function render() {
  buildPackages();
  buildAddons();
  renderTotalsOnly();
}


/* ---------- Copy quote to clipboard (for sending to a client) ---------- */

function quoteAsText() {
  const pkg = CONFIG.packages.find((p) => p.id === state.packageId);
  const { lines, subtotal, discount, total, deposit } = calculate();
  const rows = [];
  rows.push(CONFIG.businessName.toUpperCase());
  rows.push("Quote");
  rows.push("");
  lines.forEach((l) => rows.push(pad(l.label, money(l.amount))));
  rows.push("-".repeat(40));
  rows.push(pad("Subtotal", money(subtotal)));
  if (state.discountPercent > 0) rows.push(pad(`Discount (${state.discountPercent}%)`, "-" + money(discount)));
  rows.push(pad("TOTAL", money(total)));
  rows.push("");
  rows.push(`${money(deposit)} deposit to book (${CONFIG.depositPercent}%).`);
  rows.push("");
  rows.push("Includes: " + pkg.includes.join("; ") + ".");
  return rows.join("\n");
}

// Line up a label on the left and amount on the right within 40 chars
function pad(label, amount) {
  const width = 40;
  const space = Math.max(1, width - label.length - amount.length);
  return label + " ".repeat(space) + amount;
}


/* ---------- Wire up the buttons ---------- */

function init() {
  document.getElementById("business-name").textContent = CONFIG.businessName;
  document.title = CONFIG.businessName + " — Pricing";

  const discountInput = document.getElementById("discount-input");
  discountInput.addEventListener("input", (e) => {
    state.discountPercent = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
    renderTotalsOnly();
  });

  document.getElementById("copy-btn").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(quoteAsText());
      flash(e.target, "Copied!");
    } catch {
      flash(e.target, "Press Ctrl+C");
    }
  });

  document.getElementById("print-btn").addEventListener("click", () => window.print());

  render();
}

// Briefly change a button's text to give feedback
function flash(btn, msg) {
  const original = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1400);
}

document.addEventListener("DOMContentLoaded", init);
