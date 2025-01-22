module.exports = {
    data_base           : {
        mongodb: {
            developer   : process.env.MONGODB_DEV,
            production  : process.env.MONGODB_PROD
        }
    },
    external_application: {
        billing : {
            url     : process.env.BILLING_APP,
            token   : process.env.BILLING_TOKEN,
        },
        agent   : {
            url     : process.env.AGENT_APP,
            token   : process.env.AGENT_TOKEN,
        },
        central : {
            url     : process.env.CENTRAL_APP,
            user    : process.env.CENTRAL_USER,
            password: process.env.CENTRAL_PASSWORD,
            version : process.env.CENTRAL_VERSION
        },
        klaviyo : {
            url     : process.env.KLAVIYO_URL,
            token   : process.env.KLAVIYO_TOKEN,
            revision: process.env.KLAVIYO_REVISION
        },
        cms     : {
            url     : process.env.CMS_APP,
            file_url: process.env.CMS_URL
        }
    },
    mailer              : {
        general     : {
            user: process.env.MAILER_GENERAL_EMAIL,
            pass: process.env.MAILER_GENERAL_PASSWORD
        },
        contact     : {
            user: process.env.MAILER_CONTACT_EMAIL,
            pass: process.env.MAILER_CONTACT_PASSWORD
        },
        developer   : {
            user: process.env.DEV_EMAIL,
            pass: process.env.DEV_PASSWORD
        }
    },
    shopify             : {
        shop_us              : {
            shop        : process.env.SHOPIFY_SHOP_SHOP_US,
            api_key     : process.env.SHOPIFY_API_KEY_SHOP_US,
            access_token: process.env.SHOPIFY_TOKEN_SHOP_US,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_SHOP_US
        },
        development_2b          : {
            shop        : process.env.SHOPIFY_SHOP_DEVELOPMENT_2B,
            api_key     : process.env.SHOPIFY_API_KEY_DEVELOPMENT_2B,
            access_token: process.env.SHOPIFY_TOKEN_DEVELOPMENT_2B,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_DEVELOPMENT_2B
        },
        snatched_body           : {
            shop        : process.env.SHOPIFY_SHOP_SNATCHED_BODY,
            api_key     : process.env.SHOPIFY_API_KEY_SNATCHED_BODY,
            access_token: process.env.SHOPIFY_TOKEN_SNATCHED_BODY,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_SNATCHED_BODY
        },
        shapes_secrets          : {
            shop        : process.env.SHOPIFY_SHOP_SHAPES_SECRETS,
            api_key     : process.env.SHOPIFY_API_KEY_SHAPES_SECRETS,
            access_token: process.env.SHOPIFY_TOKEN_SHAPES_SECRETS,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_SHAPES_SECRETS,
        },
        fajas_colombianas_sale  : {
            shop        : process.env.SHOPIFY_SHOP_FAJAS_COLOMBIANAS_SALE,
            api_key     : process.env.SHOPIFY_API_KEY_FAJAS_COLOMBIANAS_SALE,
            access_token: process.env.SHOPIFY_TOKEN_FAJAS_COLOMBIANAS_SALE,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_FAJAS_COLOMBIANAS_SALE
        },
        sonryse                 : {
            shop        : process.env.SHOPIFY_SHOP_SONRYSE,
            api_key     : process.env.SHOPIFY_API_KEY_SONRYSE,
            access_token: process.env.SHOPIFY_TOKEN_SONRYSE,
            verbose     : false,
            api_version : process.env.SHOPIFY_API_VERSION_SONRYSE
        }
    },
    slack               : {
        access_token: process.env.SLACK_TOKEN,
        dev_channel : {
            hefesto : process.env.SLACK_DEV_CHANNEL_HEFESTO,
            agent   : process.env.SLACK_DEV_CHANNEL_AGENT,
            billing : process.env.SLACK_DEV_CHANNEL_BILLING
        }
    }
};