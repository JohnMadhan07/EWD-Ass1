"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambdas/updatemoviereview.ts
var updatemoviereview_exports = {};
__export(updatemoviereview_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(updatemoviereview_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var ddbDocClient = createDDbDocClient();
var handler = async (event, context) => {
  try {
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : void 0;
    const reviewername = parameters?.Parameter;
    console.log("Event: ", event);
    const body = event.body ? JSON.parse(event.body) : void 0;
    const updatedText = body?.text;
    if (!body) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Missing request body" })
      };
    }
    if (!movieId && !reviewername) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ Message: "Missing movie Id or parameter" })
      };
    }
    const commandInput = {
      TableName: process.env.TABLE_NAME,
      Key: {
        movieId,
        ReviewerName: reviewername
      },
      UpdateExpression: "SET Content = :review",
      ExpressionAttributeValues: {
        ":review": body
      }
    };
    const updateCommand = await ddbDocClient.send(
      new import_lib_dynamodb.UpdateCommand(commandInput)
    );
    console.log(body);
    console.log(body.Item);
    return {
      statusCode: 201,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message: "Updated Review " })
    };
  } catch (error) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ error })
    };
  }
};
function createDDbDocClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  };
  const unmarshallOptions = {
    wrapNumbers: false
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
