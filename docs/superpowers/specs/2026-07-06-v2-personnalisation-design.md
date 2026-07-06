# IOS26.EDAWARD v2 — Personnalisation, lisibilité, doc & release

Date : 2026-07-06
Statut : validé

## Contexte

Le thème dispose d'un panneau de configuration (bouton Topbar « IOS26 ») avec
trois réglages persistés dans `localStorage` (`ios26:settings`) : schéma
(sombre/clair/auto), fond pochette (on/off), flou (subtil/normal/fort).
`theme.js` applique les palettes en écrivant les variables `--spice-*` et
`--spice-rgb-*` sur `:root` ; `user.css` construit le verre à partir de
`--glass-blur` et des variables de palette. Le fond dynamique est un double
calque en cross-fade (`#ios26-backdrop`), assombri par un overlay fixe
`::after` à `rgba(main, 0.52)`.

Cette version ajoute quatre chantiers : panneau de config v2, overlay
adaptatif, transition douce entre schémas, documentation + release.

## 1. Panneau de config v2

### Accent personnalisable

- Nouvelle rangée « Accent » dans le panneau : 9 pastilles rondes reprenant
  les couleurs système iOS — rouge, orange, jaune, vert, sarcelle, bleu,
  indigo, violet, rose. La pastille active est entourée d'un anneau.
- Chaque accent définit une variante sombre et une variante claire (ex.
  bleu : `0A84FF` sombre / `007AFF` clair), résolue selon le schéma actif.
  AMOLED utilise les variantes sombres.
- L'accent remplace, dans la palette rendue : `button`, `button-active`,
  `notification`, ainsi que la teinte du dégradé de secours du fond
  (`#ios26-backdrop`, via `--spice-rgb-button`).
- Persistance : `settings.accent` (nom de la couleur, défaut `"blue"`).
  Valeur inconnue → retombe sur `"blue"`.

Palette (sombre / clair) :

| Nom     | Sombre   | Clair    |
|---------|----------|----------|
| red     | `FF453A` | `FF3B30` |
| orange  | `FF9F0A` | `FF9500` |
| yellow  | `FFD60A` | `FFCC00` |
| green   | `30D158` | `34C759` |
| teal    | `64D2FF` | `5AC8FA` |
| blue    | `0A84FF` | `007AFF` |
| indigo  | `5E5CE6` | `5856D6` |
| purple  | `BF5AF2` | `AF52DE` |
| pink    | `FF375F` | `FF2D55` |

### Mode AMOLED

- 4e option du sélecteur de schéma : Sombre / Clair / Auto / AMOLED.
- Nouvelle palette `amoled` dans `SCHEMES` : `main #000000`, `sidebar` et
  `player` `#000000`, `card #0A0A0A`, textes identiques au sombre.
- Classe `body.ios26-amoled` : augmente l'opacité de l'overlay du fond
  pochette (plancher plus haut que le sombre) et réduit la transparence du
  verre pour préserver le noir profond.
- `Auto` continue de résoudre vers sombre/clair uniquement (AMOLED est un
  choix explicite).

### Flou « Désactivé » (basses perfs)

- Le sélecteur Flou devient : Désactivé / Subtil / Normal / Fort.
- « Désactivé » applique la classe `body.ios26-no-blur` qui supprime
  complètement `backdrop-filter` / `-webkit-backdrop-filter` (pas `blur(0)`,
  qui garde un coût GPU) sur tous les panneaux de verre, et augmente
  l'opacité des fonds de panneaux pour garder le texte lisible.
- Le flou de la pochette de fond (`filter: blur(72px)` sur les calques,
  rendu une fois par image, peu coûteux) est conservé.

## 2. Overlay adaptatif (lisibilité)

- Dans `update()` (theme.js), après chargement de la pochette
  (`img.crossOrigin = "anonymous"`), l'image est dessinée sur un canvas
  16×16 et la luminance moyenne calculée (formule relative
  0.2126R + 0.7152G + 0.0722B, normalisée 0–1).
- L'opacité de l'overlay `#ios26-backdrop::after` devient une variable CSS
  `--backdrop-dim` (défaut `0.52`) posée sur `:root` :
  - schéma sombre/AMOLED : pochette claire → overlay plus opaque,
    interpolation linéaire de 0,45 (pochette sombre) à 0,70 (pochette
    claire) ; plancher relevé en AMOLED ;
  - schéma clair : logique inversée (pochette sombre → overlay plus opaque).
- La valeur est recalculée au changement de morceau et au changement de
  schéma (la luminance est mémorisée avec l'URL courante).
- Erreur de chargement, canvas tainted ou absence de pochette → retour au
  défaut `0.52`. Aucune régression possible.

## 3. Transition douce entre schémas

- Au changement de schéma ou d'accent, `render()` pose la classe
  `ios26-theming` sur `body`, retirée après ~300 ms (timer réinitialisé si
  changements rapprochés).
- En CSS, `body.ios26-theming *` active
  `transition: background-color .25s ease, color .25s ease, border-color .25s ease`.
  La classe étant temporaire, aucun coût permanent sur l'UI.
- Le cross-fade existant du fond pochette (0,8 s) est conservé tel quel.

## 4. Documentation & release

### README

- Section « Menu de configuration » mise à jour : accent, AMOLED, flou
  désactivé, overlay adaptatif (mention courte).
- Nouvelle section **Compatibilité** : version Spicetify testée, version
  Spotify, OS (Windows testé ; Mac/Linux non testés).
- Nouvelle section **Troubleshooting** : thème non appliqué après
  `spicetify apply`, réapplication après mise à jour de Spotify
  (`spicetify backup apply`), conflits avec extensions modifiant les
  couleurs.
- Emplacements d'images prévus : `docs/assets/screenshot-light.png`
  (capture mode clair) et `docs/assets/config-panel.gif` (panneau en
  action). Captures fournies par l'utilisateur après implémentation.

### Release

- Tag `v1.0.0` + release GitHub (via `gh`) avec un zip prêt à dézipper
  contenant `color.ini`, `user.css`, `theme.js`, `README.md`.
- Créée après l'ajout des captures.
- Étape suivante (hors périmètre de cette version) : soumission au repo
  officiel `spicetify/spicetify-themes`.

## Ordre d'implémentation

1. Panneau de config v2 (accent, AMOLED, flou désactivé)
2. Transition douce
3. Overlay adaptatif
4. Doc + release

## Vérification

- `spicetify apply` puis contrôle visuel : chaque accent, chaque schéma
  (dont AMOLED), flou désactivé, changement de morceau avec pochettes
  claire/sombre, redimensionnement de fenêtre.
- Vérifier la persistance des réglages après redémarrage de Spotify.
- Vérifier le fallback de l'overlay (morceau sans pochette / mode hors
  ligne).
