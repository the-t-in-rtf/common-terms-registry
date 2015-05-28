# Preference Terms Dictionary API
The Preference Terms Dictionary API is a tool to allow developers to find and reuse common terms that describe user needs and preferences, and to contribute new standard terms and aliases not already included in the Preference Terms Dictionary.

This document describes the REST API available to developers.

# Data Objects
This section describes the data objects which are accepted by and returned by the Preference Terms Dictionary API.

## Record
All records in the Preference Terms Dictionary have the following common fields:

|Field|Description|
| --- | --- |
|Type|The type of record, i.e. term, alias, translation, transformation, condition.|
|Permanency|An indication of how likely a field is to change over time.|
|NameSpace|The namespace to use in combination with the UniqueID to construct a URI that refers to the record.|
|UniqueId|A completely unique identifier for this record.|
|Notes|Any additional information associated with this record.|
|Status|The review status of this record.|
|Updated|The date at which the record was last updated.|

[View JSON Schema for records](../schema/record.json)

## Term
A term is a single canonical way of describing a need or solution. For example, users who require high-contrast schemes may be concerned about the ability to set a high-contrast background and foreground color. Each of these would be a common term, identified by a persistent ID such as backgroundColor or foregroundColor.  In addition to the common fields described above, term records have the following fields:

|Field|Description|
| --- | --- |
|valueSpace|A description of the values allowed for this term.|
|termLabel|A short label for this term as it would appear in a menu or listing.|
|definition|A description of the term.|
|applicationUniqueFlag|Whether this term is unique to a particular application.|
|uses|A description of other systems that use this term and how they use it.|
|defaultValue|A suggested default value.|

[View JSON Schema for terms](../schema/term.json)


## alias
An alias is another name for a standard term, with no other differences. When describing system settings and other user preferences, the difference may be simply a matter of formatting. For example, one program might have a registry entry or setting for max.volume and another might have a registry entry or setting called max_volume. Other examples may simply be a matter of alternate wording. For example, one developer may use “loudness” instead of “volume” when describing their settings. In addition to the common fields described above, alias records have the following fields:

|Field|Description|
| --- | --- |
|aliasOf|The unique identifier of the parent record this record is an alias of.|
|termLabel|A short label for this term as it would appear in a menu or listing.|
|uses|A description of other systems that use this term and how they use it.|
|ulUri|If this setting is application-specific, it should point to the application's listing in the Unified Listing.  This field is used for that purpose, and requires a valid URI|
|defaultValue|A suggested default value.|

[View JSON Schema for aliases](../schema/alias.json)


## Translation
A translation is representation of a term in another language with no other differences. For example, in US English, the preference for a particular background color might be presented as “backgroundColor”. In Commonwealth countries, that might be presented as “backgroundColour”. In addition to the common fields described above, translation records have the following fields:

|Field|Description|
| --- | --- |
|translationOf|The unique identifier of the parent record this record is a translation of.|
|valueSpace|A translation of the terms used in the parent record’s value space.|
|termLabel|A translation of the short label for the parent record as it would appear in a menu or listing.|
|definition|A translation of the definition of the parent record.|
|uses|A translation of the uses in the parent record.|
|defaultValue|A translation of the default value in the parent record..|

[View JSON Schema for translations](../schema/translation.json)

## Transformation
Translations and aliases present a term using different words or formatting, with no meaningful difference in the values used to describe a user’s needs or preferences. For example, two devices may have a volume control that can be set from 0 to 10 in increments of 1. If those two devices have the same maximum volume and each of their corresponding volume levels are the same loudness, then a user who prefers (or requires) for the volume to be set to 10 would have the same experience in having that preference applied to each device. It wouldn't matter if one device called the control “volume” and the other called the control “loudness”. On the other hand, if two devices have a different maximum volume, are adjustable using different increments, or have a different perceived loudness when set to the same value, then something else is required.

For these cases, the Preference Terms Dictionary provides a transformation. A transformation provides a bidirectional lossless algorithm for converting from one way of describing preferences and needs to another. To continue the previous example, the common term describing volume preferences might be expressed using a decibel scale. For an implementation that uses 0-10 to indicate volume, the transformation record would provide an algorithm for converting from decibel to 0-10 values and from 0-10 values to decibel values. In addition to the common fields described above, transformation records have the following fields:

|Field|Description|
| --- | --- |
|aliasOf|The unique identifier of the parent record this record is a transformation alias of.|
|valueSpace|A bidirectional lossless algorithm for converting to and from the values used by the common term.|
|termLabel|A translation of the short label for the parent record as it would appear in a menu or listing.|
|uses|A description of other systems that use this term and how they use it.|
|defaultValue|A suggested default value.|

[View JSON Schema for transformations](../schema/transformation.json)


## condition
There are some preferences that are conditional, and depend on the environment and the content an AT user is interacting with. For example, an AT user may wish to have two different color schemes, one for daylight hours, and one for nighttime.

conditions are terms that can be used to clearly identify what settings should be applied under what circumstances.  For example, “greater than”, “less than”, and “in the following range” are all conditions. The conjunctions “and”, “or” as well as the adverbs “not” and “only” are also conditions. conditions can be combined to describe complex conditions.

In addition to the common fields described above, condition records have only one additional field.

|Field|Description|
| --- | --- |
|definition|A clear definition of the condition.|

[View JSON Schema for conditions](../schema/condition.json)

## Relationships
Terms and conditions are unique records that do not refer to another record implicitly. All other record types (aliases, translations, transformations) must refer to a single parent term (see the aliasOf, translationOf, etc. fields proposed above).

# API REST endpoints

## POST /api/record
Creates a new record.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Request (application/json}

    ```
    {
       "type": "term",
       "uniqueId": "newRecord",
       "termLabel": "New Record",
       "definition": "This is a new record.",
       "notes": "This record was created as an example.",
     }
     ```

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/message+json; profile=https://terms.raisingthefloor.org/schema/record.json#
        + Link: <https://terms.raisingthefloor.org/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"New record submitted."
            "record": {
               "type": "term",
               "uniqueId": "newRecord",
               "termLabel": "New Record",
               "definition": "This is a new record.",
               "notes": "This record was created as an example.",
               "updated": "2014-05-25T11:23:32.441Z"
            }
        }
        ```

## PUT /api/record
Update an existing record.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.  Partial records are allowed, but at a minimum you must provide a uniqueId and at least one other field.  If a partial record is submitted, only the supplied fields will be updated.  To clear the value for a field, you must explicitly pass "null" as the value.  Returns the updated record.

+ Request (application/json}

    ```
    {
       "uniqueId": "existingRecord",
       "definition": "This existing record needs to be updated.",
       "notes": null
     }
    ```

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/message.json#
        + Link: <https://terms.raisingthefloor.org/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"Record updated."
            "record": {
                "uniqueId": "existingRecord",
                "definition": "This existing record needs to be updated.",
                "type": "term",
                "termLabel": "Existing Record",
                "definition": "This is an existing record.",
                "notes": "This record is another sample record.",
                "updated": "2014-05-25T11:23:32.441Z"
            }
        }
        ```

## DELETE /api/record/{uniqueId}
Flags a record as deleted.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Parameters
    + uniqueId (required, string) ... The unique identifier of a single record.

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/message+json; profile=https://terms.raisingthefloor.org/schema/message.json#
        + Link: <https://terms.raisingthefloor.org/schema/message.json#>; rel="describedBy"
    + Body
        ```
        {
            "ok": true,
            "message": "Record flagged as deleted."
        }
        ```

## GET /api/record/{uniqueId}{?versions,children}
Returns a single record identified by its uniqueId.  Only the latest published version is displayed by default.  For terms, child record data (aliases, etc.) is included by default.

+ Parameters
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".
    + children (optional, boolean) ... Whether or not to display the child records (if any) of this record.  Defaults to "true".

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/record.json#
        + Link: <https://terms.raisingthefloor.org/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "record": {
                "type": "alias",
                "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                "aliasOf": "soundActive",
                "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                "status": "active",
                "source": "gnome",
                "updated": "2014-05-25T11:23:32.441Z"
            },
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## GET /api/record/{uniqueId}/publish?{version}
Publish a previously submitted draft version of a document (see "Change History" above).

+ Parameters
    + version (required, string) ... The version number of the unpublished draft version (visible in the "versions" attribute of a record).

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/record.json#
        + Link: <https://terms.raisingthefloor.org/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"Draft published."
            "record": {
                "uniqueId": "existingRecord",
                "definition": "This existing record needs to be updated.",
                "type": "term",
                "termLabel": "Existing Record",
                "definition": "This is an existing record.",
                "notes": "This record is another sample record.",
                "updated": "2014-05-25T11:23:32.441Z"
            }
        }
        ```

## GET /api/records/{?updated,status,type,offset,limit}
The full list of records.  Returns all record types by default.

+ Parameters
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + type (optional, string) ... The type of records to return.  Supported values are ("term","alias","transform","translation", and "condition"). Can be repeated to include multiple record types.
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for all records (including any unpublished drafts).  Defaults to "false".
    + children (optional, boolean) ... Whether or not to display the child records (if any) of the records returned.  Defaults to "false".

+ Response 200 (application/records+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/records.json#
        + Link: <https://terms.raisingthefloor.org/schema/records.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "params": {
                "offset": 0,
                "limit": 100,
                "updated": "2014-04-01T00:00:00.000Z",
                "statuses": [ "unreviewed" ],
                "types": [ "alias" ]
            },
            "records": [
                     {
                        "type": "alias",
                        "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                        "aliasOf": "soundActive",
                        "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                        "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                        "status": "active",
                        "source": "gnome"
                        "updated": "2014-05-25T11:23:32.441Z"
                    }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## GET /api/terms/{?updated,status,offset,limit,versions,children}
The list of standard terms. Equivalent to using /api/records with the query parameter `type=term`.  Supports the same query parameters as /api/records except for `type`.  Terms include all of their associated records, include aliases, transforms, and translations.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".
    + children (optional, boolean) ... Whether or not to display the child records (if any) of this record.  Defaults to "true".

+ Response 200 (application/headers+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/records.json#
        + Link: <https://terms.raisingthefloor.org/schema/records.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "offset": 0,
            "limit": 1,
            "records": [
                    {
                        "type": "term",
                        "uniqueId": "brailleGrade",
                        "valueSpace": "uncontracted, contracted",
                        "termLabel": "braille grade",
                        "definition": "grade of Braille to use when using a Braille display",
                        "status": "unreviewed",
                        "source": "gpii",
                        "aliases": [
                                {
                                    "type": "alias",
                                    "uniqueId": "Input Braille Grade, output Braille Grade",
                                    "aliasOf": "brailleGrade",
                                    "notes": "The original alias record contained the following additional information:\n\ndefinition:Allow to select braille grade for braille input, Allow to select braille grade for braille output on braille display\nuserPreference:Input Braille Grade, output Braille Grade\nvalueSpace:Multiple options based on the grade supported with MA\ngroup:Braille,Everywhere\nid:25, 32\n",
                                    "termLabel": "Input Braille Grade, output Braille Grade",
                                    "status": "unreviewed",
                                    "source": "mobileAccessCf"
                                }
                        ]
                    }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## GET /api/aliases/{?updated,status,offset,limit,versions}
The list of aliases. Equivalent to using /api/records with the query parameter `type=alias`.  Supports the same query parameters as /api/records except for `type`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".

+ Response 200 (application/records+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/records.json#
        + Link: <https://terms.raisingthefloor.org/schema/records.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "offset": 0,
            "limit": 1,
            "records": [
                     {
                        "type": "alias",
                        "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                        "aliasOf": "soundActive",
                        "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                        "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                        "status": "active",
                        "source": "gnome"
                        "updated": "2014-05-25T11:23:32.441Z"
                    }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## GET /api/transforms/{?updated,status,offset,limit,versions}
The list of transforms. Equivalent to using /api/records with the query parameter `type=transform`.  Supports the same query parameters as /api/records except for `type`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".

## GET /api/translations/{?updated,status,offset,limit,versions}
The list of translations. Equivalent to using /api/records with the query parameter `type=translation`.  Supports the same query parameters as /api/records except for `type`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".

## GET /api/conditions/{?updated,status,offset,limit,versions}
The list of conditions.  Equivalent to using /api/records with the query parameter `type=condition`.  Supports the same query parameters as /api/records except for `type`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".

## GET /api/search/{?q,status,sort,offset,limit,versions}
Performs a full text search of all data, returns matching terms.  Only standard terms are returned.  All other associated record types are combined with the standard term into a single record.

+ Parameters
    + q (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax](https://github.com/rnewson/couchdb-lucene) to construct more complex searches.
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + sort (optional,string) ... The sort order to use when displaying records.  Conforms to [lucene's query syntax][1].
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for each record (including any unpublished drafts).  Defaults to "false".

+ Response 200 (application/search+json)
    + Headers
        + Content-Type: application/record+json; profile=https://terms.raisingthefloor.org/schema/search.json#
        + Link: <https://terms.raisingthefloor.org/schema/search.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "params": {
                "offset": 0,
                "limit": 1,
                "q": "soundActive",
                "sort": "uniqueId ASC"
            },
            "records": [
                {
                    "type": "term",
                    "uniqueId": "6DotComputerBrailleTable",
                    "definition": "Allow selection of 6 dot computer braille",
                    "status": "unreviewed",
                    "source": "gpii",
                    "aliases": [
                        {
                            "type": "alias",
                            "uniqueId": "6 dot computer braille table",
                            "aliasOf": "6DotComputerBrailleTable",
                            "termLabel": "6 dot computer braille table",
                            "notes": "The original alias record contained the following additional information:\n\ndefinition:Allow selection of 6 dot computer braille\nuserPreference:6 dot computer braille table\nvalueSpace:Multiple options based on the grade supported with MA\ngroup:Braille,Everywhere\nid:3\n",
                            "status": "unreviewed",
                            "source": "mobileAccessCf"
                            "updated": "2014-05-25T11:23:32.441Z"
                        }
                    ],
                    "updated": "2014-05-25T11:23:32.441Z"
                }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```