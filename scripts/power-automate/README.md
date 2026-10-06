# Power Automate - Monitoring des URLs (Outils de Recrutement)

`LesaffreURLMonitoring.zip` est une solution Power Platform (non gérée)
contenant un flow qui vérifie chaque jour à 7h00 (Europe/Paris) les URLs
de la table Dataverse `new_outilderecrutement` ("Outil de Recrutement"),
et envoie un email récapitulatif via Office 365 Outlook uniquement s'il y
a au moins un outil en erreur.

Ce package a été construit à la main à partir du schéma documenté des
solutions Dataverse — il n'a **pas** été exporté depuis un environnement
Power Platform réel (aucun accès à un tenant Lesaffre depuis cet outil).
Un `README.md` détaillé (comportement exact du flow, valeurs à vérifier
avant import, plan de secours si l'import échoue) est inclus **à
l'intérieur du zip**, à sa racine.

## Import rapide

1. [make.powerautomate.com](https://make.powerautomate.com) → **Solutions**
   → **Importer une solution** → sélectionner `LesaffreURLMonitoring.zip`.
2. À l'écran des références de connexion, associer une connexion
   Dataverse et une connexion Office 365 Outlook valides.
3. Ouvrir le flow importé et vérifier les 3 valeurs spécifiques à votre
   table (nom d'ensemble d'entité, colonne URL, colonne nom) listées dans
   le README du zip — ce sont des hypothèses raisonnables, pas des
   valeurs confirmées contre votre schéma réel.
