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

- selectors : Liste des différentes clés à tester, avec un sélecteur par clé et sa valeur associé.(1) 
- value : La valeur de l'enrichissement (peut être un string, un int, un array ou un object)
- target : L'endroit ou l'enrichissement sera ajouté
    - from : Point de départ. 4 choix possibles
        - root : racine de l'objet
        - target : l'objet ciblé
        - parent : le parent de l'objet ciblé
        - item : chaque item ayant matché lors du test (utile lorsqu'un sélectors est un tableau)
    - selector : un sélector permettant d'afiner le ciblage
    - key : la clé où sera ajouté l'enrchissement (possibilité de créer des nouvelles propriétées)
- erase : [true|**false**] Remplace l'ancienne valeur présente à l'endroit où l'enrichissement sera ajouté (default value : false)

(1) Notes :

Le sélecteur est sous la forme "clé.sousClé.sousSousClé". Exemples de selectors dans Conditor :

    - "" : renverra l'objet JSON complet
    - "authors": renverra un tableau d'objet JSON (ou chaque item est un auteur)
    - "authors.halId" : renverra un tableau de string (ou chaque item est l'idHal d'un auteur)
    - "authors.affiliations.address" : renverra un tableau de string (ou chaque item est l'adresse de chaque affiliations de chaque auteurs)

Plusieurs clés renseignés dans "sélectors" équivaut à faire un ET logique. Un OU logique sera représenté par 2 (ou plus) enrichissements.

```js
// ET logique
[
  {
    "selectors": {
      "authors.myPropertie": [
        "myValue"
      ],
      "authors.anotherProperty": [
        "anotherValue"
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
]

// OU logique
[
  {
    "selectors": {
      "authors.myPropertie": [
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
  }, {
    "selectors": {
      "authors.anotherPropertie": [
        "anotherValue"
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
]
```

Toutes les valeurs recherchées stockées dans un tableau JSON. S'il contient plusieurs valeurss alors l'objet en possédant au moins une sera retourné.

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
      "enrichmentValue"
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
