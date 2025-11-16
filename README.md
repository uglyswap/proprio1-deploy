# Proprio1 - Configuration de Bypass de Permissions pour Claude Code

Ce dépôt contient la configuration pour activer le mode de bypass de permissions dans Claude Code.

## Fonctionnalité

Cette configuration permet à Claude Code de fonctionner en mode autonome sans demander constamment la permission de l'utilisateur pour exécuter des outils et des commandes.

## Configuration

Les fichiers de configuration suivants sont inclus :

### `.claude/settings.json`
Configuration JSON pour les permissions et l'exécution automatique des outils.

### `.claude/config.yml`
Configuration YAML complète pour le mode autonome et le bypass des permissions.

## Paramètres activés

- ✅ **Bypass des permissions** : Désactive les demandes de confirmation répétées
- ✅ **Mode de confiance** : Active le mode workspace de confiance
- ✅ **Auto-exécution** : Les outils s'exécutent automatiquement sans prompt
- ✅ **Mode autonome** : Claude Code fonctionne de manière autonome

## Utilisation

1. Cloner ce dépôt dans votre workspace
2. Les fichiers de configuration seront automatiquement pris en compte par Claude Code
3. Redémarrer votre session Claude Code si nécessaire

## Sécurité

⚠️ **Avertissement** : Cette configuration désactive les protections de sécurité par défaut.
Utilisez uniquement dans un environnement de confiance et pour des projets dont vous contrôlez le code source.

## Licence

Ce projet est fourni tel quel, sans garantie.
