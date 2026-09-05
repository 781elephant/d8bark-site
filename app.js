(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const config = window.D8_CONFIG || { orderEmail: 'orders@d8bark.com', whatsappNumber: '' };

  const menuButton = $('.menu-button');
  const nav = $('.site-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }

  $('#year').textContent = new Date().getFullYear();

  const builder = $('#bark-builder');
  const crunchHelp = $('#crunch-help');
  const dialog = $('#order-dialog');
  const requestSummary = $('#request-summary');
  const orderForm = $('#order-form');
  let currentRequest = null;

  function value(name) {
    return $(`input[name="${name}"]:checked`, builder)?.value || '';
  }

  function crunches() {
    return $$('input[name="crunch"]:checked', builder).map(x => x.value);
  }

  function updateBuilder() {
    if (!builder) return;
    $('#summary-spread').textContent = value('spread');
    $('#summary-chocolate').textContent = value('chocolate');
    const selectedCrunch = crunches();
    $('#summary-crunch').textContent = selectedCrunch.length ? selectedCrunch.join(', ') : 'No added crunch';
    $('#summary-finish').textContent = value('finish');
    crunchHelp.textContent = `${selectedCrunch.length} of 2 selected`;
  }

  if (builder) {
    builder.addEventListener('change', (event) => {
      if (event.target.name === 'crunch') {
        const selected = crunches();
        if (selected.length > 2) {
          event.target.checked = false;
          showToast('Choose up to 2 crunch options.');
        }
      }
      updateBuilder();
    });
  }

  function customBuild() {
    return {
      type: 'Custom D8 Bark',
      price: 72,
      lines: [
        'Pressed Medjool date base',
        `Spread: ${value('spread')}`,
        `Chocolate: ${value('chocolate')}`,
        `Crunch: ${crunches().length ? crunches().join(', ') : 'None'}`,
        `Finish: ${value('finish')}`
      ]
    };
  }

  function openRequest(request) {
    currentRequest = request;
    const priceLine = request.price ? `\nIndicative product price: AED ${request.price} per sheet` : '';
    requestSummary.textContent = `${request.type}\n${request.lines.join('\n')}${priceLine}`;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  $('#request-build')?.addEventListener('click', () => openRequest(customBuild()));

  $('#reset-builder')?.addEventListener('click', () => {
    builder.reset();
    updateBuilder();
    showToast('Build reset.');
  });

  $$('.product-request').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      const name = card.dataset.product;
      const price = Number(card.dataset.price || 0);
      const description = $('p', card).textContent.trim();
      openRequest({ type: name, price, lines: [description] });
    });
  });

  function buildOrderText(formData) {
    const request = currentRequest || customBuild();
    return [
      'D8 BARK ORDER REQUEST',
      '',
      request.type,
      ...request.lines,
      request.price ? `Indicative product price: AED ${request.price} per sheet` : '',
      '',
      `Name: ${formData.get('name')}`,
      `Phone / WhatsApp: ${formData.get('phone')}`,
      `Email: ${formData.get('email')}`,
      `Delivery area: ${formData.get('area')}`,
      `Quantity: ${formData.get('quantity')}`,
      `Preferred delivery date: ${formData.get('date') || 'Flexible'}`,
      `Notes: ${formData.get('notes') || 'None'}`,
      '',
      'Please confirm availability, final total and delivery timing before production.'
    ].filter(Boolean).join('\n');
  }

  orderForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!orderForm.reportValidity()) return;
    const formData = new FormData(orderForm);
    const text = buildOrderText(formData);
    const subject = encodeURIComponent(`D8 Bark Order Request | ${currentRequest?.type || 'Custom D8'}`);
    const body = encodeURIComponent(text);

    if (config.whatsappNumber && /^\d+$/.test(config.whatsappNumber)) {
      const url = `https://wa.me/${config.whatsappNumber}?text=${body}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast('Opening WhatsApp with your order request.');
      return;
    }

    window.location.href = `mailto:${config.orderEmail}?subject=${subject}&body=${body}`;
    showToast('Opening your email app with the order request.');
  });

  $('#copy-order')?.addEventListener('click', async () => {
    if (!orderForm.reportValidity()) return;
    const text = buildOrderText(new FormData(orderForm));
    try {
      await navigator.clipboard.writeText(text);
      showToast('Order details copied.');
    } catch {
      showToast('Copy was blocked by your browser.');
    }
  });

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2700);
  }

  updateBuilder();
})();
