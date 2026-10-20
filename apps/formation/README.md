# Support de formation TaskBoard (app React à héberger)

Application web envoyée aux stagiaires sous forme d'un simple lien : cours (les Markdown de `docs/`),
parcours, quiz de compréhension, téléchargement du projet de départ, et un **espace formateur
protégé par mot de passe** (guide, réponses aux questions, solutions).

```
apps/formation/
├── src/                     React 19 + TypeScript + react-router
│   ├── content/manifest.ts  ordre du parcours, public (back/front), quiz associés
│   ├── content/quizzes/     un fichier JSON par quiz (validé au build)
│   └── ...
├── server/server.mjs        serveur Node (modules natifs) : fichiers statiques + auth formateur
├── server/hash-password.mjs génère FORMATEUR_PASSWORD_HASH
├── scripts/package.mjs      fabrique les zips téléchargeables + le dossier protected/
├── Dockerfile               image de production (contexte = racine du dépôt)
└── compose.prod.yaml        exemple de déploiement
```

## Développer

```bash
make formation-install   # dépendances
make formation-dev       # http://localhost:5174 — espace formateur : mot de passe « formateur »
make formation-lint
```

Les cours sont lus directement dans `docs/` : toute modification est visible au rechargement.
Après une modification de `formateur/` ou du projet, relancer `make formation-dev` pour régénérer les zips.

### Ajouter / modifier un quiz

`src/content/quizzes/<id>.json`, puis référencer `<id>` dans `manifest.ts` (`quiz: '<id>'`).

```json
{
  "id": "php-principes",
  "title": "Principes de PHP",
  "questions": [
    {
      "question": "Texte (les `backticks` sont rendus en code)",
      "code": "<?php echo 1;",
      "language": "php",
      "choices": ["A", "B", "C"],
      "answer": 1,
      "explanation": "Pourquoi B est la bonne réponse"
    }
  ],
  "openQuestions": ["Question à expliquer à l'oral"]
}
```

`answer` : un index (choix unique) ou un tableau d'index (choix multiples). `code` et `language` sont facultatifs
(langage déduit : `php` si le code contient `$` ou `<?php`, sinon `tsx`). Un quiz invalide fait échouer le build.

## Ce que contient l'image

| Ressource | Accès |
|---|---|
| Application + cours `docs/` | public |
| `/downloads/taskboard-projet.zip` : projet de départ (sans `formateur/`, sans `vendor/`/`node_modules/`) | public |
| `/downloads/taskboard-cours.zip` : cours Markdown | public |
| `guide.md`, `questions-comprehension.md`, `questions-comprehension-vue.md`, `solutions.zip` (dossier `formateur/` entier) | **formateur uniquement**, servis par `/api/formateur/files/*` |

Le contenu formateur n'est **jamais** dans le bundle JavaScript public : la protection est côté serveur.

## Déployer sur votre serveur

1. **Construire l'image** (depuis la racine du dépôt, à refaire à chaque mise à jour des cours ou des solutions) :

   ```bash
   make formation-build          # = docker build -f apps/formation/Dockerfile -t taskboard-formation .
   ```

   Pour construire sur une machine et déployer sur une autre : `docker save taskboard-formation | ssh serveur docker load`,
   ou pousser l'image dans votre registre.

2. **Générer les secrets** :

   ```bash
   make formation-hash p='un mot de passe formateur solide'   # -> FORMATEUR_PASSWORD_HASH=scrypt$...
   openssl rand -base64 48                                    # -> SESSION_SECRET
   ```

3. **Lancer** avec `compose.prod.yaml` et un fichier `.env.prod` (non versionné) :

   ```bash
   docker compose -f apps/formation/compose.prod.yaml --env-file apps/formation/.env.prod up -d
   ```

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `FORMATEUR_PASSWORD_HASH` | Hash scrypt du mot de passe (recommandé) |
| `FORMATEUR_PASSWORD` | Mot de passe en clair (alternative, pour tester) |
| `SESSION_SECRET` | **Obligatoire**, ≥ 32 caractères : signe les cookies de session (8 h) |
| `COOKIE_SECURE` | `true` par défaut : cookie envoyé uniquement en HTTPS. `false` seulement en local |
| `TRUST_PROXY` | `true` derrière un reverse proxy : l'IP utilisée pour limiter les tentatives est lue dans `X-Forwarded-For` |
| `PORT` | `3000` par défaut |

Sécurité : 5 tentatives de connexion par IP et par 15 min, cookie `HttpOnly` + `SameSite=Strict`,
comparaison en temps constant, protection contre la traversée de chemin, en-têtes CSP / nosniff / frame-ancestors.

### Reverse proxy HTTPS

**Caddy** (certificat Let's Encrypt automatique) :

```
formation.mondomaine.fr {
    reverse_proxy 127.0.0.1:3000
}
```

**nginx** :

```nginx
server {
    listen 443 ssl http2;
    server_name formation.mondomaine.fr;
    ssl_certificate     /etc/letsencrypt/live/formation.mondomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/formation.mondomaine.fr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # écrase la valeur reçue du client
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Avec `TRUST_PROXY=true`, le conteneur ne doit être joignable **que** par le proxy (c'est le cas avec
`127.0.0.1:3000:3000` dans `compose.prod.yaml`), sinon un client pourrait falsifier son IP.

### Tester l'image en local

```bash
make formation-build && make formation-run    # http://localhost:3000, mot de passe « demo »
make formation-run-stop
```

## Limites connues

- Progression, profil et scores de quiz sont stockés dans le navigateur du stagiaire (localStorage) :
  le formateur ne les voit pas. La vérification de la compréhension se fait à l'oral et en revue de code.
- Un seul mot de passe formateur partagé (pas de comptes nominatifs).
- La limitation des tentatives de connexion est en mémoire : remise à zéro au redémarrage du conteneur.
