# MobQL

This is a little beta side project I've been working on. It allows you to define your data and how to get it from your GraphQL schema, then it will load properties as you access them, allowing you to not need to worry about designing your queries. No more having to modify your query to include a new property _and_ update your code to use it. You just use it and it will load anything it needs to from the server. Best part, the cache can still be updated just like normal MobX objects, allowing you to use whatever event system you want to update your cache in real time.

## So how do I use it?

Install it with yarn or npm

```sh
npm install mobql --save

yarn add mobql
```

Then follow the steps below to get your data ready to go. You can also take a look at the two quick example projects in the /examples directory. (Store.ts in each of these is the important bit).

### Step 1 - Define your data

Define you data as a class, generally you'll be extending `DataLoadedListEntry` as that represents an instance of an object like a User or Post with a unique ID. `DataLoadedObject` is used for a static set of properties such as a global config where there's only once instance of that object on the API. `NestedObject` is used for when you have nested data that isn't considered to be a part of another object, something like `name { first, last }` on a `User`.

```ts
class Continent extends DataLoadedListEntry {
  name: string | null = null;
  code: string;
  @MobQLArrayListObject("Country")
  countries: Country[] = [];

  constructor(id: string, manager: DataLoadedListEntryManager<any>) {
    super(manager);
    this.code = id;
  }

  getId(): string {
    return this.code;
  }
}
```

When referencing another `DataLoaded...` thing in a property, make sure to decorate it so that MobQL knows what to look for.

**(!) Make sure to initialize any `NestedObject`s in your class's constructor, as well as intialize any arrays of `DataLoadedListEntry`s as empty arrays, everything else should be `type | null = null`. This allows you to access the properties right away.**

**(!) Extremely important: Do not make any properties optional as this causes issues with the reflection used to set up the objects**

### Step 2 - Make your data loader

This package doesn't require the use of any specific graphql client, all you need to do is make a DataLoader that will take a query and variables then return the result that your graphql library gives.

```ts
class MyDataLoader extends DataLoader {
  async runQuery(query: string, variables: any): Promise<any> {
    let output;
    try {
      output = await request(
        "https://countries.trevorblades.com/graphql",
        query,
        variables
      );
    } catch (e) {
      console.log(e);
    }
    // Make sure that your output puts the data in the data property of the return value, in the future other properties will be used for other data
    return { data: output };
  }
}
```

In the example I use `graphql-request` for a quick and simple query runner.

### Step 3 - Register your models

You'll now register all your models with an ObjectManager, this is what allows your objects to reference each other as well as handles creation and serving of these object for you.

```ts
const objectManager = new ObjectManager(dataLoader);

objectManager.registerListType(Continent, "continent", "Continent", "code");
objectManager.registerListType(Country, "country", "Country", "code");
```

**(!) Important note: Make sure you give the `ObjectManager` the proper name for the id property of each object if it doesn't use `id`, otherwise this _will_ cause issues**

### Step 4 - Use the data!

You just grab the items from your object manager and start using them like you would any other MobX object. For things like grabbing a list from search, use a normal gql query and have it only return the ids of the objects, then fetch those all from the `ObjectManager` and use the data you want, any data not yet loaded will be grabbed from the server automatically. This does split it into two network requests, however the first request will be smaller and the second request will potentially save a lot of data if a lot of the objects are cached.

```ts
const continentRepo = objectManager.getList(Continent);
const continentNorthAmerica = continentRepo.get("NA");

autorun(() => {
  console.log(continentNorthAmerica.name);
  console.log(" Countries:");
  continentNorthAmerica.countries.map((country) => {
    console.log("  ", country.code, "-", country.name, country.emoji);
  });
});
```
