const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';
const paymentBusinessUidNotAuthorised = '3e2be5bc-21b8-49fe-b272-9b2eade079e9'; // Exists but not mine
const accountUid1 = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';   // Created in MP
const accountUid2 = 'a005c2a3-50b1-47f3-c666-9b2eade079e9';   // I made this up!
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';
const accountUidNotAuthorised = '148d1a4d-cf8d-4923-9be0-c8fe29a5dea9'; // Exists but not mine
const addressUid1 = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffc'; // Created by running some code like this
const addressUid2 = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd'; // Made up
const addressUid3 = 'e2ea3b6f-b6a9-4c4b-8732-d3ca5c4e6ffc'; // Made up
const addressUidNotFound = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd';
const addressUidNotAuthorised = '3f957fd9-ed3d-486d-9572-6be69bfd6263'; // Exists but not mine
const sortCode = '040059';

// Some of the things we'll get back at run time
let returnedPaymentBusinessUid = "xxxx";
let returnedPaymentBusinessSuccess = "yyyy";
let returnedAccountUid1 = "xxxx";
let returnedAccountUid2 = "xxxx";
let returnedAccountStatus = "yyyy";
let returnedAccount2Uid = "xxxx";
let returnedAddress1Uid =  "xxxx";
let returnedAddress2Uid =  "xxxx";
let returnedAddress3Uid =  "xxxx";
let returnedAddress4Uid =  "xxxx";

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
        console.log(url)
        console.log("SUCCESS")
        console.log("HTTP status: " + response.status)
        console.log("Response data:\n", response.data)
        // Return response to caller
        return response
    })
    .catch(err => {
        console.log("\n" + action)
        console.log(url)
        console.log("ERROR")
        console.error("HTTP status: " + err.response.status)
        console.error("Response data:\n", err.response.data)
    });

/*************** Test methods ****************/

/*************** Payment businesses ****************/

/* GET payment business details /api/v1/{paymentBusinessUid}: Valid */
const getPaymentBusinessValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}`;
    const method = 'get';
    const action = '/*** getPaymentBusiness - VALID ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, but in this case, grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want. In this case, I already know this so it should be the same.
    returnedPaymentBusinessUid = response.data.paymentBusinessUid;
};

/* GET payment business details /api/v1/{paymentBusinessUid}: Not authorised */
const getPaymentBusinessNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** getPaymentBusiness - NOT AUTHORISED ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* GET payment business details /api/v1/{paymentBusinessUid}: Not found */
const getPaymentBusinessNotFound= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}`;
    const method = 'get';
    const action = '/*** getPaymentBusiness - NOT FOUND ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/*************** Payment business accounts ****************/



/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: valid */
const putAccountValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid2}`;
    const method = 'get';
    const action = '/*** putAccount - VALID ***/';
    const data = {
          description: "For good things",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data); /** + data **/

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data }); /** Does data go here? **/

    // . . . and save the bit I want
    returnedAccountUid1 = response.data.paymentAccountUid;;
};

/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: Payment business not authorised */

/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}: Payment business not found */


/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}:  accountUid not a UID */

/* PUT (create) payment business account /api/v1/{paymentBusinessUid}/account/{accountUid}:  Invalid request data */




/* GET payment business account details /api/v1/{paymentBusinessUid}/account/{accountUid} */



/* GET payment business accounts /api/v1/{paymentBusinessUid}/account */

const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid1}`;
    const method = 'get';
    const action = '/*** getAccount - VALID ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

const putAddress = () => {
    const addressUid = v4(); // I think this makes a new addressUid??
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid1}/address/${addressUid}`;
    const method = 'put';
    const data = {
        accountName: 'My Account Name',
        sortCode
    };
    const action = '/*** putAddress - VALID ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ action, url, method, data, authorization, date, digest });
};

/* Now run the test methods */


/* Payment businesses */

getPaymentBusinessValid()
    .then(() => {
        // Checking I've saved the values I expected to save
    })
    .then(() => getPaymentBusinessNotAuthorised())
    .then(() => getPaymentBusinessNotFound());





/*
getAccount()
    .then(() => getAccountError()
        .then(() => getAccountNotAuthorised()));


*/
        getAccount()
            .then(() => putAddress());
