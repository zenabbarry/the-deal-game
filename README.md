# THE DEAL. — The Vesper Account

Jeu de négociation B2B en français pour trois équipes. Paris, printemps 2027 : AURA doit remporter et livrer le lancement de VESPER. Quinze décisions, trois chapitres et quatre fins, sans élimination.

## Animer une séance

1. Ouvrir le site, puis **Espace présentateur**. Entrer la clé privée pour créer un salon. Cette clé n’est jamais à communiquer aux élèves.
2. Cliquer sur **Ouvrir le grand écran**. Projeter uniquement cet onglet, en plein écran. Garder les commandes sur l’écran personnel de l’animateur.
3. Les trois équipes scannent le QR code et choisissent un nom. Un seul appareil vote pour chaque équipe. Prévoir environ 90 secondes d’accueil.
4. Lancer la partie. Le mode automatique enchaîne scènes, votes, conséquences, bilans, épilogues, podium et correction. Les pauses et le mode manuel prolongent la séance.
5. Sur le téléphone, choisir 1, 2 ou 3 puis **Confirmer**. Les propositions sont sur le grand écran ; le retour est privé. Un vote confirmé ne se modifie plus. Sans réponse, aucune décision financière n’est inventée.

Le présentateur peut mettre en pause, ouvrir/clôturer un vote, avancer une réplique ou saisir le choix d’une équipe dont le téléphone est indisponible. En mode manuel, les votes restent chronométrés. Une actualisation conserve la session sur le même navigateur. Pour reprendre les commandes sur un autre appareil, entrer le code du salon et la clé présentateur : l’ancien accès présentateur est remplacé.

Les salons expirent après 24 heures. L’expiration bloque l’accès ; elle ne supprime pas automatiquement les enregistrements. Utiliser des noms d’entreprises fictifs, sans données personnelles. En cas de coupure générale d’Internet, le mode local ci-dessous constitue une répétition/séance de secours indépendante ; il ne reprend pas automatiquement un salon en ligne.

## Principes pédagogiques

- Jauges initiales : performance, rentabilité, confiance et maîtrise TNV, chacune à 50/100, bornées entre 0 et 100. Cachées aux équipes jusqu’au dénouement.
- Bilans individualisés après les décisions 5, 10 et 15 ; conséquences différées après les décisions 11 et 14.
- Prix initial 240 000 € HT, coûts directs 174 000 €, plafond client 230 000 € HT. TVA pédagogique de 20 %.
- D10 : une remise de 15 % donne 204 000 €. D12 : une seconde remise de 10 % s’applique au prix courant, soit 183 600 € après la première. Une optimisation de périmètre donne 160 000 € de coûts et un prix de 220 000 €, ou 204 000 € si la remise initiale est engagée.
- Contribution = prix HT − coûts directs − coût de crise − financement. Elle ne représente pas un bénéfice net. Les coûts de crise dissimulés ne sont révélés qu’au dénouement.
- Fins : Empire, Rising, Ambition et Fall, selon signature, contribution, confiance, maîtrise et dissimulation. Le classement combine les jauges et pénalités, puis maîtrise TNV, contribution et confiance pour départager. Révélation du troisième au premier.
- La correction finale reprend les 15 situations, options, réponses des trois équipes et explications. Les références sont propres au scénario.

## Développement et répétition locale

Node.js 22 ou supérieur :

```sh
npm ci
npm run dev
```

Ouvrir `http://127.0.0.1:4173`. La clé locale par défaut est `repetition-locale` ; elle ne fonctionne pas sur le site publié. Le serveur local est limité à cet ordinateur. Pour une séance de secours, utiliser les commandes de saisie manuelle et les réponses orales des équipes. Les données locales sont enregistrées dans `.local-data/`, exclu de Git.

```sh
npm test
npm run test:e2e
npm run build
```

`test:e2e` joue les 15 décisions via cinq rôles HTTP (animateur, écran public, trois équipes), envoie des votes concurrents et vérifie confidentialité, conséquences, épilogues, podium et correction. Il requiert le serveur local actif. Les tests unitaires couvrent les quatre fins, les seuils exacts, les doubles envois, les accès, les pauses, les retards et le minutage automatique.

## Hébergement

Vercel publie `dist/` et exécute `api/game.js`. Supabase conserve l’état avec une version atomique : une mise à jour concurrente doit relire l’état avant d’être acceptée. Les échéances sont décidées côté serveur ; les clients se synchronisent toutes les secondes. Aucun corrigé, barème ou secret serveur n’est inclus dans le JavaScript envoyé aux élèves.

Appliquer `database/schema.sql` sur le projet Supabase. Configurer uniquement côté serveur Vercel : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Secret), `HOST_PASSWORD` (Secret). Ne jamais utiliser un préfixe `VITE_` pour ces valeurs. La table a RLS activé et n’est accessible ni au rôle anonyme ni aux utilisateurs ordinaires. Les versions de travail Vercel restent protégées ; l’adresse de production est publique. L’accès animateur est toujours protégé par la clé de l’application.

Les illustrations originales générées pour le projet sont locales dans `public/assets/`. Aucun appel à un service d’IA ni à une police distante n’est nécessaire pendant la partie. L’univers et les personnages sont fictifs. Voir `docs/design.md` et `docs/validation.md`.
