# co-enrichments
Module de gestion des enrichissements dans la chaîne de traitement conditor

## Installation ##

Installation du module via li-helpers

## Prérequis ##

Ajouter un/des fichier(s) d'enrchissement(s) puis créer (ou mettre à jour) le fichier conf.json

## Configuration ##

Créer un fichier conf.json (exemple : conf.default.json).
Le répertoire datasets/ permet de centraliser les différents fichiers.

```json
{
  "datasets": ["datasets/enrichments1.json", "datasets/enrichments2.json"]
}
```

## Enrichissements ##

Un fichier d'enrichissements n'est rien d'autre qu'un tableau JSON regroupant un liste d'enrichissements.

```json
[
  {"selectors": {}, "value": "", "target": {}},
  {"selectors": {}, "value": 1, "target": {}},
  {"selectors": {}, "value": [], "target": {}},
  {"selectors": {}, "value": {}, "target": {}},
  ...
]
```

Chaque enrichissement est représenté par un objet JSON sous la forme : 

```json
{
  "selectors": {
    "my.selector": [
      "myValue"
    ]
  },
  "value": [
    "enrichmentValue"
  ],
  "target": {
    "from": "root",
    "selector": "",
    "key": "enrichments.myKey"
  }
}
```

Explications :

- selectors : Liste des différentes sélecteurs (clé) à tester sa valeur associée (valeur).(1) 
- value : La valeur de l'enrichissement (peut être un string, un int, un array, un object, etc)
- target : L'endroit ou l'enrichissement sera ajouté
    - from : Point de départ. 4 choix possibles
        - root : racine de l'objet
        - target : l'objet ciblé par le(s) sélecteur(s)
        - parent : le parent de l'objet ciblé par le(s) sélecteur(s)
        - item : chaque item ayant matché le sélecteur (utile lorsqu'un sélecteur renvois un tableau)
    - selector : un sélector permettant d'affiner le ciblage (la donnée doit exister)
    - key : la clé où sera stocké l'enrchissement (possibilité de créer des nouvelles propriétées)
- erase : [true|**false**] Si besoin, remplace l'ancienne valeur présente à l'endroit où l'enrichissement sera ajouté (default value : false)

(1) Notes :

Le sélecteur est sous la forme "property.subProperty.subSubProperty". Exemples de selectors dans Conditor :

    - "" : renverra l'objet JSON complet
    - "authors": renverra un tableau d'objet JSON (où chaque item est un auteur)
    - "authors.halId" : renverra un tableau de string (où chaque item est l'idHal d'un auteur)
    - "authors.affiliations.address" : renverra un tableau de string (où chaque item est l'adresse de chaque affiliations de chaque auteurs)

Plusieurs clés renseignées dans "sélectors" équivaut à faire un ET logique. Un OU logique sera représenté par (au moins) deux enrichissements.

```js
// ET logique
[
  {
    "selectors": {
      "property1.subProperty": [
        "value1"
      ],
      "property2": [
        "value2"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }
]

// OU logique
[
  {
    "selectors": {
      "property1.subProperty": [
        "value1"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }, {
    "selectors": {
      "property2": [
        "value2"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }
]
```

Toutes les valeurs associées à un sélecteur sont stockées dans un tableau JSON. S'il contient plusieurs valeurs alors l'objet en possédant au moins une sera retourné. 

```js
/*
 * Si authors.id = "id1" ou authors.id = "id2"
 * Alors l'enrchissement sera ajouté à l'objet
 */
[
  {
    "selectors": {
      "authors.id": [
        "id1", "id2"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }
]

/*
 * Si authors.affiliations.address "contient au moins" "myAddress1" "myAddress2"
 * Alors l'enrchissement sera ajouté à l'objet
 */
[
  {
    "selectors": {
      "authors.affiliations.address": ["myAddress1", "myAddress2"]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }
]

/*
 * Si authors.affiliations "contient au moins" [{"address": "myAddress1"}] et [{"address": "myAddress2"}]
 * Alors l'enrchissement sera ajouté à l'objet
 */
[
  {
    "selectors": {
      "authors.affiliations": [[{"address": "myAddress1"}, {"address": "myAddress2"}]]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": {
      "from": "root",
      "selector": "",
      "key": "enrichments.myKey"
    }
  }
]
```

## Exemple ##

Pour un chaque document dans Conditor, je souhaite ajouter l'idRef "https://www.idref.fr/myIdRef" aux auteurs ayant l'idHal "myIdHal".

L'objet JSON représentant cet enrichissement sera donc de la forme suivante :

```json
{
  "selectors": {
    "authors.idHal": [
      "myIdHal"
    ]
  },
  "value": [
    "https://www.idref.fr/myIdRef"
  ],
  "target": {
    "from": "parent",
    "selector": "",
    "key": "idRef"
  }
}
```
