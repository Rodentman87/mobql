# MobQL

This is a little proof-of-concept side project I've been working on. It allows you to define your data and how to get it from your GraphQL schema, then it will load properties as you access them, allowing you to not need to worry about designing your queries. No more having to modify your query to include a new property *and* update your code to use it. You just use it and it will load anything it needs to from the server. Best part, the cache can still be updated just like normal MobX objects, allowing you to use whatever event system you want to update your cache in real time. 

## So how do I use it?

This repo is just a proof-of-concept for the idea, not a production ready library, feel free to poke around in it to get an idea of how everything works. (If you have any questions that I don't answer in this README, feel free to message me on discord and I can give you some insights into the project) In addition to being a proof-of-concept for the idea, there is also currently a bug with using it in browser that I'm in the process of fixing, so it's not quite ready for use in projects yet. There's also some hacky code in here that is likely to lead to other issues down the line.

You can take a look at `src/testFile.ts` to see a quick example of how it works (plus you can clone the repo and run `yarn run:dev` to run the example in your terminal)

### Step 1 - Define your data

Define you data as a class, generally you'll be extending `DataLoadedListEntry` as that represents an instance of an object like a User or Post with a unique ID. `DataLoadedObject` is used for a static set of properties such as a global config where there's only once instance of that object on the API. `NestedObject` is used for when you have nested data that isn't considered to be a part of another object, something like `name { first, last }` on a User.

```ts
class Continent extends DataLoadedListEntry {
  @observable name: string | null = null;
  @observable
  @dataLoaded(DataLoadedPropTypes.ARRAY_LIST_OBJECT, "code")
  countries: Country[] = [];

  constructor(
    id: string,
    list: DataLoadedList<any>,
    objectManager: ObjectManager
  ) {
    super(id, list, objectManager, "code");
    makeDataLoaded(this);
  }
}
```

Make sure to mark every property as observable so that MobX can handle the reactive state updates for you.

When referencing another `DataLoaded...` thing in a property, make sure to decorate it with the `dataLoaded` decorator and define its type. `OBJECT` for a `DataLoadedObject`, `LIST_OBJECT` for referencing a single `DataLoadedListEntry`, `ARRAY_LIST_OBJECT` for an array of `DataLoadedListEntry`s, and finally `NESTED` for a `NestedObject`.

**(!) Important note: if your `DataLoadedListEntry` uses an id with a name other than `id`, make sure to specify it in the super call in the constructor, the registration, and the decorators in classes that reference it. This is a quirk of the way the package works atm. I didn't spend a ton of time on this since this is a proof-of-concept and not meant to be used in its current state in projects**

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

**(!) Important note: Reminder of the note from earlier, make sure you give the `ObjectManager` the proper name for the id property, otherwise this *will* cause issues**

### Step 4 - Use the data!

You just grab the items from your object manager and start using them. For things like grabbing a list from search, use a normal gql query and have it only return the ids of the objects, then fetch those all from the `ObjectManager` and use the data you want, any data not yet loaded will be grabber from the server automatically

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