const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const resend =
  new Resend(process.env.RESEND_API_KEY);

class EmailService {

  get from() {
    return process.env.RESEND_FROM || 'Voces que Corren <onboarding@resend.dev>';
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async sendConfirmationEmail({
    to,
    name,
    confirmationUrl
  }) {

    const { data, error } =
      await resend.emails.send({
        from: this.from,

        to: [to],

        subject:
          'Confirma tu preregistro | Voces que Corren',

        html: `
          <div style="
            font-family:Arial,sans-serif;
            max-width:600px;
            margin:auto;
            padding:30px;
          ">

            <h2 style="color:#6F1D3A;">
              Hola ${name}
            </h2>

            <p>
              Hemos recibido tu preregistro para
              la Segunda Carrera Atlética
              “Voces que Corren” 5 km.
            </p>

            <p>
              Para completar tu inscripción,
              confirma tu correo electrónico.
            </p>

            <p style="margin:30px 0;">
              <a
                href="${confirmationUrl}"
                style="
                  display:inline-block;
                  background:#6F1D3A;
                  color:#ffffff;
                  padding:14px 24px;
                  border-radius:12px;
                  text-decoration:none;
                  font-weight:bold;
                "
              >
                Confirmar inscripción
              </a>
            </p>

            <p style="
              color:#6B6265;
              font-size:13px;
            ">
              Este enlace tiene una vigencia limitada.
            </p>

            <div style="
              color:#4E1429;
              font-size:13px;
              background:#FFF7ED;
              border:1px solid #F2D4AD;
              padding:15px 16px;
              border-radius:12px;
              line-height:1.55;
            ">
              <p style="margin:0 0 7px;font-weight:bold;">Revisa tu bandeja de correo</p>
              <p style="margin:0 0 7px;color:#6B6265;text-align:justify;line-height:1.65;">Busca también en <strong>spam, no deseados o promociones</strong>.</p>
              <p style="margin:0;color:#6B6265;text-align:justify;line-height:1.65;"><strong>Si usas iOS:</strong> si el mensaje llega a spam, muévelo primero a la bandeja principal y marca <strong>“No es spam”</strong> antes de abrirlo. Así el botón de confirmación estará disponible.</p>
            </div>

          </div>
        `
      });


    if (error) {

      console.error(
        '❌ Error Resend:',
        error
      );

      const message = error.statusCode === 403
        ? 'Resend está en modo de prueba: solo permite enviar al correo propietario de la cuenta. Verifica un dominio en Resend para enviar a otros destinatarios.'
        : 'No fue posible enviar el correo de confirmación.';
      const deliveryError = new Error(message);
      deliveryError.code = 'EMAIL_DELIVERY_FAILED';
      throw deliveryError;
    }


    console.log(
      '📧 Correo enviado:',
      data
    );


    return data;
  }

  async sendRegistrationConfirmedEmail({
    to,
    name,
    folio,
    evento
  }) {
    const waiverPath = path.resolve(
      __dirname,
      '../../../public/assets/Responsiva_Carrera_GEM_Valle_de_Chalco.pdf'
    );

    const attachment = fs.readFileSync(waiverPath);
    const safeName = this.escapeHtml(name);
    const safeFolio = this.escapeHtml(folio);
    const safeEvento = this.escapeHtml(evento);
    const qrPayload = [
      'Voces que Corren',
      `Folio: ${folio}`,
      `Nombre: ${name}`
    ].join('\n');
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      type: 'png',
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#4E1429',
        light: '#FFFFFF'
      }
    });

    const { data, error } = await resend.emails.send({
      from: this.from,
      to: [to],
      subject: `Inscripción confirmada | Folio ${folio}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#231F20">
          <h2 style="color:#6F1D3A">¡Inscripción confirmada!</h2>
          <p>Hola ${safeName}, tu inscripción para <strong>${safeEvento}</strong> quedó confirmada.</p>
          <p style="font-size:20px;font-weight:bold;color:#6F1D3A">Folio: ${safeFolio}</p>
          <p>Adjuntamos tu carta de exoneración y tu código QR personal. Conserva ambos documentos para el evento.</p>
        </div>
      `,
      attachments: [
        {
          filename: 'Responsiva_Carrera_GEM_Valle_de_Chalco.pdf',
          content: attachment
        },
        {
          filename: `QR_${folio}.png`,
          content: qrBuffer
        }
      ]
    });

    if (error) {
      console.error('Error Resend al enviar confirmación:', error);
      throw new Error('No fue posible enviar el correo de inscripción confirmada.');
    }

    console.log('Correo de inscripción confirmada enviado:', data);
    return data;
  }

}

module.exports =
  new EmailService();
