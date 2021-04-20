const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';              // From MP
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';      // Made up
const paymentBusinessUidNotAuthorised = '3e2be5bc-21b8-49fe-b272-9b2eade079e9'; // Exists but not mine
const paymentBusinessUidInvalid = 'abcdefghijk';                                // Not a valid UID
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';                      // Created in MP
const accountUid2 = 'f44ec61b-51b7-49eb-9149-4a2b1e3b34ea';                     // Created in a previous run of this code
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';              // Made up
const accountUidNotAuthorised = '148d1a4d-cf8d-4923-9be0-c8fe29a5dea9';         // Exists but not mine
const accountUidInvalid = 'abcdefghijk';                                        // Not a valid UID
const addressUid = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffc';                      // Created by running some code like this
const addressUidNotFound = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd';              // Made up
const addressUidNotAuthorised = '3f957fd9-ed3d-486d-9572-6be69bfd6263';         // Exists but not mine
const addressUidInvalid = 'abcdefghijk';                                        // Not a valid UID
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

/*
 *
 * This batch of tests cover the E tests in my 'Payment Services API errors - PBS, accounts and addresses'
 * document
 *
 */

/************************************************ Do the signing *****************************************/

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

/************************************************ Make the call *****************************************/

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

/*******************************************************************************************************************/
/*********************************************** Test methods ******************************************************/
/*******************************************************************************************************************/

/************************************************* PB account addresses ********************************************/

/* ********************* (E.1) GET payment business details /api/v1/{paymentBusinessUid}: Not found *******************/

const getPaymentBusinessNotFound= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}`;
    const method = 'get';
    const action = '/*** (E.1) getPB - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********** (E.2) GET PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not found ***********/

const getAccountPBNotFound = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUidNotFound}`;
    const method = 'get';
    const action = '/*** (E.2) getAccount - PB not found ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (E.3) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: Acc not found ***********/

const getAccountNotFound = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}`;
    const method = 'get';
    const action = '/*** (E.3) getAccount - Acc not found ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.4) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB not found ****/

const getAddressPBNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (E.4) getAddress - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.5) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Acc not found ****/

const getAddressAccNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (E.5) getAddress - Acc not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.6) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Addr not found ****/

const getAddressNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}`;
    const method = 'get';
    const action = '/*** (E.6) getAddress - Addr not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* ********************* (E.7) GET payment business details /api/v1/{paymentBusinessUid}: Invalid *******************/

const getPaymentBusinessInvalid= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}`;
    const method = 'get';
    const action = '/*** (E.7) getPB - PB invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********** (E.8) GET PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB invalid ***********/

const getAccountPBInvalid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account/${accountUid}`;
    const method = 'get';
    const action = '/*** (E.8) getAccount - PB invalid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (E.9) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: Acc invalid ***********/

const getAccountInvalid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}`;
    const method = 'get';
    const action = '/*** (E.9) getAccount - PB exists, acc invalid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.10) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB invalid ****/

const getAddressPBInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account/${accountUid}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (E.10) getAddress - PB invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.11) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Acc invalid ****/

const getAddressAccInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (E.11) getAddress - Acc invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (E.12) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Addr invalid ****/

const getAddressInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'get';
    const action = '/*** (E.12) getAddress - Addr invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* ********** (E.13) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not found ***********/

const putAccountPBNotFound = async () => {
    const newAccountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${newAccountUid}`;
    const method = 'put';
    const action = '/*** (E.13) putAccount - PB not found ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/* *** (E.14) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB not found ****/

const putAddressPBNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (E.14) putAddress - PB not found ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (E.15) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Acc not found ****/

const putAddressAccNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (E.15) putAddress - Acc not found ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/* ********** (E.16) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB invalid ***********/

const putAccountPBInvalid = async () => {
    const newAccountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account/${newAccountUid}`;
    const method = 'put';
    const action = '/*** (E.16) putAccount - PB invalid ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (E.17) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: Account invalid ***********/

const putAccountInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}`;
    const method = 'put';
    const action = '/*** (E.17) putAccount - Account invalid ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (E.18) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB invalid ****/

const putAddressPBInvalid = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (E.18) putAddress - PB invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (E.19) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Acc invalid ****/

const putAddressAccInvalid = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (E.19) putAddress - Acc invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (E.20) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Addr invalid ****/

const putAddressInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'put';
    const action = '/*** (E.20) putAddress - Addr invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests E *************************************/

getPaymentBusinessNotFound()                          /***** TEST E.1 ******/
    .then(() => getAccountPBNotFound())               /***** TEST E.2 ******/
    .then(() => getAccountNotFound())                 /***** TEST E.3 ******/
    .then(() => getAddressPBNotFound())               /***** TEST E.4 ******/
    .then(() => getAddressAccNotFound())              /***** TEST E.5 ******/
    .then(() => getAddressNotFound())                 /***** TEST E.6 ******/
    .then(() => getPaymentBusinessInvalid())          /***** TEST E.7 ******/
    .then(() => getAccountPBInvalid())                /***** TEST E.8 ******/
    .then(() => getAccountInvalid())                  /***** TEST E.9 ******/
    .then(() => getAddressPBInvalid())                /***** TEST E.10 ******/
    .then(() => getAddressAccInvalid())               /***** TEST E.11 *****/
    .then(() => getAddressInvalid())                  /***** TEST E.12 *****/
    .then(() => putAccountPBNotFound())               /***** TEST E.13 ******/
    .then(() => putAddressPBNotFound())               /***** TEST E.14 ******/
    .then(() => putAddressAccNotFound())              /***** TEST E.15 ******/
    .then(() => putAccountPBInvalid())                /***** TEST E.16 ******/
    .then(() => putAccountInvalid())                  /***** TEST E.17 ******/
    .then(() => putAddressPBInvalid())                /***** TEST E.18 ******/
    .then(() => putAddressAccInvalid())               /***** TEST E.19 ******/
    .then(() => putAddressInvalid())                  /***** TEST E.20 ******/
