// Génère la valeur de FORMATEUR_PASSWORD_HASH (à utiliser à la place de FORMATEUR_PASSWORD en production).
//   node server/hash-password.mjs 'mon mot de passe'
//   docker run --rm taskboard-formation node server/hash-password.mjs 'mon mot de passe'
import { hashPassword } from './auth.mjs'

const password = process.argv[2]
if (!password) {
  console.error("Usage : node server/hash-password.mjs '<mot de passe>'")
  process.exit(1)
}
if (password.length < 12) {
  console.error('⚠️  Mot de passe court : 12 caractères minimum recommandés.')
}
console.log(hashPassword(password))
