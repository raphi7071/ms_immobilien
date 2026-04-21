// ── PASSWORTSCHUTZ ──
const PASSWORD = 'makler'; // <-- hier Passwort ändern
const SESSION_KEY = 'ms_immo_auth';

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function showForm() {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('formCard').style.display  = 'block';
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('formCard').style.display  = 'none';
  document.getElementById('loginCard').style.display = 'block';
  document.getElementById('passwordInput').value = '';
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const val = document.getElementById('passwordInput').value;
  if (val === PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    document.getElementById('loginError').style.display = 'none';
    showForm();
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
});

if (isLoggedIn()) showForm();

// ── LISTINGS ──
const STORAGE_KEY = 'ms_immobilien_listings';

const typeEmoji = {
  Wohnung: '🏢', Haus: '🏡', Penthouse: '🏙️',
  Villa: '🏰', Gewerbe: '🏬', Grundstück: '🌿'
};

function getListings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveListings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function showToast(msg, success = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = success ? '#166534' : '#991b1b';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatPrice(price, unit) {
  const num = parseInt(price).toLocaleString('de-DE');
  if (unit === 'monatlich') return `€ ${num} / Mo.`;
  if (unit === 'm2') return `€ ${num} / m²`;
  return `€ ${num}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderListings() {
  const filterType = document.getElementById('filterType').value;
  const filterProp = document.getElementById('filterProp').value;
  let list = getListings();

  if (filterType) list = list.filter(p => p.offerType === filterType);
  if (filterProp)  list = list.filter(p => p.propType  === filterProp);

  const countEl = document.getElementById('filterCount');
  const total = getListings().length;
  countEl.textContent = total === 0 ? '' : `${list.length} von ${total} Objekt${total !== 1 ? 'en' : ''}`;

  const container = document.getElementById('listingsContainer');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏘️</div>
        <p>${total === 0
          ? 'Noch keine Objekte eingetragen. Nutzen Sie das Formular unten!'
          : 'Keine Objekte entsprechen dem aktuellen Filter.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map((p) => `
    <div class="listing-card">
      <div class="listing-thumb">${typeEmoji[p.propType] || '🏠'}</div>
      <div class="listing-body">
        <h3>${escHtml(p.title)}</h3>
        <div class="listing-loc">📍 ${escHtml(p.district || (p.zip + ' ' + p.city))}</div>
        <div class="listing-meta">
          <span><strong>${escHtml(p.offerType)}</strong></span>
          <span><strong>${escHtml(p.propType)}</strong></span>
          <span>📐 <strong>${p.area} m²</strong></span>
          <span>🛏 <strong>${p.rooms} Zi.</strong></span>
          ${p.year ? `<span>🏗 <strong>${p.year}</strong></span>` : ''}
          ${p.features.length ? `<span>✓ ${p.features.slice(0,3).map(escHtml).join(', ')}${p.features.length > 3 ? ' …' : ''}</span>` : ''}
        </div>
        ${p.description
          ? `<p style="margin-top:.6rem;font-size:.88rem;color:var(--muted)">${escHtml(p.description.slice(0,140))}${p.description.length > 140 ? '…' : ''}</p>`
          : ''}
      </div>
      <div class="listing-side">
        <div class="listing-price">
          ${formatPrice(p.price, p.priceUnit)}
          <small>Kontakt: ${escHtml(p.contactName)}</small>
        </div>
        <button class="btn-sm btn-danger" onclick="deleteListing(${p.id})">Löschen</button>
      </div>
    </div>`).join('');
}

function deleteListing(id) {
  const list = getListings();
  const index = list.findIndex(p => p.id === id);
  if (index < 0) return;
  list.splice(index, 1);
  saveListings(list);
  renderListings();
  showToast('Objekt gelöscht.', false);
}

document.getElementById('propForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const features = [...document.querySelectorAll('#features input[type=checkbox]:checked')]
    .map(cb => cb.value);

  const entry = {
    id:          Date.now(),
    title:       document.getElementById('title').value.trim(),
    offerType:   document.getElementById('offerType').value,
    propType:    document.getElementById('propType').value,
    street:      document.getElementById('street').value.trim(),
    zip:         document.getElementById('zip').value.trim(),
    city:        document.getElementById('city').value.trim(),
    district:    document.getElementById('district').value.trim(),
    area:        document.getElementById('area').value,
    rooms:       document.getElementById('rooms').value,
    floor:       document.getElementById('floor').value,
    year:        document.getElementById('year').value,
    bedrooms:    document.getElementById('bedrooms').value,
    bathrooms:   document.getElementById('bathrooms').value,
    features,
    price:       document.getElementById('price').value,
    priceUnit:   document.getElementById('priceUnit').value,
    description: document.getElementById('description').value.trim(),
    contactName: document.getElementById('contactName').value.trim(),
    contactInfo: document.getElementById('contactInfo').value.trim(),
    createdAt:   new Date().toISOString(),
  };

  const list = getListings();
  list.unshift(entry);
  saveListings(list);
  renderListings();
  e.target.reset();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('✓ Objekt erfolgreich eingetragen!');
});

renderListings();
