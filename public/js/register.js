const form = document.getElementById('registrationForm');
const steps = [...document.querySelectorAll('.form-step')];
const indicators = [...document.querySelectorAll('.step-item')];
const previousButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const submitButton = document.getElementById('submitButton');
const stepLabel = document.getElementById('stepLabel');
const stepTitle = document.getElementById('stepTitle');
const mobileStep = document.getElementById('mobileStep');
const summary = document.getElementById('summary');
const turnstileContainer = document.getElementById('turnstile-container');
let turnstileWidgetId = null;

const edomexBlock = document.getElementById('edomexBlock');
const foraneoBlock = document.getElementById('foraneoBlock');
const municipioId = document.getElementById('municipioId');
const estadoForaneo = document.getElementById('estadoForaneo');
const ciudadForanea = document.getElementById('ciudadForanea');

const municipioSelect =
  document.getElementById('municipioId');

const municipioHelp =
  document.getElementById('municipioHelp');

let currentStep = 1;

function renderTurnstile() {
  if (!turnstileContainer || turnstileWidgetId !== null) return;

  if (!window.turnstile) {
    window.setTimeout(renderTurnstile, 150);
    return;
  }

  turnstileWidgetId = window.turnstile.render(turnstileContainer, {
    sitekey: turnstileContainer.dataset.sitekey,
    theme: 'light',
    size: 'flexible'
  });
}

const titles = {
  1: 'Datos personales',
  2: 'Procedencia y contacto',
  3: 'Carrera y emergencia',
  4: 'Consentimientos'
};

const normalizeName = (value) => value
  .trim()
  .replace(/\s+/g, ' ')
  .replace(/(^|\s)([a-záéíóúüñ])/gi, (match) => match.toUpperCase());

['nombres', 'apellidoPaterno', 'apellidoMaterno'].forEach(id => {
  const field = document.getElementById(id);
  field?.addEventListener('input', () => {
    field.value = field.value
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/g, ' ');
  });
});

['nombres', 'apellidoPaterno', 'apellidoMaterno', 'contactoEmergencia', 'estadoForaneo', 'ciudadForanea'].forEach(id => {
  const field = document.getElementById(id);
  field?.addEventListener('blur', () => {
    if (field.value && field.value.toUpperCase() !== 'X') {
      field.value = normalizeName(field.value);
    }
  });
});

['telefono', 'telefonoEmergencia'].forEach(id => {
  const field = document.getElementById(id);
  field?.addEventListener('input', () => {
    field.value = field.value.replace(/\D/g, '').slice(0, 10);
  });
});

const curp = document.getElementById('curp');
curp?.addEventListener('input', () => {
  curp.value = curp.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 18);
});

document.querySelectorAll('input[name="esEdomex"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isEdomex = radio.value === 'true' && radio.checked;
    edomexBlock.classList.toggle('hidden', !isEdomex);
    foraneoBlock.classList.toggle('hidden', isEdomex);

    municipioId.required = isEdomex;
    estadoForaneo.required = !isEdomex;
    ciudadForanea.required = !isEdomex;

    if (isEdomex) {
      estadoForaneo.value = '';
      ciudadForanea.value = '';
    } else {
      municipioId.value = '';
    }
  });
});

async function loadMunicipios() {

  if (!municipioSelect) {
    return;
  }

  try {

    // Estado de carga
    municipioSelect.disabled = true;

    municipioSelect.innerHTML = `
      <option value="">
        Cargando municipios...
      </option>
    `;

    if (municipioHelp) {
      municipioHelp.textContent =
        'Consultando catálogo de municipios...';
    }


    // Consulta al backend
    const response = await fetch(
      '/api/catalogos/municipios',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );


    if (!response.ok) {
      throw new Error(
        `Error HTTP ${response.status}`
      );
    }


    const result = await response.json();


    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      throw new Error(
        'El catálogo recibido no es válido.'
      );
    }


    // Limpiamos select
    municipioSelect.innerHTML = `
      <option value="">
        Selecciona tu municipio
      </option>
    `;


    // Construimos opciones
    result.data.forEach(municipio => {

      const option =
        document.createElement('option');

      option.value = municipio.id;

      option.textContent = municipio.nombre;

      option.dataset.clave = municipio.clave;

      municipioSelect.appendChild(option);
    });


    municipioSelect.disabled = false;


    if (municipioHelp) {
      municipioHelp.textContent =
        'Selecciona tu municipio de residencia.';
    }


    console.log(
      `✅ ${result.data.length} municipios cargados`
    );


  } catch (error) {

    console.error(
      '❌ Error cargando municipios:',
      error
    );


    municipioSelect.innerHTML = `
      <option value="">
        No fue posible cargar los municipios
      </option>
    `;

    municipioSelect.disabled = true;


    if (municipioHelp) {

      municipioHelp.innerHTML = `
        No pudimos cargar el catálogo.
        <button
          type="button"
          id="retryMunicipios"
          class="
            font-semibold
            text-guinda
            underline
            underline-offset-2
          "
        >
          Intentar nuevamente
        </button>
      `;


      document
        .getElementById('retryMunicipios')
        ?.addEventListener(
          'click',
          loadMunicipios
        );
    }
  }
}

function showStep(stepNumber) {
  currentStep = stepNumber;

  steps.forEach(step => {
    step.classList.toggle('hidden', Number(step.dataset.step) !== currentStep);
  });

  indicators.forEach(indicator => {
    const stepValue = Number(indicator.dataset.stepIndicator);
    const circle = indicator.querySelector('.step-circle');
    const circleContent = circle.querySelector('.step-circle-content');

    indicator.classList.toggle('opacity-50', stepValue > currentStep);

    circle.classList.remove('bg-guinda', 'bg-dorado', 'text-white', 'border', 'border-linea', 'bg-white', 'text-texto-soft', 'step-circle-completed');

    if (stepValue === currentStep) {
      circle.classList.add('bg-guinda', 'text-white');
      circleContent.textContent = stepValue;
    } else if (stepValue < currentStep) {
      circle.classList.add('step-circle-completed', 'text-white');
      circleContent.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m5 12 4 4L19 6" />
        </svg>
      `;
    } else {
      circle.classList.add('border', 'border-linea', 'bg-white', 'text-texto-soft');
      circleContent.textContent = stepValue;
    }
  });

  stepLabel.textContent = `Paso ${currentStep} de 4`;
  mobileStep.textContent = `Paso ${currentStep} de 4`;
  stepTitle.textContent = titles[currentStep];
  previousButton.classList.toggle('invisible', currentStep === 1);
  nextButton.classList.toggle('hidden', currentStep === 4);
  submitButton.classList.toggle('hidden', currentStep !== 4);

  if (currentStep === 4) {
    createSummary();
    renderTurnstile();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleMissingSurname(field, label) {
  if (field.value.trim()) return true;

  const result = await Swal.fire({
    icon: 'warning',
    iconHtml: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.25 2.85 19a1.5 1.5 0 0 0 1.3 2.25h15.7a1.5 1.5 0 0 0 1.3-2.25L12 3.25Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 9v4.5M12 17.25v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
    title: `${label} sin capturar`,
    html: `Si cuentas con ${label.toLowerCase()}, captura el dato.<br><br>Si legalmente <strong>no cuentas con este apellido</strong>, puedes registrarlo con la letra <strong>X</strong>.`,
    showCancelButton: true,
    confirmButtonText: 'Marcar con X',
    cancelButtonText: 'Capturar apellido',
    buttonsStyling: false,
    customClass: {
      popup: 'voces-warning-modal',
      icon: 'voces-warning-icon',
      confirmButton: 'voces-modal-confirm',
      cancelButton: 'voces-modal-cancel'
    },
    reverseButtons: false
  });

  if (result.isConfirmed) {
    field.value = 'X';
    return true;
  }

  field.focus();
  return false;
}

async function validateCurrentStep() {
  if (currentStep === 1) {
    const paternal = await handleMissingSurname(document.getElementById('apellidoPaterno'), 'Apellido paterno');
    if (!paternal) return false;

    const maternal = await handleMissingSurname(document.getElementById('apellidoMaterno'), 'Apellido materno');
    if (!maternal) return false;
  }

  const currentContainer = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  const requiredFields = [...currentContainer.querySelectorAll('[required]')];
  let valid = true;
  let firstInvalid = null;

  requiredFields.forEach(field => {
    field.classList?.remove('border-red-500', 'ring-4', 'ring-red-100');

    if (!field.checkValidity()) {
      valid = false;
      firstInvalid ||= field;
      field.classList?.add('border-red-500', 'ring-4', 'ring-red-100');
    }
  });

  if (!valid) {
    await Swal.fire({
      icon: 'warning',
      iconHtml: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3.25 2.85 19a1.5 1.5 0 0 0 1.3 2.25h15.7a1.5 1.5 0 0 0 1.3-2.25L12 3.25Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 9v4.5M12 17.25v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,
      title: 'Revisa la información',
      text: 'Hay datos obligatorios pendientes o con un formato incorrecto.',
      confirmButtonText: 'Entendido',
      buttonsStyling: false,
      customClass: {
        popup: 'voces-warning-modal',
        icon: 'voces-warning-icon',
        confirmButton: 'voces-modal-confirm'
      }
    });
    firstInvalid?.focus();
  }

  return valid;
}

function getRadioText(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  if (!selected) return '—';
  const label = selected.closest('label')?.querySelector('span')?.textContent?.trim();
  return label || selected.value;
}

function getResidence() {
  const selected = document.querySelector('input[name="esEdomex"]:checked');
  if (!selected) return '—';

  if (selected.value === 'true') {
    const municipality = municipioId.selectedOptions[0]?.textContent?.trim();
    return municipality && !municipality.includes('pendiente') ? `${municipality}, Estado de México` : 'Estado de México';
  }

  return [ciudadForanea.value, estadoForaneo.value].filter(Boolean).join(', ');
}

function formatDateForSummary(value) {
  const [year, month, day] = String(value || '').split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year.slice(-2)}`;
}

function createSummary() {
  const categoria = getRadioText('categoriaCompetencia');
  const lgbtiq = getRadioText('identidadLgbtiq');

  const values = {
    'Nombre': [
      document.getElementById('nombres').value,
      document.getElementById('apellidoPaterno').value,
      document.getElementById('apellidoMaterno').value
    ].filter(Boolean).join(' '),
    'Fecha de nacimiento': formatDateForSummary(document.getElementById('fechaNacimiento').value),
    'Menor de edad': document.getElementById('esMenorEdad')?.checked ? 'Sí' : 'No',
    'Categoría de competencia': categoria,
    'Identidad LGBTIQ+': lgbtiq,
    'Procedencia': getResidence(),
    'Correo': document.getElementById('correo').value,
    'Teléfono': document.getElementById('telefono').value,
    'Talla de playera': document.getElementById('talla').value,
    'Tipo de sangre': document.getElementById('tipoSangre').value || 'No especificado',
    'Contacto de emergencia': document.getElementById('contactoEmergencia').value,
    'Teléfono de emergencia': document.getElementById('telefonoEmergencia').value,
    'CURP': document.getElementById('curp').value || 'No proporcionada'
  };

  const groups = [
    {
      title: 'Identificación del participante',
      fields: ['Nombre', 'Fecha de nacimiento', 'Menor de edad', 'CURP']
    },
    {
      title: 'Categoría y kit',
      layout: 'three-column',
      columns: [
        ['Categoría de competencia', 'Talla de playera'],
        ['Identidad LGBTIQ+'],
        ['Tipo de sangre']
      ]
    },
    {
      title: 'Contacto y procedencia',
      fields: ['Procedencia', 'Correo', 'Teléfono']
    },
    {
      title: 'Contacto de emergencia',
      fields: ['Contacto de emergencia', 'Teléfono de emergencia']
    }
  ];

  const renderField = (label, extraClass = '') => `
    <div class="${extraClass} rounded-xl border border-slate-100 bg-slate-50/75 px-3.5 py-3">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</p>
      <strong class="mt-1 block break-words text-sm font-semibold leading-5 text-slate-800">${escapeHtml(values[label] || '—')}</strong>
    </div>
  `;

  const renderGroupContent = (group) => {
    if (group.layout === 'three-column') {
      return `
        <div class="grid gap-3 md:grid-cols-3">
          <div class="space-y-3">
            ${group.columns[0].map((label) => renderField(label)).join('')}
          </div>
          <div class="space-y-3">
            ${group.columns[1].map((label) => renderField(label)).join('')}
          </div>
          ${renderField(group.columns[2][0], 'flex h-full flex-col justify-center md:row-span-2')}
        </div>
      `;
    }

    return `
      <div class="grid gap-3 sm:grid-cols-2">
        ${group.fields.map((label) => renderField(label, label === 'Nombre' ? 'sm:col-span-2' : '')).join('')}
      </div>
    `;
  };

  summary.innerHTML = groups.map((group, groupIndex) => `
    <section class="rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5">
      <div class="flex items-center gap-3">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-guinda/10 text-[10px] font-extrabold tracking-wide text-guinda">
          ${String(groupIndex + 1).padStart(2, '0')}
        </span>
        <h4 class="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">${escapeHtml(group.title)}</h4>
      </div>
      <div class="mt-4">
        ${renderGroupContent(group)}
      </div>
    </section>
  `).join('');
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}

const legalContent = {
    privacy: {
      title: 'Aviso de privacidad',
      html: `
        <div style="
          text-align:justify;
          text-justify:inter-word;
          line-height:1.75;
          color:#6B6265;
          font-size:14px;
        ">
          Los datos personales proporcionados serán utilizados para la organización, administración, comunicación y seguimiento de la carrera, así como para la generación de registros, confirmaciones y folios.<br><br>
        </div>`
    },

    waiver: {
      title: 'Carta de exoneración',
      html: `
        <div style="
          text-align:justify;
          text-justify:inter-word;
          line-height:1.75;
          color:#6B6265;
          font-size:14px;
        ">
          <strong>Hecho que refiero bajo protesta de decir verdad</strong>, sin presión, coacción o coerción por parte de la Institución convocante o del comité organizador, manifiesto que me encuentro en óptimas condiciones de salud física y emocional para participar en la actividad deportiva denominada <strong>“Carrera Voces Que Corren 5K”</strong>.<br><br>

          Asimismo, manifiesto que no padezco alguna condición que me impida realizar esta actividad física recreativa, reconozco los riesgos y peligros inherentes a la práctica deportiva y asumo la responsabilidad correspondiente respecto de mi participación.<br><br>
        </div>`
    },

    image: {
      title: 'Autorización de uso de imagen y voz',
      html: `
        <div style="
          text-align:justify;
          text-justify:inter-word;
          line-height:1.75;
          color:#6B6265;
          font-size:14px;
        ">
          Autorizo de manera <strong>voluntaria y totalmente gratuita</strong> al <strong>Gobierno del Estado de México</strong>, al comité organizador y, en su caso, a quien éste designe, para realizar la captación, fijación, reproducción, publicación y difusión de mi imagen y voz obtenidas en actividades relacionadas con la <strong>“Carrera Voces Que Corren 5K”</strong>.<br><br>

          La autorización comprende materiales gráficos, fotográficos, audiovisuales, publicaciones institucionales, sitios web, redes sociales y otros medios relacionados exclusivamente con la difusión y memoria del evento, sin que ello genere derecho a regalías u otra compensación.
        </div>`
    }
  };

document.querySelectorAll('[data-legal]').forEach(button => {
  button.addEventListener('click', () => {
    const content = legalContent[button.dataset.legal];
    Swal.fire({
      icon: 'info',
      iconHtml: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3.5 19 6v5.25c0 4.4-2.75 7.75-7 9.25-4.25-1.5-7-4.85-7-9.25V6l7-2.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
          <path d="M12 8.25v.1M12 11v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,
      title: content.title,
      html: content.html,
      width: 760,
      confirmButtonText: 'Cerrar',
      buttonsStyling: false,
      customClass: {
        popup: 'voces-legal-modal',
        icon: 'voces-legal-icon',
        confirmButton: 'voces-modal-confirm'
      }
    });
  });
});

nextButton.addEventListener('click', async () => {
  if (!(await validateCurrentStep())) return;
  if (currentStep < 4) showStep(currentStep + 1);
});

previousButton.addEventListener('click', () => {
  if (currentStep > 1) showStep(currentStep - 1);
});

//funcion limpiar formulario

function resetRegistrationForm() {

  // Limpia inputs, selects, radios y checkboxes
  form.reset();

  // Limpia bloques condicionales
  document
    .getElementById('edomexBlock')
    ?.classList.add('hidden');

  document
    .getElementById('foraneoBlock')
    ?.classList.add('hidden');

  // Limpia valores condicionales
  const municipio =
    document.getElementById('municipioId');

  const estadoForaneo =
    document.getElementById('estadoForaneo');

  const ciudadForanea =
    document.getElementById('ciudadForanea');

  if (municipio) {
    municipio.value = '';
    municipio.required = false;
  }

  if (estadoForaneo) {
    estadoForaneo.value = '';
    estadoForaneo.required = false;
  }

  if (ciudadForanea) {
    ciudadForanea.value = '';
    ciudadForanea.required = false;
  }

  // Limpia posibles estilos de error
  document
    .querySelectorAll(
      '.border-red-500, .ring-red-100'
    )
    .forEach(element => {

      element.classList.remove(
        'border-red-500',
        'ring-4',
        'ring-red-100'
      );

    });

  // Limpia resumen
  if (summary) {
    summary.innerHTML = '';
  }

  if (turnstileWidgetId !== null && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId);
  }

  // Regresa al paso 1
  showStep(1);

  // Focus inicial
  setTimeout(() => {
    document
      .getElementById('nombres')
      ?.focus();
  }, 300);
}

form.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    const isValid =
      await validateCurrentStep();

    if (!isValid) {
      return;
    }


    const submitButton =
      document.getElementById('submitButton');

    // Evita doble clic / doble envío
    if (submitButton.disabled) {
      return;
    }

    try {

      submitButton.disabled = true;

      submitButton.innerHTML = `
        <span
          class="
            inline-block
            h-4
            w-4
            animate-spin
            rounded-full
            border-2
            border-white/30
            border-t-white
          "
          aria-hidden="true"
        ></span>

        <span>
          Guardando preregistro
        </span>
      `;


      const esEdomex =
        document.querySelector(
          'input[name="esEdomex"]:checked'
        )?.value;


      const categoriaCompetencia =
        document.querySelector(
          'input[name="categoriaCompetencia"]:checked'
        )?.value;

      const identidadLgbtiq =
        document.querySelector(
          'input[name="identidadLgbtiq"]:checked'
        )?.value || null;

      const turnstileToken = turnstileWidgetId !== null && window.turnstile
        ? window.turnstile.getResponse(turnstileWidgetId)
        : '';

      if (turnstileContainer && !turnstileToken) {
        throw new Error('Completa la verificación de seguridad para continuar.');
      }


      const payload = {

        nombres:
          document.getElementById('nombres').value,

        apellidoPaterno:
          document.getElementById(
            'apellidoPaterno'
          ).value,

        apellidoMaterno:
          document.getElementById(
            'apellidoMaterno'
          ).value,

        fechaNacimiento:
          document.getElementById(
            'fechaNacimiento'
          ).value,

        esMenorEdad:
          document.getElementById('esMenorEdad')?.checked === true,

        categoriaCompetencia,

        identidadLgbtiq,

        turnstileToken,

        curp:
          document.getElementById(
            'curp'
          )?.value || null,

        esEdomex,

        municipioId:
          esEdomex === 'true'
            ? document.getElementById('municipioId').value
            : null,

        estadoForaneo:
          esEdomex === 'false'
            ? document.getElementById('estadoForaneo').value
            : null,

        ciudadForanea:
          esEdomex === 'false'
            ? document.getElementById('ciudadForanea').value
            : null,

        correo:
          document.getElementById(
            'correo'
          ).value,

        telefono:
          document.getElementById(
            'telefono'
          ).value,

        talla:
          document.getElementById(
            'talla'
          ).value,

        tipoSangre:
          document.getElementById(
            'tipoSangre'
          )?.value || null,

        contactoEmergencia:
          document.getElementById(
            'contactoEmergencia'
          ).value,

        telefonoEmergencia:
          document.getElementById(
            'telefonoEmergencia'
          ).value,

        aceptaPrivacidad:
          document.getElementById(
            'aceptaPrivacidad'
          ).checked,

        aceptaExoneracion:
          document.getElementById(
            'aceptaExoneracion'
          ).checked,

        autorizaImagen:
          document.getElementById(
            'autorizaImagen'
          ).checked
      };


    const response = await fetch(
      '/registro',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const contentType =
      response.headers.get('content-type') || '';

    let result;

    if (contentType.includes('application/json')) {

      result = await response.json();

    } else {

      const text = await response.text();

      console.error(
        'Respuesta inesperada del servidor:',
        text
      );

      throw new Error(
        'El servidor presentó un error inesperado.'
      );
    }


    // CORREO YA REGISTRADO
    if (
      response.status === 409 &&
      result.code === 'EMAIL_ALREADY_REGISTERED'
    ) {

      const duplicateResult = await Swal.fire({
        icon: 'warning',
        iconHtml: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3.25 2.85 19a1.5 1.5 0 0 0 1.3 2.25h15.7a1.5 1.5 0 0 0 1.3-2.25L12 3.25Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M12 9v4.5M12 17.25v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        `,

        title: 'Ya tienes un registro activo',

        html: `
          <div style="
            text-align:left;
            line-height:1.65;
            padding:0 8px;
          ">

            <p>
              El correo
            </p>

            <span style="
              margin:10px 0;
              display:inline-block;
              padding:6px 10px;
              background:#f3f4f6;
              border-radius:10px;
              font-weight:600;
              color:#6F1D3A;
              word-break:break-word;
            ">
              ${payload.correo}
            </span>

            <p>
              ya se encuentra asociado a un preregistro
              para <strong>Voces que Corren</strong>.
            </p>

            <p style="
              margin-top:12px;
              color:#6B6265;
            ">
              No necesitas registrarte nuevamente.
              Si todavía no has confirmado tu inscripción,
              podrás solicitar un nuevo enlace de confirmación.
            </p>

          </div>
        `,

        confirmButtonText: 'Reenviar confirmación',
        showCancelButton: true,
        cancelButtonText: 'Entendido',
        footer: 'Máximo 3 reenvíos por preregistro',
        reverseButtons: false,
        buttonsStyling: false,
        customClass: {
          popup: 'voces-duplicate-modal',
          icon: 'voces-duplicate-icon',
          confirmButton: 'voces-modal-confirm',
          cancelButton: 'voces-modal-cancel'
        }
      });

      if (duplicateResult.isConfirmed) {
        try {
          const resendResponse = await fetch('/registro/reenviar-confirmacion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo: payload.correo })
          });

          const resendResult = await resendResponse.json();

          if (!resendResponse.ok) {
            throw new Error(resendResult.message || 'No fue posible reenviar la confirmación.');
          }

          const reenviosRestantes = Number(resendResult.data?.reenviosRestantes ?? 0);
          const successMessage = reenviosRestantes === 0
            ? 'Generamos el último enlace disponible. <strong>No quedan reenvíos adicionales.</strong>'
            : `Generamos un nuevo enlace. Te quedan <strong>${reenviosRestantes}</strong> reenvío(s).`;

          await Swal.fire({
            icon: 'success',
            iconHtml: `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <path d="m8 12.2 2.6 2.6 5.4-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `,
            title: 'Confirmación reenviada',
            html: `
              <p class="voces-success-message">${successMessage}</p>
              <div class="voces-spam-note" role="note">
                <div class="voces-spam-note-title">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4.5 6.75h15v10.5h-15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
                    <path d="m5 7.25 7 5.25 7-5.25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
                  </svg>
                  <strong>Revisa tu bandeja de correo</strong>
                </div>
                <p>Busca también en <strong>spam, no deseados o promociones</strong>.</p>
                <p><strong>En iOS:</strong> si llega a spam, muévelo primero a la bandeja principal y marca <strong>“No es spam”</strong> antes de abrirlo; así el botón de confirmación será interactivo.</p>
              </div>
            `,
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: {
              popup: 'voces-success-modal',
              icon: 'voces-success-icon',
              confirmButton: 'voces-modal-confirm voces-success-confirm'
            }
          });
        } catch (resendError) {
          const resendMessage = String(resendError.message || 'No fue posible reenviar la confirmación.');
          const resendMessageHtml = resendMessage.includes('límite de 3 reenvíos')
            ? 'Has alcanzado el <strong>límite de 3 reenvíos</strong>. Solicita apoyo para reactivar tu confirmación.'
            : escapeHtml(resendMessage);

          await Swal.fire({
            icon: 'error',
            iconHtml: `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 8.5v4.25M12 16.25v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            `,
            title: 'No se pudo reenviar',
            html: `<p class="voces-error-message">${resendMessageHtml}</p>`,
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: {
              popup: 'voces-error-modal',
              icon: 'voces-error-icon',
              confirmButton: 'voces-modal-confirm voces-error-confirm'
            }
          });
        }
      }

      return;
    }


    // OTROS ERRORES
    if (!response.ok) {

      throw new Error(
        result.message ||
        'No fue posible guardar el preregistro.'
      );

    }


    // ÉXITO
    await Swal.fire({
      icon: 'success',
      iconHtml: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="m8 12.2 2.6 2.6 5.4-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      title: 'Preregistro recibido',

      html: `
        <p>
          Tus datos fueron guardados correctamente.
        </p>

        <p class="mt-3">
          En el siguiente paso deberás confirmar
          tu correo electrónico para obtener
          tu folio.
        </p>

        <div class="voces-spam-note mt-3" role="note">
          <div class="voces-spam-note-title">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4.5 6.75h15v10.5h-15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="m5 7.25 7 5.25 7-5.25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
            </svg>
            <strong>Revisa tu bandeja de correo</strong>
          </div>
          <p>Busca también en <strong>spam, no deseados o promociones</strong>.</p>
          <p><strong>En iOS:</strong> si llega a spam, muévelo primero a la bandeja principal y marca <strong>“No es spam”</strong> antes de abrirlo; así el botón de confirmación será interactivo.</p>
        </div>
      `,

      confirmButtonText: 'Aceptar',
      buttonsStyling: false,
      customClass: {
        popup: 'voces-success-modal',
        icon: 'voces-success-icon',
        confirmButton: 'voces-modal-confirm voces-success-confirm'
      }
    });


    resetRegistrationForm();

    console.log(
      '✅ Preregistro:',
      result.data
    );

    } catch (error) {

      console.error(error);


      await Swal.fire({
        icon: 'error',
        iconHtml: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 8.5v4.25M12 16.25v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        `,
        title:
          'No pudimos completar el preregistro',
        text:
          error.message,
        confirmButtonText: 'Entendido',
        buttonsStyling: false,
        customClass: {
          popup: 'voces-error-modal',
          icon: 'voces-error-icon',
          confirmButton: 'voces-modal-confirm voces-error-confirm'
        }
      });


    } finally {

      submitButton.disabled = false;

      submitButton.innerHTML = `
        <span>
          Enviar preregistro
        </span>
      `;

    }

  }
);


loadMunicipios();
showStep(1);
