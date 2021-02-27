import dotenv from 'dotenv'
import { ApolloServer } from 'apollo-server'
import { getApolloBugsnagPlugin } from './plugins/apollo_server_plugin_bugsnag'
import { schema } from './schema'
import { context } from './context'

dotenv.config()

const server = new ApolloServer({
  schema,
  context,
  plugins: [getApolloBugsnagPlugin()],
})

server.listen().then(async ({ url }) => {
  console.log(`\
🚀 Server ready at: ${url}
⭐️ See sample queries: http://pris.ly/e/ts/graphql#using-the-graphql-api
  `)
})
