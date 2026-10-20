# Solution du kata Doctrine & DQL

Pour vérifier : copier ces fichiers par-dessus ceux de `apps/api-symfony/src/Kata/` puis `make sf-kata` → 21 tests verts.

```bash
cp -R formateur/solutions/doctrine-kata/src/Kata/. apps/api-symfony/src/Kata/
make sf-kata
```

Il existe souvent plusieurs bonnes réponses (QueryBuilder ou DQL brut, `LEFT JOIN ... IS NULL` ou `NOT EXISTS`...) :
ce qui compte en revue, c'est que le stagiaire sache **expliquer** la requête SQL générée (onglet Doctrine du profiler
ou `make dql`) et pourquoi son choix est correct.
