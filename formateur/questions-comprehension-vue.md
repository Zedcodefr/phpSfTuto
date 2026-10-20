# Questions de compréhension — formation Vue → PHP · Symfony

> Document **formateur**. Il est servi uniquement derrière l'authentification de l'app de formation (`/formateur`).
> Les stagiaires voient les questions (fin de chaque page de cours, rubrique « à savoir expliquer à l'oral »),
> jamais les réponses ci-dessous.

## Mode d'emploi

**Quand ?** Questions ouvertes des cours pendant les débriefs de fin de cours, puis revues orales
à la fin des lots (étape 2 — PHP), après le kata (étape 4 — Doctrine) et à la démo finale — voir la [dernière partie](#revues-orales-de-lot--ticket--kata--bonus-front).

**Comment ?** Un échange court par dev (repère formateur : 5 à 10 minutes), écran partagé sur **son propre code**, assistant IA fermé **pendant l'oral**.
Avoir utilisé l'IA pour écrire le code est normal et autorisé : ce qu'on vérifie, c'est que le dev a lu, compris
et sait défendre ce qu'il a commité.
Le dev explique, le formateur relance. On ne cherche pas la réponse « de cours » mot pour mot : on cherche à savoir
si le dev **comprend ce qu'il a écrit** et sait le relier aux notions.

- 3 ou 4 questions par séance suffisent : choisissez celles qui touchent au code que le dev a réellement produit.
- Commencez toujours par « montre-moi » : la réponse doit s'appuyer sur une ligne de code précise.
- Utilisez la **relance** quand la première réponse est correcte mais récitée : c'est elle qui fait la différence.
- Les **signaux d'alerte** listent ce qui trahit une compréhension superficielle ou un code d'IA commité
  sans avoir été lu (cf. [charte IA](../docs/00-charte-ia.md)). Le problème n'est jamais l'usage de l'IA, c'est de ne pas savoir expliquer.

**Barème** (par question, puis une appréciation globale par séance) :

| Niveau | Critère | Suite |
|---|---|---|
| ✅ **Acquis** | Explication juste, appuyée sur le code, répond à la relance | Rien |
| 🟡 **À consolider** | Juste dans l'ensemble mais hésitant, ou relance ratée | Relire la section du cours, une question de rattrapage au point suivant |
| ❌ **Non acquis** | Ne sait pas expliquer son propre code, contresens | Reprise en binôme (pair programming) sur le passage concerné, nouvelle revue avant de merger |

Règle d'équipe suggérée : une PR dont l'auteur obtient « non acquis » sur son propre code n'est **pas mergée**
avant une nouvelle explication réussie.

Sommaire

1. [Le back-end et HTTP](#le-back-end-et-http)
2. [SQL et bases relationnelles](#sql-et-bases-relationnelles)
3. [Sécurité côté serveur](#sécurité-côté-serveur)
4. [PHP — principes](#php--principes)
5. [PHP — grammaire](#php--grammaire)
6. [PHP & HTTP](#php--http)
7. [Symfony — principes](#symfony--principes)
8. [Symfony — particularités](#symfony--particularités)
9. [Doctrine — ORM & mapping](#doctrine--orm--mapping)
10. [Doctrine — relations](#doctrine--relations)
11. [Doctrine — DQL & QueryBuilder](#doctrine--dql--querybuilder)
12. [Revues orales de lot / ticket / kata / bonus front](#revues-orales-de-lot--ticket--kata--bonus-front)

---

## Le back-end et HTTP

### 1. Le trajet d'un `fetch` POST, du composant Vue au `push`

**Attendu**
- Le composant appelle `fetch('/api/tasks', { method: 'POST', body: JSON.stringify(...) })` ; en développement, le proxy Vite relaie la requête HTTP vers le serveur.
- nginx reçoit la requête : ce n'est pas un fichier statique, il la confie à PHP-FPM, qui exécute `public/index.php`.
- Le code back lit la requête (méthode, chemin, corps), route `POST /api/tasks` vers le contrôleur, valide le JSON (`400` si illisible, `422` si invalide), fait l'`INSERT` dans PostgreSQL, construit la réponse.
- Réponse `201 Created` + en-tête `Location` + JSON de la tâche créée ; le front fait `tasks.value.push(await response.json())`.
- Tout ce qui se passe entre le `fetch` et la réponse est du code back ; la vérité est dans PostgreSQL, `tasks.value` n'est qu'une copie.

**Signaux d'alerte** : pense que le proxy Vite fait partie de la production ; oublie la validation ; croit que le `push` côté front « enregistre » la tâche.

**Relance** : « D'où viennent l'`id` et le `createdAt` de la tâche que tu pousses dans `tasks.value` ? » → générés par le serveur / la base, renvoyés dans la réponse.

### 2. Choisir le bon code HTTP

**Attendu**
- `{title:` → `400` : le serveur ne peut même pas lire le corps.
- Titre vide → `422` : JSON lisible mais données invalides, avec `violations[]` pour afficher l'erreur sous le bon champ.
- Pas de token → `401` : « qui êtes-vous ? ».
- Suppression de la tâche d'un autre → `403` : « je sais qui vous êtes, mais non ».
- Suppression d'un projet qui contient encore des tâches → `409` : règle métier violée par l'état actuel.
- Le code HTTP porte le résultat, le corps porte le détail ; jamais de `200` avec `{ "success": false }`.

**Signaux d'alerte** : confond 400 et 422, ou 401 et 403 ; propose de tout renvoyer en 200 ou en 500.

**Relance** : « Et `PUT /api/tasks/1`, alors que `GET /api/tasks/1` marche ? » → `405` : la route existe, pas cette méthode. « Et un bug non prévu ? » → `500`, toujours la faute du serveur.

### 3. Sans état : pas de Pinia côté serveur

**Attendu**
- Un store Pinia vit en mémoire tant que l'onglet est ouvert ; un serveur HTTP ne garde rien entre deux requêtes (en PHP, le script repart de zéro à chaque fois).
- Chaque requête reprouve qui elle est (token dans `Authorization`) ; la liste des tâches est relue en base à chaque `GET` ; une variable globale PHP est vide à la requête suivante.
- La base de données est la source de vérité : tout ce qui doit survivre va en base (ou dans un cache explicite).
- Deux requêtes peuvent arriver en même temps : on ne peut pas compter sur l'ordre des clics.
- Conséquence côté infrastructure : on peut lancer plusieurs serveurs derrière un répartiteur de charge, n'importe lequel peut répondre.

**Signaux d'alerte** : propose de garder l'utilisateur connecté dans une variable globale ou statique ; pense que le serveur « se souvient » du client.

**Relance** : « Que se passe-t-il si l'utilisateur double-clique sur « Créer » ? » → deux `POST`, deux tâches : `POST` n'est pas idempotent, c'est un vrai sujet côté back.

### 4. Le contrat d'API comme frontière

**Attendu**
- C'est l'accord entre le front et le back : conventions (préfixe `/api`, `camelCase`, dates ISO 8601, liste = tableau brut), format des erreurs (`status`, `detail`, `violations[].propertyPath` / `title`), objets et leurs règles, endpoints avec leurs codes possibles.
- Cette fois, c'est le dev back qui le tient : le front fourni s'appuie dessus.
- Les règles des champs (`title` 3 à 255 caractères…) deviennent la validation serveur.
- Une ambiguïté ne s'interprète pas en silence : on la remonte et le contrat est corrigé.
- `make php-check` / `make sf-check` vérifient automatiquement chaque ligne du tableau des endpoints.

**Signaux d'alerte** : considère le contrat comme une documentation indicative ; « corrige » un nom de champ sans prévenir.

**Relance** : « Pourquoi le format des erreurs avec `propertyPath` est-il important pour le front ? » → pour afficher l'erreur sous le bon champ du formulaire.

---

## SQL et bases relationnelles

### 1. Découper un JSON imbriqué en tables

**Attendu**
- Tableau d'objets → table ; objet → ligne ; propriété → colonne avec un type fixe.
- `author: {...}` → table `kata_author`, reliée par la clé étrangère `kata_book.author_id` (relation 1-N, clé côté « plusieurs »).
- `tags: [...]` → table `kata_tag` + table de jointure `kata_book_tag(book_id, tag_id)` (relation N-N).
- Pas de colonne JSON : renommer une étiquette oblige à réécrire toutes les lignes, chercher « aventure » oblige à décoder chaque ligne (pas d'index efficace), impossible de garantir que l'étiquette existe ou de compter proprement ; dupliquer le nom de l'auteur crée « deux » auteurs à la moindre faute de frappe.
- Règle : chaque information est stockée à un seul endroit, reliée par des clés.

**Signaux d'alerte** : met la clé étrangère du côté « un » (liste d'ids dans l'auteur) ; ne connaît pas la table de jointure.

**Relance** : « Et une relation 1-1, un utilisateur et son profil ? » → clé sur l'une des deux tables, avec `UNIQUE`.

### 2. `INNER JOIN`, `LEFT JOIN` et `COUNT(b.id)`

**Attendu**
- `INNER JOIN` ne garde que les correspondances : un auteur sans livre (Margaret Atwood) disparaît.
- `LEFT JOIN` depuis `kata_author` garde toutes les lignes de gauche, avec `NULL` côté livre quand il n'y a pas de correspondance.
- `GROUP BY a.id, a.name` : une ligne de résultat par auteur.
- `COUNT(*)` compte la ligne du `LEFT JOIN` remplie de `NULL` → Atwood aurait 1 ; `COUNT(b.id)` ignore les `NULL` → 0.

**Signaux d'alerte** : écrit `JOIN` et ne voit pas qu'Atwood manque ; ne sait pas expliquer pourquoi `COUNT(*)` donne 1.

**Relance** : « Comment trouver les livres sans aucune critique ? » → `LEFT JOIN kata_review ... WHERE r.id IS NULL`, ou `NOT EXISTS (...)`. « Et pour ne garder que les auteurs d'au moins 2 livres ? » → `HAVING`, qui filtre les groupes (WHERE filtre les lignes).

### 3. Travailler en base, et les index

**Attendu**
- Pour la même raison qu'on ne télécharge pas un million de lignes dans le navigateur pour faire un `.filter()` : la base a des index, ne transfère que le résultat et le fait beaucoup plus vite.
- Correspondances : `WHERE` ≈ `filter`, `ORDER BY` ≈ `sort`, `LIMIT/OFFSET` ≈ `slice`, agrégats ≈ `reduce`, `JOIN` ≈ un `.find()` dans un autre tableau.
- Un index est une structure (souvent un arbre) qui permet de trouver des lignes sans lire toute la table, comme l'index d'un livre ; clés primaires et étrangères en ont un.
- Coût : chaque écriture doit aussi mettre l'index à jour → on indexe ce qui est lu souvent (colonnes filtrées ou triées : `status`, `email`…), pas tout.

**Signaux d'alerte** : propose de charger la table puis de filtrer en PHP « pour simplifier » ; pense qu'un index n'a aucun coût.

**Relance** : « Comment vérifier qu'une requête utilise un index ? » → `EXPLAIN SELECT ...;` dans psql. « Pourquoi un `ORDER BY` est-il obligatoire pour paginer ? » → sans lui l'ordre n'est pas garanti, les pages seraient incohérentes.

### 4. Transactions et ACID

**Attendu**
- Une transaction regroupe plusieurs écritures qui réussissent toutes ou aucune : `BEGIN` … `COMMIT` (ou `ROLLBACK`).
- Exemple du cours : un virement entre deux comptes ; sans transaction, une panne entre les deux `UPDATE` fait disparaître l'argent. Dans TaskBoard : créer une tâche, mettre à jour un compteur et journaliser de façon cohérente.
- Atomicité (tout ou rien), Cohérence (les contraintes sont respectées à la fin), Isolation (deux transactions simultanées ne se voient pas à moitié faites), Durabilité (un `COMMIT` confirmé survit à un crash).
- Doctrine ouvre une transaction à chaque `flush()`.

**Signaux d'alerte** : compare à un `Promise.all` sans voir que la base annule en bloc même si le serveur s'arrête ; ne sait pas ce que fait `ROLLBACK`.

**Relance** : « Dans le bonus psql, après `BEGIN; DELETE FROM task;` puis `ROLLBACK;`, que vois-tu ? » → les tâches sont revenues.

---

## Sécurité côté serveur

### 1. Le back, seul endroit où la sécurité est réelle

**Attendu**
- Le code Vue tourne dans le navigateur de l'utilisateur : il peut l'ouvrir dans les DevTools, le modifier, ou ne pas l'utiliser du tout.
- Exemple : `curl -X POST /api/tasks -d '{"title":"", "status":"nimporte"}'` contourne le formulaire ; sans validation serveur, la tâche invalide entre en base. L'API répond `422` avec les violations.
- Validation front = confort ; validation back = garantie. Masquer un bouton ne suffit pas : on vérifie les droits à chaque requête ; on ignore ou refuse les champs non modifiables (`id`, `createdAt`, `author`).
- Les types TypeScript sont effacés à l'exécution : tout ce qui vient de la requête (corps, URL, en-têtes, cookies) est hostile.

**Signaux d'alerte** : pense que TypeScript ou le formulaire garantit la forme des données reçues ; propose de valider seulement côté front « pour éviter la duplication ».

**Relance** : « Le client envoie `"createdAt": "2000-01-01"` dans un `PATCH`. Que fait le serveur ? » → il l'ignore ou le refuse : ce champ n'est pas modifiable par le client.

### 2. Injection SQL et requêtes préparées

**Attendu**
- Concaténation : `"... WHERE title LIKE '%$search%'"` ; avec `' OR 1=1 --`, la requête devient `LIKE '%' OR 1=1 --%'` → toute la table. D'autres valeurs permettent de lire d'autres tables, voire de modifier ou supprimer des données.
- Requête préparée : la requête et les valeurs voyagent séparément (`prepare` + `execute(['search' => ...])`) ; la valeur ne peut jamais devenir du SQL.
- Parallèle : « jamais de `v-html` avec une donnée utilisateur » → une donnée ne doit jamais être interprétée comme du code.
- Doctrine le fait via `setParameter()`, à condition de ne pas concaténer de valeur dans le DQL non plus.

**Signaux d'alerte** : pense qu'échapper les apostrophes à la main suffit ; croit que l'injection SQL concerne aussi l'affichage Vue.

**Relance** : « Et le XSS, alors, de quel côté se protège-t-on ? » → à l'affichage (`{{ }}` échappe, `v-html` non) ; le back renvoie du JSON en `application/json` et ne nettoie pas le texte en base.

### 3. De la connexion au `DELETE`

**Attendu**
- Inscription : le mot de passe est stocké hashé (`password_hash`, bcrypt / Argon2id : lent exprès, sel intégré), jamais en clair ni chiffré de façon réversible, jamais renvoyé dans le JSON.
- Connexion : `password_verify`, puis création d'un token aléatoire enregistré en base avec une date d'expiration, renvoyé au client ; message d'erreur unique (pas « email inconnu » vs « mot de passe faux »).
- Requêtes suivantes : `Authorization: Bearer <token>` ; à chaque requête le serveur retrouve le token, vérifie qu'il n'a pas expiré, charge l'utilisateur. L'utilisateur courant est déduit du token, jamais d'un `userId` envoyé par le client.
- `401` : pas de token, invalide ou expiré. `403` : utilisateur identifié mais sans droit sur CETTE tâche (Bob sur la tâche d'Alice) ; dans Symfony, un voter.

**Signaux d'alerte** : propose `md5`/`sha256` ; vérifie seulement qu'on est connecté, pas que la ressource appartient à l'utilisateur ; fait confiance au `userId` du corps.

**Relance** : « Pourquoi md5 ou sha256 ne suffisent-ils pas ? » → bien trop rapides : des milliards d'essais par seconde. « Session + cookie ou token Bearer : quel risque principal pour chacun ? » → CSRF pour le cookie, vol du token (XSS qui lit `localStorage`) pour le Bearer.

### 4. CORS et secrets `VITE_*`

**Attendu**
- CORS est appliqué par le navigateur (preflight `OPTIONS`, réponse `Access-Control-Allow-Origin`) sur décision du serveur ; `curl` ou un autre serveur l'ignorent totalement : ce n'est pas une protection de l'API. La protection, ce sont l'authentification et l'autorisation côté serveur.
- On liste les origines précises, jamais `*` avec des cookies ; dans le projet, le proxy Vite évite CORS en développement.
- Les variables `VITE_*` sont copiées dans le bundle JS : tout le monde peut les lire. Un secret vit côté serveur (`%env(...)%`, `.env.local` ignoré par Git, variables d'environnement, coffre `secrets:set` en production), et l'appel au service tiers passe par le back.
- Un secret déjà exposé (commit, capture, conversation avec une IA) est compromis : on le change.

**Signaux d'alerte** : pense que CORS bloque les appels de scripts ou de `curl` ; pense qu'un `.env` non commité suffit à protéger une variable `VITE_*`.

**Relance** : « Et en production, que doit contenir une réponse 500 ? » → un message générique ; la trace et `$e->getMessage()` partent dans les logs, jamais dans la réponse.

---

## PHP — principes

### 1. Serveur Express qui tourne en continu vs PHP-FPM

**Attendu**
- Node : **un** process lancé une fois (`node server.js`), qui garde sa mémoire ; toutes les requêtes passent par la même boucle d'événements et partagent les mêmes variables.
- PHP : nginx transmet la requête à PHP-FPM via FastCGI ; un worker libre exécute `public/index.php` **depuis zéro** (autoload, création des objets, connexion à la base), produit la réponse, puis **tout est libéré**. Le worker attend la requête suivante.
- Le parallélisme vient du **pool de workers**, pas d'`async`/`await` : chaque worker traite une requête à la fois, de façon synchrone.
- Avec `php -S` (API PHP pur) : un seul processus fait serveur web et exécution ; jamais en production.
- OPcache garde les fichiers compilés (opcodes), pas les données ni les objets.

**Signaux d'alerte** : parle d'un « démarrage de l'application » une seule fois, de variables partagées entre utilisateurs ; pense qu'il faut `await` les appels à la base ; confond OPcache et cache de données.

**Relance** : « Une exception non attrapée dans une requête, que devient-elle en Node et en PHP ? » → en Node elle peut faire tomber le process (donc tout le monde) ; en PHP, seule cette requête échoue (500).

### 2. Résultat mémorisé entre deux requêtes et tâche de nettoyage régulière

**Attendu**
- En Node : une `Map` au niveau du module (ou un singleton) pour le cache, un `setInterval()` pour la tâche régulière.
- En PHP : la mémoire est libérée à chaque fin de requête ; une variable `static` ou globale ne vit que le temps d'une requête, et aucun process ne tourne entre deux requêtes pour exécuter un `setInterval`.
- À la place : un stockage externe pour le cache (APCu, Redis, fichiers, base, ou le composant Cache de Symfony) ; pour la tâche de fond, un `cron` qui lance une commande console, ou une file de messages (Symfony Messenger).

**Signaux d'alerte** : propose `static`, une session ou une variable globale ; ne sait citer aucune alternative.

**Relance** : « Avec trois serveurs derrière un load balancer, APCu suffit-il ? » → non, APCu est local à une machine : Redis (ou la base).

### 3. Où est `App\Validation\TaskValidator` et différence avec un `import` ES

**Attendu** : fichier `src/Validation/TaskValidator.php` (PSR-4 `App\` → `src/`, un segment de namespace = un dossier, nom du fichier = nom de la classe, casse comprise). Au premier `new TaskValidator()`, PHP ne connaît pas la classe : il appelle l'autoloader enregistré par `vendor/autoload.php`, qui calcule le chemin et fait un `require` du fichier. En ES, `import` désigne un **fichier** et le module est chargé à l'import ; en PHP, `use` n'importe qu'un **nom** et ne charge rien, le chargement a lieu au premier usage. Pas d'`export` : toute classe est accessible depuis partout.

**Signaux d'alerte** : pense qu'il faut un `require` manuel, ou un `composer dump-autoload` après chaque nouvelle classe (inutile avec PSR-4) ; croit que `use` exécute le fichier.

**Relance** : « Tu renommes la classe sans renommer le fichier : que se passe-t-il ? » → « Class not found » : l'autoloader cherche un fichier qui n'existe pas.

### 4. `declare(strict_types=1)` comparé à TypeScript

**Attendu**
- TypeScript vérifie à la compilation puis efface les types : une donnée externe qui ment (`JSON.parse`, `as`) passe en production.
- PHP vérifie les types à l'exécution, à chaque appel ; avec `strict_types=1`, aucune conversion implicite des scalaires (`"5"` n'est plus accepté pour un `int`) : `TypeError` immédiate. Sans lui, PHP convertit silencieusement, comme JavaScript.
- Directive **par fichier**, qui s'applique aux appels émis depuis ce fichier : d'où sa présence en tête de chaque fichier.
- Exemple attendu dans le code : l'id de route arrive en `string` et doit être converti `(int)` avant `find(int $id)` ; une ligne PDO renvoie `'id' => '7'` ; un JSON `"title": 123`.

**Signaux d'alerte** : pense que c'est global, ou que ça type les variables locales ; pense que PHP vérifie les types avant l'exécution comme `tsc`.

**Relance** : « Qu'est-ce qui détecte une erreur de type dans une branche jamais exécutée ? » → PHPStan (≈ `tsc --noEmit`), pas PHP lui-même.

---

## PHP — grammaire

### 1. Array vs objet à l'affectation et en paramètre, comparé à JS

**Attendu** : en JS, tableaux et objets sont partagés (deux variables pointent vers la même donnée). En PHP, un `array` est **copié** à l'affectation et au passage en argument (copy-on-write : la copie réelle n'a lieu qu'à la modification) ; un objet est partagé comme en JS. Une fonction qui modifie un tableau reçu doit donc le **renvoyer**. Dans le code : le repository renvoie des `Task` (objets) que le contrôleur modifie avant `save()` ; les tableaux de données JSON ou les lignes PDO sont copiés.

**Signaux d'alerte** : « les arrays sont passés par référence comme en JS » ; utilise `&` partout « pour être sûr ».

**Relance** : « Dans `InMemoryTaskRepository`, pourquoi des `clone` ? » → sinon le contrôleur modifierait l'objet stocké sans passer par `save()`, et le faux repository ne se comporterait pas comme la base.

### 2. Une closure de son code, comparée à une arrow function JS

**Attendu** : `fn` capture automatiquement les variables utilisées, **par valeur**, au moment de sa création ; `function () use ($x)` ne voit que ce qui est listé dans `use`, par valeur aussi (`use (&$x)` pour une référence). En JS, une closure capture la variable elle-même : elle voit sa valeur actuelle. `fn` ne contient qu'une expression ; `$this` est lié automatiquement dans une méthode (pas de `bind`).

**Signaux d'alerte** : ne sait pas ce qui est capturé ; pense qu'une modification ultérieure de la variable est vue par la closure ; écrit une `function` sans `use` et ne comprend pas le warning « Undefined variable ».

**Relance** : `$x = 1; $f = fn () => $x; $x = 2; echo $f();` → 1 (en JS : 2).

### 3. « Clé absente » vs « clé à null » dans un corps JSON

**Attendu** : `isset($data['k'])` vaut `false` si la clé est absente **ou** vaut `null` ; `array_key_exists('k', $data)` dit seulement si la clé est présente (≈ `'k' in body`) ; `$data['k'] ?? 'défaut'` donne une valeur par défaut sans warning. Pour un PATCH, `{"description": null}` signifie « effacer », une clé absente signifie « ne pas toucher » : il faut `array_key_exists()`. Lire une clé absente sans `??` provoque un warning (pas d'`undefined` en PHP).

**Signaux d'alerte** : utilise `isset()` pour tout ; ne voit pas de différence entre absent et `null` ; cherche un équivalent d'`undefined`.

**Relance** : « Et `if ($data['title'])` pour vérifier que le titre est rempli ? » → warning si la clé manque, et un titre `'0'` serait considéré comme vide (falsy en PHP).

### 4. Constructor promotion et `readonly`, comparés à TypeScript

**Attendu** : comme `constructor(public readonly id: number)` en TS, la promotion déclare la propriété **et** l'affecte depuis le paramètre, en une seule ligne. `readonly` : affectable une seule fois (depuis la classe) ; toute modification ultérieure lève une `Error` **à l'exécution** (en TS, seul le compilateur le refuse). Sur `JsonResponse`, les autres lots peuvent lire `$response->status` mais pas le modifier. `Task` n'est pas entièrement readonly car le contrôleur modifie titre et statut ; son `id` l'est.

**Signaux d'alerte** : pense que `readonly` est une simple indication pour l'éditeur ; ne sait pas que la propriété existe sans être déclarée séparément.

**Relance** : « Que se passe-t-il si tu lis une propriété typée jamais initialisée ? » → une `Error`, pas `undefined`.

---

## PHP & HTTP

### 1. Le trajet d'un `POST /api/tasks`, comparé à Express

**Attendu**
- Le serveur web envoie toutes les requêtes vers `public/index.php` (front controller), exécuté de zéro ; pas de `listen()`, pas de routes enregistrées une fois pour toutes.
- `Request::fromGlobals()` lit les superglobales (`$_SERVER['REQUEST_METHOD']`, le chemin via `parse_url`, `$_GET`) ≈ objet `req`.
- Création de la connexion, du repository, du contrôleur ; enregistrement des routes ; `$router->dispatch($request)` trouve la route ≈ `app.post(...)`.
- Le contrôleur lit le corps avec `Request::json()` (`php://input` + `json_decode` ≈ `express.json()`), valide (`TaskValidator`), crée la `Task`, appelle `save()` (INSERT … RETURNING).
- Il renvoie `new JsonResponse($task, 201, ['Location' => ...])` ; `send()` écrit le code, les en-têtes, puis un seul `echo json_encode(...)` ≈ `res.status(201).json(task)`. `jsonSerialize()` donne la forme publique.
- Le `try`/`catch` autour du dispatch joue le rôle du middleware d'erreur Express.

**Signaux d'alerte** : ne sait pas où est lu le corps ; pense que `$_POST` contient le JSON ; place un `echo` avant les en-têtes.

**Relance** : « Pourquoi le `Location` doit-il partir avant le `echo` ? » → une fois le corps commencé, les en-têtes sont envoyés (« headers already sent »).

### 2. JSON invalide, puis JSON valide avec un titre vide

**Attendu**
- JSON invalide : `json_decode(..., flags: JSON_THROW_ON_ERROR)` lève une `\JsonException`, convertie en `HttpException(400)` ; le front controller la transforme en réponse JSON 400. Sans le flag, `json_decode` renverrait `null` en silence.
- Titre vide : le JSON est valide, c'est `TaskValidator` qui produit une erreur par champ ; une `ValidationException` donne une réponse 422 avec le détail des champs en erreur, au format du contrat.
- Le dev montre les lignes de code concernées et le JSON renvoyé.

**Signaux d'alerte** : confond 400 et 422 ; ne sait pas où est levée l'exception ni qui la convertit en réponse ; laisse passer `null` comme si c'était un tableau.

**Relance** : « Et un corps JSON valide mais qui est une liste `[1, 2]` au lieu d'un objet ? » → doit aussi être refusé (400), pas planter en 500.

### 3. Requêtes préparées partout

**Attendu** : avec une requête préparée, le SQL et les valeurs voyagent séparément jusqu'à la base : une valeur ne peut jamais devenir du SQL. Exemple d'attaque : `$title = "x' OR '1'='1"` dans une requête concaténée renvoie toutes les lignes ; pire, une valeur peut terminer la requête et en ajouter une autre. C'est le même problème qu'une requête `pg` construite par template literal. Règle : toute valeur venant de l'extérieur passe par un paramètre `:nom`.

**Signaux d'alerte** : pense que `addslashes()` ou un échappement manuel suffit ; ne sait pas pourquoi `ORDER BY :sort` ne fonctionne pas.

**Relance** : « Comment trier selon `?sort=title` alors qu'on ne peut pas paramétrer un nom de colonne ? » → liste blanche (`match` sur des valeurs autorisées), jamais la valeur reçue directement.

### 4. Paramètres de route et distinction 404 / 405

**Attendu**
- Le motif `/api/tasks/{id}` est transformé en regex `#^/api/tasks/(?<id>\d+)$#` (groupe nommé, `^`/`$` pour tout le chemin, `\d+` pour les chiffres) ; `preg_match` remplit `$matches` avec les groupes numérotés **et** nommés ; on garde les clés string pour obtenir l'équivalent de `req.params`, puis on les passe au handler en arguments nommés.
- Pour chaque route : si le chemin correspond **et** la méthode aussi → handler ; si le chemin correspond mais pas la méthode → on le retient ; à la fin, chemin trouvé sans méthode → 405, aucun chemin → 404.

**Signaux d'alerte** : renvoie 404 dès que la première route ne correspond pas ; ne sait pas ce que contient `$matches` ; oublie `^` et `$`.

**Relance** : « Sans `^` et `$`, que se passe-t-il pour `/api/tasks/42/extra` ? » → la route serait acceptée à tort.

---

## Symfony — principes

### 1. Le trajet d'un `POST /api/tasks` dans Symfony

**Attendu**
- nginx → PHP-FPM → `public/index.php` → `Kernel::handle($request)`.
- `kernel.request` : routing (quelle route ?) et sécurité (qui est-ce ?) ≈ middlewares Express, `router.beforeEach` de Vue Router.
- `kernel.controller` puis `kernel.controller_arguments` : résolution des arguments ; `#[MapRequestPayload]` désérialise le JSON en DTO puis le valide (422 sinon) ; `{id}` peut devenir une entité (404 sinon).
- Le contrôleur fait le métier (persist / flush) et renvoie `$this->json($task, 201)` : le Serializer normalise via les getters puis encode en JSON.
- `kernel.response` (dernières retouches), envoi, `kernel.terminate`, puis PHP détruit tout. En cas d'exception : `kernel.exception` → JSON problem details ≈ middleware d'erreur Express / `app.config.errorHandler`.
- Comparaison Vue : comme les hooks de cycle de vie d'un composant, on branche du code à des moments précis, mais rien ne « vit » après la réponse.

**Signaux d'alerte** : ne sait pas où a lieu la validation ; pense que les routes sont enregistrées au démarrage d'un serveur ; ignore `kernel.exception`.

**Relance** : « Où intervient le 422 si le titre est vide ? » → pendant la résolution des arguments, avant l'entrée dans le contrôleur.

### 2. Ce qui remplace chaque fichier de l'API PHP pur

**Attendu**
- `index.php` → `public/index.php` + `Kernel` (front controller fourni).
- `Router` → composant Routing + attributs `#[Route]`.
- `Request` / `JsonResponse` → `HttpFoundation` (`Request`, `JsonResponse`, `$this->json()`).
- `HttpException` → exceptions HTTP de Symfony (`createNotFoundException()`, `ConflictHttpException`…) + `kernel.exception` / problem details.
- `Connection` → DBAL / Doctrine, configuré par `DATABASE_URL`.
- `TaskRepository` → repository Doctrine (`ServiceEntityRepository`) + `EntityManager`.
- `TaskValidator` → Validator + contraintes `#[Assert\…]` sur un DTO, via `#[MapRequestPayload]`.
- `Task::jsonSerialize()` → Serializer (getters, groupes ou DTO de sortie).
- Le câblage à la main dans `index.php` → conteneur de services + autowiring.

**Signaux d'alerte** : ne fait aucun lien entre les deux projets ; pense que Symfony « fait autre chose » que ce qu'il a écrit à la main.

**Relance** : « Qu'est-ce qui remplace ton `try`/`catch (\Throwable)` final ? » → `kernel.exception` et le rendu problem details.

### 3. L'autowiring expliqué à partir de `provide` / `inject`

**Attendu** : en Vue, un parent fait `provide('api', apiClient)` et un enfant `inject('api')` ; dans Symfony, le conteneur « fournit » toutes les classes de `src/` (règle `App\: resource: '../src/'`) et une classe « injecte » en déclarant un paramètre typé dans son constructeur. Le conteneur lit les types et construit les dépendances (autowiring), sans décorateur. Un service est partagé (une instance) **pendant une requête**, puis tout est reconstruit : ce n'est pas un store Pinia, un tableau en propriété est vide à chaque requête ; l'état durable est en base. Avec deux implémentations d'une interface : un alias (`#[AsAlias]`).

**Signaux d'alerte** : pense qu'il faut enregistrer chaque service à la main ; croit qu'un service garde son état entre deux requêtes ; utilise `$container->get(...)` dans le code applicatif.

**Relance** : « Comment vérifier ce que le conteneur injecte pour `LoggerInterface` ? » → `make sf c="debug:autowiring Logger"`.

### 4. Une clé d'API secrète : où et comment

**Attendu** : jamais dans une variable `VITE_*` : tout ce qui est `VITE_*` est intégré au bundle JavaScript, lisible par n'importe quel visiteur. Côté Symfony : valeur par défaut (factice) dans `.env` commité, vraie valeur dans `.env.local` (non commité) ou, en production, en vraie variable d'environnement / secret Symfony. Chemin : variable d'environnement → `%env(API_KEY)%` dans `config/services.yaml` (ou `#[Autowire(env: 'API_KEY')]`) → paramètre du constructeur du service. Lue à l'exécution, pas au build.

**Signaux d'alerte** : commite la vraie clé dans `.env` ; la fait transiter par le front ; ne sait pas comment une valeur d'env arrive dans un service.

**Relance** : « La valeur ne change pas après modification du `.env`, que fais-tu ? » → `make sf-cc`, puis `debug:dotenv` pour voir d'où vient la valeur.

---

## Symfony — particularités

### 1. Lire le `git diff` après un `composer require`

**Attendu** : comme `npm install`, Composer met à jour `composer.json` / `composer.lock` et `vendor/`. Mais Flex applique en plus une **recette** qui modifie le projet : bundle ajouté dans `config/bundles.php`, nouveau fichier `config/packages/xxx.yaml`, variables ajoutées dans `.env` entre des balises `###> paquet ###`, parfois des fichiers dans `src/`, et `symfony.lock` mis à jour (à commiter). Lire le diff, c'est comprendre ce que le bundle configure (≈ `vue add` / `nuxi module add`). `composer remove` déroule la recette à l'envers.

**Signaux d'alerte** : ne regarde jamais le diff ; ne sait pas ce qu'est `symfony.lock` ; s'étonne d'une config qu'il n'a « pas écrite ».

**Relance** : « Une recette n'existe pas pour un bundle : que fais-tu ? » → le brancher soi-même dans `config/bundles.php` et écrire sa configuration.

### 2. Références circulaires : groupes ou DTO de sortie

**Attendu** : `Task` → `project` → `tasks` → `project`… le Serializer boucle, exactement comme `JSON.stringify` sur une structure circulaire. Deux solutions : les **groupes** (`#[Groups(['task:read'])]` sur les getters exportés, sans le groupe sur `Project::getTasks()` ; ne pas oublier `id`), ou un **DTO de sortie** (`TaskOutput::fromEntity($task)`), plus de code mais un contrat explicite, comme un type `TaskDto` construit à la main en TS. Justification attendue du choix d'équipe, appliqué de façon cohérente.

**Signaux d'alerte** : a ajouté `#[Ignore]` au hasard jusqu'à ce que ça passe ; ne sait pas que seuls les attributs du groupe sont exportés ; mélange les deux approches sans raison.

**Relance** : « Pourquoi `id` a-t-il disparu du JSON après l'ajout des groupes ? » → les groupes fonctionnent en liste blanche : `getId()` doit porter le groupe.

### 3. PATCH avec `null` explicite

**Attendu** : avec un DTO dont tous les champs valent `null` par défaut, « clé absente » et « `null` explicite » donnent la même valeur : l'information est perdue. En JS, `'description' in body` suffirait. Solutions : regarder les clés du JSON brut (`array_key_exists` sur `$request->toArray()`), un DTO qui mémorise les champs fournis, ou désérialiser avec `OBJECT_TO_POPULATE` sur un objet pré-rempli (≈ `Object.assign(currentValues, body)`). Le dev justifie celle qu'il a retenue.

**Signaux d'alerte** : ne voit pas le problème ; utilise `""` sans savoir que c'est un contournement ; teste `isset()`.

**Relance** : « Et pour `"projectId": null`, qui doit détacher une tâche de son projet ? » → même problème ; `array_key_exists` puis `assignTo(null)`.

### 4. « La validation et le `v-if` du front suffisent »

**Attendu** : le front n'est qu'un client parmi d'autres : n'importe qui peut appeler l'API avec `curl`. Le `v-if="isAdmin"` cache un bouton, il ne protège rien ; la validation vee-validate est un confort pour l'utilisateur. La protection est côté serveur : contraintes `#[Assert\…]` sur le DTO (422 avec `violations`), `access_control` / `#[IsGranted]` / voter. Codes : non authentifié → 401, authentifié mais refusé → 403, données invalides → 422. Le dev montre les lignes de son code qui protègent réellement.

**Signaux d'alerte** : pense que l'API n'est appelée que par le front ; confond 401 et 403 ; ne sait pas montrer où est faite la vérification côté serveur.

**Relance** : « Comment vérifier que seul l'auteur peut supprimer SA tâche ? » → un voter (`TASK_DELETE`) qui inspecte l'objet, appelé via `#[IsGranted('TASK_DELETE', 'task')]`.

---

## Doctrine — ORM & mapping

### 1. L'EntityManager n'est pas un store Pinia

**Attendu** : ce qui est juste : il garde en mémoire les entités chargées ou confiées, une seule copie par id (Identity Map ≈ store normalisé `entities[id]`), partagé par tous les services **de la même requête**. Ce qui est faux : il n'est **pas réactif** (modifier une entité ne fait rien avant `flush()`), il **naît et meurt avec chaque requête HTTP** (share nothing), il n'est jamais partagé entre deux requêtes ni deux utilisateurs, et la source de vérité est **la base**, pas lui (c'est un brouillon de travail).

**Signaux d'alerte** : pense pouvoir garder des entités « en cache » d'une requête à l'autre ; croit qu'une modification part en base dès l'affectation ; parle d'état global partagé.

**Relance** : « Tu modifies une entité puis tu la relis avec `findOneBy()` : obtiens-tu la valeur de la base ? » → non, l'objet modifié en mémoire (Identity Map) ; il faut `clear()` pour relire la base.

### 2. Les 4 états d'une entité, `update()` sans `persist()`

**Attendu** : NEW (`new`, inconnue de Doctrine) → `persist()` → MANAGED (aussi tout ce qui est chargé par `find`/DQL) ; `remove()` → REMOVED → `flush()` = DELETE ; `detach()`/`clear()` → DETACHED. Dans `update()`, la tâche vient de l'EntityValueResolver (donc d'un `find`) : elle est MANAGED, et au flush Doctrine la compare au snapshot pris au chargement pour générer l'UPDATE. `create()` crée un objet NEW, d'où `persist()`.

**Signaux d'alerte** : « persist() sert à sauvegarder » ; pense qu'une entité chargée doit être « réattachée ».

**Relance** : « Si on ajoutait `persist()` dans `update()`, serait-ce une erreur ? » → non, inutile mais sans effet. « Et après un `$em->clear()` ? » → l'entité en variable est détachée, ses modifications sont ignorées au flush.

### 3. Workflow de migration de son ticket

**Attendu** : rebase sur la branche principale → `make sf-migrate` → modifier l'entité → `make sf-migration` → **relire** le SQL (seulement ses changements, `down()` cohérent, `getDescription()` rempli) → `make sf-migrate` → `doctrine:schema:validate` → `make sf-db-reset` pour vérifier de zéro. Sait que la migration est la différence entre les entités et **sa base locale** (pas un fichier de schéma comme `schema.prisma`).

**Signaux d'alerte** : migration contenant les changements d'un collègue ; migration déjà mergée modifiée après coup ; n'a pas lu le SQL généré.

**Relance** : « Ta migration entre en conflit avec celle de B2 : que fais-tu ? » → supprimer la sienne, rebase, `make sf-db-reset`, régénérer.

### 4. `\DateTimeImmutable` et le parallèle avec la réactivité Vue

**Attendu** : Doctrine compare les **références** d'objets pour les dates. Avec un `\DateTime` mutable, `modify()` change l'objet en place : même référence, aucun changement détecté, aucun UPDATE. Avec `\DateTimeImmutable` (types `*_IMMUTABLE`), `modify()` renvoie un **nouvel** objet qu'il faut réaffecter (`$this->dueAt = $this->dueAt->modify(...)`), et le changement est vu. Parallèle Vue : muter un objet que le système de réactivité ne suit pas (ou attendre d'un `watch` non profond qu'il voie une mutation interne) : la donnée change, mais personne n'est prévenu.

**Signaux d'alerte** : « c'est une question de précision » ou « une convention de style » ; ne sait pas qu'il faut réaffecter le résultat de `modify()`.

**Relance** : « Avec un `\DateTimeImmutable`, que fait `$this->dueAt->modify('+1 day');` sans réaffectation ? » → rien : le nouvel objet est perdu, la propriété n'a pas changé, aucun UPDATE.

---

## Doctrine — relations

### 1. Côtés propriétaire / inverse de son ticket, bidirectionnel ou non

**Attendu** : nomme chaque relation, son côté propriétaire (le ManyToOne, celui qui a la clé étrangère dans sa table) et justifie la présence d'un côté inverse (`mappedBy`, besoin réel de naviguer `$project->getTasks()`, `orphanRemoval`…) ou son absence (moins de code, moins de pièges, une requête suffit). B2 : deux ManyToOne vers `User`, unidirectionnelles de préférence.

**Signaux d'alerte** : toutes les relations bidirectionnelles « parce que make:entity l'a proposé » ; place le côté propriétaire sur le OneToMany.

**Relance** : « Pour `taskCount`, as-tu besoin de la collection inverse ? » → non, un `COUNT` (ou `SIZE`) en base suffit.

### 2. Pourquoi `add()` sur le côté inverse ne suffit pas (K20)

**Attendu** : dans un store, le tableau **est** l'état ; ici la vérité est la colonne `author_id` de `kata_book`, et Doctrine ne lit au `flush()` que la propriété qui la représente (`Book::$author`, côté propriétaire). Modifier `Author::$books` (côté inverse) ne génère aucun UPDATE. La méthode de synchronisation (`setAuthor()`) change le côté propriétaire **et** met à jour les collections des deux auteurs en mémoire, pour que `getBooks()` reste juste pendant la requête (≈ une action Pinia qui met à jour deux morceaux d'état). K20 : `setAuthor($to)` pour chaque livre, `toArray()` avant la boucle pour ne pas itérer sur une collection modifiée pendant le parcours, un seul flush, test qui relit après `clear()`.

**Signaux d'alerte** : a modifié les collections ; ne sait pas pourquoi `toArray()` ; pense que la synchronisation mémoire est requise par la base.

**Relance** : « Que se passerait-il si `setAuthor()` changeait seulement `$this->author` ? » → la base serait juste après le flush, mais `$from->getBooks()` contiendrait encore le livre jusqu'au prochain chargement.

### 3. Nombre de requêtes d'une liste de son API

**Attendu** : un chiffre précis vérifié dans le profiler (onglet Doctrine : requêtes identiques regroupées, à un paramètre près), avant et après correction. Explique la cause (relations LAZY chargées au premier accès, y compris pendant la sérialisation) et la solution : fetch join `join()` + `addSelect()` (≈ `include` Prisma) ou `COUNT` / `SIZE` pour un compteur. Parallèle front : une cascade de requêtes identiques dans l'onglet Réseau des DevTools.

**Signaux d'alerte** : « je ne sais pas » sans savoir où regarder ; propose `fetch: 'EAGER'` comme solution ; un `join()` sans `addSelect()` qu'il croit suffisant.

**Relance** : « Et avec 500 tâches ? » → 1 + 500 requêtes sans fetch join, 1 avec.

### 4. `cascade: remove` vs `orphanRemoval` vs `onDelete: CASCADE`

**Attendu** : les deux premiers sont gérés par l'ORM en PHP (cascade remove charge les enfants et appelle `remove()` sur chacun ; orphanRemoval supprime un enfant retiré de la collection ou dont le parent est supprimé) ; `onDelete: 'CASCADE'` est une contrainte SQL exécutée par la base, sans charger d'objet. B3 : `onDelete: 'CASCADE'` sur `Comment::$task` est le plus simple ; B1 : pas de cascade, on vérifie et on renvoie 409.

**Signaux d'alerte** : confond les trois ; met `cascade: ['remove']` partout.

**Relance** : « Les listeners Doctrine sont-ils appelés pour les commentaires supprimés par `onDelete` ? » → non, c'est la base qui supprime.

---

## Doctrine — DQL & QueryBuilder

### 1. K06

**Attendu** : `leftJoin('b.reviews', 'r')` + `addSelect('r')` : la jointure ne filtre pas seulement, elle hydrate les critiques dans la même requête (≈ `include` Prisma). Le test fait `clear()`, appelle la méthode, puis vérifie que la collection est une `PersistentCollection` **déjà initialisée** (`isInitialized()`), donc chargée sans lazy loading. `leftJoin` (et non `join`) pour ne pas perdre un livre sans critique ; `getOneOrNullResult()` pour un seul livre.

**Signaux d'alerte** : `join` au lieu de `leftJoin` sans savoir pourquoi ; ne sait pas ce que vérifie `isInitialized()`.

**Relance** : « Que renverrait la méthode pour 1Q84 avec un `join` simple ? » → null (aucune critique).

### 2. K12

**Attendu** : une seule requête SQL, aucune entité chargée (≈ `prisma.updateMany`), efficace en masse. Conséquences : les entités déjà en mémoire gardent leurs anciennes valeurs (`clear()`/`refresh()` si besoin), aucun événement (preUpdate, listeners) déclenché, ni cascade ni orphanRemoval. `execute()` renvoie le nombre de lignes ; la condition `outOfPrint = false` évite de compter les livres déjà épuisés.

**Signaux d'alerte** : a chargé les livres et fait une boucle + flush (fonctionne, mais rate l'objectif) ; ignore le contournement de l'Unit of Work.

**Relance** : « Si B3 utilisait un UPDATE DQL pour changer des statuts, `completedAt` serait-il renseigné par le listener ? » → non.

### 3. Requête de filtres (ticket B3 ou K09)

**Attendu** : QueryBuilder de base, puis un `andWhere()` + `setParameter()` par critère présent, exactement comme l'objet `params` construit côté Vue (`if (status.value) params.status = ...`). Test `null !== $value` (et non `if ($value)`, piège du `false`) ; `%` dans la valeur du paramètre ; `LOWER` des deux côtés ; sait lire le DQL obtenu (`getDQL()`) et les parenthèses ajoutées autour d'un `OR`.

**Signaux d'alerte** : concaténation dans la requête (« le front valide déjà ») ; `where()` qui écrase ; filtre en PHP après `findAll()` ; ne sait pas produire le DQL.

**Relance** : « Que devient la requête si seul `search` est fourni ? Lis-la. »

### 4. Pagination

**Attendu** : `setFirstResult(($page - 1) * $limit)` + `setMaxResults($limit)`, `Paginator` : `count($paginator)` = requête COUNT séparée → en-tête `X-Total-Count`, que le front lit pour afficher « page 2 sur 5 » sans tout télécharger ; `iterator_to_array($paginator, false)` pour une liste. Le Paginator charge d'abord les ids de la page : correct même avec un fetch join de collection, contrairement à LIMIT seul (LIMIT porte sur les lignes SQL, pas sur les entités).

**Signaux d'alerte** : calcule le total avec `count(findAll())` ; pagine avec `array_slice`.

**Relance** : « page=0 ou limit=1000, que fait ton API ? » → validation 422 / bornes du contrat (min 1, max 100).

---

## Revues orales de lot / ticket / kata / bonus front

À faire à la fin des lots (étape 2 — PHP), après le kata (étape 4 — Doctrine) et à la démo finale (tickets du backlog, bonus front Vue). Échange court (repère formateur : 5-10 min), sur le code du dev : piochez 2 ou 3 questions.

### Lot A (HTTP & routage)

| Question | Réponse attendue |
|---|---|
| Comment `fromGlobals()` construit-il le chemin ? Cas de `/api/tasks/` et `/` ? | `parse_url(..., PHP_URL_PATH)`, `rtrim('/')`, et `/` reste `/`. Query string exclue (elle est dans `$_GET`). |
| Pourquoi `send()` n'envoie-t-il ni corps ni Content-Type en 204 ? | 204 = No Content par définition ; le contrat (et HTTP) l'imposent. Code de statut et en-têtes **avant** l'`echo`. |
| Montre comment le routeur transforme `/api/tasks/{id}` en regex. Pourquoi `#` comme délimiteur ? | `preg_replace` des `{nom}` en `(?<nom>\d+)`, ancrage `^...$` ; `#` pour ne pas échapper les `/`. |
| Comment `ValidationException::toArray()` réutilise-t-il le parent ? | `parent::toArray()` + clé `violations`, construite depuis `$this->errors` (`propertyPath`, `title`). |
| Pourquoi `catch (HttpException)` avant `catch (\Throwable)` dans index.php ? | Les catch sont testés dans l'ordre ; le plus spécifique d'abord. `\Throwable` attrape aussi les `Error` → 500 JSON + `error_log`. |

### Lot B (Données & PDO)

| Question | Réponse attendue |
|---|---|
| Que fait chaque option PDO de `Connection` ? | ERRMODE_EXCEPTION (erreurs → exceptions), FETCH_ASSOC (tableaux associatifs), EMULATE_PREPARES false (vraies requêtes préparées côté serveur), `SET TIME ZONE` (dates dans le fuseau PHP). |
| Pourquoi `(int) $row['id']` dans `fromRow()` ? | Selon le pilote et le type, PDO peut renvoyer des chaînes ; strict_types + `?int $id` exigent un int. |
| Comment `save()` distingue-t-il insertion et mise à jour ? Pourquoi `RETURNING *` ? | `id === null` → INSERT, sinon UPDATE ; `RETURNING *` renvoie la ligne écrite (id, created_at générés) en une requête. |
| Comment `delete()` sait-il si la tâche existait ? | `rowCount() > 0` (execute renvoie true même sans ligne). |
| Pourquoi le check du lot B ne laisse-t-il aucune donnée en base ? | `beginTransaction()` au début, `rollBack()` à la fin. |

### Lot C (Métier & validation)

| Question | Réponse attendue |
|---|---|
| Pourquoi le contrôleur dépend-il de `TaskRepositoryInterface` et pas de `TaskRepository` ? | Découplage : testable avec `InMemoryTaskRepository` avant que le lot B existe (≈ une interface TypeScript + un mock). |
| Comment le validateur gère-t-il le PATCH (`partial`) ? | Ne valide `title`/`status` que s'ils sont présents (`array_key_exists`), mais valide ce qui est fourni ; renvoie **toutes** les erreurs. |
| Pourquoi `mb_strlen` ? Donne un titre valide que `strlen` refuserait. | Longueur en caractères ; « Été » = 3 caractères, 5 octets. |
| Comment `update()` traite-t-il `"description": ""` ? Et l'absence de la clé ? | `""` → null (contournement documenté) ; clé absente → on ne touche pas. |
| D'où vient l'en-tête `Location` et pourquoi ? | Construit avec l'id renvoyé par `save()` ; le contrat demande `201` + `Location` sur création. |

### Kata Doctrine (priorité K06, K12, K20)

| Question | Réponse attendue |
|---|---|
| **K06** — pourquoi `addSelect`, pourquoi `leftJoin` ? Que vérifie le test ? | Voir [DQL Q1](#1-k06). |
| **K12** — pourquoi un UPDATE DQL, quelles conséquences ? | Voir [DQL Q2](#2-k12). |
| **K20** — pourquoi modifier les collections ne suffit pas ? | Voir [Relations Q2](#2-pourquoi-add-sur-le-côté-inverse-ne-suffit-pas-k20). |
| **K05** — pourquoi partir de `Author` avec un `LEFT JOIN` ? Pourquoi convertir le `COUNT` ? | Pour inclure Margaret Atwood (0 livre) ; un `JOIN` l'éliminerait. Selon le pilote, les agrégats peuvent revenir en string (`AVG` toujours) : on normalise en int/float. |
| **K10** — pourquoi le Paginator ? | Total correct + pagination juste même avec jointures de collection. |
| **K17** — faut-il `persist()` les nouveaux Tag ? | Oui : `Book::$tags` n'a pas de `cascade: persist` ; le livre lui-même est persisté explicitement. Une étiquette existante est réutilisée (sinon violation d'unicité sur `name`). |
| **K18** — pourquoi aucun `persist($review)` ? | `cascade: ['persist']` sur `Book::$reviews` et le constructeur de Review l'ajoute à la collection du livre (déjà MANAGED). |
| **K21** — pourquoi `toArray()` avant de retirer ? Que fait `orphanRemoval` ? | On ne modifie pas une collection pendant qu'on l'itère ; retirer de la collection = DELETE au flush. |

### Dev Back 1 (Projets)

| Question | Réponse attendue |
|---|---|
| Comment l'unicité du nom de projet est-elle garantie ? | Contrainte unique en base (migration) + validation avant flush (`UniqueEntity` ou contrainte sur le DTO) → 422 sur `name` ; sinon EntityManager fermé et 500. |
| Comment `taskCount` est-il calculé sans N+1 ? | Liste : COUNT/SIZE groupé dans la requête (résultat mixte ou `HIDDEN`), une seule requête ; `EXTRA_LAZY` + `count()` seulement pour le détail (sur la liste, un COUNT par projet = N+1) ; vérifié au profiler. |
| Comment `projectId: null` détache-t-il une tâche ? Projet inexistant ? | Solution PATCH choisie (clés du JSON brut…) ; projet inexistant → 422 sur `projectId` (contrainte ou vérification + violation). |
| Pourquoi 409 et pas une cascade pour supprimer un projet non vide ? | Contrat : protéger les données ; vérification du nombre de tâches avant `remove()`, `ConflictHttpException`. |

### Dev Back 2 (Utilisateurs & authentification)

| Question | Réponse attendue |
|---|---|
| Trajet d'une requête `POST /api/tasks` avec `Authorization: Bearer xxx`. | Firewall `api` (stateless) → authenticator `access_token` lit l'en-tête → `ApiTokenHandler` trouve le token, vérifie l'expiration, renvoie un `UserBadge` → user provider charge le User → `access_control` exige IS_AUTHENTICATED pour POST → contrôleur, `getUser()` = auteur. |
| Comment le mot de passe est-il stocké et vérifié ? Pourquoi le même message d'erreur au login ? | Haché (`UserPasswordHasherInterface`, algo auto bcrypt/argon2), jamais en clair ni sérialisé (`#[Ignore]` / pas de getter exposé) ; `isPasswordValid()` ; même 401 pour ne pas révéler l'existence d'un email. |
| Comment le token est-il généré, pourquoi `random_bytes` ? | `bin2hex(random_bytes(32))` : aléatoire cryptographique, 64 caractères, unique en base, expiration 24 h. |
| Qui décide qu'un utilisateur peut supprimer une tâche, et où ? Différence 401/403 ? | `TaskVoter::voteOnAttribute()` (auteur ou ROLE_ADMIN, tâche sans auteur : admin) + `#[IsGranted('TASK_DELETE', 'task')]` ; 401 non authentifié, 403 refusé. |
| Comment les tests existants ont-ils été adaptés ? | Vrai token envoyé en `Authorization: Bearer` (`setServerParameter('HTTP_AUTHORIZATION', ...)`, trait `LogsInUsers`) ; pourquoi pas `loginUser()` : firewall stateless, kernel redémarré entre deux requêtes → 401 dès la 2ᵉ ; tests de suppression adaptés au voter (B2-5) ; `contract-check` avec `API_TOKEN`. |

### Dev Back 3 (Commentaires, filtres & pagination)

| Question | Réponse attendue |
|---|---|
| Comment les paramètres de query arrivent-ils dans ton code ? Statut invalide ? | `#[MapQueryString(validationFailedStatusCode: 422)] TaskFilter` (DTO avec contraintes et valeurs par défaut) → 422 si invalide (404 par défaut sans ce paramètre) ; ou `MapQueryParameter`. |
| Comment `X-Total-Count` est-il calculé ? | `Paginator` : `count($paginator)` ; en-tête ajouté à la `JsonResponse`. |
| Comment `completedAt` est-il mis à jour, et dans quel cas ne le serait-il pas ? | Entity listener / callback `preUpdate` avec `hasChangedField('status')` ; pas déclenché par un UPDATE DQL ni à la création (gérer `prePersist` si une tâche est créée `done`). |
| Que deviennent les commentaires quand on supprime une tâche ? | `onDelete: 'CASCADE'` sur `Comment::$task`, relation unidirectionnelle (orphanRemoval exigerait le côté inverse sur `Task`, fichier partagé) ; justification du choix. |
| Comment `commentCount` évite-t-il le N+1 ? | COUNT dans la requête de liste (résultat mixte / sous-requête / `SIZE`), vérifié au profiler. |

### Bonus front Vue (V1 → V6)

Pour un dev back qui a fait le bonus : on vérifie surtout qu'il relie chaque comportement du front à **son** code Symfony.

| Question | Réponse attendue |
|---|---|
| (V1) Montre le module qui appelle l'API. Pourquoi un seul `request()` plutôt que des `fetch` dans les composants ? | Un seul endroit pour l'URL de base, les en-têtes (`Content-Type`, `Authorization`) et la gestion d'erreurs (`response.ok`, statut, corps JSON) ; les composants ne connaissent que des fonctions métier. |
| (V2) Le back renvoie un 422 : comment l'erreur arrive-t-elle sous le bon champ du formulaire ? | Le corps contient `violations[]` avec `propertyPath` ; le front les range par champ. Côté Symfony : contraintes du DTO + `#[MapRequestPayload]` (ou validation explicite) qui produit ce format. Un 400 global ne permettrait pas cet affichage. |
| (V3) Après un `DELETE` réussi, pourquoi ne pas faire `response.json()` ? | `204 No Content` : aucun corps, `json()` lèverait une erreur. On retire l'élément de la liste localement (ou on recharge). |
| (V4) Le bouton « Supprimer » est caché par un `v-if` pour les non-auteurs : est-ce une protection ? | Non : n'importe qui peut appeler l'API avec `curl`. La vraie règle est côté serveur (voter, 403) ; le `v-if` n'est que du confort d'affichage. Idem pour un guard de route. |
| (V5) D'où vient le nombre total de pages ? Pourquoi le front ne le voyait-il pas au début ? | En-tête `X-Total-Count` calculé côté Symfony (`count($paginator)`). Sans proxy, un en-tête non standard n'est lisible en JS que s'il est listé dans `expose_headers` (CORS). |
| (V6) Pourquoi `curl` n'a-t-il jamais eu de problème de CORS ? Qui bloque, qui autorise ? | Le CORS est une règle du **navigateur** : la requête arrive au serveur (visible au profiler), c'est la lecture de la réponse qui est bloquée. Le **serveur** autorise via les en-têtes `Access-Control-*` (`nelmio/cors-bundle` : origine, méthodes, `Authorization`, `expose_headers`). |
