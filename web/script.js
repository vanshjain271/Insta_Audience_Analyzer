let pieChart, barChart;

// Render charts, table, and keywords
function renderReport(rep) {
  const counts = rep.buckets.map(b => b.count);
  const labels = rep.buckets.map(b => b.bucket);

  const ctxPie = document.getElementById('pieChart').getContext('2d');
  const ctxBar = document.getElementById('barChart').getContext('2d');

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  pieChart = new Chart(ctxPie, {
    type: 'pie',
    data: { labels, datasets: [{ data: counts, backgroundColor: generateColors(labels.length) }]},
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  barChart = new Chart(ctxBar, {
    type: 'bar',
    data: { labels, datasets: [{ data: counts, backgroundColor: generateColors(labels.length) }]},
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // table
  const tbody = document.querySelector('#bucketTable tbody');
  tbody.innerHTML = '';
  for (const b of rep.buckets) {
    const tr = document.createElement('tr');
    const ex = (b.examples || []).join(', ');
    tr.innerHTML = `<td>${b.bucket}</td><td>${b.count}</td><td>${ex}</td>`;
    tbody.appendChild(tr);
  }

  // keywords
  const lines = Object.entries(rep.keywords_global || {}).map(([k,v]) => `${k}: ${v}`);
  document.getElementById('keywords').textContent = lines.join('\n');
}

// Generate array of colors
function generateColors(n) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    const hue = (i * 360 / n) % 360;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

// Upload CSV to backend
async function uploadCSV(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('http://localhost:8000/report_csv', { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || ('HTTP ' + res.status));
  }
  return res.json();
}

// Load demo report from backend
async function loadDemo() {
  const res = await fetch('http://localhost:8000/demo_report');
  if (!res.ok) throw new Error('Failed to load demo');
  return res.json();
}

// Event listeners
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('csvFile').files[0];
  const status = document.getElementById('status');
  try {
    status.textContent = 'Analyzing...';
    const rep = await uploadCSV(file);
    status.textContent = 'Done.';
    renderReport(rep);
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  }
});

document.getElementById('demoBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  try {
    status.textContent = 'Loading demo...';
    const rep = await loadDemo();
    status.textContent = 'Done.';
    renderReport(rep);
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  }
});
