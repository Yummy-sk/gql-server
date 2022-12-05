
const axios = require('axios');
const graphql = require('graphql');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType), // 한개의 타입에 대해 여러개를 필요로 할 때, GraphQLList를 사용한다.
            async resolve(parentValue, args) { 
                const companyId = parentValue.id;
                const response = await axios.get(`http://localhost:3000/companies/${companyId}/users`);
                return response.data;
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType, // Association with two different types
            async resolve(parentValue, args) {
                // parentValue는 해당 id 값에 맞는 user의 정보를 반환한다.
                const companyId = parentValue.companyId;
                const response = await axios.get(`http://localhost:3000/companies/${companyId}`);
                return response.data;
            }
        }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            async resolve(parentValue, args) {
                // resolve 함수는 데이터베이스에서 데이터를 가져오는 역할을 한다.
                const reponse = await axios.get(`http://localhost:3000/users/${args.id}`);
                return reponse.data;
            }
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },
            async resolve(parentValue, args) { 
                const response = await axios.get(`http://localhost:3000/companies/${args.id}`);
                return response.data;
            }
        }
    },
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                firstName: { type: GraphQLNonNull(GraphQLString) },
                age: { type: GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString }
            },
            async resolve(parentValue, args) {
                const response = await axios.post('http://localhost:3000/users', { ...args });
                return response.data;
            }
        },
        deleteUser: {
            type: UserType, 
            args: {
                id: { type: GraphQLNonNull(GraphQLString) }
            },
            async resolve(parentValue, args) {
                const userId = args.id;
                const response = await axios.delete(`http://localhost:3000/users/${userId}`);
                return response.data;
            }
        },
        editUser: {
            type: UserType, 
            args: {
                id: { type: GraphQLNonNull(GraphQLString) },
                firstName: { type: GraphQLString },
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString }
            },
            async resolve(parentValue, args) {
                const userId = args.id;
                const response = await axios.patch(`http://localhost:3000/users/${userId}`, { ...args });
                return response.data;
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
});
