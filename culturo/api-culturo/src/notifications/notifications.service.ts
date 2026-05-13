import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observation } from 'src/entities/observation.entity';
import { Section } from 'src/entities/section.entity';
import { Repository } from 'typeorm';
import type { JWTPayloadType } from 'src/utils/types';

export interface AppNotification {
  id: string;
  type: 'pending_observation' | 'upcoming_harvest' | 'rotation_alert';
  title: string;
  body: string;
  link: string;
  severity: 'info' | 'warning' | 'critical';
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async getNotifications(payload: JWTPayloadType): Promise<AppNotification[]> {
    const notifications: AppNotification[] = [];

    await Promise.all([
      this.addObservationNotifications(payload, notifications),
      this.addUpcomingHarvestNotifications(notifications),
    ]);

    return notifications.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  private async addObservationNotifications(
    payload: JWTPayloadType,
    out: AppNotification[],
  ) {
    if (payload.role === 'stagiaire') {
      const myPending = await this.observationRepository.count({
        where: { author: { id_user: payload.id }, review_status: 'pending' },
      });
      if (myPending > 0) {
        out.push({
          id: 'my-obs-pending',
          type: 'pending_observation',
          title: `${myPending} observation${myPending > 1 ? 's' : ''} en attente`,
          body: 'Votre formateur n\'a pas encore relu vos dernières observations terrain.',
          link: '/observations',
          severity: 'info',
        });
      }
      return;
    }

    const pending = await this.observationRepository.count({
      where: { review_status: 'pending' },
    });

    if (pending === 0) return;

    out.push({
      id: 'obs-pending',
      type: 'pending_observation',
      title: `${pending} observation${pending > 1 ? 's' : ''} à valider`,
      body: `${pending > 1 ? 'Des stagiaires ont soumis des' : 'Un stagiaire a soumis une'} observation${pending > 1 ? 's' : ''} terrain en attente de relecture.`,
      link: '/validation',
      severity: pending >= 5 ? 'critical' : 'warning',
    });
  }

  private async addUpcomingHarvestNotifications(out: AppNotification[]) {
    const today = new Date();
    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);

    const upcomingSections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .innerJoin('section.sectionPlan', 'sp')
      .innerJoin('sp.board', 'board')
      .where('section.section_active = TRUE')
      .andWhere('section.end_date >= :today', { today })
      .andWhere('section.end_date <= :in14Days', { in14Days })
      .select(['section.id_section', 'section.end_date', 'section.section_number', 'vegetable.vegetable_name', 'board.board_name'])
      .getMany();

    if (upcomingSections.length === 0) return;

    const fmt = (d: Date | string) =>
      new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    if (upcomingSections.length === 1) {
      const s = upcomingSections[0];
      out.push({
        id: `harvest-${s.id_section}`,
        type: 'upcoming_harvest',
        title: 'Récolte imminente',
        body: `${s.vegetable?.vegetable_name ?? 'Culture'} — fin prévue le ${fmt(s.end_date)}.`,
        link: '/recoltes',
        severity: 'info',
      });
    } else {
      out.push({
        id: 'harvest-upcoming',
        type: 'upcoming_harvest',
        title: `${upcomingSections.length} récoltes dans les 14 prochains jours`,
        body: upcomingSections
          .slice(0, 3)
          .map((s) => `${s.vegetable?.vegetable_name ?? '?'} (${fmt(s.end_date)})`)
          .join(', ') + (upcomingSections.length > 3 ? '…' : ''),
        link: '/recoltes',
        severity: 'info',
      });
    }
  }
}
