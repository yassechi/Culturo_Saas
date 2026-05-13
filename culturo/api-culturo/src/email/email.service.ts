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
