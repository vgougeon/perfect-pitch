# Do absolu

Petit jeu pour apprendre à retrouver le **Do** de mémoire (oreille absolue sur une note).

1. Tu chantes ou imagines ton Do.
2. Tu révèles le vrai Do (piano, diapason ou orgue ; grave, central ou aigu).
3. Tu dis honnêtement si tu avais juste.

Le site compte l'XP, les niveaux, les combos, la série de jours et les médailles, et trace ton taux de réussite par jour et par semaine. Plus le dernier Do entendu est ancien, plus l'essai rapporte (fraîcheur ×0,5 à ×2).

L'historique est gardé dans le `localStorage` du navigateur. Les boutons **Exporter / Importer** permettent de le sauvegarder ou de le passer sur un autre appareil.

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # vérifie les types puis génère dist/
```

Stack : Vite, React 19, Tailwind CSS 4, TypeScript.

## Mise en ligne sur GitHub Pages

1. Crée un repo sur GitHub et pousse ce dossier sur la branche `main`.
2. Dans le repo : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Chaque push sur `main` lance [.github/workflows/deploy.yml](.github/workflows/deploy.yml), qui construit et publie le site sur `https://<ton-pseudo>.github.io/<nom-du-repo>/`.

`vite.config.ts` utilise `base: './'`, donc le site marche quel que soit le nom du repo.
