const inputs = {
  h: document.getElementById('hours'), m: document.getElementById('minutes'), s: document.getElementById('seconds'),
  distWhole: document.getElementById('dist-whole'), distDec: document.getElementById('dist-decimal'),
  paceMin: document.getElementById('pace-min'), paceSec: document.getElementById('pace-sec')
};

const raceSelect = document.getElementById('race-select');
const miBtn = document.getElementById('mi-btn'), kmBtn = document.getElementById('km-btn');
const unitLabel = document.getElementById('unit-label'), unitSmall = document.getElementById('unit-small');
const paceUnit = document.getElementById('pace-unit'), paceUnitSmall = document.getElementById('pace-unit-small');

let isMiles = true;

// Typing & padding
function pad(input) {
  if (!input.value) return;
  let n = parseInt(input.value);
  if (!isNaN(n)) input.value = n.toString().padStart(2, '0');
}
[inputs.m, inputs.s, inputs.paceMin, inputs.paceSec].forEach(i => {
  i.addEventListener('blur', () => pad(i));
  i.addEventListener('input', () => i.value = i.value.replace(/\D/g, '').slice(0, 3));
});

// Race presets
raceSelect.addEventListener('change', () => {
  if (raceSelect.value) {
    const miles = parseFloat(raceSelect.value);
    setDistance(isMiles ? miles : miles * 1.609344);
    raceSelect.value = '';
  }
});

// Getters
function getTimeSec() { return (parseInt(inputs.h.value)||0)*3600 + (parseInt(inputs.m.value)||0)*60 + (parseInt(inputs.s.value)||0); }
function getDistance() {
  const w = parseFloat(inputs.distWhole.value) || 0;
  const d = parseFloat('0.' + (inputs.distDec.value || '0')) || 0;
  return w + d;
}
function getPaceSec() { return (parseInt(inputs.paceMin.value)||0)*60 + (parseInt(inputs.paceSec.value)||0); }

// Setters
function setTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  inputs.h.value = h || '';
  inputs.m.value = m.toString().padStart(2,'0');
  inputs.s.value = s.toString().padStart(2,'0');
}
function setDistance(dist) {
  const str = Number(dist).toFixed(6).replace(/\.?0+$/, '');
  const [w, d = ''] = str.split('.');
  inputs.distWhole.value = w || '';
  inputs.distDec.value = d;
}
function setPace(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  inputs.paceMin.value = m.toString().padStart(2,'0');
  inputs.paceSec.value = s.toString().padStart(2,'0');
}

// Unit toggle
function setUnit(miles) {
  const wasMiles = isMiles;
  isMiles = miles;
  miBtn.classList.toggle('active', miles);
  kmBtn.classList.toggle('active', !miles);
  unitLabel.textContent = miles ? 'miles' : 'km';
  unitSmall.textContent = paceUnitSmall.textContent = miles ? 'mi' : 'km';
  paceUnit.textContent = `min/${miles ? 'mi' : 'km'}`;

  const dist = getDistance();
  if (dist > 0) {
    const distInMiles = wasMiles ? dist : dist / 1.609344;
    setDistance(isMiles ? distInMiles : distInMiles * 1.609344);
  }
  const pace = getPaceSec();
  if (pace > 0 && getTimeSec() > 0) {
    const pacePerMile = wasMiles ? pace : pace * 1.609344;
    setPace(isMiles ? pacePerMile : pacePerMile / 1.609344);
  }
}
miBtn.onclick = () => setUnit(true);
kmBtn.onclick = () => setUnit(false);

// Calculate
function calculate(target) {
  const time = getTimeSec();
  const dist = getDistance();
  const pace = getPaceSec();
  const distInMiles = isMiles ? dist : dist / 1.609344;

  if (target === 'time' && dist > 0 && pace > 0) setTime(distInMiles * pace);
  else if (target === 'distance' && time > 0 && pace > 0) {
    const miles = time / pace;
    setDistance(isMiles ? miles : miles * 1.609344);
  }
  else if (target === 'pace' && time > 0 && dist > 0) setPace(time / distInMiles);
}
document.querySelectorAll('.calc-btn').forEach(b => b.onclick = () => calculate(b.dataset.target));
document.getElementById('clear-all').onclick = () => {
  Object.values(inputs).forEach(i => i.value = '');
  raceSelect.value = '';
};

// Pace chart
const overlay = document.getElementById('chart-overlay');
const closeBtn = document.getElementById('close-chart');
const tbody = document.querySelector('#pace-table tbody');

document.getElementById('show-chart').onclick = () => {
  overlay.classList.remove('hidden');
  if (tbody.children.length === 0) generateChart();
};
closeBtn.onclick = () => overlay.classList.add('hidden');
overlay.onclick = e => { if (e.target === overlay) overlay.classList.add('hidden'); };

function generateChart() {
  const fmtPace = mins => {
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  };
  const fmtTime = totalMinutes => {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    const s = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` 
                 : `${m}:${s.toString().padStart(2,'0')}`;
  };

  for (let kph = 8.0; kph <= 21.0; kph += 0.1) {
    kph = Math.round(kph * 10) / 10;
    const minPerKm = 60 / kph;
    const minPerMi = minPerKm * 1.609344;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fmtPace(minPerKm)}</td>
      <td>${fmtPace(minPerMi)}</td>
      <td>${fmtTime(minPerKm * 5)}</td>
      <td>${fmtTime(minPerKm * 10)}</td>
      <td>${fmtTime(minPerKm * 21.0975)}</td>
      <td>${fmtTime(minPerKm * 42.195)}</td>
    `;
    tbody.appendChild(row);
  }
}

// Init
setUnit(true);
inputs.hours.focus();