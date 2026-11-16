# Validation

Vérifications du 16 novembre 2026 avant publication :

- 13 tests automatisés réussis : quatre fins, formules et seuils, absence de réponse, événements appliqués une seule fois, accès privés, trois inscriptions simultanées, capacité, votes concurrents, doubles envois, retard, pause et concurrence entre commandes présentateur.
- Partie HTTP complète locale : 15 décisions, trois équipes simultanées, écran public et animateur ; trois parcours distincts (Empire, Ambition, Fall), podium progressif et correction de 15 décisions. Temps maximal mesuré d’un groupe de trois votes et lecture publique : 63 ms sur la machine locale. Ce chiffre n’est pas une garantie pour le réseau de la classe.
- Parcours navigateur : création du salon par formulaire, inscription d’une équipe, lancement présentateur, lecture grand écran, sélection et confirmation d’un vote, actualisation conservant le vote, conséquence privée et accusé de lecture. Aucune erreur JavaScript observée pendant ce parcours.
- Compilation de production réussie. Le budget temporel automatique, avec 90 secondes d’accueil, reste inférieur à 20 minutes dans le test d’horloge.

Limites : pas encore de séance observée avec une classe réelle ; durée humaine de lecture et réseau scolaire à confirmer lors d’une répétition. Les pauses prolongent la durée. Les clients se synchronisent par interrogation du serveur toutes les secondes, pas par connexion WebSocket. Les tests de concurrence ne constituent pas un test de charge à grande échelle.
