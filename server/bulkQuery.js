const bulkQueryAPI = async (ctx, accessToken, shop) => {
    const query = JSON.stringify({
      query: `
      mutation {
        bulkOperationRunQuery(
          query:"""
          {
            query($numOrders: Int!, $date_created: String) {
              orders(first: $numOrders, query: $date_created) {
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
    `
    });
  
    const response = await fetch(
      `https://${shop}/admin/api/2020-04/graphql.json`,
      {
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