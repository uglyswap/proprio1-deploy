# Proprio1 - Guide de Permissions pour Claude Code Web

Ce dépôt contient des informations et configurations pour gérer les permissions dans **Claude Code sur le Web**.

## Comment fonctionnent les permissions sur Claude Code Web

Sur la version web de Claude Code, les permissions sont gérées directement par l'interface web lorsque Claude tente d'utiliser des outils. Il n'existe pas de fichiers de configuration qui permettent de bypasser automatiquement toutes les demandes.

## Solutions pour éviter les demandes répétées

### ✅ Solution 1 : Cocher "Remember this decision" (Recommandé)

Quand une popup de permission apparaît pour un outil :
1. **Cochez la case "Remember this decision"** ou **"Se souvenir de ce choix"**
2. Cliquez sur "Allow" ou "Autoriser"
3. Cette permission sera mémorisée pour ce dépôt

### ✅ Solution 2 : Utiliser un dépôt de confiance

Certains dépôts peuvent être marqués comme "trusted" (de confiance) :
1. Quand le message apparaît pour la première fois
2. Cherchez une option du type "Trust this repository"
3. Cela réduit le nombre de demandes de permission

### ✅ Solution 3 : Accepter les permissions au fil de l'eau

La première fois que vous utilisez le dépôt :
- Claude demandera la permission pour chaque type d'outil
- Une fois accordée avec "Remember", ces permissions persistent
- Après quelques interactions, la plupart des outils seront pré-approuvés

## Fichiers de configuration inclus

Ce dépôt contient des fichiers de configuration qui **peuvent** être utilisés par certaines versions de Claude Code :

### `.claude/permissions.json`
Définit les permissions souhaitées pour le projet (format de référence)

### `.claude/web-settings.json`
Configuration suggérée pour les outils et opérations

**Note** : Ces fichiers servent principalement de documentation et peuvent ne pas être directement interprétés par la version web actuelle

## Outils qui peuvent demander des permissions

Voici les outils qui peuvent nécessiter une approbation :
- 🔧 **Bash** - Exécution de commandes shell
- 📖 **Read** - Lecture de fichiers
- ✏️ **Write** - Création de nouveaux fichiers
- ✂️ **Edit** - Modification de fichiers existants
- 🔍 **Grep** - Recherche dans les fichiers
- 📁 **Glob** - Recherche de fichiers par pattern
- 🤖 **Task** - Lancement d'agents de tâches
- 🌐 **WebFetch** - Récupération de contenu web
- 🔎 **WebSearch** - Recherche sur le web

## Conseils pratiques

### Pour une expérience fluide :
1. **Lors de la première utilisation** : Acceptez les permissions pour les outils de base (Read, Grep, Glob)
2. **Cochez toujours "Remember"** : Cela évite les demandes futures
3. **Soyez patient** : Après 3-4 demandes initiales, l'expérience devient fluide

### Ce qui est mémorisé :
- ✅ Les permissions sont mémorisées **par dépôt**
- ✅ Les permissions persistent entre les sessions
- ✅ Vous pouvez révoquer les permissions à tout moment

## En résumé

**La vraie solution** pour éviter les demandes répétées sur Claude Code Web :
1. Cochez **"Remember this decision"** à chaque popup
2. Accordez les permissions pour les outils dont vous avez besoin
3. Après quelques interactions, vous n'aurez plus de demandes

Il n'existe pas de "mode bypass complet" sur la version web pour des raisons de sécurité.

## Sécurité

⚠️ **Note importante** : Les permissions existent pour votre protection. En les accordant, vous permettez à Claude d'accéder et de modifier vos fichiers. Assurez-vous de :
- Utiliser Claude Code uniquement sur des dépôts de confiance
- Vérifier les changements avant de les accepter
- Utiliser le contrôle de version (git) pour pouvoir annuler les modifications

## Licence

Ce projet est fourni tel quel, sans garantie.
