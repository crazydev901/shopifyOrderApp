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
const bodyParser = require('body-parser');
// const mount = require("koa-mount");
// const { receiveWebhook, registerWebhook } = require('@shopify/koa-shopify-webhooks');
// const cors = require('@koa/cors');

const bulkQuery = require('./server/bulkQuery');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
// const Cookies = require('js-cookie');

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
                vaccessToken = accessToken;
                vshop = shop;
                vctx = ctx;
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
                // ctx.cookies.set("hostURL", HOST, {
                //     httpOnly: false,
                //     secure: true,
                //     sameSite: 'none'
                // });
                // console.log(accessToken);
                // await bulkQuery(ctx, accessToken, shop)
                //     .then(res => {
                //         console.log(res);
                //     });
                ctx.redirect('/');
            }
        })
    );
    // server.use(async function getAllOrders(ctx) {
    //     const accessToken = Cookies.get("accessToken");
    //     const shop = Cookies.get("shopOrigin");
    //     await bulkQuery(ctx, accessToken, shop)
    //         .then(res => {
    //             console.log(res);
    //         });
    // });
    // setInterval(getAllOrders, 30000);

    server.use(graphQLProxy({ version: ApiVersion.April20 }));
    // server.use(bodyParser.json());
    // const corsOptions = {
    //     origin(origin, callback) {
    //         callback(null, true);
    //     },
    //     credentials: true
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
        // console.log(ctx.cookies.get('shopOrigin'));
        // console.log(ctx.request);
        if (ctx.request.url == '/bulkQuery') {
            ctx.response.status = 200;
            ctx.response.message = "Success";
            ctx.response.body = "asdfasdf";
            console.log(ctx.response);
            return;
        }
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;

    });
    router.post('*', verifyRequest(), async(ctx) => {
        if (ctx.request.url == '/bulkQuery') {
            ctx.response.status = 200;
            const shop = ctx.cookies.get('shopOrigin');
            const accessToken = ctx.cookies.get('accessToken');
            await bulkQuery(ctx, accessToken, shop)
                .then(res => {
                    ctx.response.body = JSON.stringify(res);
                });
            return;
        }
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    });
    // router.get('/bulkQuery', verifyRequest(), async(ctx) => {
    //     console.log(ctx);
    //     await handle(ctx.req, ctx.res);
    //     ctx.respond = false;
    //     ctx.res.statusCode = 200;
    // });
    // router.post('/bulkQuery', getAllOrders());

    server.use(router.allowedMethods());
    server.use(router.routes());

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});