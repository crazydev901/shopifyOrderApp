const bulkQueryAPI = async(ctx, accessToken, shop) => {
    const query = JSON.stringify({
        query: `
      mutation {
        bulkOperationRunQuery(
          query:"""
          {
            query($numOrders: Int!) {
              orders(first: $numOrders) {
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
    `,
        variables: { numOrders: 1000 }
    });

    const response = await fetch(
        `https://${shop}/admin/api/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken
            },
            body: query
        }
    );

    const responseJson = await response.json();
    const confirmationUrl =
        responseJson.data.appSubscriptionCreate.confirmationUrl;
    return ctx.redirect(confirmationUrl);
};

module.exports = getSubscriptionUrl;