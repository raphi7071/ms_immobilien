const STORAGE_KEY = 'ms_immobilien_listings';

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatPrice(price, unit) {
  const num = parseInt(price).toLocaleString('de-DE');
  if (unit === 'monatlich') return { value: `${num} €`, label: 'pro Monat (Kaltmiete)' };
  if (unit === 'm2')        return { value: `${num} €`, label: 'pro m²' };
  return { value: `${num} €`, label: 'Kaufpreis' };
}

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

// ── GALLERY ──
let galleryImages = [], activeThumb = 0;

function setMainImage(index) {
  activeThumb = index;
  document.getElementById('galleryMain').src = galleryImages[index];
  document.querySelectorAll('.gthumb').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

// ── RENDER ──
function render(p) {
  document.title = `${p.title} – David's Immobilien`;
  galleryImages = (p.images && p.images.length > 0) ? p.images : [];

  const hasImages = galleryImages.length > 0;
  const price = formatPrice(p.price, p.priceUnit);

  const facts = [
    p.area      ? { label: 'Wohnfläche',  value: `${p.area} m²` }                   : null,
    p.rooms     ? { label: 'Zimmer',       value: p.rooms }                           : null,
    p.bedrooms  ? { label: 'Schlafzimmer', value: p.bedrooms }                        : null,
    p.bathrooms ? { label: 'Badezimmer',   value: p.bathrooms }                       : null,
    p.floor     ? { label: 'Stockwerk',    value: `${p.floor}. OG` }                  : null,
    p.year      ? { label: 'Baujahr',      value: p.year }                            : null,
    p.zip || p.city ? { label: 'Ort',      value: `${p.zip || ''} ${p.city || ''}`.trim() } : null,
    p.propType  ? { label: 'Objekttyp',    value: p.propType }                        : null,
    p.offerType ? { label: 'Angebotsart',  value: p.offerType }                       : null,
  ].filter(Boolean);

  document.getElementById('detailRoot').innerHTML = `
    <div class="dg-wrap">
      ${hasImages ? `
        <div class="dg-main-wrap">
          <img id="galleryMain" class="dg-main" src="${galleryImages[0]}" alt="${escHtml(p.title)}" />
          ${galleryImages.length > 1 ? `<span class="dg-count">${galleryImages.length} Fotos</span>` : ''}
        </div>
        ${galleryImages.length > 1 ? `
          <div class="dg-thumbs">
            ${galleryImages.map((src, i) => `
              <img class="gthumb${i === 0 ? ' active' : ''}" src="${src}"
                   alt="Foto ${i + 1}" onclick="setMainImage(${i})" />`
            ).join('')}
          </div>` : ''}
      ` : `
        <div class="dg-placeholder">
          <span style="font-size:3rem;font-weight:200;color:var(--border)">${escHtml(p.propType || 'Objekt')}</span>
        </div>
      `}
    </div>

    <div class="detail-grid">
      <div class="detail-main">
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">
          <span class="prop-tag">${escHtml(p.offerType)}</span>
          <span class="prop-tag" style="background:rgba(33,47,89,.1);color:var(--primary)">${escHtml(p.propType)}</span>
        </div>
        <h1 class="detail-title">${escHtml(p.title)}</h1>
        <p class="detail-location">${escHtml(p.district || ((p.zip + ' ' + p.city).trim()))}</p>

        <div class="detail-facts">
          ${facts.map(f => `
            <div class="detail-fact">
              <span class="detail-fact-label">${escHtml(f.label)}</span>
              <span class="detail-fact-value">${escHtml(f.value)}</span>
            </div>`).join('')}
        </div>

        ${p.description ? `
          <div class="detail-section">
            <h3>Beschreibung</h3>
            <p>${escHtml(p.description).replace(/\n/g, '<br>')}</p>
          </div>` : ''}

        ${p.features && p.features.length ? `
          <div class="detail-section">
            <h3>Ausstattung</h3>
            <div class="detail-features">
              ${p.features.map(f => `
                <div class="detail-feature-item">
                  <span style="color:var(--accent);font-weight:700">&#10003;</span>
                  <span>${escHtml(f)}</span>
                </div>`).join('')}
            </div>
          </div>` : ''}

        <div class="detail-section">
          <h3>Standort</h3>
          <p>${[p.street, p.zip, p.city, p.district].filter(Boolean).map(escHtml).join(', ')}</p>
        </div>
      </div>

      <div class="detail-side-col">
        <div class="detail-price-card">
          <div class="detail-price-value">${escHtml(price.value)}</div>
          <div class="detail-price-label">${escHtml(price.label)}</div>

          <div class="detail-agent">
            <div class="detail-agent-avatar">DI</div>
            <div>
              <div class="detail-agent-name">${escHtml(p.contactName)}</div>
              <div class="detail-agent-role">Immobilienmakler · David's Immobilien</div>
            </div>
          </div>

          <div class="detail-contact-info">
            <div class="detail-contact-row">${escHtml(p.contactInfo)}</div>
          </div>

          <a href="index.html#kontakt" class="btn btn-primary"
             style="width:100%;text-align:center;margin-top:1rem;display:block">
            Kontakt aufnehmen
          </a>
          <a href="tel:${escHtml(p.contactInfo.replace(/\s/g, ''))}" class="btn btn-outline"
             style="width:100%;text-align:center;margin-top:.6rem;display:block;color:var(--primary);border:1.5px solid var(--border)">
            Jetzt anrufen
          </a>
          <p style="font-size:.78rem;color:var(--muted);text-align:center;margin-top:1rem">
            Kostenlose Beratung &middot; Keine versteckten Gebühren
          </p>
        </div>
      </div>
    </div>`;

  if (hasImages) {
    document.getElementById('galleryMain').addEventListener('click', () => {
      openLightbox(galleryImages, activeThumb);
    });
  }
}

// ── INIT ──
(function init() {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);

  if (!id) {
    document.getElementById('detailRoot').innerHTML =
      `<div class="detail-loading">Kein Inserat ausgewahlt. <a href="immobilien.html">Zuruck zur Ubersicht</a></div>`;
    return;
  }

  const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').find(x => x.id === id);

  if (!p) {
    document.getElementById('detailRoot').innerHTML =
      `<div class="detail-loading">Inserat nicht gefunden. <a href="immobilien.html">Zuruck zur Ubersicht</a></div>`;
    return;
  }

  render(p);
})();
