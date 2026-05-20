// ============================================================
// PUNTO M — Dashboard App
// ============================================================

// ---- CONFIG — actualizar API_URL después del deploy --------
const CONFIG = {
  API_URL: 'API_URL: 'https://script.google.com/macros/s/AKfycbwosjAjNTT_WVjhAeonZwOC6PuxQESdTbtGrgBY3I53mf5xjHotDUIuLnr7Vtx4DfRZzA/exec',',
  TABS: {
    ESTRATEGIA: '01_ESTRATEGIA_MENSUAL',
    PRODUCTOS:  '02_PRODUCTOS',
    REELS:      '03_REELS',
    WHATSAPP:   '04_WHATSAPP',
    STORIES:    '05_STORIES',
    EMAILS:     '06_EMAILS',
    CALENDARIO: '07_CALENDARIO_COMERCIAL',
    CARRUSELES: '08_CARRUSELES'
  }
};

// ---- Estado global -----------------------------------------
const state = {
  data: {
    estrategia: [], productos: [], reels: [],
    whatsapp: [], stories: [], emails: [], calendario: [], carruseles: []
  },
  currentTab: 'resumen',
  selectedSemana: 'all',
  error: null
};

// ---- Boot --------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  setupNavigation();
  document.getElementById('refresh-btn').addEventListener('click', loadAllData);
  loadAllData();
});

// ---- Carga de datos ----------------------------------------
async function loadAllData() {
  showLoading(true);
  try {
    const res  = await fetch(CONFIG.API_URL + '?tab=all');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Error del servidor');

    const d = json.data;
    state.data.estrategia  = d[CONFIG.TABS.ESTRATEGIA] || [];
    state.data.productos   = d[CONFIG.TABS.PRODUCTOS]  || [];
    state.data.reels       = d[CONFIG.TABS.REELS]      || [];
    state.data.whatsapp    = d[CONFIG.TABS.WHATSAPP]   || [];
    state.data.stories     = d[CONFIG.TABS.STORIES]    || [];
    state.data.emails      = d[CONFIG.TABS.EMAILS]     || [];
    state.data.calendario  = d[CONFIG.TABS.CALENDARIO] || [];
    state.data.carruseles  = d[CONFIG.TABS.CARRUSELES] || [];

    state.error = null;
    populateWeekSelector();
    render();
  } catch (err) {
    state.error = err.message;
    showError(err.message);
  }
  showLoading(false);
}

// ---- Navegación --------------------------------------------
function setupNavigation() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.currentTab = btn.dataset.tab;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ---- Selector de semana ------------------------------------
function populateWeekSelector() {
  var weeks = [];
  var seen  = {};
  [].concat(state.data.reels, state.data.whatsapp, state.data.stories, state.data.emails)
    .forEach(function(r) {
      if (r.semana && !seen[r.semana]) { weeks.push(r.semana); seen[r.semana] = true; }
    });

  var sel = document.getElementById('week-selector');
  sel.innerHTML = '<option value="all">Todas las semanas</option>';
  weeks.sort().forEach(function(w) {
    var opt = document.createElement('option');
    opt.value = w; opt.textContent = w;
    sel.appendChild(opt);
  });

  sel.onchange = function() {
    state.selectedSemana = sel.value;
    render();
  };
}

function filterBySemana(arr) {
  if (state.selectedSemana === 'all') return arr;
  return arr.filter(function(r) { return r.semana === state.selectedSemana; });
}

// ---- Render principal --------------------------------------
function render() {
  var content = document.getElementById('content');
  content.classList.remove('hidden');

  var map = {
    resumen:     renderResumen,
    estrategia:  renderEstrategia,
    reels:       renderReels,
    whatsapp:    renderWhatsapp,
    stories:     renderStories,
    carruseles:  renderCarruseles,
    emails:      renderEmails,
    calendario:  renderCalendario,
    performance: renderPerformance,
    productos:   renderProductos
  };

  var fn = map[state.currentTab];
  content.innerHTML = fn ? fn() : '';
  bindCopyButtons();
  bindPerformanceInputs();
}

// ============================================================
// TAB: RESUMEN
// ============================================================
function renderResumen() {
  var semanaLabel = state.selectedSemana === 'all' ? 'Todas las semanas' : state.selectedSemana;
  var reels     = filterBySemana(state.data.reels);
  var wa        = filterBySemana(state.data.whatsapp);
  var stories   = filterBySemana(state.data.stories);
  var emails    = filterBySemana(state.data.emails);
  var estrategia= filterBySemana(state.data.estrategia);

  var msg  = estrategia[0] ? estrategia[0].mensaje_central  : '';
  var foco = estrategia[0] ? estrategia[0].foco_comercial   : '';
  var obs  = estrategia[0] ? estrategia[0].observaciones    : '';

  var today    = new Date();
  var upcoming = state.data.calendario
    .filter(function(e) { return parseFecha(e.fecha) >= today; })
    .sort(function(a, b) { return parseFecha(a.fecha) - parseFecha(b.fecha); })
    .slice(0, 4);

  return '<div class="page">' +
    '<div class="page-header">' +
      '<h2 class="page-title">Resumen</h2>' +
      '<p class="page-subtitle">' + escHtml(semanaLabel) + '</p>' +
    '</div>' +

    (msg ? '<div class="summary-card"><p style="font-family:var(--font-serif);font-size:18px;color:var(--verde);font-style:italic">“' + escHtml(msg) + '”</p></div>' : '') +

    '<div class="stats-grid">' +
      statCard(reels.length,   'Reels') +
      statCard(wa.length,      'WhatsApp') +
      statCard(stories.length, 'Stories') +
      statCard(emails.length,  'Emails') +
    '</div>' +

    (foco ? '<div class="summary-card"><h3 class="summary-card-title">Foco comercial</h3><p style="font-size:14px">' + escHtml(foco) + '</p></div>' : '') +
    (obs  ? '<div class="summary-card"><h3 class="summary-card-title">Observaciones</h3><p style="font-size:13px;color:var(--texto-suave)">' + escHtml(obs) + '</p></div>' : '') +

    (upcoming.length ? '<div class="summary-card"><h3 class="summary-card-title">Próximos eventos</h3>' +
      upcoming.map(function(e) {
        return '<div class="event-row">' +
          '<span class="event-date">' + escHtml(e.fecha) + '</span>' +
          '<span class="event-name">' + escHtml(e.evento) + '</span>' +
          badge(e.prioridad, e.prioridad === 'ALTA' ? 'terracota' : e.prioridad === 'MEDIA' ? 'sage' : 'beige') +
        '</div>';
      }).join('') + '</div>' : '') +

    (reels.length ? '<div class="summary-card"><h3 class="summary-card-title">Reels de la semana</h3>' +
      reels.map(function(r) {
        return '<div class="mini-row">' +
          '<span class="mini-label">' + escHtml(r.dia || '') + '</span>' +
          '<span class="mini-value">' + escHtml(r.producto || '') + '</span>' +
        '</div>';
      }).join('') + '</div>' : '') +

  '</div>';
}

function statCard(num, label) {
  return '<div class="stat-card"><span class="stat-number">' + num + '</span><span class="stat-label">' + label + '</span></div>';
}

// ============================================================
// TAB: ESTRATEGIA
// ============================================================
function renderEstrategia() {
  var rows = filterBySemana(state.data.estrategia);
  if (!rows.length) return emptyState('Sin estrategia cargada para esta semana.');

  return '<div class="page"><div class="page-header"><h2 class="page-title">Estrategia mensual</h2></div>' +
    rows.map(function(r) {
      return '<div class="estrategia-card card">' +
        '<div class="card-header"><h3>' + escHtml(r.semana || r.mes || '') + '</h3></div>' +
        '<div class="card-body"><div class="field-grid">' +
          fieldRow('Mensaje central', r.mensaje_central, true) +
          fieldRow('Objetivo', r.objetivo) +
          fieldRow('Foco comercial', r.foco_comercial) +
          fieldRow('Foco confianza', r.foco_confianza) +
          fieldRow('Productos prioritarios', r.productos_prioritarios) +
          fieldRow('Evento relevante', r.evento_relevante) +
          fieldRow('Observaciones', r.observaciones) +
        '</div></div></div>';
    }).join('') + '</div>';
}

// ============================================================
// TAB: REELS
// ============================================================
function renderReels() {
  var rows = filterBySemana(state.data.reels);
  if (!rows.length) return emptyState('Sin reels para esta semana.');

  return '<div class="page"><div class="page-header"><h2 class="page-title">Reels</h2></div>' +
    rows.map(function(r, idx) {
      var perfData = parsePerf(r.performance);
      return '<div class="reel-card card">' +
        '<div class="card-header">' +
          '<div><span class="reel-dia">' + escHtml(r.dia || '') + '</span>' +
          '<h3 class="card-title">' + escHtml(r.producto || '') + '</h3></div>' +
          '<div class="card-badges">' + (r.usar_para_ads === 'TRUE' ? badge('Meta Ads', 'terracota') : '') + '</div>' +
        '</div>' +
        '<div class="card-body">' +
          (r.objetivo ? '<p class="objetivo-text">' + escHtml(r.objetivo) + '</p>' : '') +

          '<div class="variantes-tabs">' +
            '<button class="var-tab active" onclick="showVariante(' + idx + ',1)">Variante 1</button>' +
            '<button class="var-tab" onclick="showVariante(' + idx + ',2)">Variante 2</button>' +
            '<button class="var-tab" onclick="showVariante(' + idx + ',3)">Variante 3</button>' +
          '</div>' +

          varianteHtml(idx, 1, r.variante_1_hook, r.variante_1_guion, true) +
          varianteHtml(idx, 2, r.variante_2_hook, r.variante_2_guion, false) +
          varianteHtml(idx, 3, r.variante_3_hook, r.variante_3_guion, false) +

          '<div class="tomas-section"><span class="field-label">Tomas</span><div class="tomas-grid">' +
            tomaHtml(1, r.toma_1) + tomaHtml(2, r.toma_2) + tomaHtml(3, r.toma_3) +
          '</div></div>' +

          (r.texto_en_pantalla ? '<div class="pantalla-section"><span class="field-label">Texto en pantalla</span><p>' + escHtml(r.texto_en_pantalla) + '</p><button class="btn btn-copy btn-sm" data-copy="' + escAttr(r.texto_en_pantalla) + '">Copiar texto en pantalla</button></div>' : '') +
          (r.cta ? '<div class="cta-section"><span class="field-label">CTA</span><p class="cta-text">' + escHtml(r.cta) + '</p></div>' : '') +

          '<details class="performance-details">' +
            '<summary class="performance-summary">Performance</summary>' +
            '<div class="performance-form">' +
              perfInput(r._rowIndex, '03_REELS', 'views',       'Views',       perfData.views) +
              perfInput(r._rowIndex, '03_REELS', 'likes',       'Likes',       perfData.likes) +
              perfInput(r._rowIndex, '03_REELS', 'comentarios', 'Comentarios', perfData.comentarios) +
              perfInput(r._rowIndex, '03_REELS', 'compartidos', 'Compartidos', perfData.compartidos) +
              perfInput(r._rowIndex, '03_REELS', 'guardados',   'Guardados',   perfData.guardados) +
              perfInput(r._rowIndex, '03_REELS', 'ctr',         'CTR (%)',     perfData.ctr) +
              '<div class="perf-field-full">' +
                '<label>Notas</label>' +
                '<textarea class="perf-notes" data-row="' + r._rowIndex + '" data-tab="03_REELS">' + escHtml(perfData.notas || '') + '</textarea>' +
                '<button class="save-perf-btn" data-row="' + r._rowIndex + '" data-tab="03_REELS">Guardar performance</button>' +
              '</div>' +
            '</div>' +
          '</details>' +

        '</div></div>';
    }).join('') + '</div>';
}

function varianteHtml(idx, num, hook, guion, active) {
  return '<div id="reel-' + idx + '-v' + num + '" class="variante' + (active ? '' : ' hidden') + '">' +
    '<div class="hook-box"><span class="field-label">Hook</span><p class="hook-text">' + escHtml(hook || '') + '</p></div>' +
    '<div class="guion-box"><span class="field-label">Guion</span>' +
      '<p class="guion-text">' + escHtml(guion || '').replace(/&#10;/g, '<br>') + '</p>' +
      '<button class="btn btn-copy btn-sm" data-copy="' + escAttr(guion || '') + '">Copiar guion</button>' +
    '</div></div>';
}

function tomaHtml(num, text) {
  if (!text) return '';
  return '<div class="toma-item"><span class="toma-num">' + num + '</span><span>' + escHtml(text) + '</span></div>';
}

function perfInput(row, tab, key, label, val) {
  return '<div class="perf-field"><label>' + label + '</label>' +
    '<input type="text" class="perf-input" data-row="' + row + '" data-tab="' + tab + '" data-key="' + key + '" value="' + escAttr(val || '') + '" placeholder="—"></div>';
}

window.showVariante = function(idx, num) {
  [1,2,3].forEach(function(n) {
    var el = document.getElementById('reel-' + idx + '-v' + n);
    if (el) { el.classList.toggle('hidden', n !== num); }
  });
  var cards = document.querySelectorAll('.reel-card');
  if (cards[idx]) {
    cards[idx].querySelectorAll('.var-tab').forEach(function(btn, i) {
      btn.classList.toggle('active', i + 1 === num);
    });
  }
};

// ============================================================
// TAB: WHATSAPP
// ============================================================
function renderWhatsapp() {
  var rows = filterBySemana(state.data.whatsapp);
  if (!rows.length) return emptyState('Sin posts de WhatsApp para esta semana.');

  return '<div class="page"><div class="page-header"><h2 class="page-title">WhatsApp</h2></div>' +
    rows.map(function(r) {
      return '<div class="wa-card card">' +
        '<div class="card-header">' +
          '<div><span class="wa-fecha">' + escHtml(r.fecha || '') + '</span>' +
          '<h3 class="card-title">' + escHtml(r.producto || '—') + '</h3></div>' +
        '</div>' +
        '<div class="card-body">' +
          (r.objetivo ? '<p class="objetivo-text">' + escHtml(r.objetivo) + '</p>' : '') +
          '<div class="wa-copy-box"><pre class="wa-copy-text">' + escHtml(r.copy || '') + '</pre></div>' +
          (r.link ? '<a href="' + escAttr(r.link) + '" target="_blank" class="product-link">Ver producto →</a>' : '') +
          '<div class="card-actions">' +
            '<button class="btn btn-primary btn-copy" data-copy="' + escAttr((r.copy || '') + (r.link ? '\n\n' + r.link : '')) + '">📋 Copiar WhatsApp</button>' +
          '</div>' +
        '</div></div>';
    }).join('') + '</div>';
}

// ============================================================
// TAB: STORIES
// ============================================================
function renderStories() {
  var rows = filterBySemana(state.data.stories);
  if (!rows.length) return emptyState('Sin stories para esta semana.');

  var typeColor = { PRODUCT_CARD: 'sage', COMUNIDAD: 'beige', HOOK: 'terracota' };

  return '<div class="page"><div class="page-header"><h2 class="page-title">Stories</h2></div>' +
    rows.map(function(r) {
      var copyText = [r.hook, r.texto_visual, r.texto_apoyo, r.cta].filter(Boolean).join('\n\n');
      return '<div class="story-card card">' +
        '<div class="card-header">' +
          '<div><span class="story-fecha">' + escHtml(r.fecha || '') + '</span>' +
          (r.producto ? '<h3 class="card-title">' + escHtml(r.producto) + '</h3>' : '') +
          '</div>' +
          (r.tipo_story ? badge(r.tipo_story, typeColor[r.tipo_story] || 'beige') : '') +
        '</div>' +
        '<div class="card-body">' +
          (r.hook        ? '<div class="hook-box"><span class="field-label">Hook</span><p class="hook-text">' + escHtml(r.hook) + '</p></div>' : '') +
          (r.texto_visual? fieldRow('Texto visual', r.texto_visual) : '') +
          (r.texto_apoyo ? fieldRow('Texto apoyo', r.texto_apoyo) : '') +
          (r.cta         ? '<div class="cta-section"><span class="field-label">CTA</span><p class="cta-text">' + escHtml(r.cta) + '</p></div>' : '') +
          (r.link        ? '<a href="' + escAttr(r.link) + '" target="_blank" class="product-link">Ver producto →</a>' : '') +
          '<div class="card-actions"><button class="btn btn-secondary btn-copy" data-copy="' + escAttr(copyText) + '">📋 Copiar story</button></div>' +
        '</div></div>';
    }).join('') + '</div>';
}

// ============================================================
// TAB: CARRUSELES
// ============================================================
function renderCarruseles() {
  var rows = filterBySemana(state.data.carruseles);
  if (!rows.length) return '<div class="page"><div class="page-header"><h2 class="page-title">Carruseles</h2></div>' + emptyState('Sin carruseles para esta semana.') + '</div>';

  var tipoColor = {
    'LISTICLE': 'sage', 'ANTES_DESPUES': 'terracota', 'GUIA': 'verde',
    'COMPARATIVA': 'beige', 'INSPIRACION': 'sage', 'MITOS': 'terracota'
  };

  var SLIDE_KEYS = ['slide_1','slide_2','slide_3','slide_4','slide_5','slide_6','slide_7','slide_cta'];
  var SLIDE_LABELS = ['Slide 1 — Portada','Slide 2','Slide 3','Slide 4','Slide 5','Slide 6','Slide 7','Última slide — CTA'];

  return '<div class="page"><div class="page-header"><h2 class="page-title">Carruseles</h2></div>' +
    rows.map(function(r) {
      var slides = SLIDE_KEYS.map(function(k, i) {
        if (!r[k]) return '';
        var isFirst = i === 0;
        var isLast  = k === 'slide_cta';
        return '<div class="carrusel-slide' + (isFirst ? ' slide-portada' : '') + (isLast ? ' slide-cta' : '') + '">' +
          '<span class="slide-num">' + SLIDE_LABELS[i] + '</span>' +
          '<p class="slide-text">' + escHtml(r[k]).replace(/\n/g, '<br>') + '</p>' +
        '</div>';
      }).join('');

      var copyAll = SLIDE_KEYS.map(function(k, i) {
        return r[k] ? (SLIDE_LABELS[i] + ':\n' + r[k]) : '';
      }).filter(Boolean).join('\n\n') +
        (r.caption  ? '\n\n---\nCaption:\n' + r.caption  : '') +
        (r.hashtags ? '\n\n' + r.hashtags : '');

      return '<div class="carrusel-card card">' +
        '<div class="card-header">' +
          '<div>' +
            '<span class="carrusel-fecha">' + escHtml(r.fecha || '') + '</span>' +
            '<h3 class="card-title">' + escHtml(r.producto || r.tipo_carrusel || 'Carrusel') + '</h3>' +
          '</div>' +
          '<div class="card-badges">' +
            (r.tipo_carrusel ? badge(r.tipo_carrusel.replace('_', ' '), tipoColor[r.tipo_carrusel] || 'beige') : '') +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          (r.objetivo ? '<p class="objetivo-text">' + escHtml(r.objetivo) + '</p>' : '') +
          '<div class="carrusel-slides">' + slides + '</div>' +
          (r.caption ? '<div class="caption-box"><span class="field-label">Caption</span><pre class="caption-text">' + escHtml(r.caption) + '</pre></div>' : '') +
          (r.hashtags ? '<div class="hashtags-box"><span class="field-label">Hashtags</span><p class="hashtags-text">' + escHtml(r.hashtags) + '</p></div>' : '') +
          (r.tips_diseno ? '<div class="tips-box"><span class="field-label">Tips de diseño</span><p class="tips-text">' + escHtml(r.tips_diseno) + '</p></div>' : '') +
          (r.link_fotos ? '<a href="' + escAttr(r.link_fotos) + '" target="_blank" class="product-link">📁 Ver fotos del producto →</a>' : '') +
          '<div class="card-actions">' +
            '<button class="btn btn-primary btn-copy" data-copy="' + escAttr(copyAll) + '">📋 Copiar todo</button>' +
            (r.caption ? '<button class="btn btn-secondary btn-copy" data-copy="' + escAttr((r.caption || '') + (r.hashtags ? '\n\n' + r.hashtags : '')) + '">📋 Copiar caption</button>' : '') +
          '</div>' +
        '</div></div>';
    }).join('') + '</div>';
}

// ============================================================
// TAB: EMAILS
// ============================================================
function renderEmails() {
  var rows = filterBySemana(state.data.emails);
  if (!rows.length) return emptyState('Sin emails para esta semana.');

  return '<div class="page"><div class="page-header"><h2 class="page-title">Emails</h2></div>' +
    rows.map(function(r) {
      var copyAsuntoPreheader = (r.asunto || '') + '\n' + (r.preheader || '');
      return '<div class="email-card card">' +
        '<div class="card-header">' +
          '<div><span class="email-fecha">' + escHtml(r.fecha || '') + '</span>' +
          '<h3 class="email-asunto">' + escHtml(r.asunto || '') + '</h3></div>' +
        '</div>' +
        '<div class="card-body">' +
          (r.preheader ? '<p class="email-preheader">' + escHtml(r.preheader) + '</p>' : '') +
          (r.objetivo  ? '<p class="objetivo-text">' + escHtml(r.objetivo) + '</p>' : '') +
          '<details class="email-body-details">' +
            '<summary>Ver email completo</summary>' +
            '<div class="email-body"><pre class="email-text">' + escHtml(r.email_completo || '') + '</pre></div>' +
          '</details>' +
          '<div class="ctas-row">' +
            (r.cta_1_texto ? '<a href="' + escAttr(r.cta_1_link || '#') + '" target="_blank" class="cta-pill">' + escHtml(r.cta_1_texto) + '</a>' : '') +
            (r.cta_2_texto ? '<a href="' + escAttr(r.cta_2_link || '#') + '" target="_blank" class="cta-pill cta-pill-secondary">' + escHtml(r.cta_2_texto) + '</a>' : '') +
          '</div>' +
          (r.productos_mencionados ? '<p class="productos-mencionados"><strong>Productos:</strong> ' + escHtml(r.productos_mencionados) + '</p>' : '') +
          '<div class="card-actions">' +
            '<button class="btn btn-primary btn-copy" data-copy="' + escAttr(r.email_completo || '') + '">📋 Copiar email</button>' +
            '<button class="btn btn-secondary btn-copy" data-copy="' + escAttr(copyAsuntoPreheader) + '">📋 Asunto + preheader</button>' +
          '</div>' +
        '</div></div>';
    }).join('') + '</div>';
}

// ============================================================
// TAB: CALENDARIO
// ============================================================
function renderCalendario() {
  var rows = state.data.calendario.slice().sort(function(a, b) {
    return parseFecha(a.fecha) - parseFecha(b.fecha);
  });
  if (!rows.length) return emptyState('Sin eventos en el calendario.');

  var today    = new Date();
  var typeColor = { COMERCIAL: 'terracota', ESTACIONAL: 'sage' };
  var prioColor = { ALTA: 'terracota', MEDIA: 'sage', BAJA: 'beige' };

  return '<div class="page"><div class="page-header"><h2 class="page-title">Calendario comercial</h2></div>' +
    '<div class="calendario-list">' +
    rows.map(function(e) {
      var d          = parseFecha(e.fecha);
      var isPast     = d < today;
      var isUpcoming = !isPast && (d - today) < 14 * 86400000;
      var parts      = e.fecha.split('/');
      return '<div class="cal-row' + (isPast ? ' cal-past' : '') + (isUpcoming ? ' cal-upcoming' : '') + '">' +
        '<div class="cal-date">' +
          '<span class="cal-day">' + (parts[0] || '') + '</span>' +
          '<span class="cal-month">' + monthName(parts[1]) + '</span>' +
        '</div>' +
        '<div class="cal-content">' +
          '<div class="cal-header">' +
            '<span class="cal-event-name">' + escHtml(e.evento) + '</span>' +
            '<div class="cal-badges">' +
              badge(e.tipo, typeColor[e.tipo] || 'beige') +
              badge(e.prioridad, prioColor[e.prioridad] || 'beige') +
            '</div>' +
          '</div>' +
          (e.productos_asociados ? '<p class="cal-productos">' + escHtml(e.productos_asociados) + '</p>' : '') +
          (e.notas ? '<p class="cal-notas">' + escHtml(e.notas) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div></div>';
}

// ============================================================
// TAB: PERFORMANCE
// ============================================================
function renderPerformance() {
  var reels    = filterBySemana(state.data.reels);
  var withPerf = reels.filter(function(r) { return r.performance && r.performance.trim(); });

  if (!withPerf.length) {
    return '<div class="page"><div class="page-header"><h2 class="page-title">Performance</h2></div>' +
      emptyState('Sin datos todavía. Completá los campos de performance en la tab Reels.') +
      '</div>';
  }

  return '<div class="page"><div class="page-header"><h2 class="page-title">Performance — Reels</h2></div>' +
    '<div class="perf-table-wrap"><table class="perf-table">' +
    '<thead><tr><th>Día</th><th>Producto</th><th>Views</th><th>Likes</th><th>Guardados</th><th>Compartidos</th><th>CTR</th></tr></thead>' +
    '<tbody>' +
    withPerf.map(function(r) {
      var p = parsePerf(r.performance);
      return '<tr>' +
        '<td>' + escHtml(r.dia || '') + '</td>' +
        '<td class="perf-producto" title="' + escAttr(r.producto || '') + '">' + escHtml((r.producto || '').substring(0, 35)) + (r.producto && r.producto.length > 35 ? '…' : '') + '</td>' +
        '<td>' + (p.views       || '—') + '</td>' +
        '<td>' + (p.likes       || '—') + '</td>' +
        '<td>' + (p.guardados   || '—') + '</td>' +
        '<td>' + (p.compartidos || '—') + '</td>' +
        '<td>' + (p.ctr ? p.ctr + '%' : '—') + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table></div></div>';
}

// ============================================================
// TAB: PRODUCTOS
// ============================================================
function renderProductos() {
  var estrategia   = filterBySemana(state.data.estrategia);
  var priorityStr  = estrategia[0] ? (estrategia[0].productos_prioritarios || '') : '';
  var priorityList = priorityStr.split('·').map(function(p) { return p.trim().toLowerCase(); }).filter(Boolean);

  var todos = state.data.productos.filter(function(p) {
    return p.estado_producto !== 'INACTIVO' && p.producto;
  });

  var prioritarios = todos.filter(function(p) {
    return priorityList.some(function(pn) { return (p.producto || '').toLowerCase().indexOf(pn.substring(0,10)) !== -1; });
  });
  var resto = todos.filter(function(p) {
    return !priorityList.some(function(pn) { return (p.producto || '').toLowerCase().indexOf(pn.substring(0,10)) !== -1; });
  });
  var productos = prioritarios.concat(resto).slice(0, 60);

  if (!productos.length) return emptyState('Sin productos cargados.');

  return '<div class="page">' +
    '<div class="page-header"><h2 class="page-title">Productos</h2>' +
    (priorityStr ? '<p class="page-subtitle">Prioritarios esta semana: ' + escHtml(priorityStr) + '</p>' : '') +
    '</div>' +
    '<div class="productos-grid">' +
    productos.map(function(p) {
      var stock   = parseInt(p.stock) || 0;
      var lowStock= stock > 0 && stock <= 3;
      var noStock = stock === 0 && p.stock !== '';
      return '<div class="producto-card card' + (noStock ? ' stock-out' : lowStock ? ' stock-low' : '') + '">' +
        '<div class="card-header">' +
          '<h3 class="producto-name">' + escHtml(p.producto || '') + '</h3>' +
          '<div class="card-badges">' +
            (p.es_producto_estrella === 'ALTA' ? badge('⭐ Estrella', 'terracota') : '') +
            (p.usar_en_ads === 'TRUE' || p.usar_en_ads === 'SI' ? badge('Ads', 'sage') : '') +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="producto-precios">' +
            (p.precio_transferencia ? '<span class="precio-trans">$' + formatPrice(p.precio_transferencia) + ' transf.</span>' : '') +
            (p.precio_lista         ? '<span class="precio-lista">$' + formatPrice(p.precio_lista) + '</span>' : '') +
          '</div>' +
          (p.stock !== '' ? '<div class="stock-row"><span class="field-label">Stock:</span>' +
            '<span class="stock-num ' + (noStock ? 'stock-cero' : lowStock ? 'stock-bajo' : '') + '">' + stock + '</span>' +
            (noStock  ? '<span class="stock-alert">⚠️ Sin stock</span>' : '') +
            (lowStock ? '<span class="stock-alert">⚠️ Stock bajo</span>' : '') +
          '</div>' : '') +
          (p.categoria ? '<p class="producto-cat">' + escHtml(p.categoria) + '</p>' : '') +
          (p.pain_point_principal ? '<p class="producto-pain">' + escHtml(p.pain_point_principal) + '</p>' : '') +
          (p.link ? '<a href="' + escAttr(p.link) + '" target="_blank" class="product-link">Ver en tienda →</a>' : '') +
        '</div></div>';
    }).join('') +
    '</div></div>';
}

// ============================================================
// COPY
// ============================================================
function bindCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(function(btn) {
    btn.addEventListener('click', function() { copyText(btn.dataset.copy); });
  });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showToast).catch(function() { copyFallback(text); });
  } else {
    copyFallback(text);
  }
}

function copyFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast(); } catch(e) {}
  document.body.removeChild(ta);
}

function showToast() {
  var t = document.getElementById('toast');
  t.classList.remove('hidden');
  setTimeout(function() { t.classList.add('hidden'); }, 2000);
}

// ============================================================
// PERFORMANCE SAVE
// ============================================================
function bindPerformanceInputs() {
  document.querySelectorAll('.save-perf-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var row = btn.dataset.row;
      var tab = btn.dataset.tab;
      var obj = {};

      document.querySelectorAll('.perf-input[data-row="' + row + '"]').forEach(function(inp) {
        obj[inp.dataset.key] = inp.value;
      });
      var notes = document.querySelector('.perf-notes[data-row="' + row + '"]');
      if (notes) obj.notas = notes.value;

      btn.textContent = 'Guardando…';
      btn.disabled    = true;

      try {
        await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tab: tab, row: parseInt(row), column: 'performance', value: JSON.stringify(obj) })
        });
        btn.textContent = '✓ Guardado';
        setTimeout(function() { btn.textContent = 'Guardar performance'; btn.disabled = false; }, 2500);
      } catch(e) {
        btn.textContent = 'Error — reintentar';
        btn.disabled    = false;
      }
    });
  });
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('content').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
  }
}

function showError(msg) {
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = msg;
  document.getElementById('content').classList.add('hidden');
  document.getElementById('loading').classList.add('hidden');
}

function emptyState(msg) {
  return '<div class="empty-state"><p class="empty-icon">📋</p><p>' + escHtml(msg) + '</p></div>';
}

function badge(text, color) {
  return '<span class="badge badge-' + (color || 'beige') + '">' + escHtml(text || '') + '</span>';
}

function fieldRow(label, value, large) {
  if (!value) return '';
  return '<div class="field-row' + (large ? ' field-row-large' : '') + '">' +
    '<span class="field-label">' + label + '</span>' +
    '<p class="field-value">' + escHtml(value) + '</p>' +
  '</div>';
}

function escHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return (str || '').toString().replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
}

function parseFecha(str) {
  if (!str) return new Date(0);
  var p = str.split('/');
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
}

function parsePerf(str) {
  if (!str) return {};
  try { return JSON.parse(str); } catch(e) { return {}; }
}

function monthName(m) {
  return ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(m)] || m;
}

function formatPrice(val) {
  var n = parseFloat((val || '').toString().replace(/\./g, '').replace(',', '.'));
  if (isNaN(n)) return val || '—';
  return n.toLocaleString('es-AR');
}
