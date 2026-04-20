// src/users/configs/role-permissions.config.ts

import { Permission } from "./permission.enum";


export const PERMISSIONS_PAR_ROLE: Record<string, Permission[]> = {
  admin: [
    // Utilisateurs
    Permission.ACCEDER_LISTE_UTILISATEURS,
    Permission.CREER_UTILISATEUR,
    Permission.MODIFIER_UTILISATEUR_STAGIAIRE,
    Permission.SUPPRIMER_UTILISATEUR,
    // Exploitations
    Permission.ACCEDER_TOUTES_EXPLOITATIONS,
    Permission.CREER_EXPLOITATION,
    Permission.MODIFIER_SUPPRIMER_EXPLOITATION,
    // Référentiel botanique
    Permission.CREER_LEGUME,
    Permission.MODIFIER_SUPPRIMER_LEGUME,
    Permission.CREER_FAMILLE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_FAMILLE_LEGUME,
    Permission.CREER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_RECOLTE,
    // Planification (accès complet + bypass)
    Permission.PLANIFIER_CULTURE,
    Permission.BYPASS_ROTATION,
    Permission.CONSULTER_PLAN,
    // Observations
    Permission.CONSULTER_OBSERVATIONS,
  ],

  formateur: [
    // Utilisateurs (gestion des stagiaires)
    Permission.ACCEDER_LISTE_UTILISATEURS,
    Permission.CREER_UTILISATEUR,
    Permission.MODIFIER_UTILISATEUR_STAGIAIRE,
    Permission.SUPPRIMER_UTILISATEUR,
    // Exploitations
    Permission.ACCEDER_TOUTES_EXPLOITATIONS,
    Permission.CREER_EXPLOITATION,
    Permission.MODIFIER_SUPPRIMER_EXPLOITATION,
    // Référentiel botanique
    Permission.CREER_LEGUME,
    Permission.MODIFIER_SUPPRIMER_LEGUME,
    Permission.CREER_FAMILLE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_FAMILLE_LEGUME,
    Permission.CREER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_RECOLTE,
    // Planification (bypass autorisé pour le formateur)
    Permission.PLANIFIER_CULTURE,
    Permission.BYPASS_ROTATION,
    Permission.CONSULTER_PLAN,
    // Observations
    Permission.CONSULTER_OBSERVATIONS,
  ],

  stagiaire: [
    // Consultation du plan de culture uniquement
    Permission.CONSULTER_PLAN,
    // Saisie et consultation des observations terrain
    Permission.SAISIR_OBSERVATION,
    Permission.CONSULTER_OBSERVATIONS,
  ],
};
