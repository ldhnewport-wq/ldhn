

## Diagnostic

Les passes sont bien en base (12 passes, 28 buts, 2 matchs finals) et le code les calcule correctement avec la formule `pts = buts + (passes × 2)`. Le vrai problème : la page `/classement` affiche d'abord un menu de boutons, donc tant qu'on n'a pas cliqué sur "Classements des marqueurs", on ne voit aucune statistique — d'où l'impression que "rien ne s'affiche".

## Plan

### 1. Onglets en haut de page (au lieu du menu)
Remplacer le menu d'accueil par 3 onglets toujours visibles :
- **Marqueurs** (actif par défaut) → buts, passes, points
- **Gardiens** → stats des gardiens
- **Équipes** → classement des équipes

L'onglet Marqueurs étant ouvert dès l'arrivée, les passes seront immédiatement visibles.

### 2. Distinction claire entre les 3 divisions
Dans **chaque onglet**, afficher les 3 divisions les unes sous les autres avec une séparation visuelle nette :

```text
┌──────────────────────────────────────┐
│ [Marqueurs] [Gardiens] [Équipes]     │
├──────────────────────────────────────┤
│ ▌ Division Les Rookies               │  ← bandeau coloré
│   ┌──────────────────────────────┐  │
│   │ tableau des marqueurs Rookies│  │
│   └──────────────────────────────┘  │
│                                      │
│ ▌ Division Les Young Guns            │  ← bandeau coloré
│   ┌──────────────────────────────┐  │
│   │ tableau des marqueurs YG     │  │
│   └──────────────────────────────┘  │
│                                      │
│ ▌ Division Les Vétérans              │  ← bandeau coloré
│   ┌──────────────────────────────┐  │
│   │ tableau des marqueurs Vét.   │  │
│   └──────────────────────────────┘  │
└──────────────────────────────────────┘
```

Chaque section de division aura :
- Un **en-tête de division** distinctif (titre large, barre verticale colorée à gauche, espacement marqué)
- Son **propre tableau** (marqueurs, gardiens ou équipes selon l'onglet)
- Un **séparateur visuel** entre divisions (ligne ou large espace)
- Plus besoin du sous-menu "choisir une division" pour les équipes — les 3 sont visibles directement

### 3. Logo de l'équipe à côté du joueur
Dans les tableaux Marqueurs et Gardiens, ajouter une mini-pastille avec le logo (ou abréviation colorée) de l'équipe du joueur, en cohérence avec le reste du site.

### 4. Nettoyage technique
Retirer la config cache agressive (`staleTime: 0`, `gcTime: 0`, `refetchOnMount: "always"`) qui n'est plus nécessaire — le problème n'était pas le cache.

## Détails techniques

**Fichier modifié** : `src/pages/Classement.tsx`
- Remplacer le state `view` par un state `tab: "scorers" | "goalies" | "teams"` (défaut: `"scorers"`).
- Utiliser le composant `<Tabs>` shadcn (déjà disponible).
- Composant local `<DivisionSection>` réutilisable rendant l'en-tête de division + le tableau passé en enfant.
- Importer `<TeamLogo>` (déjà existant) pour les colonnes équipe.
- Restaurer la config par défaut sur la query `events`.
- Supprimer les états `selectedDivision` et la vue `teams-division`.

