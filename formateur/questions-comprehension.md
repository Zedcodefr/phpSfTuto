# Questions de compréhension — réponses attendues

> Document **formateur**. Il est servi uniquement derrière l'authentification de l'app de formation (`/formateur`).
> Les stagiaires voient les questions (fin de chaque page de cours, rubrique « à savoir expliquer à l'oral »),
> jamais les réponses ci-dessous.

## Mode d'emploi

**Quand ?** Questions ouvertes des cours pendant les débriefs de fin de cours, puis revues orales
à la fin des lots (étape PHP), après le kata (étape Doctrine) et à la démo finale — voir la [dernière partie](#revues-orales-de-lot--ticket--kata).

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

1. [PHP — principes](#php--principes)
2. [PHP — grammaire](#php--grammaire)
3. [PHP & HTTP](#php--http)
4. [Symfony — principes](#symfony--principes)
5. [Symfony — particularités](#symfony--particularités)
6. [Doctrine — ORM & mapping](#doctrine--orm--mapping)
7. [Doctrine — relations](#doctrine--relations)
8. [Doctrine — DQL & QueryBuilder](#doctrine--dql--querybuilder)
9. [React — principes](#react--principes)
10. [React — particularités](#react--particularités)
11. [Revues orales de lot / ticket / kata](#revues-orales-de-lot--ticket--kata)

---

## PHP — principes

### 1. Le trajet d'une requête dans nginx + PHP-FPM (et avec `php -S`)

**Attendu**
- nginx reçoit la requête, sert lui-même un fichier statique s'il existe (`try_files`), sinon transmet à PHP-FPM via FastCGI.
- Un worker FPM libre prend la requête et exécute `public/index.php` **depuis zéro** : autoload, création des objets, connexion BDD.
- Le script produit la réponse (en-têtes + `echo`), puis **tout est détruit** ; le worker attend la requête suivante.
- Avec `php -S` (API PHP pur) : un seul processus fait serveur web et exécution, toute URL qui n'est pas un fichier va à `index.php` ; jamais en production.
- OPcache évite de recompiler les fichiers à chaque requête (ce sont les opcodes qui sont partagés, pas les objets).

**Signaux d'alerte** : parle d'un « démarrage de l'application » une seule fois, de singletons partagés, de threads ; confond OPcache et cache de données.

**Relance** : « Une connexion PDO ouverte pendant une requête, que devient-elle à la requête suivante ? » → fermée, une nouvelle est ouverte (pas de pool applicatif).

### 2. Pourquoi un singleton « cache en mémoire » ne sert à rien

**Attendu** : la mémoire PHP est libérée à la fin de chaque requête ; un cache statique ne vit que le temps d'une requête. Il faut un stockage externe : APCu (mémoire partagée du serveur), Redis/Memcached, fichiers, base.

**Signaux d'alerte** : propose `static` ou une session ; ne sait pas citer d'alternative.

**Relance** : « Et si on a 3 serveurs derrière un load balancer, APCu suffit-il ? » → non, APCu est local à une machine : Redis.

### 3. `composer install` vs `composer update`, lock et vendor

**Attendu**
- `install` installe exactement les versions du `composer.lock` (≈ `dotnet restore`) → après un `git pull`.
- `update` recalcule les versions selon les contraintes de `composer.json` et réécrit le lock → volontairement, dans une PR dédiée.
- On committe `composer.lock` pour que toute l'équipe ait les mêmes versions ; `vendor/` est regénérable, donc ignoré.

**Signaux d'alerte** : lance `update` « pour être à jour » après chaque pull ; pense que le lock est généré automatiquement et inutile.

**Relance** : « Ton collègue a ajouté une dépendance, tu as une erreur Class not found après le pull. Que fais-tu ? » → `make php-composer c=install` (ou `make install`).

### 4. Où est `App\Validation\TaskValidator` et que se passe-t-il au premier `new`

**Attendu** : fichier `src/Validation/TaskValidator.php` (PSR-4 `App\` → `src/`, un segment = un dossier, nom du fichier = nom de la classe). Au premier usage, PHP ne connaît pas la classe, appelle l'autoloader enregistré par `vendor/autoload.php`, qui calcule le chemin et fait un `require` du fichier ; ensuite la classe est connue pour le reste de la requête.

**Signaux d'alerte** : pense qu'il faut un `require` manuel ou un `composer dump-autoload` après chaque nouvelle classe (inutile avec PSR-4) ; ne sait pas pourquoi la casse du nom de fichier compte.

**Relance** : « Tu renommes la classe sans renommer le fichier : que se passe-t-il ? »

### 5. `declare(strict_types=1)` dans son code

**Attendu** : sans lui, PHP convertit silencieusement les scalaires aux appels (`"21"` → `21`). Avec, TypeError. Par fichier, s'applique aux appels émis depuis ce fichier. Exemple attendu dans le code : l'id de route arrive en `string` (`show(Request $request, string $id)`), le passer à `find(int $id)` exige un `(int)` explicite ; ou une valeur JSON `"title": 123` qui serait convertie.

**Signaux d'alerte** : pense que c'est global ou que ça type les variables locales.

**Relance** : « Pourquoi le paramètre du contrôleur est-il `string $id` et pas `int $id` ? »

---

## PHP — grammaire

### 1. Array vs objet à l'affectation et en paramètre

**Attendu** : un array est copié (copy-on-write : la copie réelle n'a lieu qu'à la modification) ; un objet est manipulé par référence (handle) → modifier `$t2->title` modifie l'objet partagé. Dans le code : le repository renvoie des `Task` (objets) que le contrôleur modifie avant `save()` ; les tableaux de données JSON sont copiés.

**Signaux d'alerte** : « les arrays sont passés par référence comme en C# » ; utilise `&` partout pour « être sûr ».

**Relance** : « Dans `InMemoryTaskRepository`, pourquoi des `clone` ? » → sinon le contrôleur modifierait l'objet stocké sans passer par `save()`, le faux repository ne se comporterait pas comme la base.

### 2. Une closure / arrow function de son code

**Attendu** : `fn` capture automatiquement **par valeur**, au moment de la création ; `function () use ($x)` capture explicitement, par valeur aussi (`&$x` pour une référence). En C# la lambda capture la variable elle-même.

**Signaux d'alerte** : ne sait pas ce qui est capturé ; pense qu'une modification ultérieure de la variable est vue par la closure.

**Relance** : `$x = 1; $f = fn() => $x; $x = 2; echo $f();` → 1.

### 3. Pourquoi `===` partout

**Attendu** : `==` convertit avant de comparer. Exemples : `null == false`, `"1" == "01"`, `"0" == false`, `[] == false`. `in_array(..., true)`, `match` compare déjà en strict, `switch` non.

**Signaux d'alerte** : ne sait citer aucun exemple ; « c'est juste une convention ».

**Relance** : « Et `strpos($s, 'x') == false` ? » → faux positif si la position est 0 (`0 == false`).

### 4. La ligne `array_filter($matches, is_string(...), ARRAY_FILTER_USE_KEY)`

**Attendu** : `$matches` contient la correspondance complète (clé 0), chaque groupe par index numérique **et** par nom (`'id' => '42'`). `is_string(...)` crée une closure à partir de la fonction native (first-class callable). `ARRAY_FILTER_USE_KEY` passe la **clé** au callback → on garde les clés string, donc les groupes nommés. Le résultat est étalé (`...$params`) en arguments nommés.

**Signaux d'alerte** : ne sait pas ce que contient `$matches` ; ignore le rôle de `ARRAY_FILTER_USE_KEY` (code copié).

**Relance** : « Que se passerait-il si on étalait `$matches` sans filtrer ? » → mélange de clés numériques et string ; PHP interdit un argument positionnel après des arguments nommés : erreur.

### 5. `public readonly` + constructor promotion

**Attendu** : la promotion déclare la propriété **et** l'affecte depuis le paramètre. `readonly` : affectable une seule fois (dans la portée de la classe), toute modification ultérieure lève une `Error`. Sur `JsonResponse` : les autres lots peuvent lire `$response->status` mais pas le modifier. `Task` n'est pas readonly car le contrôleur modifie titre/statut.

**Signaux d'alerte** : confond `readonly` et `const` ; ne sait pas pourquoi `Task` n'est pas readonly.

**Relance** : « Comment ferais-tu une "modification" d'un objet readonly ? » → nouvelle instance (méthode `with...`), comme `record with`.

---

## PHP & HTTP

### 1. Le trajet de `POST /api/tasks` dans votre code

**Attendu** (avec le code sous les yeux) : `index.php` → autoload → `Request::fromGlobals()` (méthode, chemin, query, corps lu dans `php://input`) → câblage (`Connection::fromEnvironment()`, `TaskRepository`, `TaskController`, `Router` + routes) → `Router::dispatch()` (regex, méthode) → `TaskController::create()` → `Request::json()` → `TaskValidator::validate()` → `new Task(...)` → `TaskRepository::save()` (INSERT … RETURNING) → `new JsonResponse($task, 201, ['Location' => ...])` → `send()` (code, en-têtes, `json_encode` qui appelle `jsonSerialize()`).

**Signaux d'alerte** : ne connaît que son lot ; ne sait pas où les exceptions sont attrapées.

**Relance** : « À quel moment exact la ligne est-elle écrite en base ? Et l'id, d'où vient-il ? »

### 2. JSON invalide, puis titre vide

**Attendu** : JSON invalide → `json_decode` avec `JSON_THROW_ON_ERROR` lève `\JsonException` → convertie en `HttpException(400)` dans `Request::json()` → attrapée dans `index.php` → `toResponse()` → `{"title":"Bad Request","status":400,"detail":...}`. Titre vide → `TaskValidator` lève `ValidationException(['title' => 'This value should not be blank.'])` → 422 avec `violations[]`.

**Signaux d'alerte** : ne sait pas où la 400 est produite ; pense que `json_decode` lève une exception par défaut.

**Relance** : « Et si le corps est `[1,2]` ? » → JSON valide mais pas un objet → 400.

### 3. Pourquoi des requêtes préparées partout

**Attendu** : la valeur est envoyée séparément du SQL, jamais interprétée. Exemple d'attaque : `?status=' OR '1'='1` ou un titre contenant `'); DROP TABLE task; --`. Les paramètres ne remplacent que des valeurs (pas de nom de colonne → liste blanche). Le check du lot B teste une apostrophe.

**Signaux d'alerte** : pense qu'`addslashes` ou un échappement manuel suffit.

**Relance** : « Pour un tri dynamique `?sort=title`, comment fais-tu ? » → liste blanche (`match`).

### 4. 404 vs 405 dans le routeur

**Attendu** : on parcourt les routes dans l'ordre d'enregistrement ; si le chemin correspond, on note qu'il existe ; si la méthode correspond aussi, on exécute. À la fin : chemin trouvé mais aucune méthode → 405, rien trouvé → 404. Le motif est ancré (`^...$`) et `{id}` n'accepte que des chiffres.

**Signaux d'alerte** : ne sait pas pourquoi `/api/tasks/abc` donne 404.

**Relance** : « Sans les ancres `^` et `$`, que se passerait-il pour `/api/tasks/42/extra` ? »

### 5. `SET TIME ZONE` et le format des dates

**Attendu** : PostgreSQL renvoie les `timestamptz` dans le fuseau de la **session** (UTC par défaut dans le conteneur) ; sans aligner la session sur `date_default_timezone_get()` (Europe/Paris), on obtiendrait `+00:00`. Le format `2026-10-15T09:30:00+02:00` est `DATE_ATOM` (ISO 8601 / RFC 3339), imposé par le contrat et identique à Symfony.

**Signaux d'alerte** : a ajouté la ligne parce que « le check le demandait » sans savoir pourquoi.

**Relance** : « Où est défini le fuseau de PHP dans le projet ? » → `docker/php/php.ini` (`date.timezone`).

---

## Symfony — principes

### 1. Le trajet de `POST /api/tasks` dans Symfony

**Attendu** : nginx → FPM → `public/index.php` → Runtime → `Kernel` (conteneur compilé dans `var/cache`) → `HttpKernel::handle()` : `kernel.request` (RouterListener trouve la route et `_controller`, firewall si sécurité) → `kernel.controller` → `kernel.controller_arguments` (RequestPayloadValueResolver désérialise et valide `CreateTaskInput`, 422 sinon) → action → `persist` + `flush` → `$this->json()` (Serializer) → `kernel.response` → `send()` → `kernel.terminate`. En cas d'exception : `kernel.exception` → réponse problem+json (grâce à `format: 'json'`).

**Signaux d'alerte** : décrit un pipeline de middlewares avec `next()` ; ne sait pas où la validation a lieu.

**Relance** : « Comment le vérifierais-tu ? » → `debug:event-dispatcher kernel.controller_arguments`, profiler (onglet Events/Performance).

### 2. Chaque fichier PHP pur → son équivalent Symfony

**Attendu** : `index.php` + `Router` → front controller Symfony + attributs `#[Route]` (RouterListener) ; `Request`/`JsonResponse` → HttpFoundation ; `HttpException` + try/catch → exceptions HttpKernel + `kernel.exception` + ProblemNormalizer ; `Connection` → `DATABASE_URL` + DBAL ; `schema.sql` → migrations ; `TaskRepository` PDO → `ServiceEntityRepository` + Doctrine ; `Task::jsonSerialize` → Serializer (getters) ; `TaskValidator` → contraintes `#[Assert]` sur DTO + `MapRequestPayload` ; câblage manuel → autowiring ; `contract-check` → `WebTestCase` + `make sf-check`.

**Signaux d'alerte** : plus de deux trous ; ne relie pas `try/catch` d'index.php à `kernel.exception`.

**Relance** : « Qu'est-ce que Symfony fait que vous n'aviez pas fait ? » (profiler, cache compilé, conversion d'entité depuis `{id}`…)

### 3. L'autowiring expliqué à un collègue .NET

**Attendu** : `services.yaml` déclare toute classe de `src/` comme service ; le conteneur lit les types des paramètres du constructeur (ou de l'action) et injecte le service correspondant, sans enregistrement (≈ `AddScoped` automatique). Deux implémentations d'une interface → alias (`#[AsAlias]`) ou `#[Autowire(service: ...)]`. Scalaires → `#[Autowire('%env(...)%')]` ou `bind`. Outils : `debug:autowiring`, `debug:container`.

**Signaux d'alerte** : « c'est magique » sans pouvoir citer `services.yaml` ; pense que `EntityManagerInterface` est créé par le contrôleur.

**Relance** : « Le conteneur est-il reconstruit à chaque requête ? » → en FPM, instancié à chaque requête, mais sa **définition** est compilée une fois dans `var/cache`.

### 4. Durée de token de 24 h, de `.env` au service

**Attendu** : variable dans `.env` (ex. `TOKEN_TTL_HOURS=24`, surchargée dans `.env.local` ou par une vraie variable d'environnement), injectée par `#[Autowire(env: 'int:TOKEN_TTL_HOURS')]` ou `bind` dans `services.yaml`, ou un paramètre `%env(int:...)%` ; processeur `int:` pour le typage.

**Signaux d'alerte** : met la valeur en dur ou lit `$_ENV` dans le service.

**Relance** : « Où mettrais-tu un vrai secret en production ? » → variable d'environnement du serveur ou `secrets:set`, jamais dans `.env` commité.

### 5. En-tête `X-Api-Version` sur toutes les réponses

**Attendu** : classe avec `#[AsEventListener]` sur `ResponseEvent` (`kernel.response`) qui ajoute l'en-tête. Équivalent d'un middleware qui agit après `next()`. Aucune configuration grâce à l'autoconfiguration.

**Signaux d'alerte** : propose de modifier chaque contrôleur.

**Relance** : « Et pour refuser une requête avant le contrôleur ? » → listener `kernel.request` qui fait `$event->setResponse()`.

---

## Symfony — particularités

### 1. `persist()` vs `flush()`, un seul flush

**Attendu** : `persist` = suivre un nouvel objet (aucun SQL), `flush` = calculer les changements de toutes les entités suivies et exécuter le SQL dans une transaction. Un seul flush par cas d'usage : atomicité (tout ou rien) et performance ; pas de flush dans un repository ni dans une boucle.

**Signaux d'alerte** : flush dans le repository « comme un save() », ou flush dans une boucle.

**Relance** : « Si deux entités sont modifiées et que la 2ᵉ viole une contrainte, que devient la 1ʳᵉ ? » → rollback, rien n'est écrit.

### 2. Côté propriétaire d'une relation de son ticket

**Attendu** : B1 `Task::$project` (ManyToOne, propriétaire), B2 `Task::$author`/`$assignee` (ManyToOne), `ApiToken::$user`, B3 `Comment::$task`/`$author`. Modifier seulement le côté inverse (collection) → aucun SQL.

**Signaux d'alerte** : croit que la collection inverse est enregistrée ; ne sait pas ce que veut dire `mappedBy`.

**Relance** : voir la question K20 du kata.

### 3. Références circulaires : groupes ou DTO

**Attendu** : explique le choix de l'équipe et ses limites : groupes (`#[Groups]`, penser à `id`, la relation inverse hors du groupe) ou DTO de sortie (contrat explicite, plus de code, maîtrise du N+1). Doit savoir montrer où le contexte de groupes est passé.

**Signaux d'alerte** : a mis `#[Ignore]` ou `MaxDepth` au hasard jusqu'à ce que « ça marche ».

**Relance** : « Le contrat veut `project: {id, name}` : comment ta solution garantit-elle qu'on n'exporte pas plus ? »

### 4. Une requête N+1 de son code

**Attendu** : identifie une liste qui accède à une relation (projet, auteur, nombre de commentaires), montre le profiler (requêtes répétées), corrige par fetch join (`join` + `addSelect`) ou `COUNT`/`SIZE` dans la requête.

**Signaux d'alerte** : n'a jamais ouvert le profiler ; passe la relation en `EAGER`.

**Relance** : « Combien de requêtes pour `GET /api/tasks` aujourd'hui ? » (il doit savoir le dire ou aller le vérifier).

### 5. PATCH avec `null` explicite

**Attendu** : avec un DTO nullable, « absent » et « null » sont indiscernables. Solution retenue (souvent : lire `$request->toArray()` et tester `array_key_exists`), et pourquoi (simplicité vs DTO qui mémorise les champs vs `OBJECT_TO_POPULATE`).

**Signaux d'alerte** : n'a pas vu le problème ; `projectId: null` ne détache pas la tâche.

**Relance** : « Écris le test qui prouve que ça marche. »

---

## Doctrine — ORM & mapping

### 1. Les 4 états d'une entité

**Attendu** : NEW (`new`, inconnue) → `persist()` → MANAGED (aussi tout ce qui est chargé par `find`/DQL) ; `remove()` → REMOVED → `flush()` = DELETE ; `detach()`/`clear()` → DETACHED. Dans son code : l'entité créée dans `create()` est NEW puis MANAGED ; celle reçue par l'EntityValueResolver est MANAGED.

**Signaux d'alerte** : pense qu'une entité chargée doit être « réattachée » avec persist.

**Relance** : « Après `$em->clear()`, que se passe-t-il si tu modifies une entité que tu avais en variable puis flush ? » → rien, elle est détachée.

### 2. Pourquoi `update()` n'appelle pas `persist()`

**Attendu** : la tâche vient de l'EntityValueResolver (donc d'un `find`) : elle est MANAGED ; au flush, Doctrine compare avec le snapshot pris au chargement et génère l'UPDATE. `create()` crée un objet NEW, inconnu de Doctrine, d'où `persist()`.

**Signaux d'alerte** : « persist() sert à sauvegarder ».

**Relance** : « Si on ajoutait `persist()` dans `update()`, serait-ce une erreur ? » → non, inutile mais sans effet.

### 3. Workflow de migration de son ticket

**Attendu** : rebase sur la branche principale → `make sf-migrate` → modifier l'entité → `make sf-migration` → **relire** le SQL (seulement ses changements, `down()` cohérent, description remplie) → `make sf-migrate` → `doctrine:schema:validate` → `make sf-db-reset` pour vérifier de zéro.

**Signaux d'alerte** : migration contenant les changements d'un collègue ; migration mergée modifiée après coup.

**Relance** : « Ta migration entre en conflit avec celle de B2 : que fais-tu ? » → supprimer la sienne, rebase, reset, régénérer.

### 4. Dépendances entre fixtures

**Attendu** : une classe par domaine, `DependentFixtureInterface::getDependencies()` pour l'ordre, `addReference()` / `getReference(nom, Classe::class)` pour partager les objets. Sait dire qui dépend de qui (tâches → projets/utilisateurs, commentaires → tâches/utilisateurs).

**Signaux d'alerte** : récupère les objets par id en dur (`find(1)`) ; une seule grosse fixture modifiée par tout le monde.

**Relance** : « Pourquoi ne pas faire `find(1)` dans la fixture ? » → les ids dépendent de l'ordre d'insertion et des séquences.

### 5. Violation d'unicité au flush

**Attendu** : exception (`UniqueConstraintViolationException`), transaction annulée, **EntityManager fermé** pour le reste de la requête. On l'évite en validant avant : `UniqueEntity` sur l'entité ou contrainte personnalisée sur le DTO (nom de projet, email) → 422.

**Signaux d'alerte** : try/catch autour du flush et on continue à utiliser l'EntityManager.

**Relance** : « Deux requêtes simultanées passent la validation avec le même email : que se passe-t-il ? » → la contrainte unique de la base reste le dernier rempart (500 ou 409 à gérer) : la validation applicative ne remplace pas l'index unique.

---

## Doctrine — relations

### 1. Côtés propriétaire / inverse de son ticket, bidirectionnel ou non

**Attendu** : nomme chaque relation, son côté propriétaire (ManyToOne), et justifie la présence d'un côté inverse (besoin réel de naviguer `$project->getTasks()`, `orphanRemoval`…) ou son absence (moins de pièges, une requête suffit).

**Signaux d'alerte** : toutes les relations bidirectionnelles « parce que make:entity l'a proposé ».

**Relance** : « Pour `taskCount`, as-tu besoin de la collection inverse ? »

### 2. K20 avec ses mots

**Attendu** : les collections `Author::$books` sont le côté inverse, ignoré au flush ; il faut appeler `$book->setAuthor($to)` pour chaque livre (côté propriétaire). `toArray()` avant la boucle pour ne pas itérer sur une collection modifiée pendant le parcours. Un seul flush. Le test relit après `clear()`.

**Signaux d'alerte** : a modifié les collections ; ne sait pas pourquoi `toArray()`.

**Relance** : « Que fait `setAuthor()` en plus de changer la propriété ? » → synchronise les collections en mémoire.

### 3. Nombre de requêtes d'une liste de son API

**Attendu** : un chiffre précis vérifié dans le profiler (onglet Doctrine), avant et après fetch join / COUNT.

**Signaux d'alerte** : « je ne sais pas » sans savoir où regarder.

**Relance** : « Et avec 500 tâches ? »

### 4. `cascade: remove` vs `orphanRemoval` vs `onDelete: CASCADE`

**Attendu** : les deux premiers sont gérés par l'ORM en PHP (cascade remove charge les enfants et les supprime un par un ; orphanRemoval supprime un enfant retiré de la collection ou dont le parent est supprimé) ; `onDelete` est une contrainte SQL exécutée par la base, sans charger d'objet. B3 : `onDelete: 'CASCADE'` sur `Comment::$task` est le plus simple ; B1 : pas de cascade, 409.

**Signaux d'alerte** : confond les trois ; met `cascade: ['remove']` partout.

**Relance** : « Les listeners Doctrine sont-ils appelés pour les commentaires supprimés par `onDelete` ? » → non, c'est la base qui supprime.

### 5. Sérialisation sans boucle ni lazy loading caché

**Attendu** : groupes ou DTO limités au contrat ; les relations exposées sont chargées par fetch join dans la requête du repository, sinon chaque getter déclenche une requête pendant la sérialisation.

**Signaux d'alerte** : pas conscient que le Serializer appelle les getters (donc le lazy loading).

**Relance** : « Si tu ajoutes un getter `getComments()` sur Task, que se passe-t-il dans le JSON de la liste ? »

---

## Doctrine — DQL & QueryBuilder

### 1. K06

**Attendu** : `leftJoin('b.reviews', 'r')` + `addSelect('r')` : la jointure ne filtre pas seulement, elle hydrate les critiques dans la même requête. Le test fait `clear()`, appelle la méthode, puis vérifie que la collection est une `PersistentCollection` **déjà initialisée** (`isInitialized()`), donc chargée sans lazy loading. `leftJoin` (et non `join`) pour ne pas perdre un livre sans critique.

**Signaux d'alerte** : `join` au lieu de `leftJoin` sans savoir pourquoi ; ne sait pas ce que vérifie `isInitialized()`.

**Relance** : « Que renverrait la méthode pour 1Q84 avec un `join` simple ? » → null (aucune critique).

### 2. K12

**Attendu** : une seule requête SQL, aucune entité chargée (efficace en masse). Conséquences : les entités déjà en mémoire ne sont pas mises à jour, aucun événement (preUpdate) déclenché, pas de cascade. `execute()` renvoie le nombre de lignes, la condition `outOfPrint = false` évite de compter les livres déjà épuisés.

**Signaux d'alerte** : a chargé les livres et fait une boucle + flush (fonctionne, mais rate l'objectif) ; ignore le contournement de l'UoW.

**Relance** : « Si B3 utilisait un UPDATE DQL pour changer des statuts, `completedAt` serait-il renseigné ? » → non.

### 3. Requête de filtres (ticket B3-1 ou K09)

**Attendu** : QueryBuilder de base, puis un `andWhere()` + `setParameter()` par critère **non null** ; `%` dans la valeur ; `LOWER` des deux côtés ; sait lire le DQL obtenu (`getDQL()`) et les parenthèses autour d'un `OR`.

**Signaux d'alerte** : concaténation dans la requête ; `where()` qui écrase ; ne sait pas produire le DQL.

**Relance** : « Que devient la requête si seul `search` est fourni ? Lis-la. »

### 4. Pagination

**Attendu** : `setFirstResult(($page - 1) * $limit)` + `setMaxResults($limit)`, `Paginator` : `count($paginator)` = requête COUNT séparée → `X-Total-Count` ; `iterator_to_array($paginator, false)` pour une liste. Le Paginator charge d'abord les ids de la page : correct même avec un fetch join de collection, contrairement à LIMIT seul (lignes SQL ≠ entités).

**Signaux d'alerte** : calcule le total avec `count(findAll())`.

**Relance** : « page=0 ou limit=1000, que fait ton API ? » → validation 422 / bornes du contrat (min 1, max 100).

### 5. SQL généré et index

**Attendu** : sait obtenir le SQL (`--show-sql`, profiler, `getSQL()`), reconnaître les alias générés, et lire un `EXPLAIN` (Index Scan vs Seq Scan) ; sait que Doctrine indexe les clés étrangères.

**Signaux d'alerte** : n'a jamais regardé le SQL de ses requêtes.

**Relance** : « Quel index ajouterais-tu pour `?status=todo` sur une grosse table, et où ? » → `#[ORM\Index(columns: ['status'])]` + migration.

---

## React — principes

### 1. Les rendus de TaskList

**Attendu** : 1ᵉʳ rendu avec `tasks = []`, `error = null` (liste vide) → l'effet s'exécute **après** l'affichage, `fetch` part → réponse → `setTasks` → 2ᵉ rendu avec les données. En dev, StrictMode double l'effet.

**Signaux d'alerte** : pense que fetch se fait avant le premier affichage, ou que `setTasks` modifie la variable immédiatement.

**Relance** : « Où ajoutes-tu l'état de chargement, et quelle est sa valeur initiale ? »

### 2. « UI = f(état) » pour un dev WPF/Blazor

**Attendu** : on ne modifie pas la vue ; on modifie l'état via le setter, React ré-exécute la fonction composant, compare l'arbre produit avec le précédent (réconciliation) et applique le minimum au DOM. Pas de binding bidirectionnel.

**Signaux d'alerte** : parle de manipuler le DOM ou de « rafraîchir » manuellement.

**Relance** : « Pourquoi une variable locale ne suffit-elle pas pour un compteur ? »

### 3. Une fonction passée en props

**Attendu** : montre un composant enfant (ex. `TaskItem`) qui reçoit `onDelete`/`onStatusChange`, l'état vit dans le parent (ou le hook) ; l'enfant signale, le parent décide et met à jour l'état ; les props sont en lecture seule.

**Signaux d'alerte** : l'enfant modifie l'objet `task` reçu.

**Relance** : « Deux composants frères doivent voir la même liste : où vit l'état ? » → dans le parent commun (lifting state up).

### 4. Pas d'URL d'API en dur

**Attendu** : `fetch('/api/...')` relatif ; Vite (port 5173) proxifie `/api` vers `API_TARGET` (api-php ou nginx-symfony) ; même origine pour le navigateur → pas de CORS ; bascule par `make use-php` / `make use-symfony` ; en prod, un reverse proxy fait la même chose.

**Signaux d'alerte** : pense que le navigateur appelle directement le port 8082.

**Relance** : « Où le vois-tu dans l'onglet Réseau ? » → URL `localhost:5173/api/...`.

### 5. Ce qui garantit le type `Task`

**Attendu** : TypeScript vérifie à la compilation l'usage des données **une fois typées** ; `as Task[]` ne vérifie rien au runtime. La garantie vient du contrat et des vérifications back (`make php-check`, tests). Une validation runtime (schéma) serait possible mais hors périmètre.

**Signaux d'alerte** : « TypeScript vérifie la réponse de l'API ».

**Relance** : « Si l'API renvoie `created_at` au lieu de `createdAt`, quand le vois-tu ? »

---

## React — particularités

### 1. Dépendances de ses `useEffect`

**Attendu** : chaque valeur du composant utilisée dans l'effet (props, état, fonctions) est dans le tableau ; explique ce qui relance l'effet (ex. `taskId` en navigant d'une tâche à l'autre) ; préfère des primitives aux objets recréés à chaque rendu.

Pour une fonction reçue en props et appelée dans l'effet : `useEffectEvent` (React 19.2) plutôt que de l'ajouter aux dépendances ou de désactiver la règle.

**Signaux d'alerte** : a désactivé la règle du linter ; dépendances choisies « pour que ça marche ».

**Relance** : « Que se passe-t-il si tu retires `taskId` ? » → la page détail ne recharge pas en changeant d'URL.

### 2. Annulation d'une requête obsolète

**Attendu** : `AbortController` créé dans l'effet, `signal` passé à `fetch`, `() => controller.abort()` en nettoyage, erreur d'annulation ignorée. Race condition : la réponse d'une ancienne requête arrive après la nouvelle et écrase l'état.

**Signaux d'alerte** : ne sait pas quand la fonction de nettoyage est appelée.

**Relance** : « Pourquoi StrictMode t'a-t-il aidé à voir ce problème ? »

### 3. Son custom hook

**Attendu** : décrit l'état interne (`tasks`, `loading`, `error`, éventuellement une version pour recharger), l'effet, l'API renvoyée ; chaque composant appelant a **sa propre copie** de l'état (pas un singleton) ; pour partager → Context.

**Signaux d'alerte** : croit que deux composants partagent l'état du hook.

**Relance** : « Comment déclenches-tu un rechargement après une création ? »

### 4. Erreurs 422 par champ

**Attendu** : `apiFetch` lit le corps « problem details » quand `!response.ok`, lève `ApiError(status, detail, violations)` ; le formulaire attrape, filtre `status === 422`, regroupe `violations` par champ (`{ propertyPath: title[] }`, plusieurs messages possibles pour un même champ), affiche sous chaque champ ; n'affiche pas `detail` (destiné au développeur) ; la validation qui fait foi est celle du back.

**Signaux d'alerte** : gestion d'erreurs dispersée dans chaque composant ; parse le message texte.

**Relance** : « Et une 500 ? Et une erreur réseau ? »

### 5. Token, 401, 403

**Attendu** : un seul endroit ajoute `Authorization: Bearer` (`apiFetch`, token lu dans le Context/localStorage) ; 401 → oublier le token, prévenir l'`AuthProvider` (déconnexion), rejouer une fois sans token un `GET` (l'API Symfony répond 401 même sur un GET public si le token est invalide), jamais une écriture ; 403 → message, on reste connecté ; au rechargement, relire le token puis `GET /api/me`. Masquer un bouton n'est pas une sécurité.

**Signaux d'alerte** : ajoute l'en-tête dans chaque appel ; déconnecte sur 403.

**Relance** : « Quel risque à stocker le token dans localStorage ? » → lisible par tout script (XSS).

---

## Revues orales de lot / ticket / kata

À faire à la fin des lots (étape PHP), après le kata (étape Doctrine) et à la démo finale (tickets du backlog). Échange court (repère formateur : 5-10 min), sur le code du dev : piochez 2 ou 3 questions.

### Partie 1 — Lot A (HTTP & routage)

| Question | Réponse attendue |
|---|---|
| Comment `fromGlobals()` construit-il le chemin ? Cas de `/api/tasks/` et `/` ? | `parse_url(..., PHP_URL_PATH)`, `rtrim('/')`, et `/` reste `/`. Query string exclue (elle est dans `$_GET`). |
| Pourquoi `send()` n'envoie-t-il ni corps ni Content-Type en 204 ? | 204 = No Content par définition ; le contrat (et HTTP) l'imposent. Code de statut et en-têtes **avant** l'`echo`. |
| Montre comment le routeur transforme `/api/tasks/{id}` en regex. Pourquoi `#` comme délimiteur ? | `preg_replace` des `{nom}` en `(?<nom>\d+)`, ancrage `^...$` ; `#` pour ne pas échapper les `/`. |
| Comment `ValidationException::toArray()` réutilise-t-il le parent ? | `parent::toArray()` + clé `violations`, construite depuis `$this->errors` (`propertyPath`, `title`). |
| Pourquoi `catch (HttpException)` avant `catch (\Throwable)` dans index.php ? | Les catch sont testés dans l'ordre ; le plus spécifique d'abord. `\Throwable` attrape aussi les `Error` → 500 JSON + `error_log`. |

### Partie 1 — Lot B (Données & PDO)

| Question | Réponse attendue |
|---|---|
| Que fait chaque option PDO de `Connection` ? | ERRMODE_EXCEPTION (erreurs → exceptions), FETCH_ASSOC (tableaux associatifs), EMULATE_PREPARES false (vraies requêtes préparées côté serveur), `SET TIME ZONE` (dates dans le fuseau PHP). |
| Pourquoi `(int) $row['id']` dans `fromRow()` ? | Selon le pilote et le type, PDO peut renvoyer des chaînes ; strict_types + `?int $id` exigent un int. |
| Comment `save()` distingue-t-il insertion et mise à jour ? Pourquoi `RETURNING *` ? | `id === null` → INSERT, sinon UPDATE ; `RETURNING *` renvoie la ligne écrite (id, created_at générés) en une requête. |
| Comment `delete()` sait-il si la tâche existait ? | `rowCount() > 0` (execute renvoie true même sans ligne). |
| Pourquoi le check du lot B ne laisse-t-il aucune donnée en base ? | `beginTransaction()` au début, `rollBack()` à la fin. |

### Partie 1 — Lot C (Métier & validation)

| Question | Réponse attendue |
|---|---|
| Pourquoi le contrôleur dépend-il de `TaskRepositoryInterface` et pas de `TaskRepository` ? | Découplage : testable avec `InMemoryTaskRepository` avant que le lot B existe (≈ ITaskRepository + test double). |
| Comment le validateur gère-t-il le PATCH (`partial`) ? | Ne valide `title`/`status` que s'ils sont présents (`array_key_exists`), mais valide ce qui est fourni ; renvoie **toutes** les erreurs. |
| Pourquoi `mb_strlen` ? Donne un titre valide que `strlen` refuserait. | Longueur en caractères ; « Été » = 3 caractères, 5 octets. |
| Comment `update()` traite-t-il `"description": ""` ? Et l'absence de la clé ? | `""` → null (contournement documenté) ; clé absente → on ne touche pas. |
| D'où vient l'en-tête `Location` et pourquoi ? | Construit avec l'id renvoyé par `save()` ; le contrat demande `201` + `Location` sur création. |

### Kata Doctrine (priorité K06, K12, K20)

| Question | Réponse attendue |
|---|---|
| **K06** — pourquoi `addSelect`, pourquoi `leftJoin` ? Que vérifie le test ? | Voir [DQL Q1](#1-k06). |
| **K12** — pourquoi un UPDATE DQL, quelles conséquences ? | Voir [DQL Q2](#2-k12). |
| **K20** — pourquoi modifier les collections ne suffit pas ? | Voir [Relations Q2](#2-k20-avec-ses-mots). |
| **K05** — pourquoi partir de `Author` avec un `LEFT JOIN` ? Pourquoi convertir le `COUNT` ? | Pour inclure Margaret Atwood (0 livre) ; un `JOIN` l'éliminerait. Selon le pilote, les agrégats peuvent revenir en string (`AVG` toujours) : on normalise en int/float. |
| **K10** — pourquoi le Paginator ? | Total correct + pagination juste même avec jointures de collection. |
| **K17** — faut-il `persist()` les nouveaux Tag ? | Oui : `Book::$tags` n'a pas de `cascade: persist` ; le livre lui-même est persisté explicitement. Une étiquette existante est réutilisée (sinon violation d'unicité sur `name`). |
| **K18** — pourquoi aucun `persist($review)` ? | `cascade: ['persist']` sur `Book::$reviews` et le constructeur de Review l'ajoute à la collection du livre (déjà MANAGED). |
| **K21** — pourquoi `toArray()` avant de retirer ? Que fait `orphanRemoval` ? | On ne modifie pas une collection pendant qu'on l'itère ; retirer de la collection = DELETE au flush. |

### Partie 4 — Dev Back 1 (Projets)

| Question | Réponse attendue |
|---|---|
| Comment l'unicité du nom de projet est-elle garantie ? | Contrainte unique en base (migration) + validation avant flush (`UniqueEntity` ou contrainte sur le DTO) → 422 sur `name` ; sinon EntityManager fermé et 500. |
| Comment `taskCount` est-il calculé sans N+1 ? | Liste : COUNT/SIZE groupé dans la requête (résultat mixte ou `HIDDEN`), une seule requête ; `EXTRA_LAZY` + `count()` seulement pour le détail (sur la liste, un COUNT par projet = N+1) ; vérifié au profiler. |
| Comment `projectId: null` détache-t-il une tâche ? Projet inexistant ? | Solution PATCH choisie (clés du JSON brut…) ; projet inexistant → 422 sur `projectId` (contrainte ou vérification + violation). |
| Pourquoi 409 et pas une cascade pour supprimer un projet non vide ? | Contrat : protéger les données ; vérification du nombre de tâches avant `remove()`, `ConflictHttpException`. |

### Partie 4 — Dev Back 2 (Utilisateurs & authentification)

| Question | Réponse attendue |
|---|---|
| Trajet d'une requête `POST /api/tasks` avec `Authorization: Bearer xxx`. | Firewall `api` (stateless) → authenticator `access_token` lit l'en-tête → `ApiTokenHandler` trouve le token, vérifie l'expiration, renvoie un `UserBadge` → user provider charge le User → `access_control` exige IS_AUTHENTICATED pour POST → contrôleur, `getUser()` = auteur. |
| Comment le mot de passe est-il stocké et vérifié ? Pourquoi le même message d'erreur au login ? | Haché (`UserPasswordHasherInterface`, algo auto bcrypt/argon2), jamais en clair ni sérialisé (`#[Ignore]` / pas de getter exposé) ; `isPasswordValid()` ; même 401 pour ne pas révéler l'existence d'un email. |
| Comment le token est-il généré, pourquoi `random_bytes` ? | `bin2hex(random_bytes(32))` : aléatoire cryptographique, 64 caractères, unique en base, expiration 24 h. |
| Qui décide qu'un utilisateur peut supprimer une tâche, et où ? Différence 401/403 ? | `TaskVoter::voteOnAttribute()` (auteur ou ROLE_ADMIN, tâche sans auteur : admin) + `#[IsGranted('TASK_DELETE', 'task')]` ; 401 non authentifié, 403 refusé. |
| Comment les tests existants ont-ils été adaptés ? | Vrai token envoyé en `Authorization: Bearer` (`setServerParameter('HTTP_AUTHORIZATION', ...)`, trait `LogsInUsers`) ; pourquoi pas `loginUser()` : firewall stateless, kernel redémarré entre deux requêtes → 401 dès la 2ᵉ ; tests de suppression adaptés au voter (B2-5) ; `contract-check` avec `API_TOKEN`. |

### Partie 4 — Dev Back 3 (Commentaires, filtres & pagination)

| Question | Réponse attendue |
|---|---|
| Comment les paramètres de query arrivent-ils dans ton code ? Statut invalide ? | `#[MapQueryString(validationFailedStatusCode: 422)] TaskFilter` (DTO avec contraintes et valeurs par défaut) → 422 si invalide (404 par défaut sans ce paramètre) ; ou `MapQueryParameter`. |
| Comment `X-Total-Count` est-il calculé ? | `Paginator` : `count($paginator)` ; en-tête ajouté à la `JsonResponse`. |
| Comment `completedAt` est-il mis à jour, et dans quel cas ne le serait-il pas ? | Entity listener / callback `preUpdate` avec `hasChangedField('status')` ; pas déclenché par un UPDATE DQL ni à la création (gérer `prePersist` si une tâche est créée `done`). |
| Que deviennent les commentaires quand on supprime une tâche ? | `onDelete: 'CASCADE'` sur `Comment::$task`, relation unidirectionnelle (orphanRemoval exigerait le côté inverse sur `Task`, fichier partagé) ; justification du choix. |
| Comment `commentCount` évite-t-il le N+1 ? | COUNT dans la requête de liste (résultat mixte / sous-requête / `SIZE`), vérifié au profiler. |

### Front (F1 → F11)

| Question | Réponse attendue |
|---|---|
| (F1-F2) Montre l'arbre de composants de la liste : qui possède l'état, qui reçoit quoi en props ? | État dans la page ou le hook, `TaskItem` reçoit `task` + callbacks ; états chargement / vide / erreur rendus conditionnellement. |
| (F4) Pourquoi un module `src/api/` ? | Un seul endroit pour l'URL, les en-têtes, le token, la gestion d'erreurs (`ApiError`) ; composants sans `fetch`. |
| (F5) Que se passe-t-il quand on passe de `/tasks/1` à `/tasks/2` ? | `useParams` change, l'effet dépendant de `taskId` se relance, l'ancienne requête est annulée. |
| (F6-F7) Comment la liste est-elle mise à jour après une création / suppression ? | Mise à jour immuable de l'état (`[...prev, task]`, `filter`) ou rechargement ; bouton désactivé pendant l'envoi **et** garde synchrone `useRef` contre la double soumission (l'état est un snapshot par rendu) ; 422 par champ. |
| (F8-F11) Comment as-tu avancé avant la livraison du back ? Qu'as-tu dû changer au branchement ? | Données en dur conformes au contrat, même signature de fonction d'API ; au branchement, seul `src/api/` change si le contrat est respecté. |
