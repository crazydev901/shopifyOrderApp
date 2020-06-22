import gql from "graphql-tag";
import React, { useCallback, useState, useEffect } from "react";
import {
  Stack,
  Button,
  Card,
  Filters,
  ResourceItem,
  ResourceList,
  TextField,
  TextStyle,
  Pagination
} from "@shopify/polaris";
import { Query } from 'react-apollo';
import fetch from "isomorphic-fetch";
import Cookies from "js-cookie";


const GET_ORDERS = gql`
  query($numOrders: Int!, $cursor: String) {
    orders(first: $numOrders, after: $cursor) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
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
`;

const BULK_QUERY = gql`
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
`;

const BULK_QUERY_STATUS = gql`
{
  currentBulkOperation {
    status
    objectCount
    url
  }
}`

export default () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortValue, setSortValue] = useState("DATE_MODIFIED_DESC");
  const [taggedWith, setTaggedWith] = useState("VIP");
  const [queryValue, setQueryValue] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cursor_index, setCursorIndex] = useState(0);
  const [cursor, setCursor] = useState([null]);
  const [load_all_flag, setFlag] = useState(false);
  const numOrders = 50;

  const handleTaggedWithChange = useCallback(value => setTaggedWith(value), []);
  const handleQueryValueChange = useCallback(value => setQueryValue(value), []);
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(null), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(null), []);
  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [handleQueryValueRemove, handleTaggedWithRemove]);

  const resourceName = {
    singular: "order",
    plural: "orders"
  };

  const promotedBulkActions = [
    {
      content: "Edit orders",
      onAction: () => console.log("Todo: implement bulk edit")
    }
  ];

  const bulkActions = [
    {
      content: "Add tags",
      onAction: () => console.log("Todo: implement bulk add tags", selectedItems)
    },
    {
      content: "Remove tags",
      onAction: () => console.log("Todo: implement bulk remove tags")
    },
    {
      content: "Delete orders",
      onAction: () => console.log("Todo: implement bulk delete")
    }
  ];
  
  const loadAll = () => {
    console.log("load All!!!!!");
    const variables = { 
      first: 100,
      query: "created_at:>=2020-05-25"
    };
    const gqlServerOpts = {
      method: "POST",
      headers: {
        "Cotent-Type": "application/json",
        "X-Shopify-Access-Token": Cookies.get("accessToken")
      },
      body: JSON.stringify({ query: BULK_QUERY, variables: variables })
    };
    console.log("gqlServerOpts!!!", gqlServerOpts);
    fetch(`https://shaw-farm.myshopify.com/admin/api/2020-04/graphql.json`, gqlServerOpts)
    .then(res => {
      console.log("BULK QUERY!!!", res);
    })
    .catch(err => console.log(err));
  }

  const filters = [
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          labelHidden
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = !isEmpty(taggedWith)
    ? [
        {
          key: 'taggedWith',
          label: disambiguateLabel('taggedWith', taggedWith),
          onRemove: handleTaggedWithRemove,
        },
      ]
    : [];

  const filterControl = (
    <Filters
      queryValue={queryValue}
      filters={filters}
      appliedFilters={appliedFilters}
      onQueryChange={handleQueryValueChange}
      onQueryClear={handleQueryValueRemove}
      onClearAll={handleClearAll}
    >
      <div style={{paddingLeft: '8px'}}>
        <Button onClick={loadAll}>Load All</Button>
      </div>
    </Filters>
  );
  
  useEffect(() => {
    console.log('useEffect has been called!');
    const variables = {
      numOrders: numOrders,
      cursor: cursor_index !== null ? cursor[cursor_index] : null
    };
    const gqlServerOpts = {
      method: "POST",
      headers: { "Cotent-Type": "application/json" },
      body: JSON.stringify({ query: GET_ORDERS, variables: variables })
    };

    fetch("/admin/api", gqlServerOpts)
    .then(res => res.json())
    .then(res => {
      console.log("res data!!!", res);
      const orders = res.data.orders.map(e => e);
      console.log("fetch orders componentDidMount", orders);
      setOrders(orders);
    });
  }, []);

  useEffect(() => {
    console.log('useEffect has been called!');
    const variables = {
      numOrders: numOrders,
      cursor: cursor_index !== null ? cursor[cursor_index] : null
    };
    const gqlServerOpts = {
      method: "POST",
      headers: { "Cotent-Type": "application/json" },
      body: JSON.stringify({ query: GET_ORDERS, variables: variables })
    };

    fetch("/admin/api", gqlServerOpts)// '/admin/api'
    .then(res => res.json())
    .then(res => {
      console.log("inside res!!!!", res);
      const orders = res.data.orders.map(e => e);
      console.log("fetch orders", orders);
      setOrders(orders);
    })
    .catch(console.error);
  }, [cursor_index]);

  const variables = {
    numOrders: numOrders,
    cursor: cursor_index !== null ? cursor[cursor_index] : null
  };


  return (
    <Query query={GET_ORDERS} variables={variables}>
        {({data, loading, error}) => {
            if (loading) {
                return <div>Loading...</div>;
            }
            else if(error) {
                return <div>{error.message}</div>;
            }
            else {
              // console.log("data!!!!!!!!", data);
              // console.log(data.orders.edges);
              const {
                edges,
                pageInfo: { hasNextPage, hasPreviousPage }
              } = data.orders;

              const updatedEdges = edges.map(e => e);

              updatedEdges.push(0);

              return (
              <Card>
                  <ResourceList
                      resourceName={resourceName}
                      items={updatedEdges}
                      renderItem={(item) => renderItem(item, hasPreviousPage, hasNextPage, edges)}
                      selectedItems={selectedItems}
                      onSelectionChange={setSelectedItems}
                      promotedBulkActions={promotedBulkActions}
                      bulkActions={bulkActions}
                      sortValue={sortValue}
                      sortOptions={[
                      { label: "Newest update", value: "DATE_MODIFIED_DESC" },
                      { label: "Oldest update", value: "DATE_MODIFIED_ASC" }
                      ]}
                      onSortChange={selected => {
                      setSortValue(selected);
                      console.log(`Sort option changed to ${selected}.`);
                      }}
                      filterControl={filterControl}
                  />
              </Card>
              );
            }
        }}
    </Query>
  );

  function renderItem(ritem, hasPreviousPage, hasNextPage, edges) {
    const item = ritem.node;
    // console.log("item!!!!!!!!!", item);
    
    if(item){
      const { name, customer, originalTotalPriceSet, tags} = item;


      let tagsStr = "";
      tags.forEach( tag => {
          tagsStr = tagsStr + tag + ", ";
      });
      return (
        <ResourceItem
          persistActions
          id={item.name}
        >
            <Stack alignment="center" distribution="fillEvenly">
              <Stack distribution="center">
                <TextStyle variation="strong">{name}</TextStyle>
              </Stack>
              <Stack distribution="center">
                <TextStyle variation="strong">{customer.displayName}</TextStyle>
              </Stack>
              <Stack distribution="center">
                <TextStyle variation="strong">{customer.addresses.city} {customer.addresses.province} {customer.addresses.zip}</TextStyle>
              </Stack>
              <Stack distribution="center">
                <TextStyle variation="strong">{originalTotalPriceSet.shopMoney.amount}{originalTotalPriceSet.shopMoney.currencyCode}</TextStyle>
              </Stack>
              <Stack distribution="center">
                  <TextStyle variation="strong">{tagsStr}</TextStyle>
              </Stack>
            </Stack>
        </ResourceItem>
      );
    } else {
      return (
        <Stack distribution="center">
          <Pagination
            label={cursor_index + 1}
            hasPrevious={hasPreviousPage}
            previousKeys={[37]}
            onPrevious={() => {
              setCursorIndex(cursor_index - 1);
            }}
            hasNext={hasNextPage}
            nextKeys={[39]}
            onNext={() => {
              cursor.push(edges[edges.length - 1].cursor);
              setCursorIndex(cursor_index + 1);
              setCursor(cursor);
            }}
          />
        </Stack>
      )
    }
  }

  function disambiguateLabel(key, value) {
    switch (key) {
      case "taggedWith":
        return `Tagged with ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }
}
