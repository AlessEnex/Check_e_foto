// ====== CONFIG ======
const ROW_COUNT = 10;
const DEFAULT_YEAR = 2025;
// Destinatari di default (modificabili)
const RECIPIENTS = [
  "vittorio.piaser@enextechnologies.com",
  "marco.lazzarin@enextechnologies.com",
  "giacomo.reato@enextechnologies.com",
  "nicolo.mattiuzzo@enextechnologies.com",
  "enrico.saccon@enextechnologies.com"
];

// Orari consentiti
const START_TIME = "08:00";
const END_TIME   = "18:00";
const STEP_MIN   = 60; // minuti

// ====== UTIL ======
const rowsContainer = document.getElementById("rowsContainer");

function pad(n){ return String(n).padStart(2,"0"); }

function timeToMinutes(t) {
  const [h,m] = t.split(":").map(Number);
  return h*60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins/60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}
function generateTimeOptions(start="08:00", end="18:00", stepMin=60) {
  const out = [];
  let cur = timeToMinutes(start);
  const limit = timeToMinutes(end);
  while (cur <= limit) {
    out.push(minutesToTime(cur));
    cur += stepMin;
  }
  return out;
}

// ISO week number (locale Europa/Rome assumed by browser)
function getISOWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

// URL encode safely
function enc(s){ return encodeURIComponent(s).replace(/%20/g, "+"); }

// ====== DOM BUILD ======
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
  const fieldset = document.createElement("fieldset");
  fieldset.className = "custom-radio";
  const legend = document.createElement("legend");
  legend.className = "legend-inline";
  legend.textContent = "Disponibile in linea";
  fieldset.appendChild(legend);

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

    fieldset.appendChild(input);
    fieldset.appendChild(label);
  });

  return fieldset;
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
  const lComm = document.createElement("label");
  lComm.setAttribute("for", `commessa_${idx}`);
  lComm.textContent = "Numero commessa";
  const iComm = document.createElement("input");
  iComm.type = "text";
  iComm.inputMode = "numeric";
  iComm.id = `commessa_${idx}`;
  fComm.append(lComm, iComm);

  // Anno (default 2025)
  const fYear = document.createElement("div");
  fYear.className = "custom-text-input field";
  const lYear = document.createElement("label");
  lYear.setAttribute("for", `anno_${idx}`);
  lYear.textContent = "Anno";
  const iYear = document.createElement("input");
  iYear.type = "number";
  iYear.id = `anno_${idx}`;
  iYear.value = DEFAULT_YEAR;
  iYear.min = 2000; iYear.max = 2100;
  fYear.append(lYear, iYear);

  // Testo fisso + Data
  const fData = document.createElement("div");
  fData.className = "custom-text-input field";
  const fixed = document.createElement("div");
  fixed.className = "label-fixed";
  fixed.textContent = "DISPONIBILE PER CHECK FOTO DA";
  const iDate = document.createElement("input");
  iDate.type = "date";
  iDate.id = `data_${idx}`;
  fData.append(fixed, iDate);

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

  // Disponibile in linea (radio pills)
  const fLine = document.createElement("div");
  fLine.className = "field";
  const radio = createRadioGroup(`linea_${idx}`, ["Linea 1", "Linea 2", "Linea 3"]);
  fLine.appendChild(radio);

  grid.append(fComm, fYear, fData, fStart, fEnd, fLine);

  // Logica: fine = inizio + 2h (modificabile)
  function applyAutoEnd() {
    const startVal = sStart.value;
    let endMinutes = timeToMinutes(startVal) + 120; // +2h
    const maxEnd = timeToMinutes(END_TIME);
    if (endMinutes > maxEnd) endMinutes = maxEnd;
    const computed = minutesToTime(endMinutes);
    if (!sEnd.dataset.userEdited) {
      sEnd.value = computed;
    }
    sEnd.dataset.lastAutoFrom = startVal;
  }

  sStart.addEventListener("change", () => {
    sEnd.dataset.userEdited = ""; // reset
    applyAutoEnd();
  });
  sEnd.addEventListener("change", () => {
    sEnd.dataset.userEdited = "1";
  });

  // init default
  sStart.value = START_TIME;
  applyAutoEnd();

  return row;
}

// Build 10 righe
for (let i = 1; i <= ROW_COUNT; i++) {
  rowsContainer.appendChild(createRow(i));
}

// ====== EMAIL ======
document.getElementById("sendEmailBtn").addEventListener("click", () => {
  const rows = [...document.querySelectorAll(".row")];

  const data = rows.map((row, idx) => {
    const comm = row.querySelector(`#commessa_${idx+1}`).value.trim();
    const year = row.querySelector(`#anno_${idx+1}`).value.trim();
    const date = row.querySelector(`#data_${idx+1}`).value; // yyyy-mm-dd
    const start = row.querySelector(`#start_${idx+1}`).value;
    const end   = row.querySelector(`#end_${idx+1}`).value;
    const selectedRadio = row.querySelector(`input[name="linea_${idx+1}"]:checked`);
    const line = selectedRadio ? selectedRadio.value : "";
    return { comm, year, date, start, end, line };
  }).filter(r => r.comm || r.date || r.start || r.end || r.line);

  const commesse = [...new Set(data.map(d => d.comm).filter(Boolean))];
  const week = getISOWeekNumber(new Date());
  const subject = `check e foto pre-bunker (commesse numero ${commesse.length ? commesse.join(",") : "—"}) , week: ${week}`;

  const bodyLines = data.map(d => {
    const dd = d.date ? d.date.split("-").reverse().join("/") : "—";
    return [
      `Commessa: ${d.comm || "—"}`,
      `Anno: ${d.year || "—"}`,
      `Data: ${dd}`,
      `Orario: ${d.start || "—"} - ${d.end || "—"}`,
      `Linea: ${d.line || "—"}`
    ].join(" | ");
  });

  const body = bodyLines.length ? `Dettagli pre-bunker:\n\n${bodyLines.join("\n")}\n` : "Nessuna riga compilata.";

  const to = RECIPIENTS.join(",");
  const mailto = `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`;
  window.location.href = mailto;
});
