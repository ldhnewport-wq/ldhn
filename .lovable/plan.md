# Tournoi 3e édition 2026

## Objectif
Ajouter un nouvel onglet principal "Tournoi 3e édition 2026" accessible depuis la page d'accueil et offrant un espace dédié au tournoi annuel.

## Structure de la page `/tournoi`

Hub central avec :
- **En-tête** : Titre "Tournoi 3e édition 2026" + logo LDHN
- **Équipes inscrites** : grille des équipes participantes avec logos/couleurs, cliquables pour voir l'alignement (réutilisation du composant existant des équipes)
- **6 boutons d'accès rapide** :
  1. Horaire général
  2. Horaire par catégorie (Rookies / Intermédiaire / Élite)
  3. Tableau du tournoi (bracket)
  4. Règlements
  5. Remerciements (commanditaires/bénévoles)
  6. Retour accueil

## Données

Nouvelle table `tournament_teams` (référence vers `teams` existantes) pour marquer quelles équipes sont inscrites au tournoi 2026, avec une catégorie (rookies/intermédiaire/élite).

Les **alignements sont transférés automatiquement** depuis la table `players` existante (jointure par `team_id`) — pas de duplication des joueurs.

Nouvelles tables :
- `tournament_schedule` : matchs du tournoi (date, heure, équipes, catégorie, terrain)
- `tournament_bracket` : positions dans le tableau éliminatoire
- `tournament_content` : contenu éditable pour Règlements et Remerciements (sections markdown)

## Sous-pages

- `/tournoi` — hub principal
- `/tournoi/horaire` — horaire (filtres par catégorie)
- `/tournoi/tableau` — bracket visuel
- `/tournoi/reglements` — texte des règlements
- `/tournoi/remerciements` — page de remerciements
- `/tournoi/equipe/:id` — détail d'une équipe inscrite (réutilise TeamDetail)

## Admin

Extension de `/admin` avec un nouvel onglet "Tournoi" pour :
- Inscrire/désinscrire des équipes
- Gérer l'horaire
- Éditer le bracket
- Éditer règlements et remerciements

## Étapes techniques

1. Migration SQL : créer les 3 nouvelles tables avec RLS publique en lecture
2. Créer la page `/tournoi` (Index du tournoi)
3. Créer les sous-pages Horaire, Bracket, Règlements, Remerciements
4. Ajouter la carte/bouton sur la page d'accueil (en haut, mis en valeur)
5. Ajouter la gestion admin
