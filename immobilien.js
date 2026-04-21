// ── AUTH CALLBACKS ──
window.onAuthLogin = function () {
  document.getElementById('addSection').style.display = 'block';
  document.getElementById('addBtn').style.display     = 'inline-block';
  renderListings();
};

window.onAuthLogout = function () {
  cancelEdit();
  document.getElementById('addSection').style.display = 'none';
  document.getElementById('addBtn').style.display     = 'none';
  renderListings();
};

// Initialzustand
if (isLoggedIn()) {
  document.getElementById('addSection').style.display = 'block';
  document.getElementById('addBtn').style.display     = 'inline-block';
}

// ── BILDER ──
let pendingImages = [];

function resizeImage(file, maxWidth = 1400, quality = 0.78) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreview() {
  const grid = document.getElementById('imagePreview');
  grid.innerHTML = pendingImages.map((src, i) => `
    <div class="img-preview-item">
      <img src="${src}" alt="Vorschau ${i + 1}" />
      <button type="button" onclick="removePreviewImage(${i})" title="Entfernen">&#10005;</button>
    </div>`).join('');
}

function removePreviewImage(index) {
  pendingImages.splice(index, 1);
  renderImagePreview();
}

async function handleFileInput(files) {
  const MAX_IMAGES = 10;
  const remaining = MAX_IMAGES - pendingImages.length;
  const toProcess = Array.from(files).slice(0, remaining);
  if (toProcess.length < files.length) {
    showToast(`Maximal ${MAX_IMAGES} Bilder pro Objekt.`, false);
  }
  const resized = await Promise.all(toProcess.map(f => resizeImage(f)));
  pendingImages.push(...resized);
  renderImagePreview();
}

document.getElementById('fileDrop').addEventListener('click', () => {
  document.getElementById('images').click();
});

document.getElementById('images').addEventListener('change', function () {
  handleFileInput(this.files);
  this.value = '';
});

const dropZone = document.getElementById('fileDrop');
dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFileInput(e.dataTransfer.files);
});

// ── LIGHTBOX ──
let lbImages = [], lbIndex = 0;

function openLightbox(images, startIndex) {
  lbImages = images; lbIndex = startIndex;
  document.getElementById('lbImg').src = lbImages[lbIndex];
  document.getElementById('lightbox').classList.add('open');
  document.getElementById('lbPrev').style.display = lbImages.length > 1 ? 'grid' : 'none';
  document.getElementById('lbNext').style.display = lbImages.length > 1 ? 'grid' : 'none';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lbStep(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  document.getElementById('lbImg').src = lbImages[lbIndex];
}

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'ArrowRight') lbStep(1);
  if (e.key === 'ArrowLeft')  lbStep(-1);
  if (e.key === 'Escape')     closeLightbox();
});

// ── EDIT MODE ──
let editingId = null;

function editListing(id) {
  const p = getListings().find(x => x.id === id);
  if (!p) return;
  editingId = id;

  document.getElementById('title').value       = p.title       || '';
  document.getElementById('offerType').value   = p.offerType   || '';
  document.getElementById('propType').value    = p.propType    || '';
  document.getElementById('street').value      = p.street      || '';
  document.getElementById('zip').value         = p.zip         || '';
  document.getElementById('city').value        = p.city        || '';
  document.getElementById('district').value    = p.district    || '';
  document.getElementById('area').value        = p.area        || '';
  document.getElementById('rooms').value       = p.rooms       || '';
  document.getElementById('floor').value       = p.floor       || '';
  document.getElementById('year').value        = p.year        || '';
  document.getElementById('bedrooms').value    = p.bedrooms    || '';
  document.getElementById('bathrooms').value   = p.bathrooms   || '';
  document.getElementById('price').value       = p.price       || '';
  document.getElementById('priceUnit').value   = p.priceUnit   || 'gesamt';
  document.getElementById('description').value = p.description || '';
  document.getElementById('contactName').value = p.contactName || '';
  document.getElementById('contactInfo').value = p.contactInfo || '';

  document.querySelectorAll('#features input[type=checkbox]').forEach(cb => {
    cb.checked = Array.isArray(p.features) && p.features.includes(cb.value);
  });

  pendingImages = Array.isArray(p.images) ? [...p.images] : [];
  renderImagePreview();

  document.getElementById('formTitle').textContent        = 'Inserat bearbeiten';
  document.getElementById('submitBtn').textContent        = 'Anderungen speichern';
  document.getElementById('cancelEditBtn').style.display  = 'inline-block';
  document.getElementById('resetBtn').style.display       = 'none';

  document.getElementById('addSection').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  pendingImages = [];
  renderImagePreview();

  const form = document.getElementById('propForm');
  if (form) form.reset();

  document.getElementById('formTitle').textContent        = 'Neues Objekt eintragen';
  document.getElementById('submitBtn').textContent        = 'Objekt speichern';
  document.getElementById('cancelEditBtn').style.display  = 'none';
  document.getElementById('resetBtn').style.display       = 'inline-block';
}

// ── LISTINGS ──
const STORAGE_KEY = 'ms_immobilien_listings';

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
  if (unit === 'monatlich') return `${num} € / Mo.`;
  if (unit === 'm2')        return `${num} € / m²`;
  return `${num} €`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildThumb(p) {
  if (p.images && p.images.length > 0) {
    return `
      <div class="listing-thumb" style="position:relative;padding:0;overflow:hidden">
        <img class="listing-thumb-img" src="${p.images[0]}" alt="${escHtml(p.title)}"
             onclick="event.stopPropagation();openLightbox(window._lb_${p.id}, 0)" />
        ${p.images.length > 1
          ? `<span class="img-count-badge">${p.images.length} Fotos</span>`
          : ''}
      </div>`;
  }
  return `<div class="listing-thumb">
    <span style="font-size:.95rem;font-weight:700;color:var(--primary);opacity:.35;letter-spacing:.5px">${escHtml(p.propType || 'Objekt')}</span>
  </div>`;
}

function buildGallery(p) {
  if (!p.images || p.images.length <= 1) return '';
  return `
    <div class="listing-gallery">
      ${p.images.map((src, i) => `
        <img src="${src}" alt="Foto ${i + 1}"
             onclick="event.stopPropagation();openLightbox(window._lb_${p.id}, ${i})" />`
      ).join('')}
    </div>`;
}

function buildAdminButtons(p) {
  if (!isLoggedIn()) return '';
  return `
    <div style="display:flex;gap:.5rem;flex-direction:column">
      <button class="btn-sm" style="background:rgba(26,60,94,.1);color:var(--primary);width:100%"
              onclick="event.stopPropagation();editListing(${p.id})">Bearbeiten</button>
      <button class="btn-sm btn-danger" style="width:100%"
              onclick="event.stopPropagation();deleteListing(${p.id})">Loschen</button>
    </div>`;
}

function goToDetail(id) {
  window.location.href = `detail.html?id=${id}`;
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
        <div class="empty-icon" style="font-size:2.5rem;font-weight:200;color:var(--border)">—</div>
        <p>${total === 0
          ? 'Noch keine Objekte eingetragen.'
          : 'Keine Objekte entsprechen dem aktuellen Filter.'}</p>
      </div>`;
    return;
  }

  list.forEach(p => { window[`_lb_${p.id}`] = p.images || []; });

  container.innerHTML = list.map((p) => `
    <div class="listing-card" onclick="goToDetail(${p.id})" style="cursor:pointer">
      ${buildThumb(p)}
      <div class="listing-body">
        <h3>${escHtml(p.title)}</h3>
        <div class="listing-loc">${escHtml(p.district || ((p.zip + ' ' + p.city).trim()))}</div>
        <div class="listing-meta">
          <span><strong>${escHtml(p.offerType)}</strong></span>
          <span><strong>${escHtml(p.propType)}</strong></span>
          <span><strong>${p.area} m²</strong></span>
          <span><strong>${p.rooms} Zimmer</strong></span>
          ${p.year ? `<span>Bj. ${p.year}</span>` : ''}
          ${p.features && p.features.length
            ? `<span>${p.features.slice(0,3).map(escHtml).join(' · ')}${p.features.length > 3 ? ' …' : ''}</span>`
            : ''}
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
        ${buildAdminButtons(p)}
      </div>
    </div>`).join('');
}

function deleteListing(id) {
  const list = getListings();
  const index = list.findIndex(p => p.id === id);
  if (index < 0) return;
  list.splice(index, 1);
  saveListings(list);
  if (editingId === id) cancelEdit();
  renderListings();
  showToast('Objekt geloscht.', false);
}

document.getElementById('propForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const features = [...document.querySelectorAll('#features input[type=checkbox]:checked')]
    .map(cb => cb.value);

  const entry = {
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
    images:      [...pendingImages],
  };

  try {
    const list = getListings();

    if (editingId !== null) {
      const index = list.findIndex(x => x.id === editingId);
      if (index >= 0) {
        entry.id        = editingId;
        entry.createdAt = list[index].createdAt;
        list[index]     = entry;
      }
      saveListings(list);
      cancelEdit();
      showToast('Anderungen gespeichert.');
    } else {
      entry.id        = Date.now();
      entry.createdAt = new Date().toISOString();
      list.unshift(entry);
      saveListings(list);
      pendingImages = [];
      renderImagePreview();
      e.target.reset();
      showToast('Objekt erfolgreich eingetragen.');
    }
  } catch {
    showToast('Speicher voll – bitte weniger oder kleinere Bilder verwenden.', false);
    return;
  }

  renderListings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderListings();
