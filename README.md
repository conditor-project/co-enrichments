# co-enrichments

Module de gestion des enrichissements dans la chaîne de traitement conditor.

## Installation ##

Installation du module via li-helpers.

## Prérequis ##

Ajouter des d'enrchissement(s) dans une base MongoDB puis créer (ou mettre à jour) le fichier conf.json.

## Configuration ##

Créer un fichier conf.json (exemple : conf.default.json).

* **enrichments** : Liste des collections utilisés par le module
* **limit** : Nombre de traitements simultanés*
* **mongodb** : Informations de la base mongodb
    * **metadata** : Collection contenant les métadonnées
    * **connecturl** : URL de connection à la base mongodb
    * **connectOpts** : Options de connection (c.f. [documentation](https://mongoosejs.com/docs/connections.html#options))

```json
{
  "enrichments": [{ "collection": "idHal" }],
  "limit": 5,
  "mongodb": {
    "metadata": "_metadata",
    "connectUrl": "mongodb://localhost:27017/enrichments",
    "connectOpts": {
      "useNewUrlParser": true,
      "useFindAndModify": false,
      "useUnifiedTopology": true
    }
  }
}
```

*\* Note : Le module traite les enrichissements collection par collection. Cependant, il est possible d'effectuer les traitements en parallèle, dans la limit du nombre de collections renseignées.*

## MongoDB ##

Tous les enrichissements doivent être stockés dans une base MongoDB (par défaut : "enrichments"). Une collection regroupant toutes les métadonnées (par défaut : "_metadata") des collections d'enrichissements doit être ajoutée à cette base. Il peut y avoir une nombre illimité de collection d'enrichissements.

Note : [Compass](https://www.mongodb.com/products/compass) ou [Robo 3T](https://robomongo.org/download) sont des outils permettant de visualiser les données présentes dans une base MongoDB.

***L'ajouter des métadonnées dans la collection "metadata" est indispensable au bon fonctionnement du module.***

### Les données d'enrichissements dans MongoDB ###

#### Script d'insertion ####

Un script ([scripts/insertEnrichments.js](scripts/insertEnrichments.js)) permet d'ajouter les enrichissements et les metadata à la base MongoDB.

##### Help #####

* **--input** : Nom du fichier d'enrichissement
* **--collection** : Nom de la collection où seront ajoutés les enrichissements
* **--deduplicate** : Dédoublonne les enrichissements*
* **--limit** : Nombre d'enrichissements traités en parallèle

*Dédoublonnage simple, recherche d'égalité stricte.

```sh
$ node scripts/insertEnrichments.js --help
Usage: insertEnrichments [options]

Options:
  --input <input>            required   input file
  --collection <collection>  required   name of mongodb collection
  --deduplicate              optionnal  deduplicate enrichment(s). It will force --limit value to 1 (& increase processing times)
  --limit <limit>            optionnal  max number of enrichments in queue (default: 1)
  -h, --help                 display help for command
```

##### Insertion sans dédoublonnage #####

Exemple d'insertion sans dédoublonnage :

```sh
$ node scripts/insertEnrichments.js --input=path/to/myFile.json --collection=myCollection

Connecting to : mongodb://localhost:27017/enrichments... done.
Insert enrichments into mongodb... (21426) done.
----------------------------------------
-               metadata               -
----------------------------------------
 new metadata :               2
 duplicate(s) metadata :      0
 metadata error(s) :          0
----------------------------------------
----------------------------------------
-              enrichments             -
----------------------------------------
 new enrichment(s) :          21426
 duplicate(s) enrichment(s) : 0
 enrichment(s) error(s) :     0
----------------------------------------

21426 enrichment(s) processed.
processing time : 16013 ms.
average processing time per enrichment : 0.7473630168953608 ms.
```

*Méthode la plus rapide (car traitements parallèlisables)*.

##### Insertion avec dédoublonnage #####

Exemple d'insertion avec dédoublonnage :

```sh
$ node scripts/insertEnrichments.js --input=path/to/myFile.json --collection=myCollection --deduplicate

Connecting to : mongodb://localhost:27017/enrichments... done.
Insert enrichments into mongodb... (21426) done.
----------------------------------------
-               metadata               -
----------------------------------------
 new metadata :               2
 duplicate(s) metadata :      0
 metadata error(s) :          0
----------------------------------------
----------------------------------------
-              enrichments             -
----------------------------------------
 new enrichment(s) :          21426
 duplicate(s) enrichment(s) : 0
 enrichment(s) error(s) :     0
----------------------------------------

21426 enrichment(s) processed.
processing time : 234608 ms.
average processing time per enrichment : 10.94968729580883 ms.
```
*Méthode la plus lente (car traitements non parallèlisables)*.

### Les metadata dans MongoDB ###

#### Un seul type d'enrichissements avec un même sélecteur ####

La collection "maCollectionA" contient des enrichissements de type :

```json
{
  "selectors": [{
    "selector": "my.selector1",
    "values": [
      ["value1"],
      ["value2"]
    ]
  }],
  "target": {
    "from": "parent",
    "selector": "",
    "key": "enrichments.myId"
  },
  "value": ["myValue"]
}
```

Il faudra alors que la collection "metadata" contienne :

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector1"]
}
```

#### Plusieurs types d'enrichissements avec plusiseurs sélecteurs ####

La collection "maCollectionA" contient des enrichissements de type :

```json
{
  "selectors": [{
    "selector": "my.selector1",
    "values": [
      ["valueA"],
      ["valueB"]
    ]
  }],
  "target": {
    "from": "parent",
    "selector": "",
    "key": "enrichments.myId"
  },
  "value": ["myValue"]
}
```
ET

```json
{
  "selectors": [{
    "selector": "my.selector2",
    "values": [
      ["valueC"],
      ["valueD"]
    ]
  }],
  "target": {
    "from": "parent",
    "selector": "",
    "key": "enrichments.myId"
  },
  "value": ["myValue"]
}
```

Il faudra alors que la collection "metadata" contienne :

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector1"]
}
```

ET

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector2"]
}
```

#### Un seul type d'enrichissements avec multiples sélecteurs ####

La collection "maCollectionA" contient des enrichissements de type :

```json
{
  "selectors": [{
    "selector": "my.selector1",
    "values": [
      ["valueA"],
      ["valueB"]
    ]
  }, {
    "selector": "my.selector2",
    "values": [
      ["valueC"],
      ["valueD"]
    ]
  }],
  "target": {
      "from": "parent",
      "selector": "",
      "key": "enrichments.myId"
    },
    "value": ["myValue"]
}
```

Il faudra alors que la collection "metadata" contienne :

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector1, my.selector2"]
}
```

#### Plusieurs types d'enrichissements avec multiples sélecteurs ####

La collection "maCollectionA" contient des enrichissements de type :

```json
{
  "selectors": [{
    "selector": "my.selector1",
    "values": [
      ["valueA"],
      ["valueB"]
    ]
  }, {
    "selector": "my.selector2",
    "values": [
      ["valueC"],
      ["valueD"]
    ]
  }],
  "target": {
      "from": "parent",
      "selector": "",
      "key": "enrichments.myId"
    },
    "value": ["myValue"]
}
```

ET

```json
{
  "selectors": [{
    "selector": "my.selector3",
    "values": [
      ["valueE"],
      ["valueF"]
    ]
  }, {
    "selector": "my.selector4",
    "values": [
      ["valueG"],
      ["valueH"]
    ]
  }],
  "target": {
      "from": "parent",
      "selector": "",
      "key": "enrichments.myId"
    },
    "value": ["myValue"]
}
```

Il faudra alors que la collection "metadata" contienne :

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector1, my.selector2"]
}
```

ET

```json
{
  "enrichment": "maCollectionA",
  "selectors": ["my.selector3, my.selector4"]
}
```

## Enrichissements ##

### Structures ###

Un fichier d'enrichissements n'est rien d'autre qu'un tableau JSON regroupant un liste d'enrichissements.

```json
[
  {"selectors": [{}], "value": "", "target": {}},
  {"selectors": [{}], "value": 1, "target": {}},
  {"selectors": [{}], "value": [], "target": {}},
  {"selectors": [{}], "value": {}, "target": {}},
  ...
]
```

Chaque enrichissement est représenté par un objet JSON sous la forme : 

```json
{
  "selectors": {
    "my": {
      "selector": [
        "myValue"
      ]
    }
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

### Propriétés d'un enrichissement ###

Explications pour chaque propriété d'un enrichissement :

    - [Object] selectors = Les clés représentent les différents sélecteurs, avec pour chacun la/les valeur(s) associée(s).
    - [Object|Array|String|Int|Boolean] value = La valeur de l'enrichissement.
    - [Object] target = L'endroit où l'enrichissement sera ajouté.
        - [String] from = Point de départ de la sélection (4 choix possibles) :
            - root = racine de l'objet
            - target = l'objet ciblé par le(s) sélecteur(s)
            - parent = le parent de l'objet ciblé par le(s) sélecteur(s)
            - item = chaque item ayant matché le(s) sélecteur(s) (utile lorsqu'un sélecteur "match" plusieurs items d'un tableau)
        - [String] selector =  Un sélector permettant d'affiner le ciblage (la donnée ciblée doit exister)
        - [String] key = La clé où sera stocké l'enrchissement (possibilité de créer des nouvelles propriétées)
    - [Boolean] erase : La nouvelle valeur remplacera l'ancienne en cas de conflit (donnée ciblée déjà existante). Par défaut à : false.

Rappel : Les propriétés de "selectors" et "target.selector" doivent obligatoirement contenir un sélecteur.

**Note : Pour la propriété target uniquement**, un sélecteur est sous la forme "property.subProperty.subSubProperty" (ou ""). Il permet au module de sélectionner n'importe quelle valeur **existante** d'un objet JSON.

Exemples de selecteur (pour un "docObject" Conditor) :

    - "" : renverra un objet JSON (le "docObjet" complet)
    - "authors": renverra un tableau d'objet JSON (où chaque item est un auteur)
    - "authors.halId" : renverra un tableau de string (où chaque item est l'idHal d'un auteur)
    - "authors.affiliations.address" : renverra un tableau de string (où chaque item est l'adresse de chaque affiliations de chaque auteur)

### Les sélecteurs ###

La structure de "selectors" est la suivante :

```js
/*
 * Exemples avec un seul sélecteur
 */
{
  "selectors": {
    "mySelector": [...]
  },
  ...
}

{
  "selectors": {
    "my": {
      "selector": [...]
    }
  },
  ...
}
/*
 * Exemple avec plusieurs sélecteurs
 */
{
  "selectors": {
    "mySelector1": [...],
    "mySelector2": [...],
    "mySelector3": [...],
    ...
  },
  ...
}
```

Si un enrichissement à plusieurs "selectors", le module n'ajoutera l'enrichissement qu'aux objets respectant **tous** les critères.

**Pour la propriété selectors** : Il n'est pas possible de stocker des objets ayant une clé comportant le symbole ".", c'est pourquoi les sélecteurs sont représentés sous la forme d'objet JSON.

Exemples de selecteur (pour un "docObject" Conditor) :

```js
// sélectionne un tableau d'objet JSON (où chaque item est un auteur)
{ "authors": [...] }

// sélectionne un tableau de string (où chaque item est l'idHal d'un auteur)
{ "authors": { "halId" : [...] } }

 // sélectionne un tableau de string (où chaque item est l'adresse de chaque affiliations de chaque auteur)
{ "authors": { "affiliations": { "address": [...] } } }
```

Toutes les valeurs associées aux "selectors" doivent être stockées dans un tableau JSON, comme suit :

```js
/*
 * Exemple avec une seule valeur
 */
{
  "mySelector": [ true ]
}
/*
 * Exemple avec plusieurs valeurs 
 */
{
  "mySelector": [
    "value1",
    "value2",
    "value3",
    "value4",
    ...
  ]
}
/*
 * Exemple avec plusieurs valeurs de n'importe quel type
 */
{
  "mySelector": [
    "value1",
    2,
    true,
    { "value": 1 },
    [ 1, 2, 3, 4, 5 ]
    [ {...}, 1, "2", true]
    ...
  ]
}
```

Pour chaque sélecteurs, le module va comparer les valeurs ciblées par les différents sélecteurs et aux valeurs attendues puis ajouter l'enrichissement à tout objet ayant **au moins** une des ces valeurs.

##### Exemples #####

Je veux ajouter un enrichissement aux objets ayant :

- comme "source" : "mySource" **ET** comme "publicationDate" : "myPublicationDate"

```js
/*
 * Je fais donc un seul enrichissement avec deux sélecteurs dans "selectors"
 */
[
  {
    "selectors": {
      "source": [
        "mySource"
      ],
      "publicationDate": [
        "myPublicationDate"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": { ... }
  }
]

```

Je veux ajouter un enrichissement aux objets ayant :

- comme "source" : "mySource" **OU** comme "publicationDate" : "myPublicationDate"

```js
/*
 * Je fais donc deux enrichissements avec un seul sélecteur dans "selectors"
 */
[
  {
    "selectors": {
      "source": [
        "mySource"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": { ... }
  },
  {
    "selectors": {
      "publicationDate": [
        "myPublicationDate"
      ]
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": { ... }
  }
]
```

Je veux ajouter un enrichissement aux documents ayant :

- Un auteur avec une affiliation avec l'adresse : "myAddress1" **OU** "myAddress2"


```js
/*
 * Je mets donc la valeur : "myAddress1" et "myAddress2"
 * dans le sélecteur : "authors.affiliations"
 */
[
  {
    "selectors": {
      "authors": {
        "affiliations": {
          "address": ["myAddress1", "myAddress2"]
        }
      }
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": { ... }
  }
]
```

Je veux ajouter un enrichissement aux documents ayant :

- Un auteur avec une affiliation avec l'adresse : "myAddress1" **ET** "myAddress2"

```js
/*
 * Je mets donc la valeur : [{"address": "myAddress1"}, {"address": "myAddress2"}]
 * dans le sélecteur : "authors.affiliations"
 */
[
  {
    "selectors": {
      "authors": {
        "affiliations": [[{"address": "myAddress1"}, {"address": "myAddress2"}]]
      }
    },
    "value": [
      "myEnrichmentValue"
    ],
    "target": { ... }
  }
]
```
