# INN Antibody Annotation Format → JSON Format

This document describes a mapping between Prof. Andrew Martin’s “[INN
Antibody Annotation Format](./INN_annotation_format.pdf)” for antibody-
based therapeutics and a new JSON data schema that is to be imported 
into a MongoDB database and made accessible to queries through a web 
front-end. The conversion from the INN format to the JSON format is 
carried out using [this parser](../antibody_annotation_to_json/), and 
the constraints of the output JSON data are defined in [this schema
document](./INN_antibody_schema.json).

The original INN annotation format is flat text and consists of
`keyword[i]: value;` tuples, where the keyword often has one or more
instance numbers appended in square brackets. These instances represent
different chains (or single-origin portions of a fused chain) that
require separate annotations for the same attribute. Some keywords may
also be followed by domain, region or isoform indicators in parentheses.
See [here](./INN_annotation_format.pdf) for more detail on the INN 
annotation format.

Below is the terminology used in this documentation for roughly
equivalent concepts in the two data formats.

| INN annotation              | JSON                 |
|-----------------------------|----------------------|
| field / record<sup>\*</sup> | property<sup>+</sup> |
| keyword                     | name                 |
| value                       | value                |

<sup>\*</sup> *record* in the INN annotation should not be confused with
the same term in tabular/relational data, where it refers to the whole
units of observation (i.e. rows). In the INN annotation, a *record* is
more similar to an individual cell in tabular data, while the
observational units (antibody-based therapeutics) are in separate text
files.

<sup>+</sup> *property* is used here both when referring to the general
attribute (similar to *field* in the INN annotation) or an individual
case (similar to *record* in INN annotation terms).

An example of two records in the INN format:

```
VLRange[1]: 1-112;
VLRange[5]: 865-974;
```
The same data looks like this in the JSON format:
```
“VLRange”: [
  {
	“Instance”: 1,
	“Start”: 1,
	“End”: 112
  },
  {
	“Instance”: 5,
	“Start”: 865,
	“End”: 974
  }
]
```

The instance numbers are moved from the INN format keywords to nested
objects within the JSON values. Since there is more than one instance
with the same property, the JSON value is an array of objects. In the
simpler and more flexible INN format, the values for different instances
are in separate records, while JSON allows a nested structure with a
single property name referencing an array of values, with each item in
the array corresponding to a different instance.

Below is an example of the conversion of a complete annotation file for a
fairly complicated antibody:

- [original INN annotation for Request 12023](../test/input_data/12023.txt)
- [corresponding JSON annotation format](../test/expected_json_files/12023.json)


## Overview of the mapping

The JSON property names match the INN field keywords as closely as
possible, including the use of PascalCase. The only changes are as
follows:

- Removal of instance numbers and surrounding square brackets,

- Removal of disulfide isoform indicators in square brackets e.g. in
  `HeavyDisulfidesIntra[A]`

- Removal of other domain/region indicators in parentheses e.g. in
  `HeavyChainClass(CH1)` and `CDRSource(L1,L2,L3)`,

- Removal of parts of keywords that are aggregated in the JSON format,
  e.g. `Confirmed` and `Potential` in the `*NGlycos` and `*OGlycos`
  fields[^1],

- Removal of the spaces in `Heavy Chain` and `Light Chain`,

- For top-level `Note` records, the keyword of the related record (the
  preceding one) is prepended with a hyphen, e.g. `Format-Note`.

Any information removed from a name is moved to a subproperty in the
JSON format. More details and examples are provided further down in this
documentation.

In terms of their structure and types of values within the JSON format,
the annotations fall into two groups, depending on their cardinality
with the whole antibody:

1.  Single annotations for the whole antibody. The JSON value is a
    string and is unchanged from the original annotation. The only
    properties in this group are `Request`, `Format`, `ID`, `AbML`,
    `HeavySource`, `LightSource`, and some notes (see
    *[below](#a-note-on-notes)*).

2.  The vast majority are instance-specific: they can – but don’t
    necessarily always – apply to one or more of the instances or chains
    that make up an antibody. The JSON value is an array of objects,
    with each item containing a mandatory `Instance`/`Instances`
    subproperty. Many properties – like `Antigen`, `Type`, and
    `Conjugate`[^2] – only ever apply to the whole antibody in the case
    of standard antibody formats, but may describe several instances in
    more complicated formats. For consistency, the values are always
    arrays of objects – even for standard antibodies – where the array
    contains a single object, and the instance subproperty takes the
    value `0`. The item subproperties for this group of properties can be
    summarised as follows (with more details and examples later):

    - `Instance`/`Instances` is mandatory. If there are no square brackets
      and thus no instances, the value is `0`. For inter-chain disulfide
      annotations, `InstanceX`/`InstanceL` and `InstanceY`/`InstanceH` are
      used, and both are given the value `0` if there are no square
      brackets.
    - The value in the INN format is either made a single subproperty or
	  split into several. The single subproperty in the former case or the
	  primary information in the latter case is called `Value`/`Values` or
	  a more descriptive name if it is not already indicated by the parent
	  property. For `Fusion` and `Interaction` properties, the values are
	  the instances themselves, so there are no additional `Values`
	  subproperties.[^3]
    - `Note` is optional.
    - Additional subproperties may arise from the aggregation of some
	  fields into single properties, e.g. `Confirmed` and `Potential` in
	  the `*NGlycos` and `*OGlycos` fields.

<a name="a-note-on-notes"></a>`Note` records are treated differently
depending on their associated record. Those that relate to
whole-antibody properties (e.g. `ID`) become top-level JSON properties
with the related keyword prepended with a hyphen (e.g. `ID-Note`). These
notes contain single string values, except `Format-Note`, which can
contain multiple notes for different instances (e.g. in request
*[12155](../test/input_data/12155.txt)*), and so is an array of objects. All other `Note` records are
subsumed into their related properties.

The grammar of the subproperty names indicates when to expect an array
of values. It can be different between properties but is consistent
within properties. If the `Instance(s)` subproperty is written in the
singular form, its value is always a single number.[^4] If plural, it
may refer to one or more instances, so its value is always an array[^5]
(even if single-item). The same rule is followed for the `Value(s)` and
`Domain(s)`[^6] subproperties. The `Regions`, `Positions` and
`Mutations` subproperties are always arrays and so always written
plural.

The integrity of the data values is maintained through the format
conversion by making only minor structural or syntactic (and not
semantic) changes, which are as follows:

- Some values are split into several subproperties (as described above),
  but they always remain grouped together within a single item of the
  parent property.
- Instance, domain and region indicators (within square brackets or
  parentheses after INN keywords) are moved to JSON subproperties. Where
  there are several comma-separated indicators, the subproperty is an
  array. In the absence of square brackets for annotations with a
  mandatory instance subproperty, the value `0` is chosen (for `Instance`)
  or `[0]` (for `Instances`).
- `Positions`, `Values` and `Mutations` subproperties are split into
  arrays.
- For `Fusion` and `Interaction` record values, the space-separated
  string of instance numbers (e.g. `1 2 3`) is split into an array of
  number items (e.g. `[1, 2, 3]`) for consistency with all of the other
  `Instances` subproperties.
- Similarly, `Domains` values are changed from a space-separated string
  to an array of strings (e.g. `VH CL` becomes `[“VH”, “CL”]`).
- All `NONE` values are converted to JSON’s `null` type. This value means
  the explicit absence of the attribute (rather than a failure of
  measurement or the data getting lost).
- For `CHSRange` records that only mention two deletions, the `Start`
  and `End` subproperties of the JSON property are given null values.

The integrity of the data as it is run through the parser will be
verified with unit tests covering the full range of expected data and
edge cases. See the [test/README page](../test/README.md) for a
complete overview of how this project is tested.


## Details of the mapping for every INN annotation keyword


| INN keyword (excluding optional <br>instance/domain/region/isoform indicators) | JSON property name | JSON array item subproperties <br>*() = non-mandatory* |
|---|---|---|
| Request | Request | N/A |
| Format | Format | N/A |
| ID | ID | N/A |
| AbML | AbML | N/A |
| HeavySource[^7] | HeavySource | N/A |
| LightSource | LightSource | N/A |
| Note <br>*(relating to any of the above keywords, except Format)* | \<keyword\>-Note <br>*(relating to any of the above keywords, except Format)* | N/A |
| Note <br>*(relating to Format)* | Format-Note | Instances, Value |
| Note <br>*(all other Note records)* | N/A <br>*(subsumed into related property)* | N/A |
| Source | Source | Instances, Value, (Note) |
| Fusion | Fusion | Instances, (Note) |
| Linker | Linker | Instances, Start, End, (Note) |
| Domains | Domains | Instances, Values, (Note) |
| Type | Type | Instances, Value, (Note) |
| Conjugate | Conjugate | Instances, DrugName, (Note) |
| Antigen | Antigen | Instances, Species, Names, Gene, (Note) |
| Binding | Binding | Instances, Species, Names, Gene, (Note) |
| PDB | PDB | Instances, ID, (Note) |
| HeavyChainClass | HeavyChainClass | Instance, (Domains), Value, (Note) |
| HeavyChainLength | HeavyChainLength | Instance, Value, (Note) |
| ChainLength | ChainLength | Instances, Value, (Note) |
| LightChainClass | LightChainClass | Instance, (Domain), Value, (Note) |
| LightChainLength | LightChainLength | Instance, Value, (Note) |
| HeavyPotentialNGlycos <br>HeavyConfirmedNGlycos | HeavyNGlycos | Instance, Potential, Confirmed, (ConfirmedPartial), (ConfirmedRare), (Note) |
| LightPotentialNGlycos <br>LightConfirmedNGlycos | LightNGlycos | Instance, Potential, Confirmed, (ConfirmedPartial), (ConfirmedRare), (Note) |
| PotentialNGlycos <br>ConfirmedNGlycos | NGlycos | Instances, Potential, Confirmed, (ConfirmedPartial), (ConfirmedRare), (Note) |
| HeavyPotentialOGlycos <br>HeavyConfirmedOGlycos | HeavyOGlycos | Instance, Potential, Confirmed, (ConfirmedPartial), (ConfirmedRare), (Note) |
| PotentialOGlycos <br>ConfirmedOGlycos | OGlycos | Instances, Potential, Confirmed, (ConfirmedPartial), (ConfirmedRare), (Note) |
| HeavyConfirmedPTM | HeavyConfirmedPTM | Instance, Type, Positions, (PositionsPartial), (PositionsRare), (Note) |
| LightConfirmedPTM | LightConfirmedPTM | Instance, Type, Positions, (PositionsPartial), (PositionsRare), (Note) |
| ConfirmedPTM | ConfirmedPTM | Instances, Type, Positions, (PositionsPartial), (PositionsRare), (Note) |
| HeavyCysPositions | HeavyCysPositions | Instance, Values, (Note) |
| LightCysPositions | LightCysPositions | Instance, Values, (Note) |
| CysPositions | CysPositions | Instances, Values, (Note) |
| HeavyDisulfidesIntra | HeavyDisulfidesIntra | Instance, (Isoform), Positions, (Note) |
| LightDisulfidesIntra | LightDisulfidesIntra | Instance, (Isoform), Positions, (Note) |
| DisulfidesIntra | DisulfidesIntra | Instances, (Isoform), Positions, (Note) |
| DisulfidesInterH1H2[^8] | DisulfidesInterH1H2 | InstanceX, InstanceY, (Isoform), Positions, (Note) |
| DisulfidesInterL1H1 | DisulfidesInterL1H1 | InstanceL, InstanceH, (Isoform), Positions, (Note) |
| DisulfidesInterL2H2 | DisulfidesInterL2H2 | InstanceL, InstanceH, (Isoform), Positions, (Note) |
| DisulfidesInterL3H3[^9] | DisulfidesInterL3H3 | InstanceL, InstanceH, (Isoform), Positions, (Note) |
| DisulfidesInter | DisulfidesInter | InstanceX, InstanceY, (Isoform), Positions, (Note) |
| HVGermline | HVGermline | Instance, Species, GeneID, (Note) |
| HJGermline | HJGermline | Instance, Species, GeneID, (Note) |
| HCGermline | HCGermline | Instance, (Domains), Species, GeneID, (Note) |
| LVGermline | LVGermline | Instance, Species, GeneID, (Note) |
| LJGermline | LJGermline | Instance, Species, GeneID, (Note) |
| LCGermline | LCGermline | Instance, (Domain), Species, GeneID, (Note) |
| VHRange | VHRange | Instance, Start, End, (Note) |
| CH1Range | CH1Range | Instance, Start, End, (Mutations), (Note) |
| HingeRange | HingeRange | Instance, Start, End, (Mutations), (Note) |
| CH2Range | CH2Range | Instance, Start, End, (Mutations), (Note) |
| CH3Range | CH3Range | Instance, Start, End, (Mutations), (Note) |
| CH4Range | CH4Range | Instance, Start, End, (Mutations), (Note) |
| CHSRange | CHSRange | Instance, Start, End, (Mutations), (Note) |
| VLRange | VLRange | Instance, Start, End, (Note) |
| CLRange | CLRange | Instance, Start, End, (Mutations), (Note) |
| MutationH | MutationH | Instance, Mutations, Reason, (Note) |
| MutationL | MutationL | Instance, Mutations, Reason, (Note) |
| Mutation | Mutation | Instance, Mutations, Reason, (Note) |
| CDRKabatH1 | CDRKabatH1 | Instance, Sequence, Start, End, (Note) |
| CDRKabatH2 | CDRKabatH2 | Instance, Sequence, Start, End, (Note) |
| CDRKabatH3 | CDRKabatH3 | Instance, Sequence, Start, End, (Note) |
| CDRKabatL1 | CDRKabatL1 | Instance, Sequence, Start, End, (Note) |
| CDRKabatL2 | CDRKabatL2 | Instance, Sequence, Start, End, (Note) |
| CDRKabatL3 | CDRKabatL3 | Instance, Sequence, Start, End, (Note) |
| CDRSource | CDRSource | Instances, (Regions), Species, (Note) |
| FusionProteinHeavy | FusionProteinHeavy | Instance, Start, End, (Multimer), (Note) |
| FusionProteinLight | FusionProteinLight | Instance, Start, End, (Multimer), (Note) |
| FusionProtein | FusionProtein | Instance, Start, End, (Multimer), (Note) |
| FusionProteinHeavyLinker | FusionProteinHeavyLinker | Instances, Start, End, (Note) |
| FusionProteinLightLinker | FusionProteinLightLinker | Instances, Start, End, (Note) |
| FusionProteinLinker | FusionProteinLinker | Instances, Start, End, (Note) |
| FusionProteinHeavyDisulfides | FusionProteinHeavyDisulfides | Instance, (Isoform), Positions, (Note) |
| FusionProteinLightDisulfides | FusionProteinLightDisulfides | Instance, (Isoform), Positions, (Note) |
| FusionProteinDisulfides | FusionProteinDisulfides | Instance, (Isoform), Positions, (Note) |
| Interaction | Interaction | Instances, (Note) |
| Heavy Chain | HeavyChain | Instances, Sequence |
| Light Chain | LightChain | Instances, Sequence |
| Chain | Chain | Instances, Sequence |


As can be seen by the chosen JSON subproperty names, the 80+ annotation
properties could be condensed into around 30 groups according to shared
information structures. Each group can be handled by a single method in
the [parser’s](../antibody_annotation_to_json/core.py)
code. The grouping also informs much of the logic of the [JSON 
schema’s](./INN_antibody_schema.json) modular construction (sharing 
definitions for item subproperties, or grouping together identical schemas 
with the `patternProperties` keyword).

## JSON Schema and validation

The structure and constraints of the JSON format is formally laid out in
more detail in a [JSON Schema document](./INN_antibody_schema.json).
It defines the allowed and required properties (at all levels of the
structure) and the data types and a range, set or pattern of values for
many of these properties. There are also examples provided in the 
`examples` subproperty of each property in the schema.

About one third of the properties are given their own unique subschema.
For the rest, the schema defines a number of `patternProperties`, where
property names matching a given regex pattern are assigned the same
subschema. The properties covered by each pattern are enumerated in
comments so the patternProperty schema that covers a particular property
may be found using Ctrl+F. Note that many of the Heavy/Light-prefixed
properties share the same subschema (with a singular `Instance`
subproperty), but the more general case (without a prefix) has its own
unique subschema (with a plural `Instances` subproperty).

In this project, the schema is first used (in a non-automated way) as a
form of documentation to guide the development of the parser’s source
code ([here is an overview](../CONTRIBUTING.md#workflow)). It is then imported for an
optional automatic validation step that is built into the app. This is
implemented with the [python jsonschema
library](https://pypi.org/project/jsonschema/). Along with python
unit tests, this schema validation supports a test-driven development
approach as well as giving users more confidence in the output of the
fully operational parser. In addition, it may bring to attention when
new input data doesn’t conform to the expectations of the existing
therapeutic antibody annotations; this is fairly likely to happen with
the ever-increasing complexity of engineered antibody formats. If and
when this happens, the parser may need to be modified or extended (or
the schema could simply be relaxed), and downstream applications (such
as a database and searchable website) may also need updating.


## Footnotes

[^1]:
    > The other PTM annotations are only ever confirmed (not predicted
    > from sequence), so *“Confirmed”* remains in the property name.

[^2]:
    > The possibility of multi-payload antibody-drug conjugates means
    > that this value is an array of objects (like all other
    > instance-specific properties) rather than a single object.

[^3]:
    > The `Fusion` and `Interaction` properties usually only appear once
    > (if at all) per antibody and usually without attached notes, which
    > results in a single-object array with only the one `Instances`
    > subproperty. This may seem unnecessary, but the structure is
    > maintained for consistency with the cases where there are multiple
    > independent annotations or attached notes.

[^4]:
    > The fields with exclusively single-instance annotations include
    > `Conjugate`, `Heavy/Light*` (except where \* = *Chain*),
    > `MutationH/L`, `*Range`, `*Germline`, and `CDR*` (except where
    > \* = *Source*). Most of the Heavy/Light chain fields have
    > equivalents without the Heavy/Light prefix – these can apply to
    > linker regions (the two linked instances are listed) or multiple
    > fused instances within chains that cannot be assigned as
    > predominantly heavy or light.

[^5]:
    > Note that `{“Instances”: [1, 2], … }` has a different meaning
    > than `{“Instances”: [1], … }, {“Instances”: [2], … }`. The
    > former indicates that the object’s other properties only make
    > sense for both instances together, e.g. the length of a fusion
    > chain, or an antigen binding-site formed by the association of
    > variable domains from different instances. It could also indicate
    > that the annotation applies to a linker between the two instances,
    > e.g. the `ConfirmedPTM[4,5]` record in request 
	> *[12082](../test/input_data/12082.txt)*.

[^6]:
    > `Domain` is used in `LightChainClass`, where it will only ever take
    > one value (`"VL"` or `"CL"`), as it is used to refer to one of the two
    > light chain domains. An array of `Domains` is used in
    > `HeavyChainClass`, since a single heavy chain instance can be split
    > into multi-domain groups (e.g. `[“CH1”, “CH2”]` and 
	> `[“CH3”, “CH4”)]`.

[^7]:
    > `HeavySource` and `LightSource` could be changed to arrays of instances 
	> in the JSON format, like all of the other Heavy/Light versions of 
	> records. The only reason they are here is that the INN format 
	> documentation suggests they will only be used in standard antibody 
	> formats, unlike the other Heavy/Light records, which can take instance 
	> qualifiers and are only stripped of the Heavy/Light prefix when the 
	> chain cannot be assigned as predominantly heavy or light.

[^8]: 
	> There is usually only one `DisulfidesInter(H1H2|L1H1|L2H2|L3H3)` record 
	> per antibody, except in the case of multiple disulfide isoforms, which 
	> is why these properties are arrays of objects (like all other instance-
	> specific properties) rather than a single nested object.

[^9]:
	> It is theoretically possible for very complicated antibody formats to 
	> have annotations for more than 3 different ‘L-H’ pairs, so the JSON 
	> schema allows this in a `patternProperty` definition (going up to L9H9).
