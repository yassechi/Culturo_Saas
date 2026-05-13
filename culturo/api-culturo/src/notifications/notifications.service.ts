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
      where: payload.role === 'formateur'
        ? { review_status: 'pending', author: { id_formateur: payload.id } }
        : { review_status: 'pending' },
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
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .innerJoin('section.sectionPlan', 'sp')
      .innerJoin('sp.board', 'board')
      .where('section.section_active = TRUE')
      .andWhere('section.end_date <= :in7Days', { in7Days })
      .select(['section.id_section', 'section.end_date', 'section.section_number', 'vegetable.vegetable_name', 'board.board_name'])
      .getMany();

    if (sections.length === 0) return;

    const fmt = (d: Date | string) =>
      new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const overdue = sections.filter((s) => new Date(s.end_date) < today);
    const dueToday = sections.filter((s) => {
      const d = new Date(s.end_date);
      return d >= today && d <= todayEnd;
    });
    const upcoming = sections.filter((s) => new Date(s.end_date) > todayEnd);

    if (overdue.length > 0) {
      out.push({
        id: `harvest-overdue`,
        type: 'upcoming_harvest',
        title: `${overdue.length} récolte${overdue.length > 1 ? 's' : ''} en retard`,
        body: overdue
          .slice(0, 3)
          .map((s) => `${s.vegetable?.vegetable_name ?? '?'} (prévu le ${fmt(s.end_date)})`)
          .join(', ') + (overdue.length > 3 ? '…' : ''),
        link: '/tableau-de-bord',
        severity: 'critical',
      });
    }

    if (dueToday.length > 0) {
      out.push({
        id: `harvest-today`,
        type: 'upcoming_harvest',
        title: `${dueToday.length} récolte${dueToday.length > 1 ? 's' : ''} à faire aujourd'hui`,
        body: dueToday
          .slice(0, 3)
          .map((s) => s.vegetable?.vegetable_name ?? '?')
          .join(', ') + (dueToday.length > 3 ? '…' : ''),
        link: '/tableau-de-bord',
        severity: 'warning',
      });
    }

    if (upcoming.length > 0) {
      if (upcoming.length === 1) {
        const s = upcoming[0];
        out.push({
          id: `harvest-${s.id_section}`,
          type: 'upcoming_harvest',
          title: 'Récolte imminente',
          body: `${s.vegetable?.vegetable_name ?? 'Culture'} — fin prévue le ${fmt(s.end_date)}.`,
          link: '/tableau-de-bord',
          severity: 'info',
        });
      } else {
        out.push({
          id: 'harvest-upcoming',
          type: 'upcoming_harvest',
          title: `${upcoming.length} récoltes dans les 7 prochains jours`,
          body: upcoming
            .slice(0, 3)
            .map((s) => `${s.vegetable?.vegetable_name ?? '?'} (${fmt(s.end_date)})`)
            .join(', ') + (upcoming.length > 3 ? '…' : ''),
          link: '/tableau-de-bord',
          severity: 'info',
        });
      }
    }
  }
}
