// src/users/configs/role-permissions.config.ts

import { Permission } from "./permission.enum";


export const PERMISSIONS_PAR_ROLE: Record<string, Permission[]> = {
  formateur: [ // En minuscules
    // Gestion des utilisateurs
    Permission.ACCEDER_LISTE_UTILISATEURS,
    Permission.CREER_UTILISATEUR,
    Permission.MODIFIER_UTILISATEUR_STAGIAIRE,
    Permission.SUPPRIMER_UTILISATEUR,
    
    // Gestion des exploitations
    Permission.ACCEDER_TOUTES_EXPLOITATIONS,
    Permission.CREER_EXPLOITATION,
    Permission.MODIFIER_SUPPRIMER_EXPLOITATION,
    
    // Gestion des légumes
    Permission.CREER_LEGUME,
    Permission.MODIFIER_SUPPRIMER_LEGUME,
    Permission.CREER_FAMILLE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_FAMILLE_LEGUME,
    Permission.CREER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_VARIETE_LEGUME,
    Permission.MODIFIER_SUPPRIMER_RECOLTE,
  ],
  
  stagiaire: [ // En minuscules
    // Permissions limitées pour les stagiaires
    // À définir selon vos besoins
  ],
};