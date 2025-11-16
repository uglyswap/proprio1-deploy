# Proprio1 - Configuration de Bypass de Permissions pour Claude Code Web

Ce dépôt contient la configuration pour activer le mode de bypass de permissions dans **Claude Code sur le Web**.

## Fonctionnalité

Cette configuration permet à Claude Code Web de fonctionner en mode autonome sans demander constamment la permission de l'utilisateur pour exécuter des outils et des commandes.

## Configuration

Les fichiers de configuration suivants sont inclus :

### `.claude/permissions.json`
Configuration des permissions auto-approuvées pour tous les outils et opérations.

### `.claude/web-settings.json`
Configuration spécifique pour Claude Code Web avec bypass des confirmations.

## Paramètres activés

- ✅ **Bypass des permissions** : Désactive les demandes de confirmation répétées
- ✅ **Mode de confiance** : Active le mode workspace de confiance
- ✅ **Auto-exécution** : Les outils s'exécutent automatiquement sans prompt
- ✅ **Auto-approbation** : Tous les outils (`*`) sont pré-approuvés
- ✅ **Opérations autorisées** : read, write, execute, network, git

## Utilisation pour Claude Code Web

### Méthode 1 : Via l'interface web
1. Ouvrir Claude Code sur le web (https://claude.ai/code)
2. Connecter ce dépôt à votre workspace
3. Dans les paramètres du projet, activer "Trusted Workspace"
4. Les fichiers `.claude/*.json` seront automatiquement détectés

### Méthode 2 : Configuration manuelle
1. Dans l'interface Claude Code Web, cliquer sur l'icône de paramètres
2. Activer l'option "Auto-approve tool executions"
3. Cocher "Trust this workspace"
4. Sauvegarder les préférences

### Méthode 3 : Déclarer le workspace comme fiable dès le début
Lorsque Claude Code Web vous demande la première fois si vous faites confiance au workspace, cliquer sur "Always trust" au lieu de "Trust once"

## Comment cela fonctionne

Les fichiers de configuration dans `.claude/` sont lus par Claude Code Web pour définir le comportement des permissions :

- **permissions.json** : Définit quels outils et opérations sont auto-approuvés
- **web-settings.json** : Configure le comportement spécifique à la version web

Lorsque vous ouvrez ce workspace dans Claude Code Web, le système détecte ces fichiers et applique les paramètres de bypass automatiquement.

## Instructions détaillées

### Pour éviter les demandes répétées :

1. **Au premier lancement** : Quand Claude Code Web vous demande si vous faites confiance au workspace, sélectionnez **"Always trust"** ou **"Toujours faire confiance"**

2. **Si déjà en session** :
   - Cliquez sur l'icône ⚙️ (paramètres) en haut à droite
   - Activez "Auto-approve tool executions"
   - Activez "Trusted workspace mode"
   - Cliquez sur "Save" ou "Enregistrer"

3. **Pour ce dépôt spécifique** :
   - Les fichiers `.claude/*.json` sont déjà configurés
   - Ils seront automatiquement appliqués une fois le workspace approuvé

## Outils auto-approuvés

Avec cette configuration, les outils suivants n'exigeront plus de confirmation :
- ✅ Bash (exécution de commandes)
- ✅ Read (lecture de fichiers)
- ✅ Write (écriture de fichiers)
- ✅ Edit (modification de fichiers)
- ✅ Grep (recherche dans les fichiers)
- ✅ Glob (recherche de fichiers)
- ✅ Task (agents de tâches)
- ✅ WebFetch (requêtes web)
- ✅ WebSearch (recherche web)

## Sécurité

⚠️ **Avertissement** : Cette configuration désactive les protections de sécurité par défaut.
Utilisez uniquement dans un environnement de confiance et pour des projets dont vous contrôlez le code source.

## Support

Si vous rencontrez des problèmes :
1. Rechargez la page du navigateur
2. Déconnectez-vous et reconnectez-vous à Claude Code Web
3. Vérifiez que les fichiers `.claude/*.json` sont bien présents dans le dépôt
4. Assurez-vous d'avoir bien activé "Trusted workspace" dans les paramètres

## Licence

Ce projet est fourni tel quel, sans garantie.
