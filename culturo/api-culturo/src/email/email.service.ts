import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // ← IMPORTANT : Forcer à false pour Mailtrap
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    console.log('========== DEBUG EMAIL ==========');
    console.log("Tentative d'envoi d'email à:", email);
    console.log('MAIL_HOST:', this.configService.get<string>('MAIL_HOST'));
    console.log('MAIL_PORT:', this.configService.get<number>('MAIL_PORT'));
    console.log('MAIL_USER:', this.configService.get<string>('MAIL_USER'));
    console.log('MAIL_FROM:', this.configService.get<string>('MAIL_FROM'));
    console.log('=================================');

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'Bienvenue sur notre plateforme',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bienvenue ${firstName} ${lastName} !</h2>
          <p>Votre compte a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter à notre plateforme avec votre adresse email.</p>
          <br>
          <p>Cordialement,</p>
          <p><strong>L'équipe</strong></p>
        </div>
      `,
      });

      console.log(' Email envoyé avec succès !');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      throw new InternalServerErrorException(
        "Erreur lors de l'envoi de l'email",
      );
    }
  }
}
