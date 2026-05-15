import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = parseInt(this.configService.get<string>('MAIL_PORT') ?? '1025', 10);
    const secure = this.configService.get<string>('MAIL_SECURE') === 'true';
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    this.logger.log(`SMTP init — host: ${host}:${port}, user: ${user || '(aucun)'}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      // Authentification uniquement si des identifiants sont fournis
      ...(user ? { auth: { user, pass } } : {}),
    });

    // Vérifie la connexion SMTP au démarrage
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`Connexion SMTP échouée : ${error.message}`);
      } else {
        this.logger.log('Connexion SMTP OK — prêt à envoyer des emails.');
      }
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetUrl: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'Réinitialisation de votre mot de passe — Culturo',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2d5a27;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${firstName},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe sur Culturo.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
          <br>
          <a href="${resetUrl}" style="
            display: inline-block;
            background-color: #2d5a27;
            color: white;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
          ">Réinitialiser mon mot de passe</a>
          <br><br>
          <p style="color: #666; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email. Votre mot de passe restera inchangé.</p>
          <p style="color: #666; font-size: 13px;">Lien direct : <a href="${resetUrl}">${resetUrl}</a></p>
          <br>
          <p>Cordialement,<br><strong>L'équipe Culturo</strong></p>
        </div>
        `,
      });

      this.logger.log(`Email reset envoyé à ${email} — ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Erreur envoi email reset à ${email} : ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de l'envoi de l'email");
    }
  }

  /**
   * Notifie les formateurs qu'une nouvelle observation a été soumise
   */
  async sendObservationSubmittedToFormateurs(
    formateurs: { email: string; user_first_name: string }[],
    stagiaire: { user_first_name: string; user_last_name: string; email: string },
    observation: {
      id_observation: number;
      observation_date: Date;
      plant_status: string;
      notes: string;
      disease_observed?: string | null;
      pest_observed?: string | null;
      weather_conditions?: string | null;
    },
  ): Promise<void> {
    const date = new Date(observation.observation_date).toLocaleDateString('fr-BE', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const statusLabel: Record<string, string> = { bon: 'Bon', moyen: 'Moyen', mauvais: 'Mauvais' };
    const extras = [
      observation.disease_observed ? `<li><strong>Maladie&nbsp;:</strong> ${observation.disease_observed}</li>` : '',
      observation.pest_observed   ? `<li><strong>Ravageur&nbsp;:</strong> ${observation.pest_observed}</li>` : '',
      observation.weather_conditions ? `<li><strong>Météo&nbsp;:</strong> ${observation.weather_conditions}</li>` : '',
    ].join('');

    await Promise.all(
      formateurs.map(async (f) => {
        try {
          const info = await this.transporter.sendMail({
            from: this.configService.get<string>('MAIL_FROM'),
            to: f.email,
            subject: `Nouvelle observation de ${stagiaire.user_first_name} ${stagiaire.user_last_name} — Culturo`,
            html: `
            <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">
              <h2 style="color:#2d5a27;">Nouvelle observation terrain</h2>
              <p>Bonjour ${f.user_first_name},</p>
              <p><strong>${stagiaire.user_first_name} ${stagiaire.user_last_name}</strong> (${stagiaire.email}) vient de soumettre une observation en attente de votre relecture.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;width:40%;">Date</td><td style="padding:8px;">${date}</td></tr>
                <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">État de la plante</td><td style="padding:8px;">${statusLabel[observation.plant_status] ?? observation.plant_status}</td></tr>
                <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Notes</td><td style="padding:8px;">${observation.notes}</td></tr>
                ${extras ? `<tr><td colspan="2" style="padding:8px;"><ul style="margin:0;padding-left:16px;">${extras}</ul></td></tr>` : ''}
              </table>
              <p>Connectez-vous à Culturo pour valider ou demander des modifications.</p>
              <p>Cordialement,<br><strong>L'équipe Culturo</strong></p>
            </div>`,
          });
          this.logger.log(`Email observation #${observation.id_observation} envoyé à ${f.email} — ID: ${info.messageId}`);
        } catch (error) {
          this.logger.error(`Erreur envoi email observation à ${f.email} : ${error.message}`);
        }
      }),
    );
  }

  /**
   * Notifie le stagiaire que son observation a été relue
   */
  async sendObservationReviewedToStagiaire(
    stagiaire: { email: string; user_first_name: string },
    reviewer: { user_first_name: string; user_last_name: string },
    observation: { id_observation: number; observation_date: Date; notes: string },
    reviewStatus: string,
    reviewNotes: string | null | undefined,
  ): Promise<void> {
    const date = new Date(observation.observation_date).toLocaleDateString('fr-BE', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const isApproved = reviewStatus === 'approved';
    const statusLabel = isApproved ? 'Validée ✓' : 'Modifications demandées';
    const statusColor = isApproved ? '#2d5a27' : '#b56a43';

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: stagiaire.email,
        subject: `Votre observation a été ${isApproved ? 'validée' : 'relue'} — Culturo`,
        html: `
        <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">
          <h2 style="color:${statusColor};">Observation ${statusLabel}</h2>
          <p>Bonjour ${stagiaire.user_first_name},</p>
          <p>Votre observation du <strong>${date}</strong> a été relue par <strong>${reviewer.user_first_name} ${reviewer.user_last_name}</strong>.</p>
          <p><strong>Statut&nbsp;:</strong> <span style="color:${statusColor};font-weight:bold;">${statusLabel}</span></p>
          ${reviewNotes ? `<p><strong>Commentaire du formateur&nbsp;:</strong></p><blockquote style="border-left:4px solid ${statusColor};padding:8px 16px;margin:0;background:#f9f9f9;">${reviewNotes}</blockquote>` : ''}
          <br>
          <p>Cordialement,<br><strong>L'équipe Culturo</strong></p>
        </div>`,
      });
      this.logger.log(`Email review observation #${observation.id_observation} envoyé à ${stagiaire.email} — ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Erreur envoi email review à ${stagiaire.email} : ${error.message}`);
    }
  }

  // ── Types partagés pour les emails de commande ──────────────────────────────

  private buildOrderTable(items: {
    vegetable: { vegetable_name: string };
    variety: { variety_name: string } | null;
    quantity_ordered: number;
    unit: string;
    unit_price: string | null;
  }[], tvaRate = 0, headerBg = '#2d5a27'): string {
    // Calcul du total HT : somme des lignes qui ont un prix unitaire valide
    let totalHT: number | null = null;
    const rows = items.map(item => {
      const rawPrice = item.unit_price ? parseFloat(item.unit_price.replace(',', '.')) : null;
      const price: number | null = (rawPrice !== null && !Number.isNaN(rawPrice)) ? rawPrice : null;
      const lineTotal: number | null = price !== null ? price * item.quantity_ordered : null;
      if (lineTotal !== null) {
        totalHT = (totalHT ?? 0) + lineTotal;
      }
      const priceStr  = price     !== null ? price.toFixed(2)     + ' €' : '—';
      const totalStr  = lineTotal !== null ? lineTotal.toFixed(2) + ' €' : '—';
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;">${item.vegetable.vegetable_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;color:#555;">${item.variety?.variety_name ?? '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:bold;font-size:15px;">${item.quantity_ordered}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;">${item.unit}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;text-align:right;">${priceStr}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e8e8;text-align:right;color:#444;">${totalStr}</td>
      </tr>`;
    }).join('');

    const ht = totalHT !== null ? (totalHT as number) : null;
    const tvaAmt  = (ht !== null && tvaRate > 0) ? ht * tvaRate / 100 : null;
    const ttc     = (ht !== null && tvaAmt !== null) ? ht + tvaAmt : null;

    const totalsRows = ht !== null ? `
      <tr style="background:#f0f7f0;">
        <td colspan="5" style="padding:10px 12px;text-align:right;font-weight:600;color:#555;border-top:2px solid #2d5a27;">Total HT</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:#2d5a27;border-top:2px solid #2d5a27;">${ht.toFixed(2)} €</td>
      </tr>
      ${tvaAmt !== null ? `
      <tr style="background:#f7faf7;">
        <td colspan="5" style="padding:8px 12px;text-align:right;color:#666;font-size:13px;">TVA (${tvaRate}%)</td>
        <td style="padding:8px 12px;text-align:right;color:#666;font-size:13px;">${tvaAmt.toFixed(2)} €</td>
      </tr>
      <tr style="background:#e8f5e9;">
        <td colspan="5" style="padding:12px 12px;text-align:right;font-weight:700;font-size:15px;border-top:1px solid #c8e6c9;">TOTAL TTC</td>
        <td style="padding:12px 12px;text-align:right;font-weight:700;font-size:17px;color:#1b5e20;border-top:1px solid #c8e6c9;">${(ttc as number).toFixed(2)} €</td>
      </tr>` : ''}` : '';

    return `
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <thead>
          <tr style="background:${headerBg};color:white;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;">Désignation</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;">Variété</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Qté</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;">Unité</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Prix unit. HT</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="padding:10px;text-align:center;color:#999;">Aucune ligne</td></tr>'}
          ${totalsRows}
        </tbody>
      </table>`;
  }

  /**
   * Confirmation de commande envoyée — adressé à l'utilisateur (récap interne)
   */
  async sendSupplierOrderSentEmail(
    user: { email: string; user_first_name: string; user_last_name: string },
    order: {
      id_supplier_order: number;
      order_date: Date;
      expected_date: Date | null;
      notes: string | null;
      supplier: { supplier_name: string; contact_email: string | null };
      items: {
        vegetable: { vegetable_name: string };
        variety: { variety_name: string } | null;
        quantity_ordered: number;
        unit: string;
        unit_price: string | null;
      }[];
    },
    tvaRate = 0,
  ): Promise<void> {
    const orderDate = new Date(order.order_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const expectedDate = order.expected_date
      ? new Date(order.expected_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Non précisée';

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: user.email,
        subject: `✅ Commande #${order.id_supplier_order} envoyée à ${order.supplier.supplier_name}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;color:#333;">
          <!-- En-tête -->
          <div style="background:#2d5a27;padding:24px 28px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">✅ Commande envoyée</h1>
            <p style="color:#a8d5a2;margin:4px 0 0;">Culturo · Gestion des plants</p>
          </div>

          <div style="padding:24px 28px;background:white;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
            <p>Bonjour <strong>${user.user_first_name}</strong>,</p>
            <p>Votre commande <strong>#${order.id_supplier_order}</strong> a bien été envoyée à <strong>${order.supplier.supplier_name}</strong>.</p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9fafb;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="padding:10px 14px;font-weight:bold;color:#555;width:40%;">Fournisseur</td>
                <td style="padding:10px 14px;">${order.supplier.supplier_name}</td>
              </tr>
              <tr style="background:#f0f4f0;">
                <td style="padding:10px 14px;font-weight:bold;color:#555;">Date de commande</td>
                <td style="padding:10px 14px;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;color:#555;">Livraison prévue</td>
                <td style="padding:10px 14px;">${expectedDate}</td>
              </tr>
              ${order.notes ? `<tr style="background:#f0f4f0;"><td style="padding:10px 14px;font-weight:bold;color:#555;">Notes</td><td style="padding:10px 14px;">${order.notes}</td></tr>` : ''}
            </table>

            <h3 style="color:#2d5a27;margin:0 0 4px;">Articles commandés</h3>
            ${this.buildOrderTable(order.items, tvaRate)}

            <br>
            <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin-top:8px;">
              Connectez-vous à Culturo pour confirmer la réception et mettre à jour votre stock automatiquement.
            </p>
          </div>
        </div>`,
      });
      this.logger.log(`[Email] Récap commande #${order.id_supplier_order} → ${user.email} (ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`[Email] Erreur récap commande #${order.id_supplier_order} : ${error.message}`);
    }
  }

  /**
   * Bon de commande officiel — adressé au fournisseur
   */
  async sendSupplierOrderToSupplier(
    supplierEmail: string,
    order: {
      id_supplier_order: number;
      order_date: Date;
      expected_date: Date | null;
      notes: string | null;
      supplier: { supplier_name: string };
      user_: { user_first_name: string; user_last_name: string; email: string };
      items: {
        vegetable: { vegetable_name: string };
        variety: { variety_name: string } | null;
        quantity_ordered: number;
        unit: string;
        unit_price: string | null;
      }[];
    },
    tvaRate = 0,
    contactEmail = 'culturotech@gmail.com',
  ): Promise<void> {
    const orderDate = new Date(order.order_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const expectedDate = order.expected_date
      ? new Date(order.expected_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'À définir';

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        replyTo: contactEmail,
        to: supplierEmail,
        subject: `Bon de commande N°${order.id_supplier_order} — Culturo`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;color:#222;">

          <!-- En-tête bon de commande -->
          <div style="border:2px solid #2d5a27;border-radius:8px;overflow:hidden;">

            <div style="background:#2d5a27;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h1 style="color:white;margin:0;font-size:22px;letter-spacing:1px;">BON DE COMMANDE</h1>
                <p style="color:#a8d5a2;margin:4px 0 0;font-size:13px;">N° ${order.id_supplier_order.toString().padStart(4, '0')}</p>
              </div>
              <div style="text-align:right;color:#a8d5a2;font-size:13px;">
                <div>Date : <strong style="color:white;">${orderDate}</strong></div>
              </div>
            </div>

            <div style="padding:24px 28px;background:white;">

              <!-- Parties -->
              <table style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="width:48%;vertical-align:top;">
                    <div style="background:#f5f9f5;border-left:3px solid #2d5a27;padding:12px 16px;border-radius:0 4px 4px 0;">
                      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#888;font-weight:bold;">Acheteur</p>
                      <p style="margin:0;font-weight:bold;font-size:15px;">Culturo</p>
                      <p style="margin:4px 0 0;color:#555;font-size:13px;">
                        ${order.user_.user_first_name} ${order.user_.user_last_name}<br>
                        <a href="mailto:${contactEmail}" style="color:#2d5a27;">${contactEmail}</a>
                      </p>
                    </div>
                  </td>
                  <td style="width:4%;"></td>
                  <td style="width:48%;vertical-align:top;">
                    <div style="background:#f5f9f5;border-left:3px solid #2d5a27;padding:12px 16px;border-radius:0 4px 4px 0;">
                      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#888;font-weight:bold;">Fournisseur</p>
                      <p style="margin:0;font-weight:bold;font-size:15px;">${order.supplier.supplier_name}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Infos livraison -->
              <table style="width:100%;border-collapse:collapse;background:#fafafa;border:1px solid #e8e8e8;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 16px;font-weight:bold;color:#555;width:40%;border-bottom:1px solid #e8e8e8;">Date de livraison souhaitée</td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e8e8e8;"><strong style="color:#2d5a27;">${expectedDate}</strong></td>
                </tr>
                ${order.notes ? `
                <tr>
                  <td style="padding:10px 16px;font-weight:bold;color:#555;">Instructions / Notes</td>
                  <td style="padding:10px 16px;">${order.notes}</td>
                </tr>` : ''}
              </table>

              <!-- Lignes de commande -->
              <h3 style="color:#2d5a27;margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:0.5px;">Détail de la commande</h3>
              ${this.buildOrderTable(order.items, tvaRate)}

              <!-- Pied de page -->
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e8e8e8;">
                <p style="margin:0;">Merci de bien vouloir accuser réception de cette commande et de confirmer la date de livraison prévue.</p>
                <p style="margin:8px 0 0;">Pour toute question, contactez-nous à <a href="mailto:${contactEmail}" style="color:#2d5a27;">${contactEmail}</a>.</p>
                <br>
                <p style="margin:0;">Cordialement,<br><strong>${order.user_.user_first_name} ${order.user_.user_last_name}</strong><br>
                <span style="color:#888;font-size:12px;">Culturo — Gestion des cultures</span></p>
              </div>

            </div>
          </div>

          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px;">Ce bon de commande a été généré automatiquement par Culturo.</p>
        </div>`,
      });
      this.logger.log(`[Email] Bon de commande #${order.id_supplier_order} → ${supplierEmail} (ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`[Email] Erreur bon de commande #${order.id_supplier_order} vers fournisseur : ${error.message}`);
    }
  }

  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'Bienvenue sur Culturo',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2d5a27;">Bienvenue ${firstName} ${lastName} !</h2>
          <p>Votre compte a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter à votre espace Culturo avec votre adresse email.</p>
          <br>
          <p>Cordialement,<br><strong>L'équipe Culturo</strong></p>
        </div>
        `,
      });

      this.logger.log(`Email bienvenue envoyé à ${email} — ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Erreur envoi email bienvenue à ${email} : ${error.message}`);
      // Ne pas bloquer la création de compte si l'email échoue
    }
  }
}
