const util = require('util');
const request = require('request');

const bulkQuery = async(ctx, accessToken, shop) => {
    const query = JSON.stringify({
        query: `
        mutation bulkOperationRunQuery{
          bulkOperationRunQuery(
            query:"""
            {
              orders{
                edges {
                  node {
                    id
                    name
                    customer {
                      displayName
                      addresses {
                        city
                        province
                        zip
                      }
                    }
                    originalTotalPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    tags
                  }
                }
              }
            }
            """
          ){
            bulkOperation {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
    `
    });

    const response = await fetch(
        `https://${shop}/admin/api/2020-04/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken
            },
            body: query
        }
    );

    const responseJson = await response.json();

    // console.log(responseJson.data.bulkOperationRunQuery.bulkOperation.id);

    const bulkOperationId = responseJson.data.bulkOperationRunQuery.bulkOperation.id;

    var bulkOperationStatus = 'RUNNING';

    var responseJson1 = responseJson;

    while (bulkOperationStatus == 'RUNNING') {

        let query1 = JSON.stringify({
            query: `
          query{
            node(id: "` + bulkOperationId + `") {
              ... on BulkOperation {
                id
                status
                errorCode
                createdAt
                completedAt
                objectCount
                fileSize
                url
                partialDataUrl
              }
            }
          }
        `
        });

        let response1 = await fetch(
            `https://${shop}/admin/api/2020-04/graphql.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken
                },
                body: query1
            }
        );

        responseJson1 = await response1.json();

        bulkOperationStatus = responseJson1.data.node.status;
    }
    // console.log(responseJson1);

    const fileUrl = responseJson1.data.node.url;
    var result = '';

    const requestPromise = util.promisify(request);
    const response2 = await requestPromise(fileUrl);
    // request.get(fileUrl, function(error, response, body) {
    //     result = body;
    // });
    // let response2 = await fetch(fileUrl, {
    //     method: "GET"
    // });
    // console.log(response2);
    result = response2.body;

    return result;
    // return JSON.stringify(result);

    // return JSON.stringify(Array());
    // return ctx.redirect(confirmationUrl.data.node.url);
};

module.exports = bulkQuery;