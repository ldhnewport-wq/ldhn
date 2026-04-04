

## Plan: Organiser les équipes par division dans l'onglet Admin

### Probleme actuel
L'onglet "Équipes" dans l'admin affiche toutes les équipes dans une grille plate, sans regroupement par division.

### Changement prevu

**Fichier: `src/pages/Admin.tsx` (TeamsTab, lignes ~132-150)**

Remplacer la grille plate par un affichage groupé en 3 sections :

1. Filtrer les équipes par division (`rookies`, `younguns`, `veterans`)
2. Pour chaque division, afficher un titre de section (ex: "Les Rookies") suivi des cartes d'équipes appartenant a cette division
3. Si aucune équipe dans une division, afficher un message "Aucune équipe"

Structure resultante :
```text
┌─────────────────────────────┐
│ Les Rookies                 │
│  [Équipe A] [Équipe B]     │
│                             │
│ Les Young Guns              │
│  [Équipe C]                 │
│                             │
│ Les Vétérans                │
│  [Équipe D] [Équipe E]     │
└─────────────────────────────┘
```

Chaque carte conserve le meme design actuel (couleur, abréviation, boutons modifier/supprimer). Seul le rendu de la liste change, aucun changement de logique ni de base de données.

