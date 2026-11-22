/**
 * Joel Barber — Script Principal Otimizado (60fps, Zero Jank & AppSec Hardened)
 */
(function () {
  'use strict';

  const PUBLIC_CONFIG = Object.freeze({
    whatsappNumber: '559284819171',
    cashbarberUrl: 'https://cashbarber.com.br/joelbarber',
    instagramUrl: 'https://www.instagram.com/joel_barbershop25/',
    googleReviewsUrl: 'https://share.google/uXiZ2HyoADHUBMRZQ',
    // Endpoint serverless opcional (ex.: Vercel/Netlify). Vazio = GitHub Pages: envia direto ao WhatsApp.
    contactApiUrl: '',
    minSubmitTimeMs: 2500,
    rateLimitCooldownMs: 60000
  });

  const SERVICES_DATA = Object.freeze([
    {
      id: 'cortes',
      name: 'Corte (Degradê, Social ou Navalhado)',
      category: 'principais',
      price: 35.0,
      priceLabel: 'R$ 35,00',
      duration: '35 min',
      note: 'Acabamento na tesoura, máquina ou navalha'
    },
    {
      id: 'barba-terapia',
      name: 'Barba Terapia',
      category: 'principais',
      price: 30.0,
      priceLabel: 'R$ 30,00',
      duration: '30 min',
      note: 'Limpeza de pele + hidratação na barba e toalha quente'
    },
    {
      id: 'combo-corte-barba',
      name: 'Combo Corte + Barba Simples',
      category: 'principais',
      price: 55.0,
      priceLabel: 'R$ 55,00',
      duration: '50 min',
      note: 'Corte completo + alinhamento de barba na navalha'
    },
    {
      id: 'combo-premium',
      name: 'Combo Premium (Corte + Barba Terapia + Hidratação)',
      category: 'principais',
      price: 95.0,
      priceLabel: 'R$ 95,00',
      duration: '60 min',
      note: 'Pacote completo de cuidado capilar e facial'
    },
    {
      id: 'barba-simples',
      name: 'Barba Simples',
      category: 'principais',
      price: 20.0,
      priceLabel: 'A partir de R$ 20,00',
      duration: '20 min',
      note: 'Desenho e aparo rápido com finalização'
    },
    {
      id: 'sobrancelha',
      name: 'Sobrancelha',
      category: 'acabamentos',
      price: 10.0,
      priceLabel: 'R$ 10,00',
      duration: '10 min',
      note: 'Limpeza e alinhamento natural na navalha'
    },
    {
      id: 'pezinho',
      name: 'Pezinho',
      category: 'acabamentos',
      price: 15.0,
      priceLabel: 'R$ 15,00',
      duration: '15 min',
      note: 'Manutenção dos contornos laterais e nuca'
    },
    {
      id: 'bigode',
      name: 'Bigode',
      category: 'acabamentos',
      price: 10.0,
      priceLabel: 'R$ 10,00',
      duration: '10 min',
      note: 'Alinhamento na tesoura e navalha'
    },
    {
      id: 'listras',
      name: 'Listras / Risco na Navalha',
      category: 'acabamentos',
      price: 10.0,
      priceLabel: 'A partir de R$ 10,00',
      duration: '10 min',
      note: 'Traço personalizado no corte ou sobrancelha'
    },
    {
      id: 'pigmentacao',
      name: 'Pigmentação',
      category: 'quimica',
      price: 25.0,
      priceLabel: 'A partir de R$ 25,00',
      duration: '20 min',
      note: 'Realce de contorno e cobertura de falhas'
    },
    {
      id: 'hidratacao',
      name: 'Hidratação Capilar',
      category: 'quimica',
      price: 25.0,
      priceLabel: 'R$ 25,00',
      duration: '20 min',
      note: 'Nutrição e maciez para os fios'
    },
    {
      id: 'relaxamento',
      name: 'Relaxamento',
      category: 'quimica',
      price: 25.0,
      priceLabel: 'A partir de R$ 25,00',
      duration: '25 min',
      note: 'Redução de volume e alinhamento dos fios'
    },
    {
      id: 'luzes-hidratacao',
      name: 'Luzes + Hidratação (Tom de Mel)',
      category: 'quimica',
      price: 110.0,
      priceLabel: 'A partir de R$ 110,00',
      duration: '90 min',
      note: 'Reflexos descoloridos com tratamento incluso'
    },
    {
      id: 'limpeza-pele',
      name: 'Limpeza de Pele',
      category: 'estetica',
      price: 40.0,
      priceLabel: 'A partir de R$ 40,00',
      duration: '30 min',
      note: 'Higienização facial e remoção de cravos'
    },
    {
      id: 'depilacao-nasal',
      name: 'Depilação Nasal',
      category: 'estetica',
      price: 15.0,
      priceLabel: 'A partir de R$ 15,00',
      duration: '15 min',
      note: 'Remoção rápida e segura com cera morna'
    }
  ]);

  const ALLOWED_SUBJECTS = new Set([
    'Dúvida sobre Agendamento',
    'Clube de Assinatura Mensal',
    'Elogio ou Sugestão',
    'Outro Assunto'
  ]);

  const state = {
    selectedCategory: 'todos',
    selectedServiceIds: new Set(['cortes']),
    selectedDay: 'Terça-feira',
    selectedPeriod: 'Tarde (12h às 18h)',
    lastSubmissionAt: 0
  };

  function sanitizePlainText(input, maxLength) {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function buildWhatsAppUrl(message) {
    const cleanMessage = sanitizePlainText(message, 1000);
    return `https://wa.me/${PUBLIC_CONFIG.whatsappNumber}?text=${encodeURIComponent(cleanMessage)}`;
  }

  /* Renderização com DocumentFragment (apenas 1 reflow no DOM) */
  function renderServicesList() {
    const container = document.getElementById('services-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();

    const filtered = SERVICES_DATA.filter((item) => {
      return state.selectedCategory === 'todos' || item.category === state.selectedCategory;
    });

    filtered.forEach((service) => {
      const isSelected = state.selectedServiceIds.has(service.id);

      const row = document.createElement('div');
      row.className = `service-row ${isSelected ? 'selected' : ''}`;
      row.addEventListener('click', () => toggleService(service.id));

      const leftCol = document.createElement('div');
      leftCol.className = 'service-info';

      const titleLine = document.createElement('div');
      titleLine.className = 'service-title-line';

      const nameEl = document.createElement('h3');
      nameEl.className = 'service-name';
      nameEl.textContent = service.name;

      const timeEl = document.createElement('span');
      timeEl.className = 'service-duration';
      timeEl.textContent = `· ${service.duration}`;

      titleLine.appendChild(nameEl);
      titleLine.appendChild(timeEl);

      const noteEl = document.createElement('p');
      noteEl.className = 'service-note';
      noteEl.textContent = service.note;

      leftCol.appendChild(titleLine);
      leftCol.appendChild(noteEl);

      const rightCol = document.createElement('div');
      rightCol.className = 'service-action';

      const priceEl = document.createElement('span');
      priceEl.className = 'service-price';
      priceEl.textContent = service.priceLabel;

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.setAttribute('aria-label', `Selecionar ${service.name}`);
      checkBtn.className = `service-select-btn ${isSelected ? 'is-selected' : ''}`;
      checkBtn.textContent = isSelected ? 'Selecionado' : 'Selecionar';
      checkBtn.setAttribute('aria-pressed', String(isSelected));
      checkBtn.dataset.serviceId = service.id;

      rightCol.appendChild(priceEl);
      rightCol.appendChild(checkBtn);

      row.appendChild(leftCol);
      row.appendChild(rightCol);
      fragment.appendChild(row);
    });

    const hadFocus = container.contains(document.activeElement) ? document.activeElement.dataset.serviceId : null;
    container.textContent = '';
    container.appendChild(fragment);
    if (hadFocus) {
      const again = container.querySelector('[data-service-id="' + hadFocus + '"]');
      if (again) again.focus({ preventScroll: true });
    }
  }

  function toggleService(serviceId) {
    const exists = SERVICES_DATA.some((s) => s.id === serviceId);
    if (!exists) return;

    if (state.selectedServiceIds.has(serviceId)) {
      state.selectedServiceIds.delete(serviceId);
    } else {
      state.selectedServiceIds.add(serviceId);
    }
    renderServicesList();
    updateBookingBox();
  }

  function updateBookingBox() {
    const listEl = document.getElementById('selected-services-summary');
    const totalEl = document.getElementById('selected-total-price');
    const waBtn = document.getElementById('confirm-whatsapp-btn');

    if (!listEl || !totalEl || !waBtn) return;

    const selected = SERVICES_DATA.filter((s) => state.selectedServiceIds.has(s.id));
    const fragment = document.createDocumentFragment();

    if (selected.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'booking-empty';
      empty.textContent = 'Toque nos serviços ao lado para incluir no seu agendamento.';
      fragment.appendChild(empty);
    } else {
      selected.forEach((item) => {
        const line = document.createElement('div');
        line.className = 'summary-row';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;

        const priceSpan = document.createElement('span');
        priceSpan.className = 'font-mono-num';
        priceSpan.textContent = item.priceLabel;

        line.appendChild(nameSpan);
        line.appendChild(priceSpan);
        fragment.appendChild(line);
      });
    }

    listEl.textContent = '';
    listEl.appendChild(fragment);

    const total = selected.reduce((sum, s) => sum + s.price, 0);
    totalEl.textContent = total > 0 ? formatCurrency(total) : 'R$ 0,00';

    const itemsText = selected.length > 0
      ? selected.map((s) => `- ${s.name} (${s.priceLabel})`).join('\n')
      : '- Corte / Atendimento';

    const msg =
      `Olá, Joel! Tudo bem?\n` +
      `Gostaria de agendar um horário na barbearia:\n\n` +
      `Serviços:\n${itemsText}\n\n` +
      `Dia: ${state.selectedDay}\n` +
      `Período: ${state.selectedPeriod}\n` +
      `Total estimado: ${total > 0 ? formatCurrency(total) : 'A consultar'}`;

    waBtn.href = buildWhatsAppUrl(msg);
  }

  function setupFiltersAndControls() {
    document.querySelectorAll('.category-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
        state.selectedCategory = sanitizePlainText(tab.getAttribute('data-category') || 'todos', 30);
        renderServicesList();
      });
    });

    document.querySelectorAll('.day-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.day-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.selectedDay = sanitizePlainText(btn.getAttribute('data-day') || 'Terça-feira', 30);
        updateBookingBox();
      });
    });

    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        state.selectedPeriod = sanitizePlainText(e.target.value, 40);
        updateBookingBox();
      });
    }
  }

  /* Observador único de performance:
     1. Atualiza tópico ativo na barra superior
     2. Carrega o Google Maps apenas quando o usuário se aproxima do rodapé (elimina travamento inicial) */
  function setupObserversAndPerformance() {
    if (!('IntersectionObserver' in window)) {
      const mapEl = document.getElementById('lazy-google-map');
      if (mapEl && mapEl.dataset.src) mapEl.src = mapEl.dataset.src;
      return;
    }

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('[data-topic]');

    const topicObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const topicId = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle('active', link.getAttribute('data-topic') === topicId);
            });
          }
        });
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((sec) => topicObserver.observe(sec));

    // Carrega o iframe do Google Maps somente quando o usuário chega perto da seção de contato
    const mapIframe = document.getElementById('lazy-google-map');
    if (mapIframe && mapIframe.dataset.src) {
      const mapObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              mapIframe.src = mapIframe.dataset.src;
              mapIframe.removeAttribute('data-src');
              obs.disconnect();
            }
          });
        },
        { rootMargin: '350px' }
      );
      mapObserver.observe(mapIframe);
    }
  }

  function showFormFeedback(message, isError) {
    const feedbackEl = document.getElementById('contact-feedback');
    if (!feedbackEl) return;

    feedbackEl.textContent = message;
    feedbackEl.classList.remove('hidden', 'error', 'success');
    feedbackEl.classList.add(isError ? 'error' : 'success');
  }

  function setupSecureContactForm() {
    const form = document.getElementById('secure-contact-form');
    const loadedAtInput = document.getElementById('form_loaded_at');
    if (!form) return;

    const formInitTimestamp = Date.now();
    if (loadedAtInput) {
      loadedAtInput.value = String(formInitTimestamp);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const now = Date.now();

      const honeypot = document.getElementById('website_url');
      if (honeypot && honeypot.value.trim() !== '') {
        showFormFeedback('Mensagem recebida.', false);
        form.reset();
        return;
      }

      if (now - formInitTimestamp < PUBLIC_CONFIG.minSubmitTimeMs) {
        showFormFeedback('Aguarde alguns segundos antes de enviar.', true);
        return;
      }

      if (now - state.lastSubmissionAt < PUBLIC_CONFIG.rateLimitCooldownMs) {
        const waitSec = Math.ceil((PUBLIC_CONFIG.rateLimitCooldownMs - (now - state.lastSubmissionAt)) / 1000);
        showFormFeedback(`Muitas tentativas. Aguarde ${waitSec}s antes de enviar novamente.`, true);
        return;
      }

      const rawName = document.getElementById('client_name')?.value || '';
      const rawPhone = document.getElementById('client_phone')?.value || '';
      const rawSubject = document.getElementById('client_subject')?.value || '';
      const rawMessage = document.getElementById('client_message')?.value || '';

      const name = sanitizePlainText(rawName, 80);
      const phone = sanitizePlainText(rawPhone, 20);
      const subject = ALLOWED_SUBJECTS.has(rawSubject) ? rawSubject : 'Dúvida sobre Agendamento';
      const message = sanitizePlainText(rawMessage, 500);

      if (name.length < 2 || !/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(name)) {
        showFormFeedback('Informe um nome válido (apenas letras).', true);
        return;
      }

      if (!/^[0-9+()\s-]{8,20}$/.test(phone)) {
        showFormFeedback('Informe um telefone ou WhatsApp válido com DDD.', true);
        return;
      }

      if (message.length < 5) {
        showFormFeedback('Escreva uma mensagem com pelo menos 5 caracteres.', true);
        return;
      }

      state.lastSubmissionAt = now;

      const submitBtn = document.getElementById('contact-submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (PUBLIC_CONFIG.contactApiUrl) {
          const response = await fetch(PUBLIC_CONFIG.contactApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              phone,
              subject,
              message,
              website_url: '',
              form_loaded_at: formInitTimestamp
            })
          });

          if (response.ok) {
            showFormFeedback('Mensagem enviada com sucesso! Retornaremos em breve.', false);
            form.reset();
            return;
          }
        }

        const fallbackMsg =
          `Olá, Joel! Mensagem enviada pelo formulário do site:\n\n` +
          `Nome: ${name}\n` +
          `Contato: ${phone}\n` +
          `Assunto: ${subject}\n` +
          `Mensagem: ${message}`;

        window.open(buildWhatsAppUrl(fallbackMsg), '_blank', 'noopener,noreferrer');
        showFormFeedback('Redirecionado para o WhatsApp da barbearia.', false);
        form.reset();
      } catch {
        showFormFeedback('Não foi possível enviar no momento. Tente diretamente pelo botão de WhatsApp.', true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function updateLiveHoursStatus() {
    const statusEl = document.getElementById('live-status-label');
    const dotEl = document.getElementById('live-status-dot');
    if (!statusEl || !dotEl) return;

    try {
      const manausTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
      const day = manausTime.getDay();
      const hour = manausTime.getHours();

      const row = document.querySelector(`[data-day-row="${day}"]`);
      if (row) {
        row.classList.add('is-today');
        const badge = row.querySelector('.today-indicator');
        if (badge) badge.classList.remove('hidden');
      }

      const isOpen = day >= 1 && day <= 6 && hour >= 9 && hour < 20;
      if (isOpen) {
        dotEl.className = 'status-dot';
        statusEl.textContent = 'Aberto agora · Fecha às 20h';
      } else {
        dotEl.className = 'status-dot closed';
        statusEl.textContent = 'Seg a Sáb · 09h às 20h';
      }
    } catch {
      statusEl.textContent = 'Seg a Sáb · 09h às 20h';
    }
  }

  function setupMobileNav() {
    const btn = document.getElementById('mobile-nav-toggle');
    const menu = document.getElementById('mobile-nav-panel');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isHidden = menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!isHidden));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });

    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Carrossel de avaliações: scroll-snap nativo (arraste/touch/teclado) + setas + indicadores */
  function setupReviewsCarousel() {
    const root = document.getElementById('reviews-carousel');
    const dotsEl = document.getElementById('reviews-dots');
    if (!root || !dotsEl) return;

    const viewport = root.querySelector('.carousel-viewport');
    const prev = root.querySelector('.carousel-prev');
    const next = root.querySelector('.carousel-next');
    const cards = Array.from(root.querySelectorAll('.review-card'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoplayId = null;
    let stopped = reduceMotion;
    let pages = 1;
    let current = 0;

    const behavior = () => (reduceMotion ? 'auto' : 'smooth');
    const maxScroll = () => viewport.scrollWidth - viewport.clientWidth;
    const step = () => {
      const gap = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft - cards[0].offsetWidth : 0;
      return viewport.clientWidth + gap;
    };
    const pageCount = () => (maxScroll() <= 2 ? 1 : Math.ceil(maxScroll() / step() - 0.02) + 1);
    const pageFromScroll = () => {
      if (pages <= 1) return 0;
      if (viewport.scrollLeft >= maxScroll() - 2) return pages - 1;
      return Math.min(pages - 1, Math.round(viewport.scrollLeft / step()));
    };

    function goToPage(index) {
      const i = Math.max(0, Math.min(pages - 1, index));
      const left = i === pages - 1 ? maxScroll() : i * step();
      current = i;
      viewport.scrollTo({ left, behavior: behavior() });
      update();
    }

    function renderDots() {
      pages = pageCount();
      current = Math.min(current, pages - 1);
      dotsEl.textContent = '';
      dotsEl.classList.toggle('hidden', pages <= 1);
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel-dot';
        b.setAttribute('aria-label', `Ir para o grupo ${i + 1} de ${pages}`);
        b.addEventListener('click', () => { stop(); goToPage(i); });
        dotsEl.appendChild(b);
      }
      update();
    }

    function update(e) {
      if (e && e.type === 'scroll') current = pageFromScroll();
      const page = current;
      dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
        if (i === page) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      const single = pages <= 1;
      prev.disabled = single || page === 0;
      next.disabled = single || page === pages - 1;
      prev.classList.toggle('hidden', single);
      next.classList.toggle('hidden', single);
    }

    function stop() {
      stopped = true;
      if (autoplayId) { clearInterval(autoplayId); autoplayId = null; }
    }

    function startAutoplay() {
      if (stopped || pages <= 1 || autoplayId) return;
      autoplayId = setInterval(() => {
        if (document.hidden) return;
        goToPage(current >= pages - 1 ? 0 : current + 1);
      }, 6500);
    }

    prev.addEventListener('click', () => { stop(); goToPage(current - 1); });
    next.addEventListener('click', () => { stop(); goToPage(current + 1); });

    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); goToPage(current + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); goToPage(current - 1); }
      else if (e.key === 'Home') { e.preventDefault(); stop(); goToPage(0); }
      else if (e.key === 'End') { e.preventDefault(); stop(); goToPage(pages - 1); }
    });

    // Qualquer interação do usuário encerra a reprodução automática
    ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach((evt) => {
      root.addEventListener(evt, stop, { passive: true });
    });

    viewport.addEventListener('scroll', update, { passive: true });

    window.addEventListener('resize', () => { renderDots(); });

    if (cards.length) renderDots();
    startAutoplay();
  }

  /* Lightbox acessível com navegação por setas, teclado e foco preso */
  function setupLightbox() {
    const box = document.getElementById('lightbox');
    const imgEl = document.getElementById('lb-img');
    const capEl = document.getElementById('lb-caption');
    if (!box || !imgEl) return;

    const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
    if (!triggers.length) return;
    const closeBtn = box.querySelector('.lb-close');
    const prevBtn = box.querySelector('.lb-prev');
    const nextBtn = box.querySelector('.lb-next');
    let index = 0;
    let lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      const t = triggers[index];
      const thumb = t.querySelector('img');
      imgEl.src = t.dataset.full || thumb.currentSrc || thumb.src;
      imgEl.alt = thumb ? thumb.alt : '';
      capEl.textContent = t.dataset.caption || '';
      const single = triggers.length < 2;
      prevBtn.classList.toggle('hidden', single);
      nextBtn.classList.toggle('hidden', single);
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.classList.add('hidden');
      document.body.style.overflow = '';
      imgEl.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach((t, i) => t.addEventListener('click', () => open(i)));
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    document.addEventListener('keydown', (e) => {
      if (box.classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Tab') {
        const f = Array.from(box.querySelectorAll('button:not(.hidden)'));
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Gestos de deslize no celular
    let startX = null;
    box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupReviewsCarousel();
    setupLightbox();
    renderServicesList();
    updateBookingBox();
    setupFiltersAndControls();
    setupObserversAndPerformance();
    setupSecureContactForm();
    updateLiveHoursStatus();
    setupMobileNav();
  });
})();
