const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';
const paymentBusinessUidNotAuthorised = '4389532d-8b5d-44ad-9f69-d2124cb9a603';
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bd99d';
const accountUidNotAuthorised = '09dbbfac-50b1-47f3-ac7b-a37d828bd99d';           /* To locate */
const addressUid = 'xxxxx';                                                       /* Updated at run-time */
const addressUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bd99d';
const addressUidNotAuthorised = '09dbbfac-50b1-47f3-ac7b-a37d828bd99d';           /* To locate */
const sortCode = '040059';

const calculateAuthorisationAndDigest = (date, method, url, data = '') => {
    const digest = data === ''
        ? ''
        : crypto
            .createHash('sha512')
            .update(JSON.stringify(data))
            .digest('base64');

    const signature = crypto
        .createSign('RSA-SHA512')
        .update(`(request-target): ${method} ${url}\nDate: ${date}\nDigest: ${digest}`)
        .sign(fs.readFileSync(privateKeyPath), 'base64');

    return {
        digest,
        authorization: `Signature keyid="${apiKeyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`
    };
};

const makeRequest = ({ action, url, method, authorization, date, digest, data = '' }) => axios.request({
    baseURL,
    url,
    method,
    data,
    headers: {
        Authorization: authorization,
        Date: date,
        Digest: digest,
        'Content-Type': 'application/json',
        'User-Agent': 'api-samples/message-signing/js/ps-signing'
    }
})
    .then(response => {
        console.log("\n" + action)
        console.log("SUCCESS")
        console.log(url)
        console.log(response.status)
        console.log(response.data)
    })
    .catch(err => {
        console.log("\n" + action)
        console.log("ERROR")
        console.log(url)
        console.error(err.response.status)
        console.error(err.response.data)
    });

/* GET payment business details /api/v1/{paymentBusinessUid}: Valid */
const getPaymentBusiness = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';
    const action = 'Valid getAccount';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* GET payment business details /api/v1/{paymentBusinessUid}: Not authorised */

/* GET payment business details /api/v1/{paymentBusinessUid}: Not valid */



/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid} */

/* GET payment business account details /api/v1/{paymentBusinessUid}/account/{accountUid} */

/* GET payment business accounts /api/v1/{paymentBusinessUid}/account */


const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';
    const action = 'Valid getAccount';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

const putAddress = () => {
    const addressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const data = {
        accountName: 'My Account Name',
        sortCode
    };
    const action = 'Valid putAddress';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ action, url, method, data, authorization, date, digest });
};

getAccount();
putAddress();
