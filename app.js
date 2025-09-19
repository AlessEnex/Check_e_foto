// ====== CONFIG ======
const ROW_COUNT = 10;
const DEFAULT_YEAR = 2025;
const RECIPIENTS = [
  "vittorio.piaser@enextechnologies.com",
  "marco.lazzarin@enextechnologies.com",
  "giacomo.reato@enextechnologies.com",
  "nicolo.mattiuzzo@enextechnologies.com",
  "enrico.saccon@enextechnologies.com"
];

const START_TIME = "08:00";
const END_TIME   = "18:00";
const STEP_MIN   = 60;

// ====== UTIL ======
function pad(n){ return String(n).padStart(2,"0"); }
function timeToMinutes(t) { const [h,m] = t.split(":").map(Number); return h*60 + m; }
function minutesToTime(mins) { const h = Math.floor(mins/60), m = mins % 60; return `${pad(h)}:${pad(m)}`; }
function generateTimeOptions(start="08:00", end="18:00", stepMin=60) {
  const out=[]; let cur=timeToMinutes(start); const limit=timeToMinutes(end);
  while (cur<=limit){ out.push(minutesToTime(cur)); cur+=stepMin; }
  return out;
}
function getISOWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ====== DOM BUILD ======
document.addEventListener("DOMContentLoaded", () => {
  const rowsContainer = document.getElementById("rowsContainer");
  const sendBtn = document.getElementById("sendEmailBtn");
  const mailtoLink = document.getElementById("mailtoLink");
  const hours = generateTimeOptions(START_TIME, END_TIME, STEP_MIN);

  function makeSelect(options, attrs = {}) {
    const sel = document.createElement("select");
    Object.entries(attrs).forEach(([k,v]) => sel.setAttribute(k, v));
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      sel.appendChild(o);
    });
    return sel;
  }

  function createRadioGroup(name, labels) {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-radio";
    labels.forEach((lbl, i) => {
      const id = `${name}_${i}`;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.id = id;
      input.value = lbl;
      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = lbl;
      wrapper.appendChild(input);
      wrapper.appendChild(label);
    });
    return wrapper;
  }

  function createRow(idx) {
    const row = document.createElement("div");
    row.className = "row glass";
    const grid = document.createElement("div");
    grid.className = "row-grid";
    row.appendChild(grid);

    // Numero commessa
    const fComm = document.createElement("div");
    fComm.className = "custom-text-input field";
    fComm.innerHTML = `<label for="commessa_${idx}">Numero commessa</label><input type="text" id="commessa_${idx}" inputmode="numeric">`;

    // Anno
    const fYear = document.createElement("div");
    fYear.className = "custom-text-input field";
    fYear.innerHTML = `<label for="anno_${idx}">Anno</label><input type="number" id="anno_${idx}" value="${DEFAULT_YEAR}" min="2000" max="2100">`;

    // Data
    const fData = document.createElement("div");
    fData.className = "custom-text-input field";
    fData.innerHTML = `<label for="data_${idx}">Data</label><input type="date" id="data_${idx}">`;

    // Ora inizio
    const fStart = document.createElement("div");
    fStart.className = "custom-text-input field";
    const lStart = document.createElement("label");
    lStart.setAttribute("for", `start_${idx}`);
    lStart.textContent = "Ora inizio";
    const sStart = makeSelect(hours, { id: `start_${idx}` });
    fStart.append(lStart, sStart);

    // Ora fine
    const fEnd = document.createElement("div");
    fEnd.className = "custom-text-input field";
    const lEnd = document.createElement("label");
    lEnd.setAttribute("for", `end_${idx}`);
    lEnd.textContent = "Ora fine";
    const sEnd = makeSelect(hours, { id: `end_${idx}` });
    fEnd.append(lEnd, sEnd);

    // Linea
    const fLine = document.createElement("div");
    fLine.className = "field";
    fLine.appendChild(createRadioGroup(`linea_${idx}`, ["Linea 1", "Linea 2", "Linea 3"]));

    grid.append(fComm, fYear, fData, fStart, fEnd, fLine);

    // logica fine = inizio +2h
    function applyAutoEnd() {
      const startVal = sStart.value;
      let endMinutes = timeToMinutes(startVal) + 120;
      const maxEnd = timeToMinutes(END_TIME);
      if (endMinutes > maxEnd) endMinutes = maxEnd;
      const computed = minutesToTime(endMinutes);
      if (!sEnd.dataset.userEdited) sEnd.value = computed;
    }
    sStart.addEventListener("change", () => { sEnd.dataset.userEdited = ""; applyAutoEnd(); });
    sEnd.addEventListener("change", () => { sEnd.dataset.userEdited = "1"; });

    sStart.value = START_TIME;
    applyAutoEnd();

    return row;
  }

  // Costruisci le righe
  for (let i = 1; i <= ROW_COUNT; i++) rowsContainer.appendChild(createRow(i));

  // ====== EMAIL ======
  sendBtn.addEventListener("click", () => {
    const rows = [...document.querySelectorAll(".row")];
    const data = rows.map((row, idx) => {
      const comm = row.querySelector(`#commessa_${idx+1}`).value.trim();
      const year = row.querySelector(`#anno_${idx+1}`).value.trim();
      const date = row.querySelector(`#data_${idx+1}`).value;
      const start = row.querySelector(`#start_${idx+1}`).value;
      const end   = row.querySelector(`#end_${idx+1}`).value;
      const selectedRadio = row.querySelector(`input[name="linea_${idx+1}"]:checked`);
      const line = selectedRadio ? selectedRadio.value : "";
      return { comm, year, date, start, end, line };
    }).filter(r => r.comm || r.date);

    const commesse = [...new Set(data.map(d => d.comm).filter(Boolean))];
    const week = getISOWeekNumber(new Date());
    const subject = `Check e foto pre-bunker (commesse: ${commesse.length ? commesse.join(", ") : "—"}) - Week ${week}`;

    let body = "--- CHECK & FOTO PRE-BUNKER ---\n\n";
    data.forEach(d => {
      const dd = d.date ? d.date.split("-").reverse().join("/") : "—";
      body += `Commessa: ${d.comm || "—"} | Anno: ${d.year || "—"}\n`;
      body += `Data: ${dd} | Orario: ${d.start || "—"} - ${d.end || "—"} | Linea: ${d.line || "—"}\n\n`;
    });
    if (!data.length) body += "Nessuna riga compilata.\n";

    const to = RECIPIENTS.join(";");
    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    mailtoLink.setAttribute("href", url);
    mailtoLink.click();
  });

  // ====== THEME TOGGLE ======
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    });
  }

    // ====== DATEPICKER FULL CELL CLICK ======
    document.querySelectorAll(".custom-text-input input[type='date']").forEach(input => {
      const parent = input.parentElement;
      parent.style.cursor = "pointer";

      parent.addEventListener("click", () => {
        // forza il click sull'input
        if (typeof input.showPicker === "function") {
          input.showPicker();   // Chrome/Edge moderni
        } else {
          input.focus();        // Safari/Firefox
          input.click();        // forza apertura se serve
        }
      });
    });

});

self.addEventListener("install", (e) => {
  console.log("Service Worker installed");
});


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
