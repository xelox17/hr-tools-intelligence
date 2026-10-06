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

**v2** : la v1 échouait à l'import (56 %, `Object reference not set to an
instance of an object` sur le composant Workflow) — les références de
connexion étaient mal câblées. Corrigé : chaque action référence sa
connexion via `host.connectionReferenceName` plutôt que `connectionName`.

**v3** : la v2 échouait à l'import (50 %, `must start with a valid
customization prefix`) — les noms logiques des connection references
utilisaient `lesaffrehr_` (le nom de l'éditeur) au lieu du vrai préfixe de
personnalisation déclaré dans `solution.xml` (`lhr`). Corrigé : les deux
noms logiques commencent maintenant par `lhr_` (ex.
`lhr_sharedcommondataserviceforapps_xxxxx`), identiques à l'octet près
entre `customizations.xml` et le bloc `connectionReferences` du JSON du
flow — vérifié automatiquement avant publication. Un bug annexe a aussi
été corrigé en même temps : le dossier de génération n'était pas nettoyé
entre deux essais, donc le zip pouvait contenir plusieurs fichiers
`Workflows/*.json` obsolètes au lieu d'un seul.

## Import rapide

1. [make.powerautomate.com](https://make.powerautomate.com) → **Solutions**
   → **Importer une solution** → sélectionner `LesaffreURLMonitoring.zip`.
2. À l'écran des références de connexion, associer une connexion
   Dataverse et une connexion Office 365 Outlook valides.
3. Ouvrir le flow importé et vérifier les 3 valeurs spécifiques à votre
   table (nom d'ensemble d'entité, colonne URL, colonne nom) listées dans
   le README du zip — ce sont des hypothèses raisonnables, pas des
   valeurs confirmées contre votre schéma réel.
