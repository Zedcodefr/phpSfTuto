# Solution de l'atelier pratique Symfony

Pour vérifier : copier ces fichiers par-dessus `apps/api-symfony/src/` puis `make sf-atelier` → 16 tests verts
(`make sf-test` et `make sf-check` restent verts).

```bash
cp -R formateur/solutions/symfony-atelier/src/. apps/api-symfony/src/
make sf-cc && make sf-atelier
```

| Exercice | Fichiers |
|---|---|
| A1 — `GET /api/tasks/stats` | `Service/TaskStats.php`, action `stats()` de `Controller/TaskController.php` |
| A2 — `#[NotShouting]` | `Validator/NotShouting.php`, `Validator/NotShoutingValidator.php`, `Dto/CreateTaskInput.php`, `Dto/UpdateTaskInput.php` |
| A3 — `X-Response-Time` | `EventListener/ResponseTimeListener.php` |
| A4 — `POST /api/tasks/{id}/complete` | `Exception/TaskAlreadyDone.php`, `Task::complete()` dans `Entity/Task.php`, action `complete()` |
| A5 — `app:tasks:report` | `Command/TaskReportCommand.php` (commande invokable, Symfony 7.3+) |

`Controller/TaskController.php`, `Entity/Task.php` et les deux DTO sont des copies complètes du projet de départ
auxquelles s'ajoute l'atelier. Les bonus (GROUP BY, log des requêtes lentes, tests unitaires) ne sont pas fournis.

Il existe d'autres bonnes réponses (une classe d'écouteur par événement, une commande qui étend `Command`,
un `ExceptionListener` maison au lieu de `#[WithHttpStatus]`...) : en débrief, ce qui compte est que le stagiaire
sache dire **quand** son code s'exécute dans le cycle de la requête et **qui** l'a enregistré.
