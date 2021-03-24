const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';
const paymentBusinessUidNotAuthorised = '3e2be5bc-21b8-49fe-b272-9b2eade079e9';
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';
const accountUidNotAuthorised = '148d1a4d-cf8d-4923-9be0-c8fe29a5dea9';
const addressUid = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffc';
const addressUidToCreate =  'xxxx'              /* To update at run-time */
const addressUidNotFound = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd';
const addressUidNotAuthorised = '3f957fd9-ed3d-486d-9572-6be69bfd6263';
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
const getPaymentBusinessValid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}`;
    const method = 'get';
    const action = 'getPaymentBusiness - valid';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* GET payment business details /api/v1/{paymentBusinessUid}: Not authorised */
const getPaymentBusinessNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}`;
    const method = 'get';
    const action = 'getPaymentBusiness - not athorised';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* GET payment business details /api/v1/{paymentBusinessUid}: Not found */
const getPaymentBusinessNotFound= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}`;
    const method = 'get';
    const action = 'getPaymentBusiness - not found';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};



/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: valid */
const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';
    const action = 'Valid getAccount';
    const data = {
          description: "For good things",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, data, authorization, date, digest }); /** Does data go here? **/
};

/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: Payment business not authorised */

/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: Payment business not found */


/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}:  Not a UID*/


/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}:  Invalid request data */




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

getPaymentBusinessValid();
getAccount();
putAddress();



getPaymentBusinessValid()
    .then
getAccount()
    .then(() => getAccountError()
        .then(() => getAccountNotAuthorised()));
