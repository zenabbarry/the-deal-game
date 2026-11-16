# Validation

Production vérifiée : https://the-deal-game-rust.vercel.app — le 16 novembre 2026 à 21 h 37 (Paris), sur la version de code `5c186725aa63cb2ff3603f394020d9eb54d2d228`.

- Partie complète sur Vercel avec sauvegarde Supabase : 15 décisions, trois votes concurrents par décision, cinq rôles HTTP ; toutes les assertions réussies. Plus long groupe de votes et lecture publique mesuré : 858 ms.
- Navigateur en production : page publique sans connexion Vercel, formulaire et vote sur une largeur de 390 px, confirmation, actualisation et retour privé conservé. Aucun débordement horizontal ni erreur JavaScript observé sur ce parcours.
- Temps programmé : 18 min 08 en incluant 90 secondes d’accueil, les épilogues, le podium et deux minutes de correction. Les échanges supplémentaires et pauses consomment la marge restante ou prolongent la séance.
- Secrets réservés à l’environnement de production et exclus du dépôt. La clé serveur n’apparaît pas dans le client. Les autres déploiements Vercel restent protégés.

Vérifications du 16 novembre 2026 avant publication :

- 13 tests automatisés réussis : quatre fins, formules et seuils, absence de réponse, événements appliqués une seule fois, accès privés, trois inscriptions simultanées, capacité, votes concurrents, doubles envois, retard, pause et concurrence entre commandes présentateur.
- Partie HTTP complète locale : 15 décisions, trois équipes simultanées, écran public et animateur ; trois parcours distincts (Empire, Ambition, Fall), podium progressif et correction de 15 décisions. Temps maximal mesuré d’un groupe de trois votes et lecture publique : 63 ms sur la machine locale. Ce chiffre n’est pas une garantie pour le réseau de la classe.
- Parcours navigateur : création du salon par formulaire, inscription d’une équipe, lancement présentateur, lecture grand écran, sélection et confirmation d’un vote, actualisation conservant le vote, conséquence privée et accusé de lecture. Aucune erreur JavaScript observée pendant ce parcours.
- Compilation de production réussie. Le budget temporel automatique, avec 90 secondes d’accueil, reste inférieur à 20 minutes dans le test d’horloge.

Limites : pas encore de séance observée avec une classe réelle ; durée humaine de lecture et réseau scolaire à confirmer lors d’une répétition. Les pauses prolongent la durée. Les clients se synchronisent par interrogation du serveur toutes les secondes, pas par connexion WebSocket. Les tests de concurrence ne constituent pas un test de charge à grande échelle.
