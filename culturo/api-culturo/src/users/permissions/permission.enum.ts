// src/users/enums/permission.enum.ts
export enum Permission {
  // Gestion des utilisateurs
  ACCEDER_LISTE_UTILISATEURS = 'acceder_liste_utilisateurs',
  CREER_UTILISATEUR = 'creer_utilisateur',
  MODIFIER_UTILISATEUR_STAGIAIRE = 'modifier_utilisateur_stagiaire',
  SUPPRIMER_UTILISATEUR = 'supprimer_utilisateur',
  
  // Gestion des exploitations
  ACCEDER_TOUTES_EXPLOITATIONS = 'acceder_toutes_exploitations',
  CREER_EXPLOITATION = 'creer_exploitation',
  MODIFIER_SUPPRIMER_EXPLOITATION = 'modifier_supprimer_exploitation',
  
  // Gestion des légumes
  CREER_LEGUME = 'creer_legume',
  MODIFIER_SUPPRIMER_LEGUME = 'modifier_supprimer_legume',
  CREER_FAMILLE_LEGUME = 'creer_famille_legume',
  MODIFIER_SUPPRIMER_FAMILLE_LEGUME = 'modifier_supprimer_famille_legume',
  CREER_VARIETE_LEGUME = 'creer_variete_legume',
  MODIFIER_SUPPRIMER_VARIETE_LEGUME = 'modifier_supprimer_variete_legume',
  MODIFIER_SUPPRIMER_RECOLTE = 'modifier_supprimer_recolte',
}