# GraphQL Server Example

This example shows how to implement a **GraphQL server with TypeScript** with the following stack, based on [official example](https://github.com/prisma/prisma-examples/tree/latest/typescript/graphql) and add my favorite stack:

- From Official Example
  - [**Apollo Server**](https://github.com/apollographql/apollo-server): HTTP server for GraphQL APIs
  - [**GraphQL Nexus**](https://nexusjs.org/docs/): GraphQL schema definition and resolver implementation
  - [**Prisma Client**](https://www.prisma.io/docs/concepts/components/prisma-client): Databases access (ORM)
  - [**Prisma Migrate**](https://www.prisma.io/docs/concepts/components/prisma-migrate): Database migrations
- My Favorite
  - dotenv
  - postgres
  - docker-compose.yml
  - auto formatting (husky, prettier, eslint)
  - bugsnag
  - deployment settings for render

## Getting started

```
$ yarn install
$ docker-compose up
$ npx prisma migrate dev --name init --preview-feature
$ npx prisma db seed --preview-feature
$ yarn run dev
```

Navigate to [http://localhost:4000](http://localhost:4000) in your browser to explore the API of your GraphQL server in a [GraphQL Playground](https://github.com/prisma/graphql-playground).

## Evolving the app

### 1. Migrate your database using Prisma Migrate

```diff
// ./prisma/schema.prisma

model User {
  id      Int      @default(autoincrement()) @id
  name    String?
  email   String   @unique
  posts   Post[]
+ profile Profile?
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String
  content   String?
  published Boolean  @default(false)
  viewCount Int      @default(0)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}

+model Profile {
+  id     Int     @default(autoincrement()) @id
+  bio    String?
+  user   User    @relation(fields: [userId], references: [id])
+  userId Int     @unique
+}
```

Once you've updated your data model, you can execute the changes against your database with the following command:

```
npx prisma migrate dev --name add-profile --preview-feature
```

This adds another migration to the `prisma/migrations` directory and creates the new `Profile` table in the database.

### 2. Update your application code

#### 2.1. Add the `Profile` type to your GraphQL schema

```diff
// ./src/schema.ts

+const Profile = objectType({
+  name: 'Profile',
+  definition(t) {
+    t.nonNull.int('id')
+    t.string('bio')
+    t.field('user', {
+      type: 'User',
+      resolve: (parent, _, context) => {
+        return context.prisma.profile
+          .findUnique({
+            where: { id: parent.id || undefined },
+          })
+          .user()
+      },
+    })
+  },
+})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
    t.nonNull.list.nonNull.field('posts', {
      type: 'Post',
      resolve: (parent, _, context) => {
        return context.prisma.user
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .posts()
      },
+   t.field('profile', {
+     type: 'Profile',
+     resolve: (parent, _, context) => {
+       return context.prisma.user.findUnique({
+         where: { id: parent.id }
+       }).profile()
+     }
+   })
  },
})
```

Don't forget to include the new type in the `types` array that's passed to `makeSchema`:

```diff
export const schema = makeSchema({
  types: [
    Query,
    Mutation,
    Post,
    User,
+   Profile,
    UserUniqueInput,
    UserCreateInput,
    PostCreateInput,
    PostOrderBy,
    DateTime,
  ],
  // ... as before
}
```

Note that in order to resolve any type errors, your development server needs to be running so that the Nexus types can be generated. If it's not running, you can start it with `npm run dev`.

#### 2.2. Add a `createProfile` GraphQL mutation

```diff
// ./src/schema.ts

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {

    // other mutations

+   t.field('addProfileForUser', {
+     type: 'Profile',
+     args: {
+       userUniqueInput: nonNull(
+         arg({
+           type: 'UserUniqueInput',
+         }),
+       ),
+       bio: stringArg()
+     },
+     resolve: async (_, args, context) => {
+       return context.prisma.profile.create({
+         data: {
+           bio: args.bio,
+           user: {
+             connect: {
+               id: args.userUniqueInput.id || undefined,
+               email: args.userUniqueInput.email || undefined,
+             }
+           }
+         }
+       })
+     }
+   })

  }
})
```

Finally, you can test the new mutation like this:

```graphql
mutation {
  addProfileForUser(
    userUniqueInput: { email: "mahmoud@prisma.io" }
    bio: "I like turtles"
  ) {
    id
    bio
    user {
      id
      name
    }
  }
}
```

<details><summary>Expand to view more sample Prisma Client queries on <code>Profile</code></summary>
