# MobQL

This is a little project I've been working on. It allows you to define your data and how to get it from your GraphQL schema, then it will load properties as you access them, allowing you to not need to worry about designing your queries. No more having to modify your query to include a new property *and* update your code to use it. You just use it and it will load anything it needs to from the server. Best part, the cache can still be updated just like normal MobX objects, allowing you to use whatever event system you want to update your cache in real time. 

## So how do I use it?

Well, it's not done yet, but I'll add instructions once it's ready to go