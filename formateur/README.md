# Guide du formateur

Ce guide couvre les **deux formations** bâties sur le même projet TaskBoard :
**C# → PHP · Symfony · React** (`docs/`, support https://formation.zedcode.fr) et
**Vue → PHP · Symfony** (`docs/vue/`, support https://formation.zedcode.fr/vue — voir [la section dédiée](#formation-vue--php--symfony)).
Les solutions, le contrat d'API, le kata et la charte IA sont communs.

> ⚠️ Ce dossier contient les solutions.
> - Dans l'**application de formation**, il n'est servi qu'aux personnes authentifiées sur `/formateur` : il n'est jamais inclus dans le bundle public.
>   Le zip du projet de départ téléchargeable par les stagiaires l'exclut aussi.
> - Si vous remettez le **dépôt Git** aux stagiaires, retirez-le (ou gardez-le sur une branche à part) :
>   ```bash
>   git rm -r --cached formateur && echo "/formateur/" >> .gitignore
>   ```

## Contenu

| Chemin | Rôle |
|---|---|
| `solutions/api-php/` | Solution complète de l'API PHP pur (étape 1). Passe `make php-check` (18/18) et les 3 vérifications de lots. |
| `solutions/symfony-atelier/` | Solution de l'atelier pratique Symfony (étape 2) : services, contrainte, écouteur, exception, commande. 16/16 avec `make sf-atelier`. |
| `solutions/doctrine-kata/` | Solution du kata Doctrine & DQL (`BookRepository`, `AuthorRepository`, `Library`) : 21/21 avec `make sf-kata`. |
| `questions-comprehension-vue.md` | Réponses attendues aux questions orales de la formation Vue (fondamentaux back-end compris). |
| `questions-comprehension.md` | Réponses attendues aux questions « à expliquer à l'oral » affichées sous chaque quiz de l'app, plus des questions de relance pour les revues orales. |

L'API Symfony fournie (`apps/api-symfony`) **est** la correction de la partie 1 portée en Symfony : elle sert de
point de départ au backlog (étape 4). Il n'y a pas de solution pour le backlog ni pour le front.

## Durée et rythme

Budget interne (formateur uniquement) : prévoir **au plus 3 jours de 7 h** (≈ 21 h de travail par profil).
Les durées de ce guide servent uniquement à votre animation.
L'atelier pratique Symfony (voir « Conseils d'animation ») de l'étape 2 compte pour **3 h côté back** dans ce budget : le dev front avance pendant ce temps sur F5.

**Aucune durée n'est communiquée aux stagiaires : le support et les cours n'en affichent aucune.** Côté stagiaires,
le parcours se fait **à son rythme**, par étapes ([docs/00-organisation.md](../docs/00-organisation.md#le-déroulé-par-étapes)) :
une étape est terminée quand elle est comprise, et aller plus vite est une bonne chose.

Points de contrôle, par événement (pas par horaire) :

| Fin de… | Attendu | Contrôle |
|---|---|---|
| Étape 1 — PHP | API PHP pur intégrée | `make php-check` vert, front sur `make use-php` + oraux des lots |
| Étape 2 — atelier Symfony | A1 → A5 par chacun (ou binôme) | `make sf-atelier` sur chaque branche `atelier/<prénom>` + débrief |
| Étape 3 — kata Doctrine | Kata K01 → K16 + K20 par chacun | `make sf-kata` sur chaque branche `kata/<prénom>` + débrief K06 / K12 / K20 |
| Étape 4 — Projet | Socle du backlog livré par chaque dev | `make sf-test` et `make sf-check` verts, front branché + oraux à la démo |

En séance, on présente **l'essentiel et les pièges** de chaque cours (les documents complets servent de référence).

**Si l'équipe prend du retard**, coupez dans cet ordre :

1. Les bonus des exercices PHP, puis les K17 → K21 du kata (sauf K20), qui passent en travail après formation.
   À l'atelier Symfony : A5 (commande console) et les bonus ; A1 → A4 et le débrief restent.
2. Au backlog, les tickets bonus, puis réduire chaque dev à **un** ticket socle livré et testé.
3. Côté front : F11, puis les points « Bonus » de F8 → F10.

On ne coupe **jamais** les revues orales ni l'intégration de fin d'étape 1 : ce sont elles qui garantissent la compréhension.

**Pour ceux qui vont plus vite** (à encourager, jamais à freiner) :

- Back : les tickets **bonus** du backlog, les katas bonus (K17 → K19, K21), l'exercice `priority` de la visite du projet,
  les bonus des exercices PHP (405 propre, filtre `?status=`, tests PHPUnit).
- Front : **F11** et les points « Bonus » de F8 → F10.
- Tous : lire les sections « référence » des cours, aider un collègue (en expliquant, pas en codant à sa place),
  relire une PR de l'autre côté du contrat.

## Utiliser les solutions

### Débloquer un seul lot (étape 1)

Les lots ont des signatures identiques à la solution : on peut remplacer **un seul fichier** sans toucher au reste.

```bash
# Ex. le Lot B est bloqué sur le repository : on lui donne la solution de ce fichier uniquement
cp formateur/solutions/api-php/src/Repository/TaskRepository.php apps/api-php/src/Repository/
make php-check-b
```

Préférez donner un fichier (avec une explication orale) plutôt que tout le lot : les autres méthodes restent à écrire.

### Remplacer toute l'API PHP pur (démo, rattrapage)

```bash
mv apps/api-php apps/api-php.stagiaires
cp -R formateur/solutions/api-php apps/api-php
docker compose up -d --force-recreate api-php   # sinon le montage Docker pointe sur l'ancien dossier
make php-composer c=install && make php-db-reset && make php-check
```

### Atelier Symfony

```bash
cp -R formateur/solutions/symfony-atelier/src/. apps/api-symfony/src/
make sf-cc && make sf-atelier     # 16/16 ; make sf-test et make sf-check restent verts
git checkout -- apps/api-symfony/src && git clean -fd apps/api-symfony/src   # revenir au projet de départ
```

Les fichiers modifiés (`TaskController`, `Task`, les deux DTO) sont des copies complètes du projet de départ + l'atelier :
sur un projet déjà avancé, donnez plutôt les fichiers nouveaux un par un.

### Kata Doctrine

```bash
cp -R formateur/solutions/doctrine-kata/src/Kata/. apps/api-symfony/src/Kata/
make sf-kata          # 21/21
git checkout -- apps/api-symfony/src/Kata   # revenir aux squelettes (ou les restaurer depuis le zip du projet)
```

Points de la solution PHP pur à commenter en séance :

- `public/index.php` : câblage manuel des dépendances → c'est exactement ce que le conteneur de Symfony automatisera.
- `Router` : regex + groupes nommés, paramètres passés en **arguments nommés**, `$taskController->list(...)` (first-class callable).
- `Request::json()` : `php://input`, `JSON_THROW_ON_ERROR`, distinction tableau liste / objet.
- `HttpException` / `ValidationException` : gestion d'erreurs centralisée → préfigure `kernel.exception` de Symfony.
- `TaskRepositoryInterface` + `InMemoryTaskRepository` (dans `tools/checks/Fake`) : l'inversion de dépendance qui a permis au Lot C d'avancer sans le Lot B.
- `TaskRepository` : requêtes préparées, `RETURNING *`, `rowCount()`.
- `TaskValidator` : messages identiques à ceux de Symfony pour que le front ne voie pas la différence.

## Conseils d'animation

**Étape 1 — PHP** (cours 1 h 30 max : on va droit aux différences avec C# et aux pièges)
- Commencer par le *modèle d'exécution* (share-nothing) : c'est la différence la plus structurante avec .NET
  et la source de la plupart des incompréhensions ultérieures (« pourquoi mon singleton est vide ? »).
- Exercices 1-2 en mob : tout le monde touche `php://input`, `header()`, `json_encode` avant de se répartir les lots.
- Faire lire ensemble les signatures fournies (`src/`) et les scripts `tools/checks/lot-*.php` avant de lancer les lots :
  c'est le contrat entre les trois devs. Les signatures ne doivent pas changer.
- Le Lot A est le plus « plomberie », le Lot C le plus dense : si un dev est plus à l'aise, donnez-lui le C.
- Les tableaux PHP (liste + dictionnaire + copie par valeur) méritent 10 minutes avec des exemples au tableau.
- L'IA est autorisée sur les lots : passez dans les rangs et demandez régulièrement « explique-moi cette ligne ».

**Étape 2 — Symfony** (1 h 30 max)
- Avant d'ouvrir le code, faire lister ce qu'ils ont dû écrire à la main en partie 1 : chaque élément a un équivalent
  Symfony (voir `docs/02-symfony/03-visite-du-projet.md`).
- Montrer le profiler (`/_profiler`) très tôt, en particulier l'onglet Doctrine (requêtes SQL, N+1).
- `make sf c="debug:container --show-arguments TaskController"` et `debug:autowiring` démystifient l'autowiring.

**Atelier pratique Symfony** (3 h, après le cours ; [sujet](../docs/02-symfony/05-atelier-pratique.md), tests `make sf-atelier`)

| Durée | Quoi | Animation |
|---|---|---|
| 10 min | Lancement | Chacun crée `atelier/<prénom>`, lance `make sf-atelier` (16 tests, 13 rouges). Rappeler : lire le test d'abord. |
| 15 min | A0 — outils de diagnostic | Corriger ensemble au tableau : c'est ce qui servira tout le reste de la formation. |
| 30 min | A1 — route + service | Premier passage dans les rangs : « où est enregistré `TaskStats` ? » |
| 30 min | A2 — contrainte de validation | Faire comparer avec `TaskValidator` du PHP pur. |
| 30 min | A3 — écouteur d'événements | Le point le plus formateur : la priorité. Montrer `debug:event-dispatcher kernel.request` au tableau si besoin. |
| 10 min | Pause | |
| 30 min | A4 — exception métier → 409 | Laisser constater la 500 avant de donner l'indice `#[WithHttpStatus]`. |
| 15 min | A5 — commande console | Souvent rapide une fois A1 fait ; sinon le couper (voir « Si l'équipe prend du retard »). |
| 10 min | Débrief | Les 4 questions de fin du sujet, une par personne. |

Réponses attendues au débrief :

1. **Configuration écrite** : aucune ligne. Autowiring (services), autoconfiguration (validateur, écouteur, commande
   trouvés par leur classe parente ou leur attribut), routes par attribut.
2. **POST en majuscules** : `kernel.request` (ResponseTimeListener note l'heure, RouterListener trouve la route) →
   `kernel.controller_arguments` : `RequestPayloadValueResolver` désérialise, le Validator appelle `NotShoutingValidator`,
   la violation lève une exception → `kernel.exception` la rend en 422 JSON → `kernel.response` pose `X-Response-Time`.
   Le contrôleur n'est jamais appelé.
3. **Statistiques** : la logique est dans le service `TaskStats` ; le contrôleur et la commande ne sont que deux portes
   d'entrée (HTTP, CLI). Même raison que la règle `complete()` dans l'entité : elle vaut d'où qu'on l'appelle.
4. **Le plus coûteux en PHP pur** : l'écouteur (A3) — il aurait fallu modifier `index.php` et penser au `catch` pour les
   erreurs — et la 409 (A4), à câbler dans le `try/catch` global.

Pièges fréquents : priorité de l'écouteur trop basse (pas d'en-tête sur les 404), `strtoupper` au lieu de
`mb_strtoupper` ou d'une regex Unicode (titres accentués), `persist()` inutile avant `flush()` dans `complete()`,
`try/catch` dans le contrôleur au lieu de `#[WithHttpStatus]`.

**Étape 3 — Doctrine & DQL** (cours 2 h max, kata 2 h max)
- Faire le K01 et le K02 ensemble au tableau, puis chacun avance seul. Objectif : K01 → K16 + K20 ; le reste est en bonus.
- Pour chaque kata, exiger de **lire le SQL généré** (`make dql`, profiler, ou `->getQuery()->getSQL()`) : c'est la question n°1 des oraux.
- Débrief collectif de 20 min sur K06 (fetch join), K12 (UPDATE DQL) et K20 (owning side) :
  persist vs flush, owning side, cascade, orphanRemoval, clear().

**Étape 4 — Backlog**
- Au démarrage du backlog, organiser le point de synchronisation sur la sérialisation et sur l'ordre de passage des PR qui touchent `Task`
  (voir « Travailler à 3 sans se marcher dessus » dans le backlog).
- B2-4b (écritures authentifiées) casse les tests des autres : à merger en dernier, accompagner ce merge.
- À mi-parcours du backlog, faites un point : chacun doit avoir son socle mergeable avant l'intégration finale, quitte à abandonner un bonus.

**Front**
- Le dev front n'est pas bloqué par la partie PHP : l'API Symfony respecte déjà le contrat des tâches
  (`make use-symfony`). Rebasculer sur `make use-php` quand l'API PHP pur est intégrée, pour la démo commune.
- Pour F8 à F10 (étape Projet), le pousser à coder contre le contrat avec des données en dur, puis à brancher l'API à la livraison.

## Les revues orales (IA autorisée → compréhension vérifiée)

L'IA n'est jamais interdite : les stagiaires ont pu l'utiliser pour écrire leur code. L'oral vérifie qu'ils ont **lu,
compris et assumé** ce qu'ils ont commité, comme ce sera exigé sur le vrai projet.

Format : **5-10 min par dev**, à la fin des lots (étape 1), après le kata (étape 3) et à la démo finale.

1. Le stagiaire présente son code (2 min), code ouvert, assistant IA fermé pendant l'oral.
2. Trois questions, en s'appuyant sur `questions-comprehension.md` :
   - « **Que fait** cette ligne ? » : choisir la ligne la moins évidente.
   - « **Pourquoi** ce choix plutôt que… ? »
   - « **Que se passe-t-il si…** l'id n'existe pas / le JSON est vide / il y a 10 000 lignes ? »
3. Optionnel : une petite modification en direct (ajouter un critère de filtre, un cas d'erreur).
4. Verdict : ✅ acquis · 🔁 à reprendre (on revoit la notion ensemble et on refait un oral court un peu plus tard, ou après la formation pour le projet).

Signaux d'alerte : incapacité à expliquer un attribut ou une option, code au style très différent du reste,
API ou options qui n'existent pas en Symfony 7.4 / PHP 8.4 (code généré non relu). Relisez la section PR
« Ce que l'IA a produit / ce que j'ai vérifié » avant l'oral.

## Grille d'évaluation (suggestion)

| Critère | Indicateurs | Poids |
|---|---|---|
| **Compréhension** | Oraux réussis, réponses précises aux « pourquoi » et « que se passe-t-il si », quiz ≥ 80 % | ★★★ |
| Idiomatisme | `strict_types`, typage complet, `===`, enums, readonly, attributs ; pas de « C# traduit » | ★★ |
| Maîtrise du framework | Cycle de vie d'une requête, autowiring, persist/flush, owning side, DQL lisible | ★★ |
| Qualité | Tests présents et pertinents, PR petites, migrations propres | ★★ |
| Respect du contrat | `make php-check` / `make sf-check` verts, front fonctionnel sur les deux API | ★ |
| Collaboration | Revues de code utiles, respect de la propriété des fichiers, blocages signalés tôt | ★ |
| Usage de l'IA | Transparent (section PR), code généré relu, testé, adapté aux conventions et aux versions du projet | ★ |

## Formation Vue → PHP · Symfony

Public : devs front **Vue 3** (JS/TS, Pinia, Vue Router, fetch/axios), souvent sans SQL ni back-end. Équipe de **3 devs back**,
pas de dev front dédié : le front React fourni sert seulement à visualiser l'API. Parcours (`docs/vue/`) :
**fondamentaux back-end** (HTTP côté serveur, SQL, sécurité) → PHP (mêmes lots A/B/C) → Symfony → Doctrine & kata → backlog
(mêmes tickets B1/B2/B3) ; brancher un front Vue sur l'API est un bonus.

Budget interne (formateur uniquement, jamais communiqué) : du même ordre que la formation C#, plus l'étape
« Fondamentaux back-end » ; si l'équipe est déjà à l'aise en SQL, cette étape se survole.

**Spécificités d'animation**
- **Le modèle requête / réponse d'abord.** Un dev Vue pense « état » et « réactivité » : il s'attend à ce qu'une variable
  survive entre deux requêtes ou qu'un objet « se mette à jour » tout seul. Faites dessiner le trajet `fetch` → nginx →
  PHP → PostgreSQL → réponse, et insistez : chaque requête repart de zéro, la base est la source de vérité.
- **Insister sur SQL.** C'est souvent le vrai trou. Les exercices E1-E10 de `docs/vue/01-fondamentaux/02-sql-et-bases-relationnelles.md`
  se font sur la vraie base ; faites-en corriger quelques-uns au tableau (`LEFT JOIN` + `COUNT(colonne)`, `HAVING`, pagination sans `ORDER BY`).
- **La validation serveur.** Réflexe front : « le formulaire vérifie déjà ». Faites la démonstration `curl` du cours sécurité
  dès le début, puis exigez des tests qui envoient des données invalides.
- **Filtrer en SQL, pas en PHP.** Piège typique : `findAll()` puis `array_filter()` (l'équivalent d'un `.filter()` côté client).
  À traquer en revue et à l'oral, notamment pour les filtres et la pagination de B3.
- **N+1.** Habitués à « l'objet JSON imbriqué qui arrive tout prêt », ils accèdent aux relations dans une boucle sans voir
  les requêtes. Montrez l'onglet Doctrine du profiler très tôt, puis K06 (fetch join) au débrief du kata.
- **Atelier pratique Symfony** ([sujet](../docs/vue/03-symfony/04-atelier-pratique.md)) : mêmes exercices, mêmes tests
  (`make sf-atelier`), même solution et même minutage que pour la formation C# (voir « Conseils d'animation »). Seules
  les questions de comparaison changent : middleware Express au lieu d'ASP.NET Core, scripts `package.json` au lieu de .NET.
- **Codes HTTP.** Ils les ont consommés, rarement choisis : faire justifier chaque code renvoyé (400 vs 422, 401 vs 403, 404, 409).
- **Sécurité.** Le token et `localStorage` leur sont familiers ; le hash des mots de passe, l'autorisation par ressource
  et les secrets côté serveur beaucoup moins : à vérifier à l'oral du ticket B2.
- PHP lui-même passe bien (syntaxe proche de JS/TS) ; attention aux tableaux PHP copiés **par valeur** (contrairement aux tableaux JS)
  et à `==` vs `===`, qu'ils connaissent mais dont les règles diffèrent.

Questions de compréhension et réponses attendues : `questions-comprehension-vue.md`.

## L'application de formation

`apps/formation` : l'unique lien à envoyer aux stagiaires (cours, parcours, quiz, téléchargements).
L'espace `/formateur` affiche ce guide, `questions-comprehension.md` et `questions-comprehension-vue.md`, et propose le zip de ce dossier (`solutions.zip`).

- **Auth** : vérifiée côté serveur (cookie de session signé, 8 h, limitation des tentatives). Le mot de passe se règle par
  variables d'environnement : `FORMATEUR_PASSWORD_HASH` (recommandé, généré par `make formation-hash p='...'`) ou
  `FORMATEUR_PASSWORD`, plus `SESSION_SECRET` (≥ 32 caractères, obligatoire).
- **Déploiement** : image Docker derrière un reverse proxy HTTPS. Tout est décrit dans
  [apps/formation/README.md](../apps/formation/README.md).
- **Mettre à jour le contenu** (cours, quiz, ce guide) : modifier les fichiers puis reconstruire et redéployer l'image (`make formation-build`).
- En local : `make formation-dev` → http://localhost:5174 (mot de passe `formateur`).

## Vérifications avant la session

**Avant de commencer** : chaque participant fait `make install` sur son poste et vérifie la [checklist](../docs/00-organisation.md#avant-de-commencer-chaque-participant)
(front sur http://localhost:5173, `make sf-check` vert). Envoyez le lien de l'application de formation en même temps.

Sur votre poste :

```bash
make clean && make install    # installation de zéro sur une machine « vierge »
make php-check                # échoue (squelette), sauf /api/health : normal
make php-check-lots           # tout en « … à implémenter » (jaune), aucune erreur fatale
make sf-check && make sf-test # verts
make sf-kata                  # 21 tests en erreur « TODO Kxx » : normal (squelettes)
make front-lint               # vert
make formation-build && make formation-run   # l'app de formation démarre sur :3000, login formateur OK
```

Et une fois, pour valider les solutions : copier `solutions/api-php` (cf. ci-dessus) → `make php-check-lots` + `make php-check` verts ;
copier `solutions/doctrine-kata` → `make sf-kata` 21/21.
