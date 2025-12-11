[![npm version](https://img.shields.io/npm/v/@itrocks/store?logo=npm)](https://www.npmjs.org/package/@itrocks/store)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/store)](https://www.npmjs.org/package/@itrocks/store)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/store?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/store)
[![issues](https://img.shields.io/github/issues/itrocks-ts/store)](https://github.com/itrocks-ts/store/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# store

Marks domain classes for named storage, associates transformers to properties of these class types.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/store
```

`@itrocks/store` is usually installed together with the it.rocks
framework and other infrastructure packs, but it can also be used on its
own in any TypeScript/Node.js project.

## Usage

`@itrocks/store` provides a class decorator, a helper, and a small
configuration hook:

- `Store()` marks a class as **storable** and computes its store name.
- `storeOf()` returns the store name associated with a class or
  instance.
- `storeDependsOn()` lets you plug infrastructure concerns
  (transformers, naming strategy) without creating a hard dependency on
  a specific storage technology.

### Minimal example

```ts
import { Store, storeOf } from '@itrocks/store'

@Store()
class User
{
	login!: string
}

// Later, anywhere in your code
const storeName = storeOf(User) // typically "user" or a derived name
```

You can now use `storeName` to read/write `User` instances through your
own persistence mechanism (SQL, NoSQL, in‑memory, …).

### Example with custom store name and transformers

In a real application you rarely use `@itrocks/store` alone. Instead,
you configure it once at startup and then declare your entities.

```ts
import { type Type }             from '@itrocks/class-type'
import { Store, storeDependsOn } from '@itrocks/store'

// Application bootstrap (only once)
function initStoreLayer()
{
	storeDependsOn({
		// Called for each @Store() class when it is first seen
		setTransformers: function (target: Type)
		{
			// Register field transformers, validators, etc. for this entity
			// in your storage / ORM layer.
		},
		// Global naming strategy for store names
		toStoreName: function (className: string): string
		{
			// Example: convert PascalCase class name to snake_case table name
			return className
				.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
				.toLowerCase()
		}
	})
}

// Domain entity
@Store() // uses the default naming strategy above
class Customer
{
	id!:    number
	name!:  string
	email!: string
}
```

From now on, `Customer` is registered as a storable entity and your
storage layer can query `storeOf(Customer)` whenever it needs the
corresponding store/table/collection name.

## API

### `storeDependsOn(dependencies)`

Configures how `@itrocks/store` integrates with your storage and
transformation layer.

```ts
type Dependencies = {
	setTransformers?: (target: Type) => void
	toStoreName:      (className: string) => string
}

function storeDependsOn(dependencies: Partial<Dependencies>): void
```

#### Parameters

- `dependencies.setTransformers?` – optional callback invoked when a
  decorated class is first processed by `Store()`.
  - `target` – the entity `Type` being marked as storable. Use this to
    register per‑class transformers, validators, or metadata in your
    persistence layer.
- `dependencies.toStoreName` – function that converts a **class name**
  (e.g. `"CustomerOrder"`) into a **store name** (e.g.
  `"customer_order"` or `"customerOrders"`).

You typically call `storeDependsOn()` once during application
initialisation.

If you omit some fields, the existing behaviour is kept for those
fields (for instance the default `toStoreName` simply returns the class
name unchanged).

### `Store(name?)`

Class decorator that marks a domain class as **storable** and associates
it with a store name.

```ts
function Store(name?: string | false): DecorateCaller<object>
```

#### Parameters

- `name` (optional):
  - `undefined` or empty string (default) – let `@itrocks/store` compute
    the store name from the base class name using `toStoreName`.
  - non‑empty `string` – force a specific store name (for example to
    match an existing table or collection name).
  - `false` – disable automatic transformer registration (if any) for
    this class while still allowing a store name to be retrieved.

#### Behaviour

- When applied to a class, `Store()`:
  - optionally calls `setTransformers(target)` if you configured it via
    `storeDependsOn()` and `name !== false`;
  - associates the class with a store name, either the explicit `name`
    you provided or the result of `toStoreName(baseType(target).name)`.

You normally use it as a decorator:

```ts
@Store('app_users')
class User
{
	// ...
}
```

### `storeOf(target)`

Returns the store name associated with a class or instance that has
been decorated with `@Store()`.

```ts
function storeOf(target: ObjectOrType): string | false
```

#### Parameters

- `target` – either the class constructor (`User`) or an instance
  (`new User`).

#### Returns

- the **store name** as a `string` if the class/instance is decorated
  with `@Store()`;
- `false` if the target is not associated with any store.

This is usually called by infrastructure code (ORM, DAOs, query
builders) rather than by domain classes themselves.

## Typical use cases

- **Entity mapping to a storage backend** – mark your domain classes
  with `@Store()` and let your storage layer call `storeOf()` to resolve
  the underlying table/collection name.
- **Centralised naming strategy** – enforce a single convention for
  store names across your project by configuring `toStoreName` once via
  `storeDependsOn()`.
- **Automatic transformer registration** – plug field‑level transformers
  (dates, files, translations, passwords, …) for each entity in a
  single place through `setTransformers`.
- **Framework integration** – allow higher‑level libraries (SQL
  mappers, lazy‑loading helpers, schema generators, …) to discover
  storable entities and their store names without coupling them to your
  domain model.
