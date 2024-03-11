import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient,  QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        console.log("Event: ", event);
        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
        const reviewerName = parameters?.ReviewerName;

        if (!movieId || !reviewerName) {
            return {
              statusCode: 404,
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ Message: "Missing movie Id or ReviewerName" }),
            };
          }
          let commandInput: QueryCommandInput = {
            TableName: process.env.TABLE_NAME,
          };
          commandInput = {
            ...commandInput,
            IndexName: "reviewerIx",
            KeyConditionExpression: "movieId = :m and begins_with(ReviewerName, :r) ",
            ExpressionAttributeValues: {
              ":m": movieId,
              ":r": reviewerName,
            },
          };
          const commandOutput = await ddbDocClient.send(
            new QueryCommand(commandInput)
            );
            if (!commandOutput.Items) {
                return {
                  statusCode: 404,
                  headers: {
                    "content-type": "application/json",
                  },
                  body: JSON.stringify({ Message: "Invalid movie Id or ReviewerName" }),
                };
              }
            return {
                statusCode: 200,
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  data: commandOutput.Items,
                }),
              };
    }catch (error: any) {
        console.log(JSON.stringify(error));
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ error }),
        };
      }
    };
function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }