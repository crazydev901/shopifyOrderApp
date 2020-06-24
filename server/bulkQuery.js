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
                    name
                    customer {
                      displayName
                      addresses {
                        city
                        province
                        zip
                      }
                    }
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

    console.log(responseJson.data.bulkOperationRunQuery.bulkOperation);

    const query1 = JSON.stringify({
        query: `
        query currentBulkOperation{
          currentBulkOperation {
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
      `
    });

    const response1 = await fetch(
        `https://${shop}/admin/api/2020-04/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken
            },
            body: query1
        }
    );

    const responseJson1 = await response1.json();

    console.log(responseJson1);

    // return ctx.redirect(confirmationUrl);
};

module.exports = bulkQuery;