# =============================================================================
#  TaskBoard - cibles du formateur (inclus par le Makefile si présent)
#  Exclu du projet distribué aux participants (voir apps/formation/scripts/package.mjs)
# =============================================================================

##@ Support de formation (app React à héberger, http://localhost:5174 en dev)
.PHONY: formation-install formation-dev formation-stop formation-lint formation-build formation-run formation-run-stop formation-hash formation-publish-stagiaire

DCF       := $(DC) -f compose.yaml -f compose.formation.yaml
FORMATION := $(DCF) --profile formation run --rm --no-deps formation

formation-install: ## Installe les dépendances de l'app de formation
	$(FORMATION) npm ci

formation-dev: ## Lance l'app de formation en dev (mot de passe formateur : formateur)
	$(DCF) --profile formation up -d formation
	@echo "✅ Support de formation : http://localhost:5174 (espace formateur : mot de passe « formateur »)"

formation-stop: ## Arrête l'app de formation (dev)
	$(DCF) --profile formation stop formation

formation-lint: ## Lint + types de l'app de formation
	$(FORMATION) npm run lint

formation-build: ## Construit l'image Docker de production (taskboard-formation)
	docker build -f apps/formation/Dockerfile -t taskboard-formation .

formation-run: ## Teste l'image de prod en local sur http://localhost:3000 (mot de passe : demo)
	docker run --rm -d --name taskboard-formation -p 3000:3000 \
		-e FORMATEUR_PASSWORD=demo -e SESSION_SECRET=local-demo-secret-0123456789abcdefghij -e COOKIE_SECURE=false \
		taskboard-formation
	@echo "✅ http://localhost:3000 — arrêter avec make formation-run-stop"

formation-run-stop: ## Arrête l'image de prod lancée en local
	docker stop taskboard-formation

DEPLOY_SSH  ?= ssh -p 5555 -o BatchMode=yes
DEPLOY_HOST ?= user@serv.zedcode.fr
DEPLOY_DIR  ?= taskboard-formation

formation-deploy: ## Met à jour https://formation.zedcode.fr (sources → serveur, build, redémarrage)
	rsync -az --delete -e "$(DEPLOY_SSH)" --exclude node_modules --exclude vendor --exclude '/apps/api-symfony/var' \
		--exclude dist --exclude '/apps/formation/protected' --exclude '/apps/formation/public/downloads' \
		--exclude .phpunit.cache --exclude .DS_Store --exclude .idea --exclude .git ./ $(DEPLOY_HOST):$(DEPLOY_DIR)/src/
	$(DEPLOY_SSH) $(DEPLOY_HOST) 'cd $(DEPLOY_DIR) && docker build -q -f src/apps/formation/Dockerfile -t taskboard-formation src && docker compose up -d'
	@echo "✅ Déployé : https://formation.zedcode.fr"

STAGIAIRE_REPO ?= git@github.com:Zedcodefr/phpTuto-kaamelot.git

formation-publish-stagiaire: ## Pousse le projet stagiaire (= contenu du zip) sur STAGIAIRE_REPO (m="message" optionnel)
	$(FORMATION) npm run package
	@set -e; src=$$(git describe --always --dirty); tmp=$$(mktemp -d); trap 'rm -rf "$$tmp"' EXIT; \
	git clone -q $(STAGIAIRE_REPO) "$$tmp/repo"; \
	find "$$tmp/repo" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +; \
	unzip -q apps/formation/public/downloads/taskboard-projet.zip -d "$$tmp/zip"; \
	cp -R "$$tmp/zip/taskboard/." "$$tmp/repo/"; \
	cd "$$tmp/repo"; git add -A; \
	if git diff --cached --quiet; then echo "✅ $(STAGIAIRE_REPO) déjà à jour"; exit 0; fi; \
	git diff --cached --stat | tail -1; \
	git commit -q -m "$(or $(m),Mise à jour du projet de départ (formation $$src))"; \
	git push -q origin HEAD; \
	echo "✅ Poussé sur $(STAGIAIRE_REPO) (formation $$src)"

formation-hash: ## Génère le hash du mot de passe formateur (make formation-hash p='mon mot de passe')
	@docker run --rm taskboard-formation node server/hash-password.mjs '$(p)'
