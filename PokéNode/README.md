# PokéNode - Pokédex & Team Builder
PokéNode est une application web permettant de consulter une base de données de Pokémon via des API comme pokeapi et de concevoir des équipes stratégiques.

## 📋 Fonctionnalités
- Pokédex Complet : Consultation des fiches techniques et des statistiques détaillées.

- Team Builder : Interface dédiée à la création d'équipes de 6 membres avec persistance des données, et possibilité de définir ses 4 techniques.

- Analyseur de Faiblesses : Calculateur dynamique identifiant les vulnérabilités de chaque pokémon et les faiblesses globales de l'équipe pour aider à concevoir la meilleure équipe.

## 🛠️ Installation
Le projet repose sur l'écosystème Bun pour garantir rapidité et efficacité.

```Bash
# Installer les dépendances
bun install

# Installer happy-dom pour la simulation d'environnement navigateur en test
bun add happy-dom -d

# Ajouter les définitions de types Bun
bun add -d @types/bun
```
## 🧪 Tests & Qualité
La suite de tests utilise le runner natif de Bun. L'environnement est configuré pour simuler le DOM, permettant de valider les composants UI et la logique du TeamService.

## 🏃 Lancement
```Bash
# Lancer l'application en mode développement
bun run dev

# Exécuter la suite de tests (Logique & UI)
bun test
```