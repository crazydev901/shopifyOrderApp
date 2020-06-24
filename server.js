require('isomorphic-fetch');
const dotenv = require('dotenv');
dotenv.config();
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
// const proxy = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const Router = require('koa-router');
// const mount = require("koa-mount");
// const { receiveWebhook, registerWebhook } = require('@shopify/koa-shopify-webhooks');
// const cors = require('@koa/cors');

const bulkQuery = require('./server/bulkQuery');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const {
    SHOPIFY_API_SECRET_KEY,
    SHOPIFY_API_KEY,
    // SHOPIFY_PRIVATE_APP_PASSWORD,
    // SHOP,
    // HOST,
} = process.env;

app.prepare().then(() => {
    const server = new Koa();
    const router = new Router();
    server.use(session({ sameSite: 'none', secure: true }, server));
    server.keys = [SHOPIFY_API_SECRET_KEY];

    server.use(
        createShopifyAuth({
            apiKey: SHOPIFY_API_KEY,
            secret: SHOPIFY_API_SECRET_KEY,
            scopes: ['read_orders', 'read_customers'],
            async afterAuth(ctx) {
                const { shop, accessToken } = ctx.session;
                ctx.cookies.set("shopOrigin", shop, {
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                });
                ctx.cookies.set("accessToken", accessToken, {
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                });
                await bulkQuery(ctx, accessToken, shop)
                    .then(res => {
                        console.log("here");
                    });
                // ctx.redirect('/');
            }
        })
    );
    console.log('Pass here');
    server.use(graphQLProxy({ version: ApiVersion.April20 }));
    // const corsOptions = {
    //   origin(origin, callback) {
    //     callback(null, true);
    //   },
    //   credentials: true
    // };
    // server.use(cors(corsOptions));

    // server.use(
    //   graphQLProxy({
    //     version: ApiVersion.April20,
    //     shop: SHOP,
    //     password: SHOPIFY_PRIVATE_APP_PASSWORD,
    //   })
    // );

    router.get('*', verifyRequest(), async(ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    });
    router.post('*', verifyRequest(), async(ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.body = ctx.request.body;
        ctx.res.statusCode = 200;
    });

    server.use(router.allowedMethods());
    server.use(router.routes());

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});